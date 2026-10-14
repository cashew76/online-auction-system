const rooms=new Map();
export const registerAuctionHandlers=(io,socket)=>{
 const identity=socket.identity;
 socket.on("auction:join",({auctionId})=>{
   if(!auctionId)return;
   if(identity.type==="invite" && identity.auctionId!==auctionId)return socket.emit("auction:error",{message:"Invitation does not grant access to this auction"});
   const roomId=`event:${auctionId}`; socket.join(roomId);
   if(!rooms.has(roomId))rooms.set(roomId,new Map()); rooms.get(roomId).set(socket.id,{userId:identity.id,userName:identity.name});
   io.to(roomId).emit("auction:userJoined",{userId:identity.id,userName:identity.name,activeUsers:[...rooms.get(roomId).values()]});
 });
 socket.on("auction:leave",({auctionId})=>leave(io,socket,`event:${auctionId}`));
 socket.on("disconnect",()=>{for(const roomId of [...rooms.keys()])leave(io,socket,roomId);});
};
function leave(io,socket,roomId){const room=rooms.get(roomId); if(!room)return; const u=room.get(socket.id); if(!u)return; room.delete(socket.id); socket.leave(roomId); if(!room.size)rooms.delete(roomId); io.to(roomId).emit("auction:userLeft",{...u,activeUsers:room?[...room.values()]:[]});}
