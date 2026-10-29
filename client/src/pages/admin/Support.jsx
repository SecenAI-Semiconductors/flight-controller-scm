import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function Support() {
  return (
    <div>
      <PageHeader
        title="Support & feedback"
        subtitle="Customer support tickets, ratings, reviews, and feedback analysis."
        actions={<StatusBadge status="phase_3" size="md" />}
      />
      <EmptyState
        title="Planned content"
        description={
          'Support ticket list (ticket ID, customer, subject, priority, status)\n' +
          'Ticket detail with conversation thread\n' +
          'Customer ratings and reviews feed\n' +
          'Avg. rating and NPS trend\n' +
          'Feedback category tag cloud'
        }
      />
    </div>
  );
}
