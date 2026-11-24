// UC-B4 / UC-B5 live auctions — Student B. Sprint 1: fake data.
// Sprint 4: subscribeAuction listens to the single listing document (highest bid
// and endsAt live there, not in the bids collection), placeBid becomes the
// placeBid callable (server transaction with token escrow), and
// getServerTimeOffset calls a tiny function that returns the server's clock.
import { MOCK_AVAILABLE_TOKENS, MOCK_BIDS } from "../mocks/trading";
import { applyAntiSniping, minNextBid, toMillis, tradeError, validateBid } from "../lib/trading";
import { createMockStore, fakeLatency } from "./mockStore";

// listingId → { auction, bids }. Seeded from the listing the first time it's watched.
const store = createMockStore([]);

function entryFor(listing) {
  let entry = store.all().find((e) => e.listingId === listing.id);
  if (!entry) {
    entry = {
      listingId: listing.id,
      auction: { ...listing.auction, bidCount: (MOCK_BIDS[listing.id] ?? []).length },
      bids: [...(MOCK_BIDS[listing.id] ?? [])].reverse(),
    };
    store.update((items) => [...items, entry]);
  }
  return entry;
}

/** Live { auction, bids } for one auction listing; bids newest first. */
export function subscribeAuction(listing, onData) {
  entryFor(listing);
  return store.subscribe(() => {
    const entry = store.all().find((e) => e.listingId === listing.id);
    if (entry) onData({ auction: entry.auction, bids: entry.bids });
  });
}

/** Difference between the server's clock and this laptop's, measured once. */
export async function getServerTimeOffset() {
  return 0;
}

/** Fake available balance until C's useWallet() exists. */
export function getMockAvailableTokens() {
  return MOCK_AVAILABLE_TOKENS;
}

function applyBid(listing, bidder, amount) {
  const entry = entryFor(listing);
  const nowMs = Date.now();
  const code = validateBid({
    auction: entry.auction,
    sellerId: listing.sellerId,
    bidderId: bidder.uid,
    amount,
    available: getMockAvailableTokens(bidder.uid),
    nowMs,
  });
  if (code) throw tradeError(code);

  const endsAtMs = applyAntiSniping(toMillis(entry.auction.endsAt), nowMs);
  const bid = {
    id: `bid_${nowMs}_${bidder.uid}`,
    bidderId: bidder.uid,
    bidderName: bidder.name,
    amount,
    createdAt: new Date(nowMs).toISOString(),
  };
  store.update((items) =>
    items.map((e) =>
      e.listingId === listing.id
        ? {
            ...e,
            auction: {
              ...e.auction,
              highestBid: amount,
              highestBidderId: bidder.uid,
              bidCount: (e.auction.bidCount ?? 0) + 1,
              endsAt: new Date(endsAtMs).toISOString(),
            },
            bids: [bid, ...e.bids],
          }
        : e
    )
  );
  return { bid, extended: endsAtMs !== toMillis(entry.auction.endsAt) };
}

/** UC-B4. On the server: lock the new amount, unlock the previous leader, notify them. */
export async function placeBid({ listing, bidder, amount }) {
  await fakeLatency();
  return applyBid(listing, bidder, amount);
}

/** Prototype only: another student outbids you, so the "outbid" state can be demoed. */
export async function simulateRivalBid(listing) {
  const { auction } = entryFor(listing);
  return applyBid(listing, { uid: "user_rival_demo", name: "Demo rival" }, minNextBid(auction));
}
