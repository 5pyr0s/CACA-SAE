import { describe, expect, test } from "vitest";
import {
  applyAntiSniping,
  isReservationActive,
  minNextBid,
  tokensNeeded,
  validateBid,
  validateOffer,
  validateOfferAnswer,
  validateReservation,
} from "../lib/trading";

const at = (hhmmss) => new Date(`2026-12-03T${hhmmss}`).getTime();

describe("bids (UC-B4)", () => {
  const auction = { status: "open", startPrice: 40, minIncrement: 5, highestBid: 70, highestBidderId: "ana", endsAt: at("18:00:00") };
  const bid = (over) => validateBid({ auction, sellerId: "seller", bidderId: "cris", amount: 75, available: 200, nowMs: at("17:00:00"), ...over });

  test("first bid must reach the start price, later bids the increment", () => {
    expect(minNextBid({ ...auction, highestBid: 0, highestBidderId: null })).toBe(40);
    expect(minNextBid(auction)).toBe(75);
  });

  test("plan worked example: 72 on 70 with increment 5 is refused, 75 accepted", () => {
    expect(bid({ amount: 72 })).toBe("bid-too-low");
    expect(bid({ amount: 75 })).toBeNull();
  });

  test("sellers can't bid on their own auction", () => {
    expect(bid({ bidderId: "seller" })).toBe("own-auction");
  });

  test("a bid can't exceed the available balance", () => {
    expect(bid({ amount: 201 })).toBe("insufficient-tokens");
    expect(bid({ amount: 200 })).toBeNull();
  });

  test("raising your own top bid only needs the difference", () => {
    expect(tokensNeeded(auction, "ana", 100)).toBe(30);
    expect(bid({ bidderId: "ana", amount: 100, available: 30 })).toBeNull();
    expect(bid({ bidderId: "ana", amount: 100, available: 29 })).toBe("insufficient-tokens");
  });

  test("a bid exactly at endsAt is late", () => {
    expect(bid({ nowMs: at("18:00:00") })).toBe("auction-ended");
    expect(bid({ nowMs: at("17:59:59") })).toBeNull();
  });

  test("closed auctions and fractional amounts are refused", () => {
    expect(bid({ auction: { ...auction, status: "closed" } })).toBe("auction-closed");
    expect(bid({ amount: 75.5 })).toBe("bid-too-low");
  });
});

describe("anti-sniping: the dev plan's 18:00 table", () => {
  test("2:30 left: unchanged", () => {
    expect(applyAntiSniping(at("18:00:00"), at("17:57:30"))).toBe(at("18:00:00"));
  });
  test("1:20 left: ends 18:02", () => {
    expect(applyAntiSniping(at("18:00:00"), at("17:58:40"))).toBe(at("18:02:00"));
  });
  test("0:45 left on the extended auction: ends 18:04", () => {
    expect(applyAntiSniping(at("18:02:00"), at("18:01:15"))).toBe(at("18:04:00"));
  });
  test("exactly 2:00 left counts (PO decision to confirm)", () => {
    expect(applyAntiSniping(at("18:00:00"), at("17:58:00"))).toBe(at("18:02:00"));
  });
  test("18:04:01 is rejected before anti-sniping applies", () => {
    const auction = { status: "open", startPrice: 40, minIncrement: 5, highestBid: 70, highestBidderId: "ana", endsAt: at("18:04:00") };
    expect(validateBid({ auction, sellerId: "s", bidderId: "b", amount: 80, available: 100, nowMs: at("18:04:01") })).toBe("auction-ended");
  });
});

describe("offers (UC-B1, UC-B2)", () => {
  const listing = { id: "l1", sellerId: "seller", type: "fixed", status: "active" };
  const offer = (over) => validateOffer({ listing, buyerId: "buyer", kind: "price", amount: 100, ...over });

  test("a valid price offer passes", () => expect(offer()).toBeNull());
  test("one pending offer per listing", () => expect(offer({ hasPendingOffer: true })).toBe("duplicate-offer"));
  test("no offers on your own listing", () => expect(offer({ buyerId: "seller" })).toBe("own-listing"));
  test("no offers on auctions or sold listings", () => {
    expect(offer({ listing: { ...listing, type: "auction" } })).toBe("not-offerable");
    expect(offer({ listing: { ...listing, status: "sold" } })).toBe("listing-unavailable");
  });
  test("no offers while someone else holds a reservation", () => expect(offer({ reservedByOther: true })).toBe("listing-reserved"));
  test("price must be a positive whole number; swaps need a listing", () => {
    expect(offer({ amount: 0 })).toBe("invalid-amount");
    expect(offer({ amount: 12.5 })).toBe("invalid-amount");
    expect(offer({ kind: "swap", amount: null })).toBe("missing-swap");
    expect(offer({ kind: "swap", amount: null, swapListingId: "l9" })).toBeNull();
  });
  test("only the seller answers, only while pending", () => {
    const pending = { sellerId: "seller", status: "pending" };
    expect(validateOfferAnswer({ offer: pending, callerId: "seller" })).toBeNull();
    expect(validateOfferAnswer({ offer: pending, callerId: "buyer" })).toBe("not-seller");
    expect(validateOfferAnswer({ offer: { ...pending, status: "accepted" }, callerId: "seller" })).toBe("offer-not-pending");
  });
});

describe("reservations (UC-B3)", () => {
  const listing = { id: "l1", sellerId: "seller", type: "fixed", status: "active" };
  const reserve = (over) => validateReservation({ listing, buyerId: "buyer", activeCount: 0, ...over });

  test("at most 2 active reservations", () => {
    expect(reserve({ activeCount: 1 })).toBeNull();
    expect(reserve({ activeCount: 2 })).toBe("reservation-limit");
  });
  test("only fixed-price listings, not your own, not already reserved", () => {
    expect(reserve({ listing: { ...listing, type: "swap" } })).toBe("not-reservable");
    expect(reserve({ buyerId: "seller" })).toBe("own-listing");
    expect(reserve({ listingHasActiveReservation: true })).toBe("already-reserved");
  });
  test("a reservation past expiresAt is no longer active", () => {
    const r = { status: "active", expiresAt: "2026-12-01T12:00:00Z" };
    expect(isReservationActive(r, Date.parse("2026-12-01T11:59:59Z"))).toBe(true);
    expect(isReservationActive(r, Date.parse("2026-12-01T12:00:00Z"))).toBe(false);
  });
});
