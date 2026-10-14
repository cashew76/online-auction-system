import Auction from "../models/auction.model.js";
import AuctionInvite from "../models/auctionInvite.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const [
      totalAuctions,
      activeAuctions,
      totalItems,
      totalInvites,
      activeInvites,
      totalUsers,
      recentUsers,
    ] = await Promise.all([
      Auction.countDocuments(),

      Auction.countDocuments({
        startDate: { $lte: now },
        endDate: { $gt: now },
        isArchived: false,
      }),

      Product.countDocuments(),

      AuctionInvite.countDocuments(),

      AuctionInvite.countDocuments({
        active: true,
      }),

      User.countDocuments(),

      User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
    ]);

    const recentActiveAuctions = await Auction.find({
      startDate: { $lte: now },
      endDate: { $gt: now },
      isArchived: false,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const auctionIds = recentActiveAuctions.map(
      (auction) => auction._id
    );

    const itemCounts = await Product.aggregate([
      {
        $match: {
          auction: { $in: auctionIds },
        },
      },
      {
        $group: {
          _id: "$auction",
          count: { $sum: 1 },
        },
      },
    ]);

    const inviteCounts = await AuctionInvite.aggregate([
      {
        $match: {
          auction: { $in: auctionIds },
        },
      },
      {
        $group: {
          _id: "$auction",
          count: { $sum: 1 },
        },
      },
    ]);

    const itemCountMap = new Map(
      itemCounts.map((x) => [x._id.toString(), x.count])
    );

    const inviteCountMap = new Map(
      inviteCounts.map((x) => [x._id.toString(), x.count])
    );

    const formattedRecentActiveAuctions =
      recentActiveAuctions.map((auction) => ({
        ...auction,

        // Compatibility fields for the existing AdminDashboard.jsx
        itemName: auction.name,
        itemDescription: auction.description,
        itemStartDate: auction.startDate,
        itemEndDate: auction.endDate,

        seller: auction.owner,

        itemCount:
          itemCountMap.get(auction._id.toString()) || 0,

        inviteCount:
          inviteCountMap.get(auction._id.toString()) || 0,
      }));

    const recentUsersList = await User.find({})
      .select(
        "name email role createdAt lastLogin location avatar"
      )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      stats: {
        activeAuctions,
        totalAuctions,
        totalItems,
        totalInvites,
        activeInvites,
        totalUsers,
        recentUsers,
      },

      recentAuctions: formattedRecentActiveAuctions,

      recentUsersList,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      message: "Error fetching admin dashboard data",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    // Whitelist sortable fields to prevent sorting by sensitive fields like password
    const allowedSortFields = [
      "createdAt",
      "name",
      "email",
      "role",
      "lastLogin",
    ];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build search query — escape regex special chars to prevent ReDoS
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchQuery = escapedSearch
      ? {
          $or: [
            { name: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {};

    // Apply role filter if provided
    const roleFilter = role && ["user", "admin", "superadmin"].includes(role) ? { role } : {};

    const query = { ...searchQuery, ...roleFilter };

    // Get total count for pagination info
    const totalUsers = await User.countDocuments(query);

    // Get users with pagination, search, and sorting
    const users = await User.find(query)
      .select("name email role createdAt signupAt lastLogin location avatar")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

export const getAllAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({})
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      auctions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching auctions",
      error: error.message
    });
  }
};

export const getAllAuctionManagement = async (req, res) => {
  try {
    const auctions = await Auction.find({})
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const auctionIds = auctions.map((a) => a._id);

    const itemCounts = await Product.aggregate([
      {
        $match: {
          auction: { $in: auctionIds },
        },
      },
      {
        $group: {
          _id: "$auction",
          count: { $sum: 1 },
        },
      },
    ]);

    const itemMap = new Map(
      itemCounts.map((x) => [x._id.toString(), x.count])
    );

    const data = auctions.map((auction) => ({
      _id: auction._id,
      name: auction.name,
      description: auction.description,
      startDate: auction.startDate,
      endDate: auction.endDate,
      owner: auction.owner,
      itemCount: itemMap.get(auction._id.toString()) || 0,
      active:
        new Date(auction.startDate) <= new Date() &&
        new Date(auction.endDate) > new Date(),
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error loading auctions",
      error: error.message,
    });
  }
};