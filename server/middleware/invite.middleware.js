import AuctionInvite from "../models/auctionInvite.model.js";
import { hashInviteToken } from "../utils/inviteToken.js";

const getToken = (req) => req.params.guid || req.headers["x-auction-invite"];

export const inviteRoute = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Invitation required" });

    const invite = await AuctionInvite.findOne({ tokenHash: hashInviteToken(token) });
    if (!invite) return res.status(401).json({ message: "Invalid invitation" });

    req.invite = invite;
    next();
  } catch (error) {
    res.status(500).json({ message: "Unable to validate invitation" });
  }
};

export const activeInviteRoute = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Invitation required" });

    const invite = await AuctionInvite.findOne({
      tokenHash: hashInviteToken(token),
      active: true,
    });
    if (!invite) return res.status(403).json({ message: "This invitation has been disabled" });

    req.invite = invite;
    next();
  } catch (error) {
    res.status(500).json({ message: "Unable to validate invitation" });
  }
};
