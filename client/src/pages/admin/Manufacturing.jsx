import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Manufacturing() {
  return (
    <div>
      <PageHeader
        title="Manufacturing & QA"
        subtitle="Batch production tracking, quality-control results, and test records."
        actions={<StatusBadge status="phase_1" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Batch list (batch ID, product, qty planned, qty passed, qty failed, status)\n' +
          'Unit registry (serial, batch, current status, QC result)\n' +
          'QC checklist and test-result entry\n' +
          'Yield rate trend chart\n' +
          'Defect category breakdown'
        }
      />
    </div>
  );
}
