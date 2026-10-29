import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Warranty() {
  return (
    <div>
      <PageHeader
        title="Warranty & RMA"
        subtitle="Warranty registration, claim processing, and return-merchandise authorisation."
        actions={<StatusBadge status="phase_3" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Warranty registry (serial, product, start date, end date, status)\n' +
          'RMA request list (RMA ID, customer, reason, status)\n' +
          'Claim processing workflow\n' +
          'Warranty-cost analysis\n' +
          'Return reason breakdown'
        }
      />
    </div>
  );
}
