import { geohashForLocation } from "geofire-common";
import { MOCK_REPORTS, toDate } from "../mocks/data";

let reportsStore = [...MOCK_REPORTS];
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeReports(filters = {}, onData, onError) {
  const runQuery = () => {
    try {
      let results = reportsStore.filter((r) => r.status === "open");

      if (filters.kind && filters.kind !== "all") {
        results = results.filter((r) => r.kind === filters.kind);
      }
      if (filters.category && filters.category !== "all") {
        results = results.filter((r) => r.category === filters.category);
      }

      results.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
      onData(results);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  runQuery();
  listeners.add(runQuery);
  return () => listeners.delete(runQuery);
}

export function createReport(input) {
  const lat = Number(input.lat || 45.7475);
  const lng = Number(input.lng || 21.2262);
  const bounty = input.kind === "lost" ? Number(input.bounty || 0) : 0;

  const newReport = {
    id: `rep_${Date.now()}`,
    ownerId: "user_alex",
    ownerName: "Alex Bărbatu",
    kind: input.kind || "lost",
    category: input.category || "other",
    title: input.title,
    description: input.description,
    eventDate: input.eventDate || new Date().toISOString(),
    lat,
    lng,
    geohash: geohashForLocation([lat, lng]),
    photoPaths: input.photoPaths?.length
      ? input.photoPaths
      : ["https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80"],
    status: "open",
    bounty,
    bountyStatus: bounty > 0 ? "locked" : "none",
    flagCount: 0,
    createdAt: new Date().toISOString(),
  };

  reportsStore = [newReport, ...reportsStore];
  notifyListeners();
  return newReport;
}