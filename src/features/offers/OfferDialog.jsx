import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { MAX_MESSAGE_LENGTH, tradeErrorMessage } from "../../lib/trading";
import { subscribeListings } from "../../services/listings";
import { makeOffer } from "../../services/offers";

// UC-B1: offer a price, or one of my own listings as a swap, plus a message.
export default function OfferDialog({ listing, onClose, onSent }) {
  const { user, profile } = useAuth();
  const [kind, setKind] = useState(listing.type === "swap" ? "swap" : "price");
  const [amount, setAmount] = useState("");
  const [swapId, setSwapId] = useState("");
  const [message, setMessage] = useState("");
  const [myListings, setMyListings] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef(null);

  useEffect(
    () =>
      subscribeListings({}, (items) =>
        setMyListings(items.filter((l) => l.sellerId === user.uid && l.type !== "auction" && l.id !== listing.id))
      ),
    [user.uid, listing.id]
  );

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const offer = await makeOffer({
        listing,
        buyer: { uid: user.uid, name: profile?.displayName || user.displayName || "Student" },
        kind,
        amount: kind === "price" ? Number(amount) : null,
        swapListing: myListings.find((l) => l.id === swapId),
        message,
      });
      onSent?.(offer);
      onClose();
    } catch (err) {
      setError(tradeErrorMessage(err));
      setBusy(false);
    }
  };

  const tab = (value, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={kind === value}
      onClick={() => setKind(value)}
      className={`flex-1 py-1.5 rounded-md text-sm font-medium ${kind === value ? "bg-white shadow text-slate-900" : "text-slate-600"}`}
    >
      {label}
    </button>
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="offer-title"
      className="m-auto w-full max-w-md rounded-xl p-0 backdrop:bg-slate-900/40"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h2 id="offer-title" className="text-lg font-bold text-slate-900">Make an offer</h2>
          <p className="text-sm text-slate-500 truncate">
            {listing.title} · asking {listing.price} RON
          </p>
        </div>

        <div role="tablist" className="flex gap-1 p-1 rounded-lg bg-slate-100">
          {tab("price", "Offer a price")}
          {tab("swap", "Swap an item")}
        </div>

        {kind === "price" ? (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Your price (RON)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(listing.price)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        ) : myListings.length === 0 ? (
          <p className="text-sm text-slate-600 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            You have no active listings to swap.{" "}
            <Link to="/listings/new" className="font-medium text-indigo-600 hover:underline">
              Post one first
            </Link>
            .
          </p>
        ) : (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">One of your listings</span>
            <select
              value={swapId}
              onChange={(e) => setSwapId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">Choose…</option>
              {myListings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Message (optional)</span>
          <textarea
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="When and where could you meet?"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {error && (
          <p role="alert" className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || (kind === "price" ? !amount : !swapId)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send offer"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
