import getImageUrl from "../services/cloudinaryService.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import { getIO } from "../socket/index.js";
import Upload from "../models/upload.model.js";
import User from "../models/user.model.js";

export const createAuction = async (req, res) => {
    try {
        const {
            itemName,
            startingPrice,
            itemDescription,
            itemCategory,
            itemStartDate,
            itemEndDate,
            formId,
            public_id,
            secure_url,
        } = req.body;

        const start = itemStartDate ? new Date(itemStartDate) : new Date();
        const end = new Date(itemEndDate);
        if (end <= start) {
            return res
                .status(400)
                .json({ message: "Auction end date must be after start date" });
        }

        const upload = await Upload.findOne({ formId });

        if (!upload) {
            return res.status(400).json({
                message: "Invalid upload session",
            });
        }

        if (!public_id || !secure_url) {
            return res.status(400).json({
                message: "Image is required",
            });
        }

        const newAuction = new Product({
            itemName,
            startingPrice,
            currentPrice: startingPrice,
            itemDescription,
            itemCategory,
            itemImage: {
                public_id,
                url: secure_url,
            },
            itemStartDate: start,
            itemEndDate: end,
            seller: req.user.id,
        });
        await newAuction.save();

        upload.status = "used";
        await upload.save();

        res.status(201).json({
            message: "Auction created successfully",
            newAuction,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating auction",
            error: error.message,
        });
    }
};

export const showAuction = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit) || 12)
        );
        const skip = (page - 1) * limit;

        const filter = { itemEndDate: { $gt: new Date() } };
        const total = await Product.countDocuments(filter);

        const auction = await Product.find(filter)
            .populate("seller", "name")
            .select(
                "itemName itemDescription currentPrice bids itemEndDate itemCategory itemImage seller"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const formatted = auction.map((item) => ({
            _id: item._id,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            currentPrice: item.currentPrice,
            bidsCount: item.bids.length,
            timeLeft: Math.max(0, new Date(item.itemEndDate) - new Date()),
            itemCategory: item.itemCategory,
            sellerName: item.seller.name,
            itemPhoto: item.itemImage?.url,
        }));

        res.status(200).json({
            auctions: formatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error fetching auctions", error: error.message });
    }
};

export const auctionById = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Product.findById(id)
            .populate("seller", "name")
            .populate("bids.bidder", "name")
            .populate("winner", "name");

        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Auto-set winner when auction has ended and has bids but no winner yet
        const isExpired = new Date(auction.itemEndDate) < new Date();
        if (isExpired && !auction.winner && auction.bids.length > 0) {
const activeUsers = await User.find(
{ isActive: true },
"_id"
).lean();
 
const activeUserIds = new Set(
activeUsers.map((u) => u._id.toString())
);
 
const validBids = auction.bids
.filter(
(bid) =>
bid.bidder &&
activeUserIds.has(bid.bidder._id.toString())
)
.sort((a, b) => b.bidAmount - a.bidAmount);
 
if (validBids.length > 0) {
auction.winner = validBids[0].bidder;
auction.currentPrice = validBids[0].bidAmount;
auction.isSold = true;
} else {
auction.winner = null;
auction.currentPrice = auction.startingPrice;
auction.isSold = false;
}
 
await auction.save();
 
await auction.populate("winner", "name");
}

        // If auction is expired, only allow seller and bidders to view it
        if (isExpired) {
            const userId = req.user.id;
            const isSeller =
			  auction.seller._id.toString() === userId;

			const isBidder =
			  auction.bids.some(
				(b) => b.bidder?._id?.toString() === userId
			  );

			const isSuperAdmin =
			  req.user.role === "superadmin";

			if (!isSeller && !isBidder && !isSuperAdmin) {
			  return res.status(403).json({
				message:
				  "This auction has ended and is no longer available",
			  });
			}
        }

        auction.bids.sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime));
        res.status(200).json(auction);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error fetching auctions", error: error.message });
    }
};

export const getMyCredit = async (req, res) => {
    debug.write("Entering getMyCredit controller");
    debug.write(`Request User ID: ${req.user ? req.user.id : "undefined"}`);
    try {
        // Find the logged-in user and select only the name and credit fields
        const user = await User.findById(req.user.id).select("credit");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            name: user.name,
            credit: user.credit || 0, // Fallback to 0 if credit isn't initialized
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching user credits",
            error: error.message,
        });
    }
};

