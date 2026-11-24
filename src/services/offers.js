// UC-B1 / UC-B2 offers — Student B. Sprint 1: fake data.
// Sprint 3: makeOffer becomes a rules-guarded addDoc on offers/, the subscribe*
// functions become onSnapshot queries (sent: buyerId == uid, received:
// sellerId == uid, each with an index), and accept/reject become one callable
// function that runs a transaction on the server.
import { MOCK_OFFERS, demoDataFor } from "../mocks/trading";
import { OFFER_STATUS, toMillis, tradeError, validateOffer, validateOfferAnswer } from "../lib/trading";
import { markListingSold } from "./listings";
import { completeReservationsForListing, getActiveReservationForListing } from "./reservations";
import { createMockStore, fakeLatency } from "./mockStore";

const store = createMockStore(MOCK_OFFERS);
const seeded = new Set();

function seed(uid, name) {
  if (!uid || seeded.has(uid)) return;
  seeded.add(uid);
  store.update((items) => [...demoDataFor(uid, name).offers, ...items]);
}

const newestFirst = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);

function subscribeWhere(predicate, onData, onError) {
  return store.subscribe(() => {
    try {
      onData(store.all().filter(predicate).sort(newestFirst));
    } catch (err) {
      onError?.(err);
    }
  });
}

/** "My offers → Sent". */
export function subscribeSentOffers(uid, onData, onError, { name } = {}) {
  seed(uid, name);
  return subscribeWhere((o) => o.buyerId === uid, onData, onError);
}

/** "My offers → Received". */
export function subscribeReceivedOffers(uid, onData, onError, { name } = {}) {
  seed(uid, name);
  return subscribeWhere((o) => o.sellerId === uid, onData, onError);
}

/** The buyer's offers on one listing, so the listing page can show "Offer pending". */
export function subscribeMyOffersOnListing(listingId, uid, onData) {
  return subscribeWhere((o) => o.listingId === listingId && o.buyerId === uid, onData);
}

/** UC-B1. swapListing is one of the buyer's own listings ({ id, title }). */
export async function makeOffer({ listing, buyer, kind, amount, swapListing, message = "" }) {
  await fakeLatency();
  const reservation = getActiveReservationForListing(listing.id);
  const code = validateOffer({
    listing,
    buyerId: buyer.uid,
    kind,
    amount,
    swapListingId: swapListing?.id,
    message,
    hasPendingOffer: store
      .all()
      .some((o) => o.listingId === listing.id && o.buyerId === buyer.uid && o.status === OFFER_STATUS.PENDING),
    reservedByOther: Boolean(reservation && reservation.buyerId !== buyer.uid),
  });
  if (code) throw tradeError(code);

  const offer = {
    id: `off_${Date.now()}`,
    listingId: listing.id,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    buyerId: buyer.uid,
    buyerName: buyer.name,
    kind,
    amount: kind === "price" ? amount : null,
    swapListingId: kind === "swap" ? swapListing.id : null,
    swapListingTitle: kind === "swap" ? swapListing.title : null,
    message: message.trim(),
    status: OFFER_STATUS.PENDING,
    rejectReason: null,
    createdAt: new Date().toISOString(),
  };
  store.update((items) => [offer, ...items]);
  // Sprint 3: an onCreate trigger queues "Someone sent you an offer" (key offer_<id>).
  return offer;
}

function findOffer(offerId) {
  const offer = store.all().find((o) => o.id === offerId);
  if (!offer) throw tradeError("listing-not-found");
  return offer;
}

/**
 * UC-B2 accept: the offer is accepted, the listing becomes sold, every other
 * pending offer on it is rejected, and any reservation completes. On the server
 * this is one transaction, so a double-click accepts only once.
 */
export async function acceptOffer(offerId, callerId) {
  await fakeLatency();
  const offer = findOffer(offerId);
  const code = validateOfferAnswer({ offer, callerId });
  if (code) throw tradeError(code);

  store.update((items) =>
    items.map((o) => {
      if (o.id === offerId) return { ...o, status: OFFER_STATUS.ACCEPTED };
      if (o.listingId === offer.listingId && o.status === OFFER_STATUS.PENDING)
        return { ...o, status: OFFER_STATUS.REJECTED, rejectReason: "Another offer was accepted." };
      return o;
    })
  );
  markListingSold(offer.listingId);
  completeReservationsForListing(offer.listingId);
  // Sprint 3: queue "Your item sold" (seller) and "Offer accepted" (buyer).
}

/** UC-B2 reject, with an optional reason the buyer sees under "My offers". */
export async function rejectOffer(offerId, callerId, reason = "") {
  await fakeLatency();
  const offer = findOffer(offerId);
  const code = validateOfferAnswer({ offer, callerId });
  if (code) throw tradeError(code);
  store.update((items) =>
    items.map((o) =>
      o.id === offerId ? { ...o, status: OFFER_STATUS.REJECTED, rejectReason: reason.trim() || null } : o
    )
  );
}
