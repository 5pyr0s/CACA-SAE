// Sprint 1 fake data for offers, reservations and bids (Student B).
// Field names follow the collection map in the dev plan. listingTitle,
// buyerName and sellerName are copied onto offers/reservations so list screens
// don't need a second read (proposed contract addition, agree with A).
// Delete this file when services/offers.js, reservations.js and auctions.js
// switch to Firestore in Sprint 3–4.

const now = Date.now();
const hour = 3600 * 1000;
const iso = (ms) => new Date(ms).toISOString();

export const MOCK_OFFERS = [
  {
    id: "off_1",
    listingId: "lst_1",
    listingTitle: "Texas Instruments TI-84 Plus Calculator",
    sellerId: "user_alex",
    sellerName: "Alex Bărbatu",
    buyerId: "user_spiridon",
    buyerName: "Spiridon Pop-Pavalean",
    kind: "price",
    amount: 190,
    swapListingId: null,
    swapListingTitle: null,
    message: "Can pick it up today after the 14:00 lab.",
    status: "pending",
    rejectReason: null,
    createdAt: iso(now - 2 * hour),
  },
];

export const MOCK_BIDS = {
  lst_2: [
    { id: "bid_1", bidderId: "user_alex", bidderName: "Alex Bărbatu", amount: 300, createdAt: iso(now - 90 * 60 * 1000) },
    { id: "bid_2", bidderId: "user_spiridon", bidderName: "Spiridon Pop-Pavalean", amount: 340, createdAt: iso(now - 40 * 60 * 1000) },
  ],
};

/** Fake wallet balance for the bid box until C's useWallet() exists. */
export const MOCK_AVAILABLE_TOKENS = 500;

/**
 * Gives whoever signs in something to click: two offers received on a demo
 * listing of theirs, one rejected offer they sent, and one active reservation
 * (so reserving one more item shows "2 of 2 reservations used").
 */
export function demoDataFor(uid, name = "You") {
  const myListingId = `lst_demo_${uid}`;
  return {
    offers: [
      {
        id: `off_demo_r1_${uid}`,
        listingId: myListingId,
        listingTitle: "IKEA desk lamp (demo listing)",
        sellerId: uid,
        sellerName: name,
        buyerId: "user_alex",
        buyerName: "Alex Bărbatu",
        kind: "price",
        amount: 40,
        message: "Is it still available? I'm in C12.",
        status: "pending",
        rejectReason: null,
        createdAt: iso(now - 30 * 60 * 1000),
      },
      {
        id: `off_demo_r2_${uid}`,
        listingId: myListingId,
        listingTitle: "IKEA desk lamp (demo listing)",
        sellerId: uid,
        sellerName: name,
        buyerId: "user_spiridon",
        buyerName: "Spiridon Pop-Pavalean",
        kind: "swap",
        amount: null,
        swapListingId: "lst_3",
        swapListingTitle: "Computer Networks (Tanenbaum 5th Ed.)",
        message: "",
        status: "pending",
        rejectReason: null,
        createdAt: iso(now - 10 * 60 * 1000),
      },
      {
        id: `off_demo_s1_${uid}`,
        listingId: "lst_demo_other",
        listingTitle: "Mini fridge, 50 L",
        sellerId: "user_spiridon",
        sellerName: "Spiridon Pop-Pavalean",
        buyerId: uid,
        buyerName: name,
        kind: "price",
        amount: 150,
        message: "",
        status: "rejected",
        rejectReason: "Already promised to a friend, sorry!",
        createdAt: iso(now - 26 * hour),
      },
    ],
    reservations: [
      {
        id: `res_demo_${uid}`,
        listingId: "lst_demo_res",
        listingTitle: "Desk chair, adjustable",
        sellerId: "user_alex",
        sellerName: "Alex Bărbatu",
        buyerId: uid,
        status: "active",
        expiresAt: iso(now + 9 * hour),
        createdAt: iso(now - 15 * hour),
      },
    ],
  };
}
