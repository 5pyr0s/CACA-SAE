import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getListingById,
  updateListing,
  markListingSold,
  deleteListing,
} from "../../services/listings";
import { CATEGORIES } from "../../mocks/data";

// Temporary fallback until Student B merges useAuth()
const TEMP_USER = { uid: "user_alex", displayName: "Alex Barbatu" };

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [price, setPrice] = useState("0");

  useEffect(() => {
    let active = true;
    getListingById(id)
      .then((data) => {
        if (!active) return;
        setListing(data);
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setCategory(data.category || "other");
          setPrice(String(data.price ?? 0));
        }
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading listing...</div>;
  if (!listing) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-600">Listing not found.</p>
        <Link to="/" className="text-indigo-600 font-semibold hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = listing.sellerId === TEMP_USER.uid;
  const photos = listing.photoUrls?.length ? listing.photoUrls : listing.photoPaths || [];

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updates = { title, description, category, price: Number(price) };
      await updateListing(listing.id, updates);
      setListing((prev) => ({ ...prev, ...updates }));
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update listing.");
    } finally {
      setBusy(false);
    }
  };

  const handleMarkSold = async () => {
    setBusy(true);
    setError("");
    try {
      await markListingSold(listing.id);
      setListing((prev) => ({ ...prev, status: "sold" }));
    } catch (err) {
      setError(err.message || "Failed to mark as sold.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing and all its photos permanently?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteListing(listing);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete listing.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2/3: Photos & Details */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`${listing.title} ${idx + 1}`}
                className={`w-full object-cover rounded-lg border border-slate-200 ${
                  idx === 0 ? "col-span-2 h-72" : "h-36"
                }`}
              />
            ))}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <h2 className="text-lg font-bold">Edit Listing</h2>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
                ))}
              </select>
              {listing.type !== "auction" && (
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              )}
            </div>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {listing.category?.replace("_", " ")} • {listing.type}
              </span>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                  listing.status === "sold"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {listing.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
            <p className="text-xl font-extrabold text-indigo-600">
              {listing.type === "auction"
                ? `Starts at ${listing.auction?.startPrice ?? 0} Tokens`
                : `${listing.price} RON`}
            </p>
            <p className="text-slate-700 whitespace-pre-line">{listing.description}</p>
            <p className="text-xs text-slate-500">Posted by {listing.sellerName}</p>

            {isOwner && (
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || listing.status === "sold"}
                  onClick={() => setEditing(true)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy || listing.status === "sold"}
                  onClick={handleMarkSold}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {listing.status === "sold" ? "Sold" : "Mark as Sold"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="px-3.5 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right 1/3: Student B & C Slots */}
      <div className="space-y-4">
        <div
          id="student-b-action-slot"
          className="bg-white rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500"
        >
          Student B Action Slot (Offers / Reserve / Live Auction Bid Box)
        </div>
        <div
          id="student-c-chat-slot"
          className="bg-white rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500"
        >
          Student C Slot (Message Seller / Flag Listing)
        </div>
      </div>
    </div>
  );
}