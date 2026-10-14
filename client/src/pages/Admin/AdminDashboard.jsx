import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import LoadingScreen from "../../components/LoadingScreen";
import { getAdminDashboard } from "../../api/admin";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const statConfig = [
  { key: "totalUsers", label: "Total Users", color: "text-violet-600", bg: "bg-violet-50" },
  { key: "totalAuctions", label: "Total Auctions", color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "activeAuctions", label: "Active Auctions", color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "totalItems", label: "Total Items", color: "text-sky-600", bg: "bg-sky-50" },
  { key: "totalInvites", label: "Invite Links", color: "text-amber-600", bg: "bg-amber-50" },
  { key: "activeInvites", label: "Active Links", color: "text-teal-600", bg: "bg-teal-50" },
];

export const AdminDashboard = () => {
  useDocumentTitle("Admin Dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getAdminDashboard();
        if (mounted) setDashboardData(data || {});
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
        if (mounted) setError(err?.response?.data?.message || "Failed to load admin dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <div className="max-w-7xl mx-auto p-6"><div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4">{error}</div></div>;

  const stats = dashboardData?.stats || {};
  const auctions = dashboardData?.recentAuctions || [];
  const users = dashboardData?.recentUsersList || [];

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">Monitor private auctions, items, invite links, and users</p>
          </div>
          <Link to="/admin/users" className="inline-flex bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700">All Users</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {statConfig.map((stat) => (
            <div key={stat.key} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-3`}>#</div>
              <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stats[stat.key] ?? 0}</div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Recent Active Auctions</h2>
            <Link to="/myauction" className="text-sm font-medium text-indigo-500 hover:text-indigo-600">View my auctions &rarr;</Link>
          </div>

          {auctions.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-200/80 text-gray-400">No active auctions at the moment.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr className="border-b bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Auction</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Owner</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-400 uppercase">Items</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-400 uppercase">Invites</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Ends</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-400 uppercase">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {auctions.map((auction) => (
                      <tr key={auction._id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-4"><div className="font-semibold text-gray-900">{auction.name || auction.itemName}</div><div className="text-xs text-gray-400 max-w-xs truncate">{auction.description || auction.itemDescription}</div></td>
                        <td className="px-5 py-4"><div className="text-sm text-gray-700">{auction.owner?.name || auction.seller?.name || "Unknown"}</div><div className="text-xs text-gray-400">{auction.owner?.email || auction.seller?.email || ""}</div></td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums">{auction.itemCount ?? 0}</td>
                        <td className="px-5 py-4 text-right font-semibold tabular-nums">{auction.inviteCount ?? 0}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{auction.endDate || auction.itemEndDate ? new Date(auction.endDate || auction.itemEndDate).toLocaleString() : "-"}</td>
                        <td className="px-5 py-4 text-right"><Link to={`/auctions/${auction._id}/manage`} className="inline-flex px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100">Manage</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-sm font-medium text-indigo-500 hover:text-indigo-600">View all &rarr;</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {users.length === 0 ? <div className="text-center py-14 text-gray-400">No users found.</div> : (
              <div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="border-b bg-gray-50/60"><th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">User</th><th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Role</th><th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Joined</th><th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Last Login</th></tr></thead><tbody className="divide-y divide-gray-100">{users.map((user) => <tr key={user._id} className="hover:bg-gray-50/60"><td className="px-5 py-4"><div className="font-medium text-gray-900">{user.name}</div><div className="text-xs text-gray-400">{user.email}</div></td><td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}`}>{user.role}</span></td><td className="px-5 py-4 text-sm text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td><td className="px-5 py-4 text-sm text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td></tr>)}</tbody></table></div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
