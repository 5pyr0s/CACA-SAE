import { MOCK_LISTINGS, toDate } from "../mocks/data";

let listingsStore = [...MOCK_LISTINGS];
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function normaliseText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildSearchKeywords(title = "", description = "") {
  const raw = normaliseText(`${title} ${description}`);
  const words = raw.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
  return [...new Set(words)];
}

export function subscribeListings(filters = {}, onData, onError) {
  const runQuery = () => {
    try {
      let results = listingsStore.filter((item) => item.status === "active");

      if (filters.category && filters.category !== "all") {
        results = results.filter((item) => item.category === filters.category);
      }
      if (filters.type && filters.type !== "all") {
        results = results.filter((item) => item.type === filters.type);
      }
      if (filters.minPrice !== undefined && filters.minPrice !== "") {
        results = results.filter((item) => Number(item.price) >= Number(filters.minPrice));
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
        results = results.filter((item) => Number(item.price) <= Number(filters.maxPrice));
      }
      if (filters.search && filters.search.trim() !== "") {
        const queryWords = buildSearchKeywords(filters.search, "");
        results = results.filter((item) =>
          queryWords.every((qw) =>
            item.searchKeywords?.some((kw) => kw.includes(qw)) ||
            normaliseText(item.title).includes(qw)
          )
        );
      }

      results.sort((a, b) => {
        const boostDiff = toDate(b.boostedUntil) - toDate(a.boostedUntil);
        if (boostDiff !== 0) return boostDiff;
        return toDate(b.createdAt) - toDate(a.createdAt);
      });

      onData(results);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  runQuery();
  listeners.add(runQuery);
  return () => listeners.delete(runQuery);
}

export function getListingById(id) {
  return listingsStore.find((item) => item.id === id) || null;
}

export function createListing(input) {
  const nowIso = new Date().toISOString();
  const newListing = {
    id: `lst_${Date.now()}`,
    sellerId: "user_alex",
    sellerName: "Alex Bărbatu",
    type: input.type || "fixed",
    title: input.title,
    description: input.description,
    category: input.category || "other",
    price: input.type === "auction" ? 0 : Number(input.price || 0),
    photoPaths: input.photoPaths?.length
      ? input.photoPaths
      : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"],
    status: "active",
    searchKeywords: buildSearchKeywords(input.title, input.description),
    boostedUntil: new Date(0).toISOString(),
    flagCount: 0,
    createdAt: nowIso,
    auction:
      input.type === "auction"
        ? {
            startPrice: Number(input.startPrice || 50),
            minIncrement: Number(input.minIncrement || 10),
            endsAt: new Date(Date.now() + Number(input.durationHours || 24) * 3600 * 1000).toISOString(),
            highestBid: 0,
            highestBidderId: null,
            status: "open",
            winnerId: null,
          }
        : null,
  };

  listingsStore = [newListing, ...listingsStore];
  notifyListeners();
  return newListing;
}

export function markListingSold(id) {
  listingsStore = listingsStore.map((item) =>
    item.id === id ? { ...item, status: "sold" } : item
  );
  notifyListeners();
}