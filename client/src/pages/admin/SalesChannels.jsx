import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function SalesChannels() {
  return (
    <div>
      <PageHeader
        title="Sales channels"
        subtitle="Marketplace listings, pricing tiers, and channel performance metrics."
        actions={<StatusBadge status="phase_2" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Channel list (name, type, status, active listings)\n' +
          'Listing manager (SKU, channel, price, stock synced)\n' +
          'Channel-level sales and revenue breakdown\n' +
          'Pricing-tier configuration\n' +
          'Sync status and error log'
        }
      />
    </div>
  );
}
