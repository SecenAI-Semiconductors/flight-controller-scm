import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useDebounce } from '../../hooks/useFetch';
import { suppliersApi } from '../../api/admin';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { SHOW_PARTS_SUPPLIERS } from '../../config/features';

// Roles that may write
const WRITE_ROLES = ['admin', 'supply_chain'];

const EMPTY_FORM = {
  name: '',
  code: '',
  contactName: '',
  email: '',
  phone: '',
  country: '',
  leadTimeDays: '',
  notes: '',
};

function toFormValues(supplier) {
  return {
    name: supplier.name ?? '',
    code: supplier.code ?? '',
    contactName: supplier.contactName ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    country: supplier.country ?? '',
    leadTimeDays: supplier.leadTimeDays ?? '',
    notes: supplier.notes ?? '',
  };
}

export default function Suppliers() {
  // ── Feature flag: show placeholder when SHOW_PARTS_SUPPLIERS is false ──────
  if (!SHOW_PARTS_SUPPLIERS) {
    return (
      <div>
        <PageHeader
          title="Suppliers"
          subtitle="Supplier master data for procurement and parts sourcing."
        />
        <EmptyState
          title="Coming next"
          description={
            'Supplier directory (name, code, contact, lead days, active status)\n' +
            'and supplier-to-part linking.'
          }
        />
      </div>
    );
  }

  // ── Live page (original code — untouched) ───────────────────────────────────
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role);

  // ── Table state ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebounce(search, 300);

  const params = { page, limit: 20, sortBy, sortOrder, ...(debouncedSearch && { search: debouncedSearch }) };
  const { data, loading, error, refetch } = useFetch('/admin/suppliers', { params });

  const suppliers = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Deactivate state ───────────────────────────────────────────────────────
  const [deactivating, setDeactivating] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm(toFormValues(supplier));
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  };

  const handleFieldChange = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        leadTimeDays: form.leadTimeDays === '' ? 0 : Number(form.leadTimeDays),
      };
      if (editing) {
        await suppliersApi.update(editing._id, payload);
      } else {
        await suppliersApi.create(payload);
      }
      closeModal();
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.error?.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (supplier) => {
    if (!window.confirm(`Deactivate "${supplier.name}"? Parts referencing them will not be affected.`)) return;
    setDeactivating(supplier._id);
    try {
      await suppliersApi.deactivate(supplier._id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Deactivation failed.');
    } finally {
      setDeactivating(null);
    }
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'country', label: 'Country', sortable: false },
    { key: 'contactName', label: 'Contact', sortable: false },
    { key: 'leadTimeDays', label: 'Lead time (days)', sortable: true },
    {
      key: 'active',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val ? 'active' : 'closed'} />,
    },
    ...(canWrite
      ? [
          {
            key: '_actions',
            label: '',
            sortable: false,
            render: (_val, row) => (
              <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                  Edit
                </Button>
                {row.active && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deactivating === row._id}
                    onClick={(e) => { e.stopPropagation(); handleDeactivate(row); }}
                  >
                    Deactivate
                  </Button>
                )}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier master data for procurement and parts sourcing."
        actions={
          canWrite && (
            <Button variant="primary" onClick={openCreate}>
              + Add supplier
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        error={error}
        emptyTitle="No suppliers yet"
        emptyDescription="Add your first supplier to start managing procurement."
        searchPlaceholder="Search by name, code or contact…"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={page}
        limit={20}
        total={meta.total}
        onPageChange={setPage}
        onSearchChange={handleSearch}
        onRetry={refetch}
      />

      {/* ── Create / Edit modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit supplier — ${editing.code}` : 'Add supplier'}
        size="md"
        footer={
          <span style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Create supplier'}
            </Button>
          </span>
        }
      >
        {formError && (
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {formError}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Name" name="name" value={form.name} onChange={handleFieldChange} required />
          <FormField label="Code" name="code" value={form.code} onChange={handleFieldChange} placeholder="SUP-001" required />
          <FormField label="Contact name" name="contactName" value={form.contactName} onChange={handleFieldChange} />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleFieldChange} />
          <FormField label="Phone" name="phone" value={form.phone} onChange={handleFieldChange} />
          <FormField label="Country" name="country" value={form.country} onChange={handleFieldChange} />
          <FormField label="Lead time (days)" name="leadTimeDays" type="number" value={String(form.leadTimeDays)} onChange={handleFieldChange} />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <FormField label="Notes" name="notes" type="textarea" rows={3} value={form.notes} onChange={handleFieldChange} />
        </div>
      </Modal>
    </div>
  );
}
