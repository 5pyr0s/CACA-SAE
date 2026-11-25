import { useEffect, useState } from "react";
import { Link } from "react-router";
import { subscribeListings } from "../../services/listings";
import { CATEGORIES, toDate } from "../../mocks/data";

function parseDate(val) {
  if (!val) return new Date(0);
  if (typeof val.toDate === "function") return val.toDate();
  return toDate(val);
}

export default function FeedPage() {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    setError("");
    const unsubscribe = subscribeListings(
      { search, category, type, minPrice, maxPrice },
      (items) => setListings(items),
      (err) => setError(err.message || "Failed to load listings.")
    );
    return unsubscribe;
  }, [search, category, type, minPrice, maxPrice]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campus Marketplace</h1>
          <p className="text-sm text-slate-600">Buy, swap, or bid on student gear around UPT</p>
        </div>
        <Link
          to="/listings/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + Create Listing
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="Search keywords (e.g. calculator, sony)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="all">All Types</option>
          <option value="fixed">Fixed Price</option>
          <option value="swap">Swap</option>
          <option value="auction">Live Auction</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min RON"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="number"
            placeholder="Max RON"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
          No active listings match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => {
            const isBoosted = parseDate(item.boostedUntil) > new Date();
            const thumbnail = item.photoUrls?.[0] || item.photoPaths?.[0] || "";
            return (
              <Link
                key={item.id}
                to={`/listings/${item.id}`}
                className={`group bg-white rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col ${
                  isBoosted ? "border-amber-400 ring-1 ring-amber-300" : "border-slate-200"
                }`}
              >
                <div className="relative h-48 bg-slate-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No photo
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-900/80 text-white">
                      {item.type}
                    </span>
                    {isBoosted && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-slate-950">
                        Boosted
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-medium text-indigo-600 uppercase">
                      {item.category?.replace("_", " ")}
                    </span>
                    <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {item.type === "auction" ? (
                      <span className="text-sm font-bold text-amber-700">
                        Top Bid: {item.auction?.highestBid || item.auction?.startPrice} Tokens
                      </span>
                    ) : (
                      <span className="text-base font-bold text-slate-900">{item.price} RON</span>
                    )}
                    <span className="text-xs text-slate-500">by {item.sellerName}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}