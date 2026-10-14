import axios from "axios";
import { api } from "../config/api.js";
export const getMyAuctions=async()=> (await api.get("/auction")).data;
export const createAuction=async(data)=> (await api.post("/auction",data)).data;
export const getOwnerAuction=async(id)=> (await api.get(`/auction/${id}`)).data;
export const addAuctionItem=async(id,data)=> (await api.post(`/auction/${id}/items`,data)).data;
export const renameAuction = async (id, name) =>
  (
    await api.put(
      `/auction/${id}/name`,
      { name }
    )
  ).data;
export const createInvite=async(id,label)=> (await api.post(`/auction/${id}/invites`,{label})).data;
export const disableInvite=async(id,inviteId)=> (await api.delete(`/auction/${id}/invites/${inviteId}`)).data;
export const getInviteAuction=async(guid)=> (await api.get(`/invite/${encodeURIComponent(guid)}`)).data;
export const placeInviteBid=async({guid,itemId,bidAmount})=> (await api.post(`/invite/${encodeURIComponent(guid)}/items/${itemId}/bid`,{bidAmount})).data;
export const getUploadSignature=async()=> (await api.get("/upload/signature")).data;
export const uploadImageToCloudinary=async({file,signatureData,onProgress})=>{const f=new FormData(); f.append("file",file); f.append("api_key",signatureData.apiKey); f.append("timestamp",signatureData.timestamp); f.append("signature",signatureData.signature); f.append("folder",signatureData.folder); const url=`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`; return (await axios.post(url,f,{withCredentials:false,onUploadProgress:e=>{if(onProgress&&e.total)onProgress(Math.round(e.loaded*100/e.total));}})).data;};
