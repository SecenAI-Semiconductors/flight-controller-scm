import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Procurement() {
  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="Supplier management, purchase orders, and inbound component tracking."
        actions={<StatusBadge status="phase_1" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Supplier directory (name, lead time, rating)\n' +
          'Purchase-order list (PO number, supplier, status, ETA)\n' +
          'Inbound shipment tracker\n' +
          'Component price history\n' +
          'Reorder-point alerts'
        }
      />
    </div>
  );
}
