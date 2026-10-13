import { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import EmptyState from './EmptyState';
import '../styles/components/data-table.css';

export default function DataTable({
  columns,
  data,
  loading = false,
  error = null,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no records to display.',
  searchPlaceholder = 'Search...',
  sortBy,
  sortOrder,
  onSort,
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  onSearchChange,
  onRowClick,
  onRetry,
}) {
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const totalPages = Math.ceil(total / limit) || 1;
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // Generate page numbers
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    const newOrder =
      sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  // ── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="data-table-wrapper">
        <div className="data-table__loading">
          <div className="data-table__spinner" />
          Loading...
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────
  if (error) {
    return (
      <div className="data-table-wrapper">
        <div className="data-table__error">
          <svg className="data-table__error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="data-table__error-message">{error}</span>
          {onRetry && (
            <div className="data-table__error-retry">
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      {/* Toolbar */}
      {onSearchChange && (
        <div className="data-table__toolbar">
          <div className="data-table__search">
            <svg className="data-table__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="data-table__search-input"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!data || data.length === 0) ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          }
        />
      ) : (
        <>
          {/* Table */}
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.sortable ? 'sortable' : ''}${sortBy === col.key ? ' sorted' : ''}`}
                    onClick={() => handleSort(col)}
                  >
                    {col.label}
                    {col.sortable && (
                      <span className="data-table__sort-icon">
                        {sortBy === col.key && sortOrder === 'asc' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {onPageChange && total > limit && (
            <div className="data-table__pagination">
              <span className="data-table__page-info">
                Showing {startRow}–{endRow} of {total}
              </span>
              <div className="data-table__page-controls">
                <button
                  className="data-table__page-btn"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    className={`data-table__page-btn${p === page ? ' data-table__page-btn--active' : ''}`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="data-table__page-btn"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
