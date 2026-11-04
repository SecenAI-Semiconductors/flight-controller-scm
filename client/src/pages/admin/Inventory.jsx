import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { inventoryApi, partsApi, suppliersApi } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';

const WRITE_ROLES = ['admin', 'warehouse'];

// ── Helper: parse Zod field-level errors from API response ───────────────────
function parseFieldErrors(err) {
  const details = err?.response?.data?.error?.details;
  if (Array.isArray(details)) {
    const map = {};
    for (const issue of details) {
      const field = issue.path?.[0];
      if (field) map[field] = issue.message;
    }
    return map;
  }
  return {};
}

function parseTopError(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.message ||
    'An unexpected error occurred'
  );
}

// ── Lots display ─────────────────────────────────────────────────────────────

function LotsBadge({ lots }) {
  if (!lots || lots.length === 0)
    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  if (lots.length === 1 && lots[0].lotNumber === '')
    return <span>Unlotted</span>;
  return (
    <span
      title={lots
        .map((l) => `${l.lotNumber || 'unlotted'}: ${l.onHand}`)
        .join(', ')}
    >
      {lots.length} lot{lots.length > 1 ? 's' : ''}
    </span>
  );
}

// ── Movement Modal ────────────────────────────────────────────────────────────

function MovementModal({ type, parts, suppliers, onClose, onSuccess }) {
  const isReceipt = type === 'receipt';
  const isIssue = type === 'issue';
  const isAdjustment = type === 'adjustment';

  const title = isReceipt
    ? 'Receive Stock'
    : isIssue
    ? 'Issue Stock'
    : 'Adjust Stock';

  const [form, setForm] = useState({
    part: '',
    quantity: '',
    lotNumber: '',
    supplier: '',
    reference: '',
    reason: '',
    direction: 'increase',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((e) => ({ ...e, [name]: undefined }));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setTopError('');
    setFieldErrors({});

    const qty = parseInt(form.quantity, 10);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setFieldErrors({ quantity: 'Enter a positive whole number' });
      return;
    }

    const payload = {
      type,
      part: form.part,
      quantity: qty,
      lotNumber: form.lotNumber || '',
      reference: form.reference || '',
      reason: form.reason || '',
    };
    if (isReceipt && form.supplier) payload.supplier = form.supplier;
    if (isAdjustment) payload.direction = form.direction;

    setSaving(true);
    try {
      await inventoryApi.postMovement(payload);
      onSuccess();
    } catch (err) {
      const fe = parseFieldErrors(err);
      if (Object.keys(fe).length) {
        setFieldErrors(fe);
      } else {
        setTopError(parseTopError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  const partOptions = parts.map((p) => ({
    value: p._id,
    label: `${p.partNumber} — ${p.name}`,
  }));
  const supplierOptions = suppliers.map((s) => ({
    value: s._id,
    label: `${s.code} — ${s.name}`,
  }));

  return (
    <Modal title={title} isOpen onClose={onClose}>
      <form
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {topError && (
          <div
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              padding: '0.5rem',
              background: 'var(--color-accent-soft)',
              borderRadius: '4px',
            }}
          >
            {topError}
          </div>
        )}

        <FormField
          label="Part"
          name="part"
          type="select"
          value={form.part}
          onChange={change}
          options={partOptions}
          placeholder="Select part..."
          required
          error={fieldErrors.part}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isAdjustment ? '1fr 1fr' : '1fr 1fr',
            gap: '0.75rem',
          }}
        >
          <FormField
            label="Quantity"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={change}
            placeholder="e.g. 10"
            required
            error={fieldErrors.quantity}
            min="1"
            step="1"
          />
          {isAdjustment && (
            <FormField
              label="Direction"
              name="direction"
              type="select"
              value={form.direction}
              onChange={change}
              options={[
                { value: 'increase', label: 'Increase (+)' },
                { value: 'decrease', label: 'Decrease (−)' },
              ]}
              error={fieldErrors.direction}
            />
          )}
        </div>

        <FormField
          label="Lot Number"
          name="lotNumber"
          type="text"
          value={form.lotNumber}
          onChange={change}
          placeholder="Leave blank for unlotted"
          error={fieldErrors.lotNumber}
        />

        {isReceipt && (
          <FormField
            label="Supplier (optional)"
            name="supplier"
            type="select"
            value={form.supplier}
            onChange={change}
            options={supplierOptions}
            placeholder="Select supplier..."
            error={fieldErrors.supplier}
          />
        )}

        {(isReceipt || isIssue) && (
          <FormField
            label="Reference"
            name="reference"
            type="text"
            value={form.reference}
            onChange={change}
            placeholder={
              isReceipt ? 'Invoice / PO number' : 'Work order / PO number'
            }
            required
            error={fieldErrors.reference}
          />
        )}

        {isAdjustment && (
          <FormField
            label="Reason"
            name="reason"
            type="textarea"
            value={form.reason}
            onChange={change}
            placeholder="Reason for adjustment (required)"
            required
            error={fieldErrors.reason}
            rows={2}
          />
        )}

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
            marginTop: '0.5rem',
          }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {title}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── History Modal ─────────────────────────────────────────────────────────────

function HistoryModal({ part, onClose }) {
  const [page, setPage] = useState(1);
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    inventoryApi
      .getPartMovements(part.partId, { page, limit: 20 })
      .then(({ data }) => {
        if (!cancelled) {
          setMovements(data.data ?? []);
          setMeta(data.meta ?? { total: 0, page: 1, limit: 20 });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(parseTopError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [part.partId, page]);

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'quantityDelta',
      label: 'Qty Δ',
      render: (val) => (
        <span style={{ color: val > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {val > 0 ? `+${val}` : val}
        </span>
      ),
    },
    {
      key: 'lotNumber',
      label: 'Lot',
      render: (val) => val ? (
        <span title={val} style={{ display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', fontFamily: 'monospace' }}>
          {val}
        </span>
      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>,
    },
    {
      key: 'reference',
      label: 'Ref / Reason',
      render: (val, row) => val || row.reason || <span style={{ color: 'var(--color-text-muted)' }}>—</span>,
    },
    {
      key: 'performedBy',
      label: 'By',
      render: (val) => <span style={{ whiteSpace: 'nowrap' }}>{val?.email ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'When',
      render: (val) => val ? (
        <span style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
          {new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
          <br />
          <span style={{ color: 'var(--color-text-muted)' }}>
            {new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </span>
      ) : '—',
    },
  ];

  return (
    <Modal
      title={`History — ${part.partNumber} (${part.name})`}
      isOpen
      onClose={onClose}
      size="xl"
    >
      <DataTable
        columns={columns}
        data={movements}
        loading={loading}
        error={error}
        emptyTitle="No movements yet"
        emptyDescription="No stock movements have been recorded for this part."
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={setPage}
      />
    </Modal>
  );
}

// ── Main Inventory Page ───────────────────────────────────────────────────────

export default function Inventory() {
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('partNumber');
  const [sortOrder, setSortOrder] = useState('asc');

  const [stock, setStock] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [modal, setModal] = useState(null); // null | 'receive' | 'issue' | 'adjust' | 'history'
  const [selectedPart, setSelectedPart] = useState(null);

  // ── Load parts and suppliers for modal dropdowns (once) ───────────────────
  useEffect(() => {
    partsApi
      .list({ limit: 100, sortBy: 'partNumber', sortOrder: 'asc' })
      .then(({ data }) => setParts(data?.data ?? []))
      .catch(() => {});
    suppliersApi
      .list({ limit: 100, sortBy: 'code', sortOrder: 'asc' })
      .then(({ data }) => setSuppliers(data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── Load stock table ───────────────────────────────────────────────────────
  const loadStock = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    inventoryApi
      .getStock({ page, limit: 20, search, sortBy, sortOrder })
      .then(({ data }) => {
        setStock(data?.data ?? []);
        setMeta(data?.meta ?? { total: 0, page: 1, limit: 20 });
      })
      .catch((err) => setFetchError(parseTopError(err)))
      .finally(() => setLoading(false));
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const onSort = useCallback((key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  }, []);

  const onSearchChange = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const onMovementSuccess = useCallback(() => {
    setModal(null);
    loadStock();
  }, [loadStock]);

  const columns = [
    {
      key: 'partNumber',
      label: 'Part #',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'totalOnHand',
      label: 'On Hand',
      sortable: true,
      render: (val, row) => (
        <span
          style={{
            fontWeight: 600,
            color:
              val === 0
                ? 'var(--color-danger)'
                : 'var(--color-text-primary)',
          }}
        >
          {val} {row.unitOfMeasure || 'pcs'}
        </span>
      ),
    },
    {
      key: 'lots',
      label: 'Lots',
      render: (val) => <LotsBadge lots={val} />,
    },
    {
      key: '_actions',
      label: '',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPart(row);
            setModal('history');
          }}
        >
          History
        </Button>
      ),
    },
  ];

  const headerActions = canWrite ? (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setModal('adjust')}
      >
        Adjust stock
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setModal('issue')}
      >
        Issue stock
      </Button>
      <Button size="sm" onClick={() => setModal('receive')}>
        + Receive stock
      </Button>
    </div>
  ) : null;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Component stock levels and movement history."
        actions={headerActions}
      />

      <DataTable
        columns={columns}
        data={stock}
        loading={loading}
        error={fetchError}
        emptyTitle="No stock records"
        emptyDescription="Record a receipt to add components to inventory."
        searchPlaceholder="Search by part number or name..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={setPage}
        onSearchChange={onSearchChange}
        onRetry={loadStock}
      />

      {/* Movement Modals — each mounted independently so form state resets */}
      {modal === 'receive' && (
        <MovementModal
          type="receipt"
          parts={parts}
          suppliers={suppliers}
          onClose={closeModal}
          onSuccess={onMovementSuccess}
        />
      )}
      {modal === 'issue' && (
        <MovementModal
          type="issue"
          parts={parts}
          suppliers={suppliers}
          onClose={closeModal}
          onSuccess={onMovementSuccess}
        />
      )}
      {modal === 'adjust' && (
        <MovementModal
          type="adjustment"
          parts={parts}
          suppliers={suppliers}
          onClose={closeModal}
          onSuccess={onMovementSuccess}
        />
      )}

      {/* History Modal */}
      {modal === 'history' && selectedPart && (
        <HistoryModal part={selectedPart} onClose={closeModal} />
      )}
    </div>
  );
}
