import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function ProductLifecycle() {
  return (
    <div>
      <PageHeader
        title="Product lifecycle"
        subtitle="Hardware and firmware design revisions, BOM, and component specifications."
        actions={<StatusBadge status="phase_1" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Product table (model, HW revision, FW revision, status)\n' +
          'BOM viewer per product\n' +
          'Design-revision timeline\n' +
          'Component specs and datasheets\n' +
          'Revision comparison diff'
        }
      />
    </div>
  );
}
