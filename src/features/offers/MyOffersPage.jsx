import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { MAX_ACTIVE_RESERVATIONS, OFFER_STATUS, toMillis, tradeErrorMessage } from "../../lib/trading";
import { acceptOffer, rejectOffer, subscribeReceivedOffers, subscribeSentOffers } from "../../services/offers";
import { cancelReservation, subscribeMyReservations } from "../../services/reservations";
import Spinner from "../auth/Spinner";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-slate-200 text-slate-700",
  active: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  expired: "bg-slate-200 text-slate-700",
  cancelled: "bg-slate-200 text-slate-700",
};

const when = (v) => new Date(toMillis(v)).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status] ?? ""}`}>{status}</span>
  );
}

function offerSummary(o) {
  return o.kind === "price" ? `${o.amount} RON` : `Swap for “${o.swapListingTitle}”`;
}

// Live list from a subscribe(uid, onData, onError) service function.
function useLive(subscribe, uid, name) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(
    () => subscribe(uid, (data) => setState({ data, error: null }), (error) => setState({ data: null, error }), { name }),
    [subscribe, uid, name]
  );
  return state;
}

export default function MyOffersPage() {
  const { user, profile } = useAuth();
  const name = profile?.displayName || user.displayName || undefined;
  const [tab, setTab] = useState("received");

  const sent = useLive(subscribeSentOffers, user.uid, name);
  const received = useLive(subscribeReceivedOffers, user.uid, name);
  const reservations = useLive(subscribeMyReservations, user.uid, name);

  const pendingReceived = received.data?.filter((o) => o.status === OFFER_STATUS.PENDING).length ?? 0;
  const tabs = [
    ["received", "Received", pendingReceived],
    ["sent", "Sent", 0],
    ["reservations", "Reservations", reservations.data?.activeCount ?? 0],
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">My offers</h1>

      <div role="tablist" className="flex gap-1 border-b border-slate-200">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${
              tab === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
            {count > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs">{count}</span>}
          </button>
        ))}
      </div>

      {tab === "received" && <ReceivedList state={received} uid={user.uid} />}
      {tab === "sent" && <SentList state={sent} />}
      {tab === "reservations" && <ReservationList state={reservations} uid={user.uid} />}
    </div>
  );
}

function ListShell({ state, empty, children }) {
  if (state.error) return <p className="text-sm text-rose-700">Couldn't load this list: {state.error.message}</p>;
  if (!state.data) return <Spinner />;
  const items = Array.isArray(state.data) ? state.data : state.data.items;
  if (items.length === 0)
    return <p className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">{empty}</p>;
  return <ul className="space-y-3">{children(items)}</ul>;
}

function Card({ children }) {
  return <li className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">{children}</li>;
}

function SentList({ state }) {
  return (
    <ListShell state={state} empty="You haven't sent any offers yet.">
      {(items) =>
        items.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={`/listings/${o.listingId}`} className="font-semibold text-slate-900 hover:underline">
                {o.listingTitle}
              </Link>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-slate-700">
              {offerSummary(o)} to {o.sellerName} · {when(o.createdAt)}
            </p>
            {o.status === OFFER_STATUS.REJECTED && o.rejectReason && (
              <p className="text-sm text-slate-600 italic">Seller's reason: “{o.rejectReason}”</p>
            )}
            {o.status === OFFER_STATUS.ACCEPTED && (
              <p className="text-sm text-emerald-700">Accepted! Message the seller to arrange the handover.</p>
            )}
          </Card>
        ))
      }
    </ListShell>
  );
}

function ReceivedList({ state, uid }) {
  return (
    <ListShell state={state} empty="No offers on your listings yet.">
      {(items) => items.map((o) => <ReceivedOffer key={o.id} offer={o} uid={uid} />)}
    </ListShell>
  );
}

function ReceivedOffer({ offer, uid }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(tradeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/listings/${offer.listingId}`} className="font-semibold text-slate-900 hover:underline">
          {offer.listingTitle}
        </Link>
        <StatusBadge status={offer.status} />
      </div>
      <p className="text-sm text-slate-700">
        <span className="font-medium">{offer.buyerName}</span> offers {offerSummary(offer)} · {when(offer.createdAt)}
      </p>
      {offer.message && <p className="text-sm text-slate-600">“{offer.message}”</p>}
      {offer.status === OFFER_STATUS.REJECTED && offer.rejectReason && (
        <p className="text-xs text-slate-500">Reason: {offer.rejectReason}</p>
      )}

      {offer.status === OFFER_STATUS.PENDING &&
        (rejecting ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              maxLength={200}
              className="flex-1 min-w-48 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
            />
            <button type="button" disabled={busy} onClick={() => run(() => rejectOffer(offer.id, uid, reason))} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "Rejecting…" : "Reject offer"}
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
              Back
            </button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <button type="button" disabled={busy} onClick={() => run(() => acceptOffer(offer.id, uid))} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {busy ? "Accepting…" : "Accept"}
            </button>
            <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">
              Reject
            </button>
          </div>
        ))}
      {offer.status === OFFER_STATUS.PENDING && !rejecting && (
        <p className="text-xs text-slate-500">Accepting marks the listing sold and rejects the other pending offers.</p>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </Card>
  );
}

function ReservationList({ state, uid }) {
  return (
    <>
      {state.data && (
        <p className="text-sm text-slate-600">
          {state.data.activeCount} of {MAX_ACTIVE_RESERVATIONS} reservations used. Reservations last 24 hours.
        </p>
      )}
      <ListShell state={state} empty="You have no reservations.">
        {(items) =>
          items.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/listings/${r.listingId}`} className="font-semibold text-slate-900 hover:underline">
                  {r.listingTitle}
                </Link>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-slate-700">
                From {r.sellerName} · {r.status === "active" ? `held until ${when(r.expiresAt)}` : `reserved ${when(r.createdAt)}`}
              </p>
              {r.status === "active" && (
                <button type="button" onClick={() => cancelReservation(r.id, uid)} className="text-sm font-medium text-slate-600 underline hover:text-slate-900">
                  Cancel reservation
                </button>
              )}
            </Card>
          ))
        }
      </ListShell>
    </>
  );
}
