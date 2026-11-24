// UC-B3 reservations — Student B. Sprint 1: fake data.
// Sprint 3: reads become onSnapshot queries on reservations/, and
// reserveListing/cancelReservation become callable functions (the browser can't
// write reservations; the "max 2" limit lives in a counter document).
import { demoDataFor } from "../mocks/trading";
import {
  RESERVATION_MS,
  RESERVATION_STATUS,
  isReservationActive,
  toMillis,
  tradeError,
  validateReservation,
} from "../lib/trading";
import { createMockStore, fakeLatency } from "./mockStore";

const store = createMockStore([]);
const seeded = new Set();

function seed(uid, name) {
  if (!uid || seeded.has(uid)) return;
  seeded.add(uid);
  store.update((items) => [...demoDataFor(uid, name).reservations, ...items]);
}

// The sweeper's job on the server; here, expiry is applied whenever data is read.
function withExpiry(r, nowMs = Date.now()) {
  return r.status === RESERVATION_STATUS.ACTIVE && toMillis(r.expiresAt) <= nowMs
    ? { ...r, status: RESERVATION_STATUS.EXPIRED }
    : r;
}

export function getActiveReservationForListing(listingId) {
  return store.all().find((r) => r.listingId === listingId && isReservationActive(r)) ?? null;
}

function activeCountFor(uid) {
  return store.all().filter((r) => r.buyerId === uid && isReservationActive(r)).length;
}

/** The buyer's reservations, newest first, plus how many are active. */
export function subscribeMyReservations(uid, onData, onError, { name } = {}) {
  seed(uid, name);
  return store.subscribe(() => {
    try {
      const items = store
        .all()
        .filter((r) => r.buyerId === uid)
        .map((r) => withExpiry(r))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData({ items, activeCount: items.filter((r) => r.status === RESERVATION_STATUS.ACTIVE).length });
    } catch (err) {
      onError?.(err);
    }
  });
}

/** The active reservation on one listing (or null), live. */
export function subscribeListingReservation(listingId, onData) {
  return store.subscribe(() => onData(getActiveReservationForListing(listingId)));
}

export async function reserveListing({ listing, buyer }) {
  await fakeLatency();
  seed(buyer.uid, buyer.name);
  const code = validateReservation({
    listing,
    buyerId: buyer.uid,
    activeCount: activeCountFor(buyer.uid),
    listingHasActiveReservation: Boolean(getActiveReservationForListing(listing.id)),
  });
  if (code) throw tradeError(code);

  const nowMs = Date.now();
  const reservation = {
    id: `res_${nowMs}`,
    listingId: listing.id,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    buyerId: buyer.uid,
    status: RESERVATION_STATUS.ACTIVE,
    expiresAt: new Date(nowMs + RESERVATION_MS).toISOString(),
    createdAt: new Date(nowMs).toISOString(),
  };
  store.update((items) => [reservation, ...items]);
  return reservation;
}

export async function cancelReservation(reservationId, uid) {
  await fakeLatency();
  const r = store.all().find((x) => x.id === reservationId);
  if (!r || r.buyerId !== uid || !isReservationActive(r)) throw tradeError("listing-unavailable");
  store.update((items) =>
    items.map((x) => (x.id === reservationId ? { ...x, status: RESERVATION_STATUS.CANCELLED } : x))
  );
}

/** Called when the seller completes the deal (accepting an offer or marking sold). */
export function completeReservationsForListing(listingId) {
  store.update((items) =>
    items.map((x) =>
      x.listingId === listingId && isReservationActive(x) ? { ...x, status: RESERVATION_STATUS.COMPLETED } : x
    )
  );
}
