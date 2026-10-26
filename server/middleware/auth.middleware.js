import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";

const JWT_SECRET = env.jwt_secret;

export const secureRoute = (req, res, next) => {
  console.log("Cookies:", req.cookies);

  const token = req.cookies.auth_token;

  console.log("Token:", token ? "FOUND" : "MISSING");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decode = jwt.verify(token, JWT_SECRET);

    console.log("Decoded:", decode);

    req.user = decode;
    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

export const checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }

  next();
};

export const checkSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      message: "SuperAdmin access required",
    });
  }

  next();
};