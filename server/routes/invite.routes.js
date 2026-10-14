import express from "express";
import { inviteRoute, activeInviteRoute } from "../middleware/invite.middleware.js";
import { getInviteAuction, placeInviteBid } from "../controllers/invite.controller.js";

const r = express.Router();
r.get("/:guid", inviteRoute, getInviteAuction);
r.post("/:guid/items/:itemId/bid", activeInviteRoute, placeInviteBid);
export default r;
