import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadListingPhotos, deleteStoragePaths } from "./storage";

const LISTINGS = "listings";

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
  const constraints = [where("status", "==", "active")];

  if (filters.category && filters.category !== "all") {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.type && filters.type !== "all") {
    constraints.push(where("type", "==", filters.type));
  }

  constraints.push(orderBy("boostedUntil", "desc"));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(20));

  const q = query(collection(db, LISTINGS), ...constraints);

  return onSnapshot(
    q,
    (snap) => {
      let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (filters.minPrice !== undefined && filters.minPrice !== "") {
        results = results.filter((item) => Number(item.price) >= Number(filters.minPrice));
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
        results = results.filter((item) => Number(item.price) <= Number(filters.maxPrice));
      }
      if (filters.search && filters.search.trim() !== "") {
        const queryWords = buildSearchKeywords(filters.search, "");
        results = results.filter((item) =>
          queryWords.every(
            (qw) =>
              item.searchKeywords?.some((kw) => kw.includes(qw)) ||
              normaliseText(item.title).includes(qw)
          )
        );
      }

      onData(results);
    },
    (err) => {
      console.error("Listings listener error:", err);
      if (onError) onError(err);
    }
  );
}

export async function getListingById(id) {
  const snap = await getDoc(doc(db, LISTINGS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createListing(input, user, files = [], onProgress) {
  if (!user?.uid) throw new Error("Must be signed in to post a listing");

  const listingRef = doc(collection(db, LISTINGS));
  const uploaded = files.length
    ? await uploadListingPhotos(user.uid, listingRef.id, files, onProgress)
    : [];

  try {
    const docData = {
      sellerId: user.uid,
      sellerName: user.displayName || "UPT Student",
      type: input.type || "fixed",
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category || "other",
      price: input.type === "auction" ? 0 : Number(input.price || 0),
      photoPaths: uploaded.map((u) => u.path),
      photoUrls: uploaded.map((u) => u.url),
      status: "active",
      searchKeywords: buildSearchKeywords(input.title, input.description),
      boostedUntil: Timestamp.fromMillis(0),
      flagCount: 0,
      createdAt: serverTimestamp(),
      auction:
        input.type === "auction"
          ? {
              startPrice: Number(input.startPrice || 50),
              minIncrement: Number(input.minIncrement || 10),
              endsAt: Timestamp.fromMillis(
                Date.now() + Number(input.durationHours || 24) * 3600 * 1000
              ),
              highestBid: 0,
              highestBidderId: null,
              status: "open",
              winnerId: null,
            }
          : null,
    };

    await setDoc(listingRef, docData);
    return { id: listingRef.id, ...docData };
  } catch (err) {
    await deleteStoragePaths(uploaded.map((u) => u.path));
    throw err;
  }
}

export async function updateListing(id, updates) {
  const allowed = {};
  if (updates.title !== undefined) allowed.title = updates.title.trim();
  if (updates.description !== undefined) allowed.description = updates.description.trim();
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.price !== undefined) allowed.price = Number(updates.price);
  if (updates.title !== undefined || updates.description !== undefined) {
    allowed.searchKeywords = buildSearchKeywords(updates.title || "", updates.description || "");
  }
  await updateDoc(doc(db, LISTINGS, id), allowed);
}

export async function markListingSold(id) {
  await updateDoc(doc(db, LISTINGS, id), { status: "sold" });
}

export async function deleteListing(listing) {
  if (listing.photoPaths?.length) {
    await deleteStoragePaths(listing.photoPaths);
  }
  await deleteDoc(doc(db, LISTINGS, listing.id));
}