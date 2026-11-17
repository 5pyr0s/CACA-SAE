import { Link, NavLink, Outlet } from "react-router";

export default function Layout() {
  const navClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      isActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold tracking-tight text-indigo-600">
              C.A.C.A
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navClass}>Marketplace</NavLink>
              <NavLink to="/map" className={navClass}>Lost &amp; Found Map</NavLink>
              <NavLink to="/offers" className={navClass}>My Offers</NavLink>
              <NavLink to="/chat" className={navClass}>Chat</NavLink>
              <NavLink to="/admin" className={navClass}>Admin</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/wallet"
              className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"
              title="50 tokens locked in escrow"
            >
              100 Tokens (50 locked)
            </Link>
            <Link
              to="/listings/new"
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              + Post Listing
            </Link>
            <Link
              to="/reports/new"
              className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
            >
              + Report Lost/Found
            </Link>
            <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Profile
            </Link>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}