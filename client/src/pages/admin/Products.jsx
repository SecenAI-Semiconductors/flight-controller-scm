import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useDebounce } from '../../hooks/useFetch';
import { productsApi } from '../../api/admin';
import { formatINR, CURRENCY_LABEL } from '../../utils/currency';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

// admin + quality can write; all internal roles can read
const WRITE_ROLES = ['admin', 'quality'];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'discontinued', label: 'Discontinued' },
];

const LISTING_OPTIONS = [
  { value: 'hidden', label: 'Hidden' },
  { value: 'live', label: 'Live' },
];

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  variant: '',
  description: '',
  status: 'draft',
  price: '',
  listingStatus: 'hidden',
};

function toFormValues(p) {
  return {
    name: p.name ?? '',
    sku: p.sku ?? '',
    category: p.category ?? '',
    variant: p.variant ?? '',
    description: p.description ?? '',
    status: p.status ?? 'draft',
    price: p.price ?? '',
    listingStatus: p.listingStatus ?? 'hidden',
  };
}

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = WRITE_ROLES.includes(user?.role);

  // ── Table state ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebounce(search, 300);

  const params = {
    page,
    limit: 20,
    sortBy,
    sortOrder,
    ...(debouncedSearch && { search: debouncedSearch }),
  };
  const { data, loading, error, refetch } = useFetch('/admin/products', { params });
  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Deactivate state ────────────────────────────────────────────────────────
  const [deactivating, setDeactivating] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(toFormValues(product));
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
        price: form.price === '' ? null : Number(form.price),
      };
      if (editing) {
        await productsApi.update(editing._id, payload);
      } else {
        await productsApi.create(payload);
      }
      closeModal();
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.error?.message ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (product) => {
    if (!window.confirm(`Deactivate product "${product.sku} — ${product.name}"?`)) return;
    setDeactivating(product._id);
    try {
      await productsApi.deactivate(product._id);
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

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'variant', label: 'Variant', sortable: false, render: (v) => v || '—' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'active',
      label: 'Active',
      sortable: false,
      render: (val) => <StatusBadge status={val ? 'active' : 'closed'} />,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (val) => (val != null ? formatINR(val) : '—'),
    },
    ...(canWrite
      ? [
          {
            key: '_actions',
            label: '',
            sortable: false,
            render: (_val, row) => (
              <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                >
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
        title="Products"
        subtitle="Product master data — hardware models, revisions, and BOM."
        actions={
          canWrite && (
            <Button variant="primary" onClick={openCreate}>
              + Add product
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        error={error}
        emptyTitle="No products yet"
        emptyDescription="Add your first product to start managing revisions and BOMs."
        searchPlaceholder="Search by SKU or name…"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={page}
        limit={20}
        total={meta.total}
        onPageChange={setPage}
        onSearchChange={handleSearch}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/admin/product-lifecycle/${row._id}`)}
      />

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit product — ${editing.sku}` : 'Add product'}
        size="md"
        footer={
          <span style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Create product'}
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
          <FormField label="SKU" name="sku" value={form.sku} onChange={handleFieldChange} placeholder="FC-X1" required />
          <FormField label="Category" name="category" value={form.category} onChange={handleFieldChange} placeholder="Flight Controller" required />
          <FormField label="Variant" name="variant" value={form.variant} onChange={handleFieldChange} placeholder="Lite, Pro…" />
          <FormField
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={handleFieldChange}
            options={STATUS_OPTIONS}
          />
          <FormField
            label={`Price (${CURRENCY_LABEL})`}
            name="price"
            type="number"
            value={String(form.price ?? '')}
            onChange={handleFieldChange}
            placeholder="Leave blank if unpriced"
          />
          <FormField
            label="Listing status"
            name="listingStatus"
            type="select"
            value={form.listingStatus}
            onChange={handleFieldChange}
            options={LISTING_OPTIONS}
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <FormField
            label="Description"
            name="description"
            type="textarea"
            rows={3}
            value={form.description}
            onChange={handleFieldChange}
          />
        </div>
      </Modal>
    </div>
  );
}
