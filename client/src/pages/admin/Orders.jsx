import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Orders() {
  return (
    <div>
      <PageHeader
        title="Orders & delivery"
        subtitle="Order tracking, fulfilment workflow, and shipment status."
        actions={<StatusBadge status="phase_2" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Order list (order ID, customer, date, status, total)\n' +
          'Order detail with line items and shipment info\n' +
          'Fulfilment queue (pick, pack, ship steps)\n' +
          'Shipment tracking integration\n' +
          'Returns and cancellation log'
        }
      />
    </div>
  );
}
