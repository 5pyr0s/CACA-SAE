import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { formatDuration, useCountdown } from "../../hooks/useCountdown";
import { ANTI_SNIPE_WINDOW_MS, toMillis } from "../../lib/trading";
import { getServerTimeOffset, simulateRivalBid, subscribeAuction } from "../../services/auctions";
import BidBox from "./BidBox";

// UC-B4: live highest bid, bid history and countdown for one auction listing.
export default function AuctionPanel({ listing }) {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0);

  useEffect(() => subscribeAuction(listing, setState), [listing]);
  useEffect(() => {
    getServerTimeOffset().then(setOffsetMs).catch(() => {});
  }, []);

  const endsAtMs = toMillis(state?.auction.endsAt);
  const left = useCountdown(endsAtMs, offsetMs);

  if (!state) return null;
  const { auction, bids } = state;
  const ended = left === 0 || auction.status !== "open";
  const isSeller = user?.uid === listing.sellerId;
  const isLeader = user && auction.highestBidderId === user.uid;
  const wasOutbid = user && !isLeader && bids.some((b) => b.bidderId === user.uid);
  const final = left > 0 && left <= ANTI_SNIPE_WINDOW_MS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-amber-700">Live token auction</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
            ended ? "bg-slate-200 text-slate-700" : final ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
          }`}
          aria-live="polite"
        >
          {ended ? "Ended" : `Ends in ${formatDuration(left)}`}
        </span>
      </div>

      <div>
        <div className="text-xs text-slate-500">{auction.highestBidderId ? "Highest bid" : "Starting price"}</div>
        <div className="text-3xl font-bold tabular-nums">
          {auction.highestBidderId ? auction.highestBid : auction.startPrice} <span className="text-base font-semibold">Tokens</span>
        </div>
        <div className="text-xs text-slate-500">
          {auction.bidCount ?? bids.length} bids · min increment {auction.minIncrement} tokens
        </div>
      </div>

      {final && !ended && (
        <p className="text-xs text-rose-700">Final 2 minutes: any bid now adds 2 minutes to the clock.</p>
      )}

      {isLeader && (
        <p className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-800">
          {ended ? "You won this auction." : "You're the highest bidder."}
        </p>
      )}
      {wasOutbid && !ended && (
        <p className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm font-medium text-amber-900">
          You've been outbid. Your tokens have been released.
        </p>
      )}

      {ended ? (
        <p className="text-sm text-slate-600">
          {auction.highestBidderId ? "Bidding is closed. The winner and seller will get an email." : "Ended with no bids."}
        </p>
      ) : !user ? (
        <Link
          to="/login"
          state={{ from: { pathname: `/listings/${listing.id}` } }}
          className="block w-full text-center py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
        >
          Sign in to bid
        </Link>
      ) : isSeller ? (
        <p className="text-sm text-slate-600">This is your auction, so you can't bid on it.</p>
      ) : (
        // Remount on every new highest bid so stale input and messages clear.
        <BidBox key={auction.highestBid} listing={listing} auction={auction} />
      )}

      {bids.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Bid history</div>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {bids.map((b, i) => (
              <li key={b.id} className="flex justify-between text-sm">
                <span className={i === 0 ? "font-semibold" : "text-slate-600"}>
                  {b.bidderId === user?.uid ? "You" : b.bidderName}
                </span>
                <span className="tabular-nums text-slate-700">
                  {b.amount} · {new Date(toMillis(b.createdAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {import.meta.env.DEV && !ended && (
        <button type="button" onClick={() => simulateRivalBid(listing)} className="text-xs text-slate-400 hover:text-slate-600 underline">
          Prototype: simulate a rival bid
        </button>
      )}
    </div>
  );
}
