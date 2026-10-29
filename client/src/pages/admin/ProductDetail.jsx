import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { productsApi } from '../../api/admin';
import { formatINR } from '../../utils/currency';
import { SHOW_PARTS_SUPPLIERS } from '../../config/features';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const WRITE_ROLES = ['admin', 'quality'];

// ── CostRollup ────────────────────────────────────────────────────────────────
function CostRollup({ rollup }) {
  if (!rollup) return null;
  return (
    <div style={{
      background: 'var(--color-accent-soft)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      gap: '2rem',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.25rem' }}>BOM Total Cost</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatINR(rollup.totalCost)}</div>
      </div>
      {rollup.missingCostParts.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-warning, #f59e0b)' }}>
          ⚠ Missing unit cost: {rollup.missingCostParts.join(', ')}
        </div>
      )}
    </div>
  );
}

// ── RevisionMetaPanel — read-only metadata for released/obsolete revisions ────
function RevisionMetaPanel({ revision }) {
  if (!revision) return null;
  const { firmwareVersion, changeRequest, effectiveDate, approver, fileLinks } = revision;
  const hasData = firmwareVersion || changeRequest || effectiveDate || approver || (fileLinks && fileLinks.length > 0);
  if (!hasData) return null;

  const cell = (label, value) =>
    value ? (
      <div>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5, marginBottom: '0.2rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.9rem' }}>{value}</div>
      </div>
    ) : null;

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '1rem',
    }}>
      {cell('Firmware version', firmwareVersion)}
      {cell('Change request', changeRequest)}
      {cell('Effective date', effectiveDate ? new Date(effectiveDate).toLocaleDateString() : null)}
      {cell('Released by', approver?.email ?? (approver ? String(approver) : null))}
      {fileLinks && fileLinks.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5, marginBottom: '0.4rem' }}>
            File links
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {fileLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: 'var(--color-accent, #6366f1)', textDecoration: 'underline' }}
              >
                {link.label || link.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role);

  // ── Product ─────────────────────────────────────────────────────────────────
  const { data: product, loading: productLoading, error: productError } = useFetch(
    id ? `/admin/products/${id}` : null
  );

  // ── Revisions list ──────────────────────────────────────────────────────────
  const [revisionsPage, setRevisionsPage] = useState(1);
  const { data: revisionsData, loading: revisionsLoading, refetch: refetchRevisions } = useFetch(
    id ? `/admin/products/${id}/revisions` : null,
    { params: { page: revisionsPage, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' } }
  );
  const revisions = revisionsData?.data ?? [];
  const revisionsMeta = revisionsData?.meta ?? { total: 0 };

  // ── Selected revision + BOM ─────────────────────────────────────────────────
  const [selectedRevId, setSelectedRevId] = useState(null);
  const { data: revisionDetail, loading: revLoading, refetch: refetchRevision } = useFetch(
    id && selectedRevId ? `/admin/products/${id}/revisions/${selectedRevId}` : null
  );
  const bomLines = revisionDetail?.bomLines ?? [];
  const costRollup = revisionDetail?.costRollup ?? null;
  const isReleased = revisionDetail?.status === 'released' || revisionDetail?.status === 'obsolete';

  // ── Parts for BOM line dropdown ─────────────────────────────────────────────
  const { data: partsData } = useFetch('/admin/parts', {
    params: { limit: 200, sortBy: 'partNumber', sortOrder: 'asc' },
  });
  const activeParts = (partsData?.data ?? []).filter((p) => p.active);
  const partOptions = activeParts.map((p) => ({ value: p._id, label: `${p.partNumber} — ${p.name}` }));

  // ── Suppliers for BOM line dropdown ─────────────────────────────────────────
  const { data: suppliersData } = useFetch('/admin/suppliers', {
    params: { limit: 100, sortBy: 'name', sortOrder: 'asc' },
  });
  const activeSuppliers = (suppliersData?.data ?? []).filter((s) => s.active !== false);
  const supplierOptions = [
    { value: '', label: 'None' },
    ...activeSuppliers.map((s) => ({ value: s._id, label: `${s.code} — ${s.name}` })),
  ];

  // ── Revision modal ───────────────────────────────────────────────────────────
  const EMPTY_REV_FORM = {
    label: '', notes: '', firmwareVersion: '', changeRequest: '',
    effectiveDate: '', fileLinks: [],
  };

  const [revModalOpen, setRevModalOpen] = useState(false);
  const [revModalMode, setRevModalMode] = useState('create'); // 'create' | 'edit' | 'fork'
  const [editingRevId, setEditingRevId] = useState(null);
  const [forkSourceId, setForkSourceId] = useState(null);
  const [revForm, setRevForm] = useState(EMPTY_REV_FORM);
  const [revError, setRevError] = useState('');
  const [revSaving, setRevSaving] = useState(false);

  const toRevForm = (rev) => ({
    label: rev.label ?? '',
    notes: rev.notes ?? '',
    firmwareVersion: rev.firmwareVersion ?? '',
    changeRequest: rev.changeRequest ?? '',
    effectiveDate: rev.effectiveDate ? String(rev.effectiveDate).slice(0, 10) : '',
    fileLinks: (rev.fileLinks ?? []).map(({ label, url }) => ({ label, url })),
  });

  const openCreateRev = () => {
    setRevModalMode('create');
    setEditingRevId(null);
    setForkSourceId(null);
    setRevForm(EMPTY_REV_FORM);
    setRevError('');
    setRevModalOpen(true);
  };

  const openEditRev = (rev) => {
    setRevModalMode('edit');
    setEditingRevId(rev._id);
    setForkSourceId(null);
    setRevForm(toRevForm(rev));
    setRevError('');
    setRevModalOpen(true);
  };

  const openForkRev = (rev) => {
    setRevModalMode('fork');
    setForkSourceId(rev._id);
    setEditingRevId(null);
    setRevForm({ ...toRevForm(rev), label: '', notes: `Forked from ${rev.label}` });
    setRevError('');
    setRevModalOpen(true);
  };

  const closeRevModal = () => { setRevModalOpen(false); setRevError(''); };

  const handleRevFieldChange = useCallback((name, value) => {
    setRevForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  // fileLinks helpers
  const addFileLink = () =>
    setRevForm((prev) => ({ ...prev, fileLinks: [...prev.fileLinks, { label: '', url: '' }] }));
  const removeFileLink = (i) =>
    setRevForm((prev) => ({ ...prev, fileLinks: prev.fileLinks.filter((_, idx) => idx !== i) }));
  const updateFileLink = (i, field, value) =>
    setRevForm((prev) => ({
      ...prev,
      fileLinks: prev.fileLinks.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    }));

  const handleRevSave = async () => {
    setRevSaving(true);
    setRevError('');
    try {
      const payload = {
        label: revForm.label,
        notes: revForm.notes,
        firmwareVersion: revForm.firmwareVersion,
        changeRequest: revForm.changeRequest,
        effectiveDate: revForm.effectiveDate || null,
        fileLinks: revForm.fileLinks.filter((l) => l.label || l.url),
      };
      if (revModalMode === 'fork') {
        await productsApi.forkRevision(id, forkSourceId, payload);
      } else if (revModalMode === 'edit') {
        await productsApi.updateRevision(id, editingRevId, payload);
        if (selectedRevId === editingRevId) refetchRevision();
      } else {
        await productsApi.createRevision(id, payload);
      }
      closeRevModal();
      refetchRevisions();
    } catch (err) {
      setRevError(err.response?.data?.error?.message ?? 'Save failed.');
    } finally {
      setRevSaving(false);
    }
  };

  // ── Release ──────────────────────────────────────────────────────────────────
  const [releasing, setReleasing] = useState(false);
  const handleRelease = async () => {
    if (!window.confirm('Release this revision? Most fields will become read-only.')) return;
    setReleasing(true);
    try {
      await productsApi.releaseRevision(id, selectedRevId);
      refetchRevision();
      refetchRevisions();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Release failed.');
    } finally {
      setReleasing(false);
    }
  };

  // ── BOM modal ────────────────────────────────────────────────────────────────
  const EMPTY_BOM_FORM = {
    part: '', quantity: '', referenceDesignators: '', notes: '',
    supplier: '', alternates: [],
  };

  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [bomForm, setBomForm] = useState(EMPTY_BOM_FORM);
  const [bomError, setBomError] = useState('');
  const [bomSaving, setBomSaving] = useState(false);
  const [removingLine, setRemovingLine] = useState(null);

  const openAddLine = () => {
    setEditingLine(null);
    setBomForm(EMPTY_BOM_FORM);
    setBomError('');
    setBomModalOpen(true);
  };

  const openEditLine = (line) => {
    setEditingLine(line);
    setBomForm({
      part: line.part?._id ?? String(line.part),
      quantity: String(line.quantity),
      referenceDesignators: line.referenceDesignators ?? '',
      notes: line.notes ?? '',
      supplier: line.supplier?._id ?? line.supplier ?? '',
      alternates: (line.alternates ?? []).map((a) => a._id ?? String(a)),
    });
    setBomError('');
    setBomModalOpen(true);
  };

  const closeBomModal = () => { setBomModalOpen(false); setEditingLine(null); setBomError(''); };

  const handleBomFieldChange = useCallback((name, value) => {
    setBomForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const toggleAlternate = (partId) => {
    setBomForm((prev) => ({
      ...prev,
      alternates: prev.alternates.includes(partId)
        ? prev.alternates.filter((id) => id !== partId)
        : [...prev.alternates, partId],
    }));
  };

  const handleBomSave = async () => {
    setBomSaving(true);
    setBomError('');
    try {
      if (editingLine) {
        const { part: _p, ...updatePayload } = {
          ...bomForm,
          quantity: Number(bomForm.quantity),
          supplier: bomForm.supplier || null,
        };
        await productsApi.updateBomLine(id, selectedRevId, editingLine._id, updatePayload);
      } else {
        await productsApi.addBomLine(id, selectedRevId, {
          ...bomForm,
          quantity: Number(bomForm.quantity),
          supplier: bomForm.supplier || null,
        });
      }
      closeBomModal();
      refetchRevision();
    } catch (err) {
      setBomError(err.response?.data?.error?.message ?? 'Save failed.');
    } finally {
      setBomSaving(false);
    }
  };

  const handleRemoveLine = async (line) => {
    if (!window.confirm(`Remove ${line.part?.partNumber ?? 'this line'} from BOM?`)) return;
    setRemovingLine(line._id);
    try {
      await productsApi.removeBomLine(id, selectedRevId, line._id);
      refetchRevision();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Remove failed.');
    } finally {
      setRemovingLine(null);
    }
  };

  // ── Alternates: eligible parts (exclude the selected/own part) ───────────────
  const ownPartId = editingLine
    ? (editingLine.part?._id ?? String(editingLine.part))
    : bomForm.part;
  const alternatePartChoices = activeParts.filter((p) => p._id !== ownPartId);

  // ── BOM columns ──────────────────────────────────────────────────────────────
  const bomColumns = [
    { key: 'partNumber', label: 'Part #',   sortable: false, render: (_v, row) => SHOW_PARTS_SUPPLIERS ? (row.part?.partNumber ?? '—') : '—' },
    { key: 'partName',   label: 'Name',     sortable: false, render: (_v, row) => SHOW_PARTS_SUPPLIERS ? (row.part?.name ?? '—') : '—' },
    { key: 'quantity',   label: 'Qty',      sortable: false },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: false,
      render: (_v, row) => SHOW_PARTS_SUPPLIERS
        ? (row.supplier ? `${row.supplier.code} — ${row.supplier.name}` : '—')
        : '—',
    },
    { key: 'referenceDesignators', label: 'Ref des.', sortable: false, render: (v) => v || '—' },
    {
      key: 'lineCost',
      label: 'Line cost',
      sortable: false,
      render: (v) => (v != null ? formatINR(v, { decimals: 4 }) : <span style={{ opacity: 0.4 }}>—</span>),
    },
    ...(!isReleased && canWrite
      ? [{
          key: '_actions',
          label: '',
          sortable: false,
          render: (_v, row) => (
            <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => openEditLine(row)}>Edit</Button>
              <Button
                variant="danger"
                size="sm"
                loading={removingLine === row._id}
                onClick={() => handleRemoveLine(row)}
              >
                Remove
              </Button>
            </span>
          ),
        }]
      : []),
  ];

  // ── Revision columns ─────────────────────────────────────────────────────────
  const revisionColumns = [
    { key: 'label', label: 'Label', sortable: false },
    { key: 'status', label: 'Status', sortable: false, render: (v) => <StatusBadge status={v} /> },
    { key: 'firmwareVersion', label: 'FW version', sortable: false, render: (v) => v || '—' },
    {
      key: 'releasedAt',
      label: 'Released',
      sortable: false,
      render: (v) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      key: '_actions',
      label: '',
      sortable: false,
      render: (_v, row) => (
        <span style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={selectedRevId === row._id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedRevId(row._id)}
          >
            {selectedRevId === row._id ? 'Viewing' : 'View BOM'}
          </Button>
          {canWrite && row.status === 'draft' && (
            <Button variant="secondary" size="sm" onClick={() => openEditRev(row)}>Edit</Button>
          )}
          {canWrite && row.status === 'released' && (
            <Button variant="secondary" size="sm" onClick={() => openForkRev(row)}>New revision</Button>
          )}
        </span>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  if (productLoading) {
    return <div style={{ padding: '2rem', opacity: 0.6 }}>Loading product…</div>;
  }

  if (productError || !product) {
    return (
      <EmptyState
        variant="error"
        title="Product not found"
        description="This product may have been deleted or the ID is invalid."
        action={<Button variant="secondary" onClick={() => navigate('/admin/product-lifecycle')}>← Back</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`${product.sku} — ${product.name}`}
        subtitle={[product.category, product.variant].filter(Boolean).join(' · ') || product.description || 'No description'}
        actions={
          <span style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center' }}>
            <StatusBadge status={product.status} size="md" />
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/product-lifecycle')}>
              ← Products
            </Button>
          </span>
        }
      />

      {/* ── Revisions ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Revisions</h2>
          {canWrite && (
            <Button variant="primary" size="sm" onClick={openCreateRev}>+ New revision</Button>
          )}
        </div>
        <DataTable
          columns={revisionColumns}
          data={revisions}
          loading={revisionsLoading}
          emptyTitle="No revisions yet"
          emptyDescription={canWrite ? 'Create the first revision to start adding BOM lines.' : 'No revisions exist for this product.'}
          page={revisionsPage}
          limit={20}
          total={revisionsMeta.total}
          onPageChange={setRevisionsPage}
          onRetry={refetchRevisions}
        />
      </div>

      {/* ── BOM viewer ─────────────────────────────────────────────────────────── */}
      {selectedRevId && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              BOM — {revisionDetail?.label ?? '…'}
              {revisionDetail && <span style={{ marginLeft: '0.75rem' }}><StatusBadge status={revisionDetail.status} /></span>}
            </h2>
            <span style={{ display: 'inline-flex', gap: '0.5rem' }}>
              {canWrite && !isReleased && revisionDetail && (
                <>
                  <Button variant="secondary" size="sm" onClick={openAddLine}>+ Add line</Button>
                  <Button variant="primary" size="sm" loading={releasing} onClick={handleRelease}>Release revision</Button>
                </>
              )}
              {canWrite && revisionDetail?.status === 'released' && (
                <Button variant="secondary" size="sm" onClick={() => openForkRev(revisionDetail)}>
                  New revision from this
                </Button>
              )}
            </span>
          </div>

          {/* Metadata panel — read-only, shown for released/obsolete revisions */}
          {isReleased && revisionDetail && <RevisionMetaPanel revision={revisionDetail} />}

          {costRollup && <CostRollup rollup={costRollup} />}

          <DataTable
            columns={bomColumns}
            data={bomLines}
            loading={revLoading}
            emptyTitle="BOM is empty"
            emptyDescription={isReleased ? 'This revision has no BOM lines.' : 'Add parts to build the Bill of Materials.'}
            onRetry={refetchRevision}
          />
        </div>
      )}

      {/* ── Revision modal (create / edit / fork) ──────────────────────────────── */}
      <Modal
        isOpen={revModalOpen}
        onClose={closeRevModal}
        title={
          revModalMode === 'fork' ? 'New revision (copy BOM from this one)'
          : revModalMode === 'edit' ? 'Edit revision'
          : 'New revision'
        }
        size="md"
        footer={
          <span style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeRevModal}>Cancel</Button>
            <Button variant="primary" loading={revSaving} onClick={handleRevSave}>
              {revModalMode === 'edit' ? 'Save changes' : 'Create'}
            </Button>
          </span>
        }
      >
        {revError && (
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {revError}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField
            label="Label"
            name="label"
            value={revForm.label}
            onChange={handleRevFieldChange}
            placeholder="V2"
            required
          />
          <FormField
            label="Firmware version"
            name="firmwareVersion"
            value={revForm.firmwareVersion}
            onChange={handleRevFieldChange}
            placeholder="1.2.0"
          />
          <FormField
            label="Change request"
            name="changeRequest"
            value={revForm.changeRequest}
            onChange={handleRevFieldChange}
            placeholder="ECR-042"
          />
          <FormField
            label="Effective date"
            name="effectiveDate"
            type="date"
            value={revForm.effectiveDate}
            onChange={handleRevFieldChange}
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            rows={3}
            value={revForm.notes}
            onChange={handleRevFieldChange}
          />
        </div>

        {/* File links */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              File links{' '}
              <span style={{ opacity: 0.45, fontWeight: 400 }}>({revForm.fileLinks.length}/20)</span>
            </label>
            {revForm.fileLinks.length < 20 && (
              <Button variant="secondary" size="sm" onClick={addFileLink}>+ Add link</Button>
            )}
          </div>
          {revForm.fileLinks.length === 0 && (
            <p style={{ opacity: 0.45, fontSize: '0.875rem', margin: 0 }}>No file links added.</p>
          )}
          {revForm.fileLinks.map((link, i) => (
            <div
              key={i}
              style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}
            >
              <input
                type="text"
                className="form-field__input"
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateFileLink(i, 'label', e.target.value)}
              />
              <input
                type="url"
                className="form-field__input"
                placeholder="https://…"
                value={link.url}
                onChange={(e) => updateFileLink(i, 'url', e.target.value)}
              />
              <Button variant="danger" size="sm" onClick={() => removeFileLink(i)}>✕</Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── BOM line modal (add / edit) ─────────────────────────────────────────── */}
      <Modal
        isOpen={bomModalOpen}
        onClose={closeBomModal}
        title={editingLine ? 'Edit BOM line' : 'Add BOM line'}
        size="md"
        footer={
          <span style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeBomModal}>Cancel</Button>
            <Button variant="primary" loading={bomSaving} onClick={handleBomSave}>
              {editingLine ? 'Save changes' : 'Add line'}
            </Button>
          </span>
        }
      >
        {bomError && (
          <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {bomError}
          </p>
        )}

        {!editingLine ? (
          <FormField
            label="Part"
            name="part"
            type="select"
            value={bomForm.part}
            onChange={handleBomFieldChange}
            options={partOptions}
            placeholder="Select a part…"
            required
          />
        ) : (
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>
            Part: <strong>{editingLine.part?.partNumber} — {editingLine.part?.name}</strong>
            <br />
            <em style={{ fontSize: '0.8rem' }}>To change the part, remove this line and add a new one.</em>
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
          <FormField
            label="Quantity"
            name="quantity"
            type="number"
            value={String(bomForm.quantity)}
            onChange={handleBomFieldChange}
            required
          />
          <FormField
            label="Supplier"
            name="supplier"
            type="select"
            value={bomForm.supplier}
            onChange={handleBomFieldChange}
            options={supplierOptions}
          />
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <FormField
            label="Reference designators"
            name="referenceDesignators"
            value={bomForm.referenceDesignators}
            onChange={handleBomFieldChange}
            placeholder="C1, C2, C5"
          />
        </div>

        {/* Approved alternates — scrollable checkbox list, excludes the primary part */}
        {alternatePartChoices.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>
              Approved alternates{' '}
              <span style={{ opacity: 0.45, fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{
              maxHeight: '140px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
            }}>
              {alternatePartChoices.map((p) => (
                <label
                  key={p._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={bomForm.alternates.includes(p._id)}
                    onChange={() => toggleAlternate(p._id)}
                  />
                  {p.partNumber} — {p.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '0.75rem' }}>
          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            rows={2}
            value={bomForm.notes}
            onChange={handleBomFieldChange}
          />
        </div>
      </Modal>
    </div>
  );
}
