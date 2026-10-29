import api from './client';

// ── Suppliers ─────────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: (params) => api.get('/admin/suppliers', { params }),
  get: (id) => api.get(`/admin/suppliers/${id}`),
  create: (data) => api.post('/admin/suppliers', data),
  update: (id, data) => api.patch(`/admin/suppliers/${id}`, data),
  deactivate: (id) => api.patch(`/admin/suppliers/${id}/deactivate`),
};

// ── Parts ─────────────────────────────────────────────────────────────────────

export const partsApi = {
  list: (params) => api.get('/admin/parts', { params }),
  get: (id) => api.get(`/admin/parts/${id}`),
  create: (data) => api.post('/admin/parts', data),
  update: (id, data) => api.patch(`/admin/parts/${id}`, data),
  deactivate: (id) => api.patch(`/admin/parts/${id}/deactivate`),
};

// ── Products / Revisions / BOM ────────────────────────────────────────────────

export const productsApi = {
  // Products
  list: (params) => api.get('/admin/products', { params }),
  get: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.patch(`/admin/products/${id}`, data),
  deactivate: (id) => api.patch(`/admin/products/${id}/deactivate`),

  // Revisions
  listRevisions: (productId, params) => api.get(`/admin/products/${productId}/revisions`, { params }),
  getRevision: (productId, revId) => api.get(`/admin/products/${productId}/revisions/${revId}`),
  createRevision: (productId, data) => api.post(`/admin/products/${productId}/revisions`, data),
  updateRevision: (productId, revId, data) => api.patch(`/admin/products/${productId}/revisions/${revId}`, data),
  releaseRevision: (productId, revId) => api.patch(`/admin/products/${productId}/revisions/${revId}/release`),
  forkRevision: (productId, revId, data) => api.post(`/admin/products/${productId}/revisions/${revId}/fork`, data),

  // BOM lines
  listBom: (productId, revId) => api.get(`/admin/products/${productId}/revisions/${revId}/bom`),
  addBomLine: (productId, revId, data) => api.post(`/admin/products/${productId}/revisions/${revId}/bom`, data),
  updateBomLine: (productId, revId, lineId, data) => api.patch(`/admin/products/${productId}/revisions/${revId}/bom/${lineId}`, data),
  removeBomLine: (productId, revId, lineId) => api.delete(`/admin/products/${productId}/revisions/${revId}/bom/${lineId}`),
};

