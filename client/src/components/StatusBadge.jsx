import '../styles/components/status-badge.css';

/**
 * Maps a status string to a color scheme.
 */
const STATUS_COLOR_MAP = {
  // Unit statuses
  in_production: 'info',
  qc_passed: 'success',
  qc_failed: 'danger',
  in_stock: 'accent',
  ordered: 'warning',
  shipped: 'info',
  delivered: 'success',
  returned: 'danger',
  // Warranty statuses
  active: 'success',
  expired: 'danger',
  claimed: 'warning',
  // Issue statuses
  open: 'danger',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
  // Order statuses
  placed: 'info',
  cancelled: 'danger',
  // Roadmap phases
  phase_1: 'info',
  phase_2: 'accent',
  phase_3: 'warning',
  phase_5: 'neutral',
  // Product statuses
  draft: 'neutral',
  discontinued: 'danger',
  // Revision statuses
  released: 'success',
  obsolete: 'neutral',
};

/**
 * Formats a status string for display: replaces underscores with spaces.
 */
function formatStatus(status) {
  return status.replace(/_/g, ' ');
}

export default function StatusBadge({ status, size = 'sm' }) {
  const colorScheme = STATUS_COLOR_MAP[status] || 'neutral';

  return (
    <span className={`status-badge status-badge--${colorScheme}${size === 'md' ? ' status-badge--md' : ''}`}>
      <span className="status-badge__dot" />
      {formatStatus(status)}
    </span>
  );
}
