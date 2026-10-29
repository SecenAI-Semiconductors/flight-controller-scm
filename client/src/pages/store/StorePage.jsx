import StoreLayout from "../../components/store/StoreLayout";
import {
  PRODUCT,
  HIGHLIGHTS,
  SPECS,
  SPECS_NOTE,
  SUPPORT,
} from "./storeContent";
import "../../styles/components/store-page.css";

// ── Tooltip for the inert Buy Now button ─────────────────────────────────────
function BuyNowButton() {
  return (
    <div className="store-hero__buy-wrap">
      <button
        className="store-btn store-btn--primary store-btn--lg store-btn--inert"
        aria-disabled="true"
        tabIndex={0}
        aria-describedby="buy-tooltip"
      >
        Buy now
      </button>
      <span className="store-btn__tooltip" role="tooltip" id="buy-tooltip">
        Checkout coming soon
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StorePage() {
  return (
    <StoreLayout>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="store-hero" id="product" aria-label="Product hero">
        <div className="store-hero__bg" aria-hidden="true" />
        <div className="store-container store-hero__inner">

          {/* Left column — text */}
          <div className="store-hero__text">
            <h1 className="store-hero__name">{PRODUCT.name}</h1>
            <p className="store-hero__tagline">{PRODUCT.tagline}</p>
            <p className="store-hero__description">{PRODUCT.description}</p>

            <div className="store-hero__price-row">
              <span className="store-hero__price">{PRODUCT.price}</span>
            </div>

            <div className="store-hero__actions">
              <BuyNowButton />
              <a
                href={PRODUCT.marketingUrl}
                className="store-btn store-btn--ghost store-btn--lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Full architecture
              </a>
            </div>

            <p className="store-hero__sku">SKU: {PRODUCT.sku}</p>
          </div>

          {/* Right column — product image */}
          <div className="store-hero__image-wrap">
            <img
              className="store-hero__image"
              src={PRODUCT.image}
              alt={PRODUCT.name}
            />
          </div>

        </div>
      </section>

      {/* ── HIGHLIGHTS ─────────────────────────────────────────────────────── */}
      <section className="store-highlights" aria-label="Product highlights">
        <div className="store-container">
          <div className="store-highlights__grid">
            {HIGHLIGHTS.map((h) => (
              <div className="store-highlight-card" key={h.heading}>
                <strong className="store-highlight-card__heading">{h.heading}</strong>
                <span className="store-highlight-card__sub">{h.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECS ─────────────────────────────────────────────────────────── */}
      <section className="store-specs" id="specs" aria-label="Technical specifications">
        <div className="store-container">
          <div className="store-section-label">Technical details</div>
          <h2 className="store-section-title">Specifications</h2>
          <div className="store-specs__table-wrap">
            <table className="store-specs__table" aria-label="Specification table">
              <tbody>
                {SPECS.map((row) => (
                  <tr key={row.label} className="store-specs__row">
                    <td className="store-specs__label">{row.label}</td>
                    <td className="store-specs__value">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="store-specs__note">{SPECS_NOTE}</p>
        </div>
      </section>

      {/* ── SUPPORT ───────────────────────────────────────────────────────── */}
      <section className="store-support" id="support" aria-label="Support and contact">
        <div className="store-container">
          <div className="store-section-label">Get help</div>
          <h2 className="store-section-title">Support</h2>
          <div className="store-support__cards">

            <a href={`https://mail.google.com/mail/?view=cm&to=${SUPPORT.supportEmail}`} className="store-support-card" target="_blank" rel="noopener noreferrer">
              <div className="store-support-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="store-support-card__body">
                <strong className="store-support-card__title">Help &amp; support</strong>
                <span className="store-support-card__sub">Technical questions and product help</span>
                <span className="store-support-card__email">{SUPPORT.supportEmail}</span>
              </div>
            </a>

            <a href={`https://mail.google.com/mail/?view=cm&to=${SUPPORT.salesEmail}`} className="store-support-card" target="_blank" rel="noopener noreferrer">
              <div className="store-support-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div className="store-support-card__body">
                <strong className="store-support-card__title">Sales &amp; pricing</strong>
                <span className="store-support-card__sub">Purchase enquiries and volume orders</span>
                <span className="store-support-card__email">{SUPPORT.salesEmail}</span>
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="store-footer" aria-label="Site footer">
        <div className="store-container">

          {/* Top row */}
          <div className="store-footer__top">
            <div className="store-footer__brand">
              <img src="/images/secenai-logo-icon.png" alt="" aria-hidden="true" className="store-footer__brand-icon" height="28" />
              <span className="store-footer__brand-name">{PRODUCT.brand}</span>
            </div>
            <nav className="store-footer__links" aria-label="Footer links">
              <a href="#product">Product</a>
              <a href="#specs">Specs</a>
              <a href="#support">Support</a>
              <a href={`https://mail.google.com/mail/?view=cm&to=${SUPPORT.supportEmail}`} target="_blank" rel="noopener noreferrer">Contact</a>
              <a href={PRODUCT.marketingUrl} target="_blank" rel="noopener noreferrer">secenai.com ↗</a>
            </nav>
          </div>

          {/* Bottom row */}
          <div className="store-footer__bottom">
            <p className="store-footer__copy">
              © {new Date().getFullYear()} {PRODUCT.brand}. All rights reserved.
            </p>
            <p className="store-footer__copy store-footer__copy--right">
              Built for autonomous platforms.
            </p>
          </div>

        </div>
      </footer>

    </StoreLayout>
  );
}
