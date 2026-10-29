import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Inventory() {
  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Current stock levels, warehouse locations, and stock-movement history."
        actions={<StatusBadge status="phase_1" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Stock summary by product and warehouse\n' +
          'Stock-movement log (date, type, qty, reference)\n' +
          'Low-stock and overstock alerts\n' +
          'Warehouse / bin-location browser\n' +
          'Inventory valuation snapshot'
        }
      />
    </div>
  );
}
