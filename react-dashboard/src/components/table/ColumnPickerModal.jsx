import { useState } from 'react';
import { Icon } from '../common/Icons';

export function ColumnPickerModal({
  isOpen,
  onClose,
  allColumns,
  visibleColumns,
  onToggleColumn,
  onSelectAll,
  onResetDefault
}) {
  const [searchCol, setSearchCol] = useState('');

  if (!isOpen) return null;

  const filteredColumns = allColumns.filter(c =>
    c.toLowerCase().includes(searchCol.toLowerCase())
  );

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="column-picker-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header">
          <div className="header-title-group">
            <div className="modal-icon-badge">
              <Icon name="settings" size={16} />
            </div>
            <div>
              <h3>Sesuaikan Kolom Tabel Aset</h3>
              <small>
                {visibleColumns.length} dari {allColumns.length} kolom aktif ditampilkan
              </small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="column-picker-search-bar">
          <Icon name="search" size={14} />
          <input
            type="text"
            value={searchCol}
            onChange={e => setSearchCol(e.target.value)}
            placeholder="Filter nama kolom..."
          />
          {searchCol && (
            <button onClick={() => setSearchCol('')}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        <div className="column-picker-body-grid">
          {filteredColumns.map(col => {
            const isChecked = visibleColumns.includes(col);
            return (
              <label key={col} className={`column-checkbox-item ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleColumn(col)}
                />
                <span className="col-name-label" title={col}>
                  {col}
                </span>
              </label>
            );
          })}
        </div>

        <div className="modal-window-footer">
          <div className="footer-left-actions">
            <button className="btn-modal-secondary" onClick={onSelectAll}>
              Pilih Semua
            </button>
            <button className="btn-modal-secondary" onClick={onResetDefault}>
              Default (8 Kolom)
            </button>
          </div>
          <button className="btn-modal-primary" onClick={onClose}>
            Terapkan & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
