import axios from "axios";
 
export const api = axios.create({
baseURL: import.meta.env.VITE_API,
withCredentials: true,
});
 
export const auctionApi = axios.create({
baseURL: import.meta.env.VITE_AUCTION_API,
withCredentials: true,
});