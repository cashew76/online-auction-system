import { useEffect, useState } from "react";
import { connectInviteSocket } from "../config/inviteSocket.js";

export const useInviteSocket = (guid, auctionId, onUpdate) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!guid || !auctionId) return;

    const s = connectInviteSocket(guid);

    const handleConnect = () => {
      setConnected(true);
      s.emit("auction:join", { auctionId });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleUpdate = () => {
      onUpdate?.();
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("auction:bidPlaced", handleUpdate);
    s.on("auction:inviteDisabled", handleUpdate);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("auction:bidPlaced", handleUpdate);
      s.off("auction:inviteDisabled", handleUpdate);
      s.emit("auction:leave", { auctionId });
      s.disconnect();
    };
  }, [guid, auctionId, onUpdate]);

  return connected;
};
