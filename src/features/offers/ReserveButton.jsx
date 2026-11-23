import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { MAX_ACTIVE_RESERVATIONS, toMillis, tradeErrorMessage } from "../../lib/trading";
import { cancelReservation, reserveListing, subscribeListingReservation, subscribeMyReservations } from "../../services/reservations";

const formatUntil = (value) =>
  new Date(toMillis(value)).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });

// UC-B3: reserve a fixed-price listing for 24 hours (at most 2 at a time).
export default function ReserveButton({ listing }) {
  const { user, profile } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => subscribeListingReservation(listing.id, setReservation), [listing.id]);
  useEffect(
    () =>
      subscribeMyReservations(user.uid, ({ activeCount: n }) => setActiveCount(n), undefined, {
        name: profile?.displayName,
      }),
    [user.uid, profile?.displayName]
  );

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

  const mine = reservation?.buyerId === user.uid;
  const atLimit = activeCount >= MAX_ACTIVE_RESERVATIONS;
  const base = "w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60";

  let button;
  if (mine) {
    button = (
      <div className="space-y-2">
        <p className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          Reserved for you until {formatUntil(reservation.expiresAt)}
        </p>
        <button type="button" disabled={busy} onClick={() => run(() => cancelReservation(reservation.id, user.uid))} className={`${base} border border-slate-300 text-slate-700 hover:bg-slate-50`}>
          {busy ? "Cancelling…" : "Cancel reservation"}
        </button>
      </div>
    );
  } else if (reservation) {
    button = (
      <button type="button" disabled className={`${base} border border-slate-200 bg-slate-50 text-slate-500`}>
        Reserved until {formatUntil(reservation.expiresAt)}
      </button>
    );
  } else {
    button = (
      <button
        type="button"
        disabled={busy || atLimit}
        onClick={() => run(() => reserveListing({ listing, buyer: { uid: user.uid, name: profile?.displayName } }))}
        className={`${base} border border-slate-300 text-slate-800 hover:bg-slate-50`}
      >
        {busy ? "Reserving…" : atLimit ? `${activeCount} of ${MAX_ACTIVE_RESERVATIONS} reservations used` : "Reserve for 24h"}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      {button}
      {!reservation && !atLimit && (
        <p className="text-xs text-slate-500 text-center">
          {activeCount} of {MAX_ACTIVE_RESERVATIONS} reservations used
        </p>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
