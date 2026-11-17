import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { createListing } from "../../services/listings";
import { CATEGORIES } from "../../mocks/data";

export default function NewListingPage() {
  const navigate = useNavigate();
  const [type, setType] = useState("fixed");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("electronics");
  const [price, setPrice] = useState("100");
  const [startPrice, setStartPrice] = useState("50");
  const [minIncrement, setMinIncrement] = useState("10");
  const [durationHours, setDurationHours] = useState("24");
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const created = createListing({
      type,
      title,
      description,
      category,
      price,
      startPrice,
      minIncrement,
      durationHours,
      photoPaths: previews,
    });
    navigate(`/listings/${created.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 space-y-6">
      <h1 className="text-2xl font-bold">Post a New Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Listing Type</label>
          <div className="grid grid-cols-3 gap-2">
            {["fixed", "swap", "auction"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-sm font-semibold uppercase border ${
                  type === t
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Raspberry Pi 4 Model B (4GB)"
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

          {type !== "auction" && (
            <div>
              <label className="block text-sm font-medium mb-1">Price (RON)</label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          )}
        </div>

        {type === "auction" && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Start Price (Tokens)
              </label>
              <input
                type="number"
                min="1"
                required
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Min Increment (Tokens)
              </label>
              <input
                type="number"
                min="1"
                required
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, pickup spot around campus..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photos (1 to 5 images)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="w-full text-sm text-slate-600"
          />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {previews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
        >
          Publish Listing
        </button>
      </form>
    </div>
  );
}