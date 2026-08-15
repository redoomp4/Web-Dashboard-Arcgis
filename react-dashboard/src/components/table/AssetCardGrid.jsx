import { Icon } from '../common/Icons';
import { TYPE_COLORS } from '../../constants/config';
import { toNumber } from '../../utils/dataParser';

export function AssetCardGrid({
  rows,
  nameKey,
  typeKey,
  capacityKey,
  feederKey,
  areaKey,
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
    <div className="card-grid-component-wrapper">
      <div className="asset-cards-masonry-grid">
        {rows.length === 0 ? (
          <div className="card-grid-empty-state">
            <Icon name="search" size={24} />
            <p>Tidak ada aset yang sesuai filter.</p>
          </div>
        ) : (
          rows.map((row, index) => {
            const isSelected = selectedAsset?.row === row;
            const typeVal = row[typeKey] || 'Tidak diisi';
            const nameVal = row[nameKey] || `Aset #${startIndex + index + 1}`;
            const capVal = capacityKey ? toNumber(row[capacityKey]) : null;
            const feederVal = feederKey ? row[feederKey] : null;
            const areaVal = areaKey ? row[areaKey] : null;
            const typeColor = TYPE_COLORS[typeVal] || '#0284c7';

            return (
              <div
                key={`card-${startIndex + index}`}
                className={`asset-interactive-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectRow(row)}
              >
                <div className="card-header-line">
                  <span
                    className="card-type-chip"
                    style={{
                      backgroundColor: `${typeColor}18`,
                      color: typeColor,
                      borderColor: `${typeColor}40`
                    }}
                  >
                    {typeVal}
                  </span>
                  {capVal > 0 && (
                    <span className="card-capacity-chip">
                      <Icon name="bolt" size={11} />
                      <b>{capVal} kVA</b>
                    </span>
                  )}
                </div>

                <h4 className="card-asset-title" title={nameVal}>
                  {nameVal}
                </h4>

                <div className="card-attributes-list">
                  {feederVal && (
                    <div className="card-attr-item">
                      <span className="attr-label">Penyulang:</span>
                      <span className="attr-value" title={feederVal}>{feederVal}</span>
                    </div>
                  )}
                  {areaVal && (
                    <div className="card-attr-item">
                      <span className="attr-label">Wilayah:</span>
                      <span className="attr-value" title={areaVal}>{areaVal}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer-actions">
                  <span className="card-inspect-hint">
                    <Icon name="map-pin" size={12} />
                    <span>Lihat di Peta & Detail →</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
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
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
