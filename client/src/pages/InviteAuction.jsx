import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useInviteAuction, useInviteBid } from "../hooks/useAuction.js";
import { useInviteSocket } from "../hooks/useInviteSocket.js";

function getAuctionState(startDate, endDate) {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const format = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return days > 0
      ? `${days}d ${hours}h ${minutes}m ${seconds}s`
      : `${hours}h ${minutes}m ${seconds}s`;
  };

  if (now < start) return { phase: "scheduled", label: "Auction starts in", time: format(start - now) };
  if (now >= end) return { phase: "ended", label: "Status", time: "Auction ended" };
  return { phase: "active", label: "Time remaining", time: format(end - now) };
}

export default function InviteAuction() {
  const { guid } = useParams();
  const { data, isLoading, error, refetch } = useInviteAuction(guid);
  const bid = useInviteBid(guid);
  const [amounts, setAmounts] = useState({});
  const [auctionState, setAuctionState] = useState({ phase: "scheduled", label: "", time: "" });
  const onBid = useCallback(() => refetch(), [refetch]);
  const connected = useInviteSocket(guid, data?.auction?._id, onBid);

  useEffect(() => {
    if (!data?.auction?.startDate || !data?.auction?.endDate) return;
    const updateCountdown = () => setAuctionState(getAuctionState(data.auction.startDate, data.auction.endDate));
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [data?.auction?.startDate, data?.auction?.endDate]);

  useEffect(() => {
    if (!guid || !data?.bidder?.label) return;
    sessionStorage.setItem(`invite-bidder:${guid}`, JSON.stringify({ label: data.bidder.label }));
    window.dispatchEvent(new Event("invite-bidder-updated"));
  }, [guid, data?.bidder?.label]);

  if (isLoading) return <div className="p-8">Loading auction...</div>;
  if (error) {
    const message = error?.response?.data?.message || "Unable to load auction.";
    return <div className="p-8 text-red-600">{message}</div>;
  }
  if (!data?.auction) return <div className="p-8 text-red-600">Auction data was not returned by the server.</div>;

  const c = data?.credits ?? { initial: 1000, committed: 0, available: 1000 };
  const items = Array.isArray(data?.items) ? data.items : [];
  const biddingOpen = auctionState.phase === "active";
  const ended = auctionState.phase === "ended";

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.auction.name}</h1>
              <p className="text-gray-500">{data.auction.description}</p>
              <div className="mt-3">
                <span className="text-xs text-gray-400">{auctionState.label}</span>
                <div className={`text-lg font-bold ${ended ? "text-red-600" : "text-indigo-600"}`}>
                  {auctionState.time}
                </div>
              </div>
              <p className="text-xs mt-2 text-gray-400">
                {connected ? "Live updates connected" : "Connecting live updates..."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <Credit label="Total" value={c.initial} />
              <Credit label="Committed" value={c.committed} />
              <Credit label="Available" value={c.available} />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const highBidderLabel = item.highBidderLabel;
            return (
              <div key={item._id} className="bg-white rounded-2xl border overflow-hidden">
                {item.itemImage?.url && (
                  <img src={item.itemImage.url} alt={item.itemName} className="w-full aspect-[4/3] object-cover" />
                )}
                <div className="p-5">
                  <h2 className="font-bold text-lg">{item.itemName}</h2>
                  <p className="text-sm text-gray-500 min-h-10">{item.itemDescription}</p>
                  <div className="mt-4">
                    <span className="text-xs text-gray-400">Current bid</span>
                    <div className="text-2xl font-bold">{item.currentPrice} credits</div>
                    {highBidderLabel && (
                      <div className="mt-1 text-sm text-gray-600">
                        High bidder: <span className="font-semibold text-indigo-600">{highBidderLabel}</span>
                      </div>
                    )}
                    {item.amWinning && (
                      <span className="block mt-1 text-xs font-semibold text-emerald-600">You are the high bidder</span>
                    )}
                  </div>
                  <form
                    className="flex gap-2 mt-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await bid.mutateAsync({ itemId: item._id, bidAmount: Number(amounts[item._id]) });
                      setAmounts((x) => ({ ...x, [item._id]: "" }));
                    }}
                  >
                    <input
                      type="number"
                      min={item.currentPrice + 1}
                      max={c.available + (item.amWinning ? item.currentPrice : 0)}
                      value={amounts[item._id] || ""}
                      onChange={(e) => setAmounts((x) => ({ ...x, [item._id]: e.target.value }))}
                      className="min-w-0 flex-1 border rounded-xl px-3 py-2"
                      placeholder={String(item.currentPrice + 1)}
                      disabled={!biddingOpen}
                      required
                    />
                    <button
                      type="submit"
                      disabled={bid.isPending || !biddingOpen}
                      className="bg-indigo-600 text-white rounded-xl px-4 font-semibold disabled:opacity-50"
                    >
                      {ended ? "Ended" : !biddingOpen ? "Not started" : bid.isPending ? "Bidding..." : "Bid"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Credit({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
