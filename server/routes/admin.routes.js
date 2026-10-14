import express from "express";
import {
  getAdminDashboard,
  getAllUsers,
  getAllAuctions,
  getAllAuctionManagement
} from "../controllers/admin.controller.js";
import { checkAdmin, checkSuperAdmin, secureRoute } from "../middleware/auth.middleware.js";

const adminRoutes = express.Router();
adminRoutes.use(secureRoute);

adminRoutes.get("/dashboard", checkAdmin, getAdminDashboard);
adminRoutes.get("/users", checkAdmin, getAllUsers);
adminRoutes.get("/auctions",checkSuperAdmin,getAllAuctions);
adminRoutes.get("/auction-management",checkSuperAdmin,getAllAuctionManagement);
export default adminRoutes;
