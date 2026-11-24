import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getListingById, markListingSold } from "../../services/listings";
import { toDate } from "../../mocks/data";
import ListingActions from "../offers/ListingActions";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(() => getListingById(id));
  const [boosted, setBoosted] = useState(() =>
    listing ? toDate(listing.boostedUntil) > new Date() : false
  );

  if (!listing) {
    return (
      <div className="p-10 bg-white rounded-xl border border-slate-200 text-center space-y-3">
        <p className="text-slate-600">Listing not found.</p>
        <Link to="/" className="text-indigo-600 text-sm font-medium hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const handleMarkSold = () => {
    markListingSold(listing.id);
    setListing({ ...listing, status: "sold" });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-indigo-600 font-medium hover:underline">
        &larr; Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-80 bg-slate-100">
            <img
              src={listing.photoPaths?.[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-100 text-indigo-800">
                {listing.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {listing.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Status: {listing.status}
              </span>
              {boosted && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-300 text-slate-900">
                  Boosted (24h)
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
            <p className="text-slate-700 leading-relaxed">{listing.description}</p>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Seller: <span className="font-semibold text-slate-900">{listing.sellerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoosted(true)}
                  disabled={boosted}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold hover:bg-amber-500 disabled:opacity-50"
                >
                  {boosted ? "Boost Active" : "Boost Listing (20 Tokens)"}
                </button>
                <button
                  type="button"
                  onClick={handleMarkSold}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
                >
                  Mark as Sold
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            id="student-b-action-slot"
            className="bg-white p-5 rounded-xl border border-slate-200 space-y-4"
          >
            <ListingActions listing={listing} />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <Link
              to="/chat"
              className="block w-full text-center py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200"
            >
              Message Seller (Student C)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}