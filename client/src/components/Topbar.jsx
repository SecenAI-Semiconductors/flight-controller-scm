import { useAuth } from '../hooks/useAuth';
import '../styles/components/topbar.css';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="topbar__brand">
          <div className="topbar__logo">
            <img src="/images/secenai-logo-icon.png" alt="SECENAI" className="topbar__logo-img" />
          </div>
          <div>
            <div className="topbar__title">FC-SCM</div>
            <div className="topbar__subtitle">Supply Chain Management</div>
          </div>
        </div>
      </div>
      <div className="topbar__right">
        <div className="topbar__user">
          <div className="topbar__user-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="topbar__user-email">{user?.email}</span>
        </div>
        <button className="topbar__logout" onClick={logout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}
