import crypto from "crypto";
export const newInviteToken = () => crypto.randomUUID();
export const hashInviteToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
