// Small loading state for B's screens. Swap for C's shared <Spinner> once
// src/components/ exists.
export default function Spinner({ label = "Loading…" }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
