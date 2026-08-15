import { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icons';

export function TableToolbar({
  viewMode,
  setViewMode,
  filteredCount,
  onOpenColumnPicker,
  onExportCSV,
  onExportExcel,
  onExportGeoJSON,
  onPrint
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="table-header-toolbar">
      <div className="toolbar-left-group">
        <div className="table-title-badge">
          <Icon name="database" size={14} />
          <span>DATA TABEL ASET</span>
        </div>
        <span className="toolbar-row-counter">
          <b>{filteredCount.toLocaleString('id-ID')}</b> baris terfilter
        </span>
      </div>

      <div className="toolbar-right-group">
        {/* View Mode Toggle (Table vs Cards) */}
        <div className="view-mode-pill-toggle">
          <button
            className={`pill-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Tampilan Tabel Grid"
          >
            <Icon name="list" size={13} />
            <span>Tabel</span>
          </button>
          <button
            className={`pill-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Tampilan Kartu Geospasial"
          >
            <Icon name="grid" size={13} />
            <span>Kartu</span>
          </button>
        </div>

        {/* Column Picker Modal Button */}
        <button
          className="btn-toolbar-action"
          onClick={onOpenColumnPicker}
          title="Sesuaikan Kolom Tabel"
        >
          <Icon name="settings" size={14} />
          <span>Atur Kolom</span>
        </button>

        {/* Export Menu Dropdown */}
        <div className="export-dropdown-container" ref={dropdownRef}>
          <button
            className="btn-toolbar-export"
            onClick={() => setExportOpen(prev => !prev)}
            title="Ekspor Data Aset"
          >
            <Icon name="download" size={14} />
            <span>Ekspor Data</span>
            <span className="dropdown-caret">▾</span>
          </button>

          {exportOpen && (
            <div className="export-menu-card">
              <button
                className="export-menu-item"
                onClick={() => {
                  onExportCSV();
                  setExportOpen(false);
                }}
              >
                <span className="export-icon csv">CSV</span>
                <div className="export-item-text">
                  <strong>Dokumen CSV (.csv)</strong>
                  <small>Format teks terpisah koma</small>
                </div>
              </button>

              <button
                className="export-menu-item"
                onClick={() => {
                  onExportExcel();
                  setExportOpen(false);
                }}
              >
                <span className="export-icon xls">XLS</span>
                <div className="export-item-text">
                  <strong>Microsoft Excel (.xlsx)</strong>
                  <small>Termasuk sheet ringkasan</small>
                </div>
              </button>

              <button
                className="export-menu-item"
                onClick={() => {
                  onExportGeoJSON();
                  setExportOpen(false);
                }}
              >
                <span className="export-icon geo">GIS</span>
                <div className="export-item-text">
                  <strong>Spatial GeoJSON (.geojson)</strong>
                  <small>Siap untuk ArcGIS Pro / QGIS</small>
                </div>
              </button>

              <button
                className="export-menu-item"
                onClick={() => {
                  onPrint();
                  setExportOpen(false);
                }}
              >
                <span className="export-icon pdf">PDF</span>
                <div className="export-item-text">
                  <strong>Cetak / Simpan PDF</strong>
                  <small>Format laporan dokumen cetak</small>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
