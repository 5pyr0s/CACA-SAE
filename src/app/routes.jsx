import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "./Layout";
import FeedPage from "../features/marketplace/FeedPage";
import ListingDetailPage from "../features/marketplace/ListingDetailPage";
import NewListingPage from "../features/marketplace/NewListingPage";
import LostFoundMapPage from "../features/map/LostFoundMapPage";
import NewReportPage from "../features/lostfound/NewReportPage";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import { RequireAdmin, RequireAuth } from "../features/auth/RequireAuth";
import MyOffersPage from "../features/offers/MyOffersPage";

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
          {/* Public */}
          <Route path="/" element={<FeedPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/map" element={<LostFoundMapPage />} />
          <Route path="/profile/:uid?" element={<PlaceholderScreen title="User Profile" owner="Student A / C" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Signed-in students only */}
          <Route element={<RequireAuth />}>
            <Route path="/listings/new" element={<NewListingPage />} />
            <Route path="/reports/new" element={<NewReportPage />} />
            <Route path="/offers" element={<MyOffersPage />} />
            <Route path="/chat" element={<PlaceholderScreen title="Real-Time Chat" owner="Student C" />} />
            <Route path="/wallet" element={<PlaceholderScreen title="Token Wallet & Ledger" owner="Student C" />} />
          </Route>

          {/* Admin custom claim only */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<PlaceholderScreen title="Admin Moderation Queue" owner="Student C" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}