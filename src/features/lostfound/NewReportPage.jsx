import { useState } from "react";
import { useNavigate } from "react-router";
import { createReport } from "../../services/reports";
import { CATEGORIES } from "../../mocks/data";

export default function NewReportPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState("lost");
  const [category, setCategory] = useState("keys_ids");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bounty, setBounty] = useState("0");
  const [lat, setLat] = useState("45.7475");
  const [lng, setLng] = useState("21.2262");

  const handleSubmit = (e) => {
    e.preventDefault();
    createReport({
      kind,
      category,
      title,
      description,
      bounty: kind === "lost" ? bounty : 0,
      lat,
      lng,
    });
    navigate("/map");
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200 space-y-6">
      <h1 className="text-2xl font-bold">Report a Lost or Found Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {["lost", "found"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`py-2 rounded-lg text-sm font-semibold uppercase border ${
                kind === k
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              I {k} Something
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Item Summary</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Black Leather Wallet near Electro"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          {kind === "lost" && (
            <div>
              <label className="block text-sm font-medium mb-1">Optional Bounty (Tokens)</label>
              <input
                type="number"
                min="0"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude (UPT Campus)</label>
            <input
              type="number"
              step="0.0001"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude (UPT Campus)</label>
            <input
              type="number"
              step="0.0001"
              required
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Distinguishing marks, approximate time..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700"
        >
          Pin Report on Map
        </button>
      </form>
    </div>
  );
}