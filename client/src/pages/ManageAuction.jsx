import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useOwnerAuction } from "../hooks/useAuction.js";
import { addAuctionItem, createInvite, disableInvite, renameAuction } from "../services/auction.service.js";
import { MdEdit } from "react-icons/md";

const blankItem = { itemName: "", itemDescription: "", itemCategory: "Other", startingPrice: 1, public_id: "", secure_url: "" };



function remaining(endDate) {
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return { ended: true, text: "Auction ended" };
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { ended: false, text: d ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s` };
}

export default function ManageAuction() {
  const { auctionId } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useOwnerAuction(auctionId);
  const [clock, setClock] = useState({ ended: false, text: "" });
  const [item, setItem] = useState(blankItem);
  const [label, setLabel] = useState("");
  const [auctionName, setAuctionName] = useState("");
  const [newLink, setNewLink] = useState("");
  const [copied, setCopied] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);

	useEffect(() => {
	  if (data?.auction?.name) {
		setAuctionName(data.auction.name);
	  }
	}, [data]);

  useEffect(() => {
    if (!data?.auction?.endDate) return;
    const tick = () => setClock(remaining(data.auction.endDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.auction?.endDate]);

  if (isLoading) return <div className="p-8">Loading...</div>;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ownerAuction", auctionId] });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      

		
<section className="bg-white border rounded-2xl p-6">
  <div className="flex items-center gap-2">
    <h1 className="text-2xl font-bold">
      {data.auction.name}
    </h1>

    <button
      type="button"
      onClick={() => setEditingName(!editingName)}
      className="text-indigo-600 hover:text-indigo-800"
      title="Rename Auction"
    >
      <MdEdit size={18} />
    </button>
  </div>

  {editingName && (
    <form
      className="flex gap-2 mt-3"
      onSubmit={async (e) => {
        e.preventDefault();

        await renameAuction(
          auctionId,
          auctionName
        );

        refresh();
        setEditingName(false);
      }}
    >
      <input
        className="border rounded-xl p-3 flex-1"
        value={auctionName}
        onChange={(e) =>
          setAuctionName(e.target.value)
        }
        required
      />

      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 rounded-xl"
      >
        Save
      </button>

      <button
        type="button"
        onClick={() => setEditingName(false)}
        className="border px-4 rounded-xl"
      >
        Cancel
      </button>
    </form>
  )}

  <p className="text-gray-500">
    Manage items and private bidder links
  </p>

  <div className="mt-2">
    <div className="text-xs text-gray-400">
      Time remaining
    </div>

    <div
      className={`text-lg font-bold ${
        clock.ended
          ? "text-red-600"
          : "text-indigo-600"
      }`}
    >
      {clock.text}
    </div>
  </div>
</section>


      {!clock.ended && (
        <section className="bg-white border rounded-2xl p-6">
          <h2 className="font-bold mb-4">Add item name, initial credit cost, description</h2>
          <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (e) => {
            e.preventDefault();
            await addAuctionItem(auctionId, item);
            setItem(blankItem);
            refresh();
          }}>
            <input className="border rounded-xl p-3" placeholder="Item name" value={item.itemName} onChange={(e) => setItem({ ...item, itemName: e.target.value })} required />
            <input className="border rounded-xl p-3" type="number" min="1" value={item.startingPrice} onChange={(e) => setItem({ ...item, startingPrice: e.target.value })} required />
            <textarea className="border rounded-xl p-3 sm:col-span-2" placeholder="Description" value={item.itemDescription} onChange={(e) => setItem({ ...item, itemDescription: e.target.value })} required />
            <button className="bg-indigo-600 text-white rounded-xl p-3 font-semibold">Add item</button>
          </form>
        </section>
      )}

      <section className="bg-white border rounded-2xl p-6">
        <h2 className="font-bold mb-1">{clock.ended ? "Auction results" : "Current auction results"}</h2>
        <p className="text-sm text-gray-500 mb-4">{clock.ended ? "Final winners and bids." : "Current high bidders and bids."}</p>
        <ul className="divide-y">
          {data.items.map((auctionItem) => {
            const activeInviteIds = new Set(
  (data.invites || [])
    .filter(invite => invite.active)
    .map(invite => invite._id.toString())
);

const highBid = auctionItem.bids?.length
  ? auctionItem.bids
      .filter(
        bid =>
          bid.invite &&
          activeInviteIds.has(bid.invite.toString())
      )
      .sort((a, b) => b.bidAmount - a.bidAmount)[0]
  : null;

const displayPrice =
  highBid?.bidAmount ??
  auctionItem.startingPrice ??
  auctionItem.currentPrice;
            return (
              <li
				className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50"
				key={auctionItem._id}
				onClick={() => setSelectedItem(auctionItem)}
				>
                <div className="flex items-center gap-3 min-w-0">
                  {auctionItem.itemImage?.url && <img src={auctionItem.itemImage.url} alt="" className="w-14 h-14 rounded-lg object-cover border" />}
                  <div>
                    <div className="font-medium text-gray-900">{auctionItem.itemName}</div>
                    <div className="text-sm text-gray-500">
                      {highBid ? <>{clock.ended ? "Winner" : "Current winner"}: <span className="font-semibold text-indigo-600">{highBid.bidderLabel || "Unknown"}</span></> : "No bids"}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <strong>{displayPrice} credits</strong>
                  <div className="text-xs text-gray-400">{clock.ended ? "Final bid" : "Current bid"}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-white border rounded-2xl p-6">
        <h2 className="font-bold mb-2">Bidder links and credits</h2>
        {!clock.ended && (
          <form className="flex gap-2 mb-4" onSubmit={async (e) => {
            e.preventDefault();
            const d = await createInvite(auctionId, label || "Bidder");
            setNewLink(`${window.location.origin}/invite/${d.guid}`);
            setLabel("");
            refresh();
          }}>
            <input className="border rounded-xl p-3 flex-1" placeholder="Bidder label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <button className="bg-indigo-600 text-white rounded-xl px-4">Create link</button>
          </form>
        )}
        {newLink && !clock.ended && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-xl break-all">
            <strong>Copy this link now:</strong><br />{newLink}
            <button type="button" className="ml-3 font-semibold text-indigo-600" onClick={async () => {
              await navigator.clipboard.writeText(newLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}>{copied ? "Copied ✓" : "Copy"}</button>
          </div>
        )}
        <ul className="divide-y">
          {data.invites.map((invite) => (
            <li className="py-3 flex justify-between items-center gap-4" key={invite._id}>
              <div>
                <div className="font-medium">{invite.label}</div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-emerald-700">{invite.availableCredits ?? invite.initialCredits ?? 1000} credits remaining</span>
                  {" · "}{invite.committedCredits ?? 0} committed · {invite.initialCredits ?? 1000} total · {invite.active ? "active" : "disabled"}
                </div>
              </div>
              {invite.active && !clock.ended && <button className="text-red-600" onClick={async () => { await disableInvite(auctionId, invite._id); refresh(); }}>Disable</button>}
            </li>
          ))}
        </ul>
      </section>
	  
	  {selectedItem && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={() => setSelectedItem(null)}
  >
    <div
      className="bg-white rounded-2xl p-6 max-w-3xl w-full mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Bid History - {selectedItem.itemName}
        </h2>

        <button
          className="text-gray-500"
          onClick={() => setSelectedItem(null)}
        >
          ✕
        </button>
      </div>

      {selectedItem.bids?.length ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Bidder</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {[...selectedItem.bids]
              .sort(
                (a, b) =>
                  new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime()
              )
              .map((bid, idx) => (
                <tr
                  key={idx}
                  className="border-b"
                >
                  <td className="p-2">
                    {bid.bidderLabel ||
                     bid.bidder?.name ||
                     "Unknown"}
                  </td>

                  <td className="p-2 text-right">
                    {bid.bidAmount}
                  </td>

                  <td className="p-2">
                    {bid.bidTime
                      ? new Date(
                          bid.bidTime
                        ).toLocaleString()
                      : ""}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p>No bids.</p>
      )}
    </div>
  </div>
)}

    </div>
  );
}
