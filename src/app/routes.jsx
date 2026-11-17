import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "./Layout";
import FeedPage from "../features/marketplace/FeedPage";
import ListingDetailPage from "../features/marketplace/ListingDetailPage";
import NewListingPage from "../features/marketplace/NewListingPage";
import LostFoundMapPage from "../features/map/LostFoundMapPage";
import NewReportPage from "../features/lostfound/NewReportPage";

function PlaceholderScreen({ title, owner }) {
  return (
    <div className="p-10 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-2">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-500">Placeholder route for {owner} (Sprint 1 skeleton)</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/listings/new" element={<NewListingPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/map" element={<LostFoundMapPage />} />
          <Route path="/reports/new" element={<NewReportPage />} />

          <Route path="/login" element={<PlaceholderScreen title="Login" owner="Student B" />} />
          <Route path="/register" element={<PlaceholderScreen title="Register" owner="Student B" />} />
          <Route path="/offers" element={<PlaceholderScreen title="My Offers & Reservations" owner="Student B" />} />

          <Route path="/chat" element={<PlaceholderScreen title="Real-Time Chat" owner="Student C" />} />
          <Route path="/wallet" element={<PlaceholderScreen title="Token Wallet & Ledger" owner="Student C" />} />
          <Route path="/profile/:uid?" element={<PlaceholderScreen title="User Profile" owner="Student A / C" />} />
          <Route path="/admin" element={<PlaceholderScreen title="Admin Moderation Queue" owner="Student C" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}