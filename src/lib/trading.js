// Pure business rules for offers, reservations and bids (Student B).
// No Firebase imports: the browser uses these for instant feedback, and the
// Cloud Functions in Sprint 3–4 reuse the same checks inside their transactions,
// where they are the real authority.

export const MAX_ACTIVE_RESERVATIONS = 2;
export const RESERVATION_MS = 24 * 60 * 60 * 1000;
export const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000;
export const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;
export const MAX_MESSAGE_LENGTH = 500;

export const OFFER_STATUS = { PENDING: "pending", ACCEPTED: "accepted", REJECTED: "rejected" };
export const RESERVATION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export const TRADE_ERRORS = {
  "listing-not-found": "This listing no longer exists.",
  "listing-unavailable": "This listing isn't available any more.",
  "listing-reserved": "Someone has reserved this listing. Try again when the reservation ends.",
  "own-listing": "You can't do that on your own listing.",
  "not-offerable": "Offers are only for fixed-price and swap listings.",
  "duplicate-offer": "You already have a pending offer on this listing.",
  "invalid-amount": "Enter a whole number of lei above zero.",
  "missing-swap": "Pick one of your listings to swap.",
  "message-too-long": `Keep the message under ${MAX_MESSAGE_LENGTH} characters.`,
  "offer-not-pending": "This offer has already been answered.",
  "not-seller": "Only the seller can answer this offer.",
  "not-reservable": "Only fixed-price listings can be reserved.",
  "already-reserved": "This listing is already reserved.",
  "reservation-limit": `You can hold at most ${MAX_ACTIVE_RESERVATIONS} reservations at a time.`,
  "auction-closed": "This auction has closed.",
  "auction-ended": "Too late: the auction ended before your bid arrived.",
  "own-auction": "You can't bid on your own auction.",
  "bid-too-low": "Your bid is below the minimum next bid.",
  "insufficient-tokens": "You don't have enough available tokens for this bid.",
};

export function tradeErrorMessage(err) {
  return TRADE_ERRORS[err?.code] ?? err?.message ?? "Something went wrong. Please try again.";
}

export function tradeError(code) {
  const err = new Error(TRADE_ERRORS[code] ?? code);
  err.code = code;
  return err;
}

export function toMillis(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return new Date(value).getTime();
}

const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

/** UC-B1. Returns an error code, or null when the offer is valid. */
export function validateOffer({ listing, buyerId, kind, amount, swapListingId, message = "", hasPendingOffer, reservedByOther }) {
  if (!listing) return "listing-not-found";
  if (listing.sellerId === buyerId) return "own-listing";
  if (listing.type !== "fixed" && listing.type !== "swap") return "not-offerable";
  if (listing.status !== "active") return "listing-unavailable";
  if (reservedByOther) return "listing-reserved";
  if (hasPendingOffer) return "duplicate-offer";
  if (kind === "price" && !isPositiveInt(amount)) return "invalid-amount";
  if (kind === "swap" && !swapListingId) return "missing-swap";
  if (kind !== "price" && kind !== "swap") return "invalid-amount";
  if (message.length > MAX_MESSAGE_LENGTH) return "message-too-long";
  return null;
}

/** UC-B2. Only the seller, only from pending. */
export function validateOfferAnswer({ offer, callerId }) {
  if (offer.sellerId !== callerId) return "not-seller";
  if (offer.status !== OFFER_STATUS.PENDING) return "offer-not-pending";
  return null;
}

/** UC-B3. activeCount comes from the buyer's counter document on the server. */
export function validateReservation({ listing, buyerId, activeCount, listingHasActiveReservation }) {
  if (!listing) return "listing-not-found";
  if (listing.sellerId === buyerId) return "own-listing";
  if (listing.type !== "fixed") return "not-reservable";
  if (listing.status !== "active" || listingHasActiveReservation) return "already-reserved";
  if (activeCount >= MAX_ACTIVE_RESERVATIONS) return "reservation-limit";
  return null;
}

export function isReservationActive(reservation, nowMs = Date.now()) {
  return reservation?.status === RESERVATION_STATUS.ACTIVE && toMillis(reservation.expiresAt) > nowMs;
}

/** The smallest bid that would be accepted right now. */
export function minNextBid(auction) {
  if (!auction?.highestBidderId) return auction?.startPrice ?? 0;
  return auction.highestBid + auction.minIncrement;
}

/**
 * Tokens a bid newly locks. Raising your own top bid only locks the difference,
 * because the earlier amount is already locked.
 */
export function tokensNeeded(auction, bidderId, amount) {
  return auction.highestBidderId === bidderId ? amount - auction.highestBid : amount;
}

/** UC-B4. nowMs must be the server's clock on the server. */
export function validateBid({ auction, sellerId, bidderId, amount, available, nowMs }) {
  if (!auction || auction.status !== "open") return "auction-closed";
  if (nowMs >= toMillis(auction.endsAt)) return "auction-ended";
  if (bidderId === sellerId) return "own-auction";
  if (!isPositiveInt(amount) || amount < minNextBid(auction)) return "bid-too-low";
  if (tokensNeeded(auction, bidderId, amount) > available) return "insufficient-tokens";
  return null;
}

/**
 * Anti-sniping (UC-B4): a bid with 2:00 or less left pushes the end 2 minutes
 * past the old end. Decisions to confirm with the Product Owner:
 *   - exactly 2:00 left counts as "in the last 2 minutes";
 *   - the extension is added to the old end, not to the bid time.
 * Late bids never reach this function (validateBid rejects them first).
 */
export function applyAntiSniping(endsAtMs, nowMs) {
  return endsAtMs - nowMs <= ANTI_SNIPE_WINDOW_MS ? endsAtMs + ANTI_SNIPE_EXTENSION_MS : endsAtMs;
}
