import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { subscribeReports } from "../../services/reports";
import { CATEGORIES } from "../../mocks/data";

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const UPT_CENTER = [45.7475, 21.2262];

const lostIcon = L.divIcon({
  className: "",
  html: '<div style="background:#e11d48;color:white;padding:4px 8px;border-radius:9999px;font-weight:700;font-size:11px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">LOST</div>',
  iconSize: [46, 24],
  iconAnchor: [23, 12],
});

const foundIcon = L.divIcon({
  className: "",
  html: '<div style="background:#059669;color:white;padding:4px 8px;border-radius:9999px;font-weight:700;font-size:11px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">FOUND</div>',
  iconSize: [54, 24],
  iconAnchor: [27, 12],
});

export default function LostFoundMapPage() {
  const [reports, setReports] = useState([]);
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeReports({ kind, category }, (items) => setReports(items));
    return unsubscribe;
  }, [kind, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campus Lost &amp; Found Map</h1>
          <p className="text-sm text-slate-600">
            Red pins = Lost items (with optional token bounty) | Green pins = Found items
          </p>
        </div>
        <Link
          to="/reports/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
        >
          + Report Lost / Found Item
        </Link>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="all">All Reports (Lost &amp; Found)</option>
          <option value="lost">Lost Only</option>
          <option value="found">Found Only</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <MapContainer center={UPT_CENTER} zoom={16} style={{ height: 480, width: "100%" }}>
          <TileLayer
            url={TILE_URL}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {reports.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={r.kind === "lost" ? lostIcon : foundIcon}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="font-bold uppercase text-slate-500">
                    {r.kind} - {r.category}
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{r.title}</div>
                  <p className="text-slate-600">{r.description}</p>
                  {r.bounty > 0 && (
                    <div className="font-bold text-amber-700">
                      Bounty: {r.bounty} Tokens ({r.bountyStatus})
                    </div>
                  )}
                  <div className="text-slate-400">Geohash: {r.geohash}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}