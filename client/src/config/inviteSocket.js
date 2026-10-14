import { io } from "socket.io-client";
export const connectInviteSocket=(guid)=>io(import.meta.env.VITE_API?.replace(/\/api\/?$/,"")||window.location.origin,{withCredentials:true,auth:{inviteGuid:guid}});
