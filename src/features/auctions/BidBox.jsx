import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { minNextBid, tokensNeeded, tradeErrorMessage } from "../../lib/trading";
import { getMockAvailableTokens, placeBid } from "../../services/auctions";

// UC-B4 bid input. Defaults to the minimum next bid; the server re-checks everything.
export default function BidBox({ listing, auction }) {
  const { user, profile } = useAuth();
  const minimum = minNextBid(auction);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Swap for C's useWallet().available in Sprint 4.
  const available = getMockAvailableTokens(user.uid);
  const value = amount === "" ? minimum : Number(amount);
  const needed = Number.isFinite(value) ? tokensNeeded(auction, user.uid, value) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const { extended } = await placeBid({
        listing,
        bidder: { uid: user.uid, name: profile?.displayName || user.displayName || "You" },
        amount: value,
      });
      setAmount("");
      setFeedback({ ok: true, text: extended ? "Bid placed. The auction was extended by 2 minutes." : "Bid placed." });
    } catch (err) {
      setFeedback({ ok: false, text: tradeErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-xs font-medium text-slate-600" htmlFor="bid-amount">
        Your bid (minimum {minimum} tokens)
      </label>
      <div className="flex gap-2">
        <input
          id="bid-amount"
          type="number"
          inputMode="numeric"
          min={minimum}
          step={1}
          placeholder={String(minimum)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
        >
          {busy ? "Bidding…" : `Bid ${Number.isFinite(value) ? value : ""}`}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Locks {Math.max(0, needed)} tokens · {available} available
      </p>
      {feedback && (
        <p role={feedback.ok ? "status" : "alert"} className={`text-sm ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {feedback.text}
        </p>
      )}
    </form>
  );
}
