import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useDebounce } from '../../hooks/useFetch';
import { partsApi, suppliersApi } from '../../api/admin';
import { formatINR, CURRENCY_LABEL } from '../../utils/currency';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { SHOW_PARTS_SUPPLIERS } from '../../config/features';

const WRITE_ROLES = ['admin', 'supply_chain'];

const EMPTY_FORM = {
  name: '',
  partNumber: '',
  category: '',
  description: '',
  unitOfMeasure: 'pcs',
  unitCost: '',
  reorderPoint: '',
  preferredSupplier: '',
  notes: '',
};

function toFormValues(part) {
  return {
    name: part.name ?? '',
    partNumber: part.partNumber ?? '',
    category: part.category ?? '',
    description: part.description ?? '',
    unitOfMeasure: part.unitOfMeasure ?? 'pcs',
    unitCost: part.unitCost ?? '',
    reorderPoint: part.reorderPoint ?? '',
    preferredSupplier: part.preferredSupplier?._id ?? part.preferredSupplier ?? '',
    notes: part.notes ?? '',
  };
}

export default function Parts() {
  // ── Feature flag: show placeholder when SHOW_PARTS_SUPPLIERS is false ──────
  if (!SHOW_PARTS_SUPPLIERS) {
    return (
      <div>
        <PageHeader
          title="Parts"
          subtitle="Component master data for BOMs and procurement."
        />
        <EmptyState
          title="Coming next"
          description={
            'Parts master (part number, name, unit cost, default supplier)\n' +
            'feeding product BOMs.'
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
  const { data, loading, error, refetch } = useFetch('/admin/parts', { params });

  const parts = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };

  // ── Supplier list for the dropdown ────────────────────────────────────────
  const { data: suppliersData } = useFetch('/admin/suppliers', {
    params: { limit: 100, sortBy: 'name', sortOrder: 'asc' },
  });
  const activeSuppliers = (suppliersData?.data ?? []).filter((s) => s.active);
  const supplierOptions = [
    { value: '', label: 'None' },
    ...activeSuppliers.map((s) => ({ value: s._id, label: `${s.code} — ${s.name}` })),
  ];

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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

  const openEdit = (part) => {
    setEditing(part);
    setForm(toFormValues(part));
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
        unitCost: form.unitCost === '' ? 0 : Number(form.unitCost),
        reorderPoint: form.reorderPoint === '' ? 0 : Number(form.reorderPoint),
        preferredSupplier: form.preferredSupplier || null,
      };
      if (editing) {
        await partsApi.update(editing._id, payload);
      } else {
        await partsApi.create(payload);
      }
      closeModal();
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.error?.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (part) => {
    if (!window.confirm(`Deactivate part "${part.partNumber} — ${part.name}"?`)) return;
    setDeactivating(part._id);
    try {
      await partsApi.deactivate(part._id);
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
    { key: 'partNumber', label: 'Part #', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'unitOfMeasure', label: 'UoM', sortable: false },
    {
      key: 'unitCost',
      label: 'Unit cost',
      sortable: true,
      render: (val) => formatINR(val ?? 0),
    },
    {
      key: 'preferredSupplier',
      label: 'Supplier',
      sortable: false,
      render: (val) => val ? `${val.code} — ${val.name}` : '—',
    },
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
        title="Parts"
        subtitle="Component master data — part numbers, categories, costs, and preferred suppliers."
        actions={
          canWrite && (
            <Button variant="primary" onClick={openCreate}>
              + Add part
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={parts}
        loading={loading}
        error={error}
        emptyTitle="No parts yet"
        emptyDescription="Add your first part to begin building the component library."
        searchPlaceholder="Search by name, part number or category…"
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
        title={editing ? `Edit part — ${editing.partNumber}` : 'Add part'}
        size="md"
        footer={
          <span style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Create part'}
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
          <FormField label="Part number" name="partNumber" value={form.partNumber} onChange={handleFieldChange} placeholder="FC-CAP-001" required />
          <FormField label="Category" name="category" value={form.category} onChange={handleFieldChange} required />
          <FormField label="Unit of measure" name="unitOfMeasure" value={form.unitOfMeasure} onChange={handleFieldChange} placeholder="pcs" />
          <FormField label={`Unit cost (${CURRENCY_LABEL})`} name="unitCost" type="number" value={String(form.unitCost)} onChange={handleFieldChange} />
          <FormField label="Reorder point" name="reorderPoint" type="number" value={String(form.reorderPoint)} onChange={handleFieldChange} />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Preferred supplier"
              name="preferredSupplier"
              type="select"
              value={form.preferredSupplier}
              onChange={handleFieldChange}
              options={supplierOptions}
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <FormField label="Description" name="description" type="textarea" rows={2} value={form.description} onChange={handleFieldChange} />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <FormField label="Notes" name="notes" type="textarea" rows={2} value={form.notes} onChange={handleFieldChange} />
        </div>
      </Modal>
    </div>
  );
}
