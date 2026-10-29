import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ADMIN_ROLES } from "../../App";
import { PRODUCT } from "../../pages/store/storeContent";
import "../../styles/components/store-header.css";

export default function StoreHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const isStaff = user && ADMIN_ROLES.includes(user.role);
  const isCustomer = user && !isStaff;

  return (
    <header className={`store-header${scrolled ? " store-header--scrolled" : ""}`}>
      <div className="store-header__inner">
        {/* Brand */}
        <Link to="/" className="store-header__brand" aria-label="Go to home">
          <img
            src="/images/secenai-logo-icon.png"
            alt=""
            aria-hidden="true"
            className="store-header__logo-img"
            height="28"
          />
          <span className="store-header__brand-name">{PRODUCT.brand}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="store-header__nav" aria-label="Main navigation">
          <a href="#product" className="store-header__nav-link">Product</a>
          <a href="#specs" className="store-header__nav-link">Specs</a>
          <a href="#support" className="store-header__nav-link">Support</a>
        </nav>

        {/* CTA */}
        <div className="store-header__cta">
          {!user && (
            <Link to="/login" className="store-header__signin-btn">
              Sign in
            </Link>
          )}
          {isStaff && (
            <Link to="/admin" className="store-header__signin-btn store-header__signin-btn--staff">
              Dashboard
            </Link>
          )}
          {isCustomer && (
            <div className="store-header__user">
              <span className="store-header__user-email">{user.email}</span>
              <button className="store-header__signout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`store-header__hamburger${menuOpen ? " store-header__hamburger--open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="store-header__mobile-menu" aria-label="Mobile navigation">
          <a href="#product" className="store-header__mobile-link" onClick={() => setMenuOpen(false)}>Product</a>
          <a href="#specs" className="store-header__mobile-link" onClick={() => setMenuOpen(false)}>Specs</a>
          <a href="#support" className="store-header__mobile-link" onClick={() => setMenuOpen(false)}>Support</a>
          {!user && <Link to="/login" className="store-header__mobile-link" onClick={() => setMenuOpen(false)}>Sign in</Link>}
          {isStaff && <Link to="/admin" className="store-header__mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {isCustomer && (
            <button className="store-header__mobile-link store-header__mobile-signout" onClick={() => { handleLogout(); setMenuOpen(false); }}>
              Sign out ({user.email})
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
