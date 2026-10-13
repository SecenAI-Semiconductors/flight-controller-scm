import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';

/**
 * Protects routes: redirects to /login if not authenticated.
 * Shows nothing while loading to avoid flash.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Placeholder page for routes not yet implemented. */
function PlaceholderPage({ title, description }) {
  // Imported inline to avoid circular dependency during Checkpoint A
  // These will be split into separate files in Checkpoint C
  return (
    <div>
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__subtitle">{description}</p>
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-8)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-5)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Coming Soon
        </h3>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', maxWidth: 360 }}>
          This section is under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PlaceholderPage title="Overview" description="Dashboard overview and key metrics" />} />
            <Route path="units" element={<PlaceholderPage title="Units" description="Flight controller unit registry" />} />
            <Route path="design" element={<PlaceholderPage title="Design Revisions" description="Hardware and firmware design tracking" />} />
            <Route path="manufacturing" element={<PlaceholderPage title="Manufacturing" description="Batch production tracking" />} />
            <Route path="inventory" element={<PlaceholderPage title="Inventory" description="Stock and listing management" />} />
            <Route path="orders" element={<PlaceholderPage title="Orders" description="Order tracking and fulfillment" />} />
            <Route path="feedback" element={<PlaceholderPage title="Feedback" description="Customer ratings and reviews" />} />
            <Route path="issues" element={<PlaceholderPage title="Issues" description="Customer issue tracking and resolution" />} />
            <Route path="warranty" element={<PlaceholderPage title="Warranty" description="Warranty management and claims" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
