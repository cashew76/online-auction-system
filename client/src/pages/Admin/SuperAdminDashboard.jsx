import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";

export default function SuperAdminDashboard() {
  const [auctions, setAuctions] = useState([]);
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    axios
      .get("/api/admin/auction-management")
      .then((r) => {
        console.log("auction response", r.data);

        setRawData(r.data);

        if (Array.isArray(r.data)) {
          setAuctions(r.data);
        } else if (Array.isArray(r.data?.auctions)) {
          setAuctions(r.data.auctions);
        } else if (Array.isArray(r.data?.data)) {
          setAuctions(r.data.data);
        } else {
          setAuctions([]);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        SuperAdmin Auction Management
      </h1>

      {auctions.length === 0 && (
        <div className="mb-6 p-4 border rounded bg-yellow-50">
          <h2 className="font-bold mb-2">No auction array found</h2>

          <pre className="text-xs overflow-auto">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      )}

      <div className="grid gap-4">
        {auctions.map((auction) => (
          <div
            key={auction._id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center">
              
			  
<div>
  <h2 className="font-bold text-lg mb-3">
    {auction.name}
  </h2>
  

  <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
    <h5>
      <strong>Owner:</strong> {auction.owner?.name}
    </h5>

	<h5>
      <strong>Items:</strong> {auction.itemCount}
    </h5>
  
    <h5>
      <strong>Start:</strong>{" "}
      {new Date(auction.startDate).toLocaleString()}
    </h5>


    <h5>
      <strong>Email:</strong> {auction.owner?.email}
    </h5>

	<h5>
      <strong>Status:</strong>{" "}
      {auction.active ? "🟢 Active" : "⚪ Ended"}
    </h5>

    
	
	
	
    <h5>
      <strong>End:</strong>{" "}
      {new Date(auction.endDate).toLocaleString()}
    </h5>
  </div>
</div>
			  

              <div className="flex gap-2">
                <Link
                  to={`/auctions/${auction._id}/manage`}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Open Auction
                </Link>

                <Link
                  to={`/admin/manage/${auction._id}`}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}