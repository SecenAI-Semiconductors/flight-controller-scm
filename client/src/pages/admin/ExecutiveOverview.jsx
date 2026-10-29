import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function ExecutiveOverview() {
  return (
    <div>
      <PageHeader
        title="Executive overview"
        subtitle="High-level KPIs and health indicators across the entire supply chain."
        actions={<StatusBadge status="phase_1" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Total units produced (all-time and MTD)\n' +
          'Units by current status (in production, QC passed, in stock, shipped, delivered, returned)\n' +
          'Open orders count and fulfilment rate\n' +
          'Revenue summary (MTD / YTD)\n' +
          'Open issues / RMA count\n' +
          'Avg. customer rating'
        }
      />
    </div>
  );
}
