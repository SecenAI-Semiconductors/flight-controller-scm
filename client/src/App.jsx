import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import StorePage from './pages/store/StorePage';

// ── Admin pages ────────────────────────────────────────────────────────────
import ExecutiveOverview from './pages/admin/ExecutiveOverview';
import Products from './pages/admin/Products';
import ProductDetail from './pages/admin/ProductDetail';
import Procurement from './pages/admin/Procurement';
import Manufacturing from './pages/admin/Manufacturing';
import Inventory from './pages/admin/Inventory';
import SalesChannels from './pages/admin/SalesChannels';
import Orders from './pages/admin/Orders';
import Support from './pages/admin/Support';
import Warranty from './pages/admin/Warranty';
import Settings from './pages/admin/Settings';
import Suppliers from './pages/admin/Suppliers';
import Parts from './pages/admin/Parts';

// ── Internal roles that can reach the admin dashboard ─────────────────────
export const ADMIN_ROLES = ['admin', 'supply_chain', 'warehouse', 'quality', 'sales'];

/**
 * Guards admin routes. Unauthenticated users are sent to /login with the
 * current location saved in state so Login can return them after sign-in.
 * Authenticated non-admin roles (customers) are sent to /store.
 */
function RequireAdminRole({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    // Pass `from` so Login can redirect back after a successful sign-in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    // Authenticated but wrong side of the app — send to storefront
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth route ──────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />

          {/* ── Public storefront ─────────────────────────────────────── */}
          <Route path="/" element={<StorePage />} />

          {/* /store redirects to root storefront */}
          <Route path="/store" element={<Navigate to="/" replace />} />
          <Route path="/store/*" element={<Navigate to="/" replace />} />

          {/* ── Admin dashboard (internal roles only) ─────────────────── */}
          <Route
            path="/admin"
            element={
              <RequireAdminRole>
                <AppLayout />
              </RequireAdminRole>
            }
          >
            {/* Default admin landing */}
            <Route index element={<ExecutiveOverview />} />

            {/* Product & Supply */}
            <Route path="product-lifecycle" element={<Products />} />
            <Route path="product-lifecycle/:id" element={<ProductDetail />} />
            <Route path="procurement" element={<Procurement />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="parts" element={<Parts />} />

            {/* Production */}
            <Route path="manufacturing" element={<Manufacturing />} />
            <Route path="inventory" element={<Inventory />} />

            {/* Sales & Delivery */}
            <Route path="sales-channels" element={<SalesChannels />} />
            <Route path="orders" element={<Orders />} />

            {/* After-sales */}
            <Route path="support" element={<Support />} />
            <Route path="warranty" element={<Warranty />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Legacy redirects (keep old bookmarks working) */}
            <Route path="design" element={<Navigate to="/admin/product-lifecycle" replace />} />
            <Route path="units" element={<Navigate to="/admin/manufacturing" replace />} />
            <Route path="feedback" element={<Navigate to="/admin/support" replace />} />
            <Route path="issues" element={<Navigate to="/admin/support" replace />} />
          </Route>

          {/* Catch-all → storefront (RequireAdminRole guards /admin itself) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
