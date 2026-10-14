import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";
import User from "../models/user.model.js";
import AuctionInvite from "../models/auctionInvite.model.js";
import { hashInviteToken } from "../utils/inviteToken.js";
import { registerAuctionHandlers } from "./auction.handler.js";
let io;
export const initSocket=(server)=>{
 io=new Server(server,{cors:{origin:env.origin,methods:["GET","POST"],credentials:true},pingTimeout:60000,pingInterval:25000});
 io.use(async(socket,next)=>{try{
   const guid=socket.handshake.auth?.inviteGuid;
   if(guid){const invite=await AuctionInvite.findOne({tokenHash:hashInviteToken(guid),active:true}); if(!invite)return next(new Error("Invalid invitation")); socket.identity={type:"invite",id:invite._id.toString(),name:invite.label,auctionId:invite.auction.toString()}; return next();}
   const cookies=socket.handshake.headers.cookie||""; const token=cookies.match(/auth_token=([^;]+)/)?.[1]; if(!token)return next(new Error("Authentication required"));
   const decoded=jwt.verify(token,env.jwt_secret); const user=await User.findById(decoded.id).select("name role"); if(!user)return next(new Error("User not found"));
   socket.identity={type:"user",id:user._id.toString(),name:user.name,role:user.role}; next();
 }catch{next(new Error("Invalid or expired credential"));}});
 io.on("connection",socket=>registerAuctionHandlers(io,socket)); return io;
};
export const getIO=()=>{if(!io)throw new Error("Socket.io not initialized");return io;};
