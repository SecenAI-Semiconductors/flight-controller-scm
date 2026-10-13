import '../styles/components/stat-card.css';

export default function StatCard({ label, value, icon, loading = false, error = null }) {
  if (loading) {
    return (
      <div className="stat-card stat-card--loading">
        <div className="stat-card__header">
          <span className="stat-card__label">&nbsp;</span>
        </div>
        <span className="stat-card__value">&nbsp;</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card stat-card--error">
        <div className="stat-card__header">
          <span className="stat-card__label">{label}</span>
        </div>
        <span className="stat-card__error-text">{error}</span>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && <div className="stat-card__icon">{icon}</div>}
      </div>
      <span className={`stat-card__value${value === null || value === undefined ? ' stat-card__value--null' : ''}`}>
        {value === null || value === undefined ? '—' : value}
      </span>
    </div>
  );
}
