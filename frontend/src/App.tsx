import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { api } from "./lib/api";
import { AuthProvider, useAuth } from "./lib/auth";
import { ModulesProvider } from "./lib/modules";
import { ADMIN_BASE, IS_PLATFORM, isAdminPath } from "./lib/tenant";
import Layout from "./components/Layout";
import { ConfirmHost, Toaster } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ModuleListPage from "./pages/ModuleListPage";
import ModuleFormPage from "./pages/ModuleFormPage";
import LogsPage from "./pages/LogsPage";
import SettingsPage from "./pages/SettingsPage";
import TemplatesPage from "./pages/TemplatesPage";
import TemplateEditorPage from "./pages/TemplateEditorPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/store/OrdersPage";
import OrderDetailPage from "./pages/store/OrderDetailPage";
import CustomersPage from "./pages/store/CustomersPage";
import ReviewsPage from "./pages/store/ReviewsPage";
import StoreSettingsPage from "./pages/store/StoreSettingsPage";
import PlatformLayout from "./platform/PlatformLayout";
import TenantsPage from "./platform/TenantsPage";
import SiteApp, { ShowcaseApp, WebsiteNotFound } from "./site/SiteApp";
import MarketingApp from "./marketing/MarketingApp";

// module badalne par page ka state reset ho (search, page no, form values)
function KeyedList() {
  const { key } = useParams();
  return <ModuleListPage key={key} />;
}
function KeyedForm() {
  const { key, id } = useParams();
  return <ModuleFormPage key={`${key}-${id}`} />;
}

/** abc.yourdomain.com/admin ya xyz.com/admin */
function TenantAdmin() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return (
    <ModulesProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="m/:key" element={<KeyedList />} />
          <Route path="m/:key/:id" element={<KeyedForm />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          {user.role === "ADMIN" && <Route path="templates/new" element={<TemplateEditorPage />} />}
          {user.role === "ADMIN" && <Route path="templates/:id" element={<TemplateEditorPage />} />}
          {user.role === "ADMIN" && <Route path="users" element={<UsersPage />} />}
          <Route path="store/orders" element={<OrdersPage />} />
          <Route path="store/orders/:id" element={<OrderDetailPage />} />
          <Route path="store/customers" element={<CustomersPage />} />
          <Route path="store/reviews" element={<ReviewsPage />} />
          {user.role === "ADMIN" && <Route path="store/settings" element={<StoreSettingsPage />} />}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ModulesProvider>
  );
}

/** www.yourdomain.com/admin — super admin */
function PlatformAdmin() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return (
    <Routes>
      <Route element={<PlatformLayout />}>
        <Route index element={<TenantsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

/** Domain registered/active hai ya nahi — nahi to "Website not found" */
function TenantGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  useEffect(() => {
    api
      .get("/tenant-info")
      .then(() => setState("ok"))
      .catch((e) => setState(axios.isAxiosError(e) && e.response?.status === 404 ? "missing" : "ok"));
  }, []);
  if (state === "loading") return null;
  if (state === "missing") return <WebsiteNotFound />;
  return <>{children}</>;
}

/** /admin/* = admin panel (alag router, basename /admin — andar ke saare links /m/..., /settings waise hi) */
function AdminApp() {
  return (
    <BrowserRouter basename={ADMIN_BASE}>
      <AuthProvider>
        {IS_PLATFORM ? (
          <PlatformAdmin />
        ) : (
          <TenantGate>
            <TenantAdmin />
          </TenantGate>
        )}
        <Toaster />
        <ConfirmHost />
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Ek hi React app, 4 roop:
 *   www.yourdomain.com          -> MarketingApp (product ki website), /preview/<template> = live demo
 *   www.yourdomain.com/admin    -> super admin
 *   abc.yourdomain.com, xyz.com -> SiteApp (client ki public website, chosen template me)
 *   abc.yourdomain.com/admin    -> us website ka admin panel
 */
export default function App() {
  const path = window.location.pathname;
  if (isAdminPath(path)) return <AdminApp />;
  if (!IS_PLATFORM) return <SiteApp />;
  // root domain: /preview/<template> = kisi bhi template ka live demo (demo content)
  const showcase = path.match(/^\/preview\/([a-z0-9-]+)/);
  return showcase ? <ShowcaseApp templateKey={showcase[1]} /> : <MarketingApp />;
}
