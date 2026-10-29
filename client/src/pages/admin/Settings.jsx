import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Settings() {
  return (
    <div>
      <PageHeader
        title="Reports & settings"
        subtitle="User management, role configuration, audit logs, and reporting dashboards."
        actions={
          <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
            <StatusBadge status="phase_1" size="md" />
            <StatusBadge status="phase_5" size="md" />
          </span>
        }
      />
      <EmptyState
        title="Planned content"
        description={
          'User list (name, email, role, last login)\n' +
          'Role and permission editor\n' +
          'Audit log (timestamp, user, action, resource)\n' +
          'Report builder (saved reports, export)\n' +
          'System settings (company profile, notifications, integrations)'
        }
      />
    </div>
  );
}