export const placeBid = async (req, res) => {
    try {
        const bidAmount = Number(req.body.bidAmount);
        const user = req.user.id;
        const { id } = req.params;

        if (isNaN(bidAmount)) {
            return res.status(400).json({ message: "Invalid bid amount" });
        }

        const product = await Product.findById(id);
        if (!product)
            return res.status(404).json({ message: "Auction not found" });

        // Prevent seller from bidding on their own auction
        if (product.seller.toString() === user) {
            return res
                .status(403)
                .json({ message: "You cannot bid on your own auction" });
        }

        if (new Date(product.itemEndDate) < new Date())
            return res
                .status(400)
                .json({ message: "Auction has already ended" });

        const minBid =
            Math.max(product.currentPrice, product.startingPrice) + 1;
        const maxBid =
            Math.max(product.currentPrice, product.startingPrice) + 10;
        if (bidAmount < minBid)
            return res
                .status(400)
                .json({ message: `Bid must be at least Rs ${minBid}` });
        if (bidAmount > maxBid)
            return res
                .status(400)
                .json({ message: `Bid must be at max Rs ${maxBid}` });

        const updated = await Product.findOneAndUpdate(
            {
                _id: id,
                currentPrice: product.currentPrice,
                itemEndDate: { $gt: new Date() },
            },
            {
                $set: { currentPrice: bidAmount },
                $push: { bids: { bidder: user, bidAmount } },
            },
            { new: true }
        );

        if (!updated) {
            return res.status(409).json({
                message: "Bid failed — price changed. Please try again.",
            });
        }

        // Populate for the response and socket broadcast
        const populated = await Product.findById(id)
            .populate("seller", "name")
            .populate("bids.bidder", "name");

        populated.bids.sort(
            (a, b) => new Date(b.bidTime) - new Date(a.bidTime)
        );

        // Broadcast to all socket users in this auction room
        try {
            const io = getIO();
            const bidderName =
                populated.bids.find((b) => b.bidder?._id?.toString() === user)
                    ?.bidder?.name || "Someone";

            io.to(id).emit("auction:bidPlaced", {
                auction: populated,
                bidderName,
                bidderId: user,
                bidAmount,
            });
        } catch (socketErr) {
            console.error("Socket broadcast error:", socketErr.message);
        }

        res.status(200).json({
            message: "Bid placed successfully",
            auction: populated,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error placing bid",
            error: error.message,
        });
    }
};

export const dashboardData = async (req, res) => {
    try {
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const dateNow = new Date();
        const userDoc = await User.findById(userObjectId).select("credit");
        const userCredit = userDoc ? userDoc.credit : 0;
        const stats = await Product.aggregate([
            {
                $facet: {
                    totalAuctions: [{ $count: "count" }],
                    userAuctionCount: [
                        { $match: { seller: userObjectId } },
                        { $count: "count" },
                    ],
                    activeAuctions: [
                        {
                            $match: {
                                itemStartDate: { $lte: dateNow },
                                itemEndDate: { $gte: dateNow },
                            },
                        },
                        { $count: "count" },
                    ],
                },
            },
        ]);

        const totalAuctions = stats[0].totalAuctions[0]?.count || 0;
        //const userCredit = stats[0].userCredit[0]?.count || 60;
        const userAuctionCount = stats[0].userAuctionCount[0]?.count || 0;
        const activeAuctions = stats[0].activeAuctions[0]?.count || 0;

        const globalAuction = await Product.find({
            itemEndDate: { $gt: dateNow },
        })
            .populate("seller", "name")
            .sort({ createdAt: -1 })
            .limit(4);
        const latestAuctions = globalAuction.map((item) => ({
            _id: item._id,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            currentPrice: item.currentPrice,
            bidsCount: item.bids.length,
            timeLeft: Math.max(0, new Date(item.itemEndDate) - new Date()),
            itemCategory: item.itemCategory,
            sellerName: item.seller.name,
            itemPhoto: item.itemImage?.url,
        }));

        const userAuction = await Product.find({ seller: userObjectId })
            .populate("seller", "name")
            .sort({ createdAt: -1 })
            .limit(4);
        const latestUserAuctions = userAuction.map((item) => ({
            _id: item._id,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            currentPrice: item.currentPrice,
            bidsCount: item.bids.length,
            timeLeft: Math.max(0, new Date(item.itemEndDate) - new Date()),
            itemCategory: item.itemCategory,
            sellerName: item.seller.name,
            itemPhoto: item.itemImage?.url,
        }));

        return res.status(200).json({
            totalAuctions,
            userCredit,
            userAuctionCount,
            activeAuctions,
            latestAuctions,
            latestUserAuctions,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error getting dashboard data",
            error: error.message,
        });
    }
};

export const myAuction = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit) || 12)
        );
        const skip = (page - 1) * limit;

        const filter = { seller: req.user.id };
        const total = await Product.countDocuments(filter);

        const auction = await Product.find(filter)
            .populate("seller", "name")
            .select(
                "itemName itemDescription currentPrice bids itemEndDate itemCategory itemImage seller"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const formatted = auction.map((item) => ({
            _id: item._id,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            currentPrice: item.currentPrice,
            bidsCount: item.bids.length,
            timeLeft: Math.max(0, new Date(item.itemEndDate) - new Date()),
            itemCategory: item.itemCategory,
            sellerName: item.seller.name,
            itemPhoto: item.itemImage?.url,
        }));

        res.status(200).json({
            auctions: formatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error fetching auctions", error: error.message });
    }
};

export const myBids = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit) || 12)
        );
        const skip = (page - 1) * limit;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const filter = { "bids.bidder": userId };
        const total = await Product.countDocuments(filter);

        const auction = await Product.find(filter)
            .populate("seller", "name")
            .populate("winner", "name")
            .select(
                "itemName itemDescription currentPrice bids itemEndDate itemCategory itemImage seller winner isSold"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formatted = auction.map((item) => {
            const isExpired = new Date(item.itemEndDate) < new Date();
            return {
                _id: item._id,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                currentPrice: item.currentPrice,
                bidsCount: item.bids.length,
                timeLeft: Math.max(0, new Date(item.itemEndDate) - new Date()),
                itemCategory: item.itemCategory,
                sellerName: item.seller.name,
                itemPhoto: item.itemImage?.url,
                isExpired,
                winner: item.winner
                    ? { _id: item.winner._id, name: item.winner.name }
                    : null,
                isSold: item.isSold,
            };
        });

        res.status(200).json({
            auctions: formatted,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error fetching my bids", error: error.message });
    }
};
