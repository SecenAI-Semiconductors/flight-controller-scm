import '../styles/components/empty-state.css';

export default function EmptyState({ icon, title, description, action, variant = 'default' }) {
  return (
    <div className={`empty-state${variant === 'error' ? ' empty-state--error' : ''}`}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
