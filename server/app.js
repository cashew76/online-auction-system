import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.config.js";

import { authRoutes,userRoutes,auctionRoutes,inviteRoutes,contactRoutes,adminRoutes,cloudinaryRoutes } from "./routes/index.js";

import { connectDB } from "./config/db.config.js";
import fs from "fs";
import path from "path";

 
const accessLogStream = fs.createWriteStream(
path.join(process.cwd(), "access.log"),
{ flags: "a" }
);
 
export const app=express();

app.set("trust proxy", true);

morgan.token("ip", (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    req.ip
  );
});

morgan.token("browser", (req) => {
	return req.headers["user-agent"] || "Unknown";
});
 
app.use(
	morgan(
	':ip :method :url :status :response-time ms ":browser"'
		)
	);
 
app.use(
	morgan(
		':ip [:date[iso]] :method :url :status :response-time ms ":browser"',
		{
			stream: accessLogStream,
		}
	)
);



app.use(cors({origin:env.origin,methods:["GET","POST","PUT","DELETE","PATCH"],credentials:true}));

app.use(cookieParser()); app.use(compression()); app.use(express.json());

if(process.env.VERCEL)app.use(async(req,res,next)=>{await connectDB();next();});

app.use((err, req, res, next) => {
console.error(err);
res.status(500).json({ message: "Server Error" });
});

app.use("/api/auth",authRoutes); app.use("/api/user",userRoutes); app.use("/api/auction",auctionRoutes); app.use("/api/invite",inviteRoutes);
app.use("/api/contact",contactRoutes); app.use("/api/admin",adminRoutes); app.use("/api/upload",cloudinaryRoutes);
export default app;
