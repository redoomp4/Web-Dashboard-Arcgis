import { Icon } from '../common/Icons';

export function AssetDataTable({
  rows,
  visibleColumns,
  sortConfig,
  onSort,
  selectedAsset,
  onSelectRow,
  page,
  setPage,
  pageSize,
  totalFilteredCount
}) {
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredCount);

  return (
    <div className="table-component-wrapper">
      <div className="table-scroll-container">
        <table className="asset-data-table">
          <thead>
            <tr>
              <th className="table-row-num-th">#</th>
              {visibleColumns.map(col => {
                const isSorted = sortConfig.key === col;
                const sortDir = isSorted ? sortConfig.direction : null;

                return (
                  <th key={col} onClick={() => onSort(col)} className="sortable-th">
                    <div className="th-content-wrapper">
                      <span>{col}</span>
                      <span className={`sort-arrow-icon ${sortDir || ''}`}>
                        {sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : '↕'}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="table-no-data-cell">
                  <div className="table-empty-notice">
                    <Icon name="search" size={20} />
                    <span>Tidak ada data aset yang cocok dengan filter aktif.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isSelected = selectedAsset?.row === row;
                const globalIndex = startIndex + index + 1;

                return (
                  <tr
                    key={`tr-${globalIndex}`}
                    className={`table-data-row ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => onSelectRow(row)}
                  >
                    <td className="table-row-num-td">{globalIndex}</td>
                    {visibleColumns.map(col => (
                      <td key={col} title={String(row[col] ?? '')}>
                        {String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalFilteredCount > 0 && (
        <div className="table-pagination-footer">
          <div className="pagination-range-text">
            Menampilkan <b>{startIndex + 1}</b> - <b>{endIndex}</b> dari{' '}
            <b>{totalFilteredCount.toLocaleString('id-ID')}</b> aset
          </div>

          <div className="pagination-buttons-group">
            <button
              className="btn-page-nav"
              disabled={page === 1}
              onClick={() => setPage(1)}
              title="Halaman Pertama"
            >
              «
            </button>
            <button
              className="btn-page-nav"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>

            <span className="pagination-page-indicator">
              Hal <b>{page}</b> / <b>{totalPages}</b>
            </span>

            <button
              className="btn-page-nav"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </button>
            <button
              className="btn-page-nav"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Halaman Terakhir"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
