import { useState } from 'react';
import { Icon } from '../common/Icons';
import { convertDDtoDMS } from '../../utils/gisCalculations';
import { TYPE_COLORS } from '../../constants/config';
import { toNumber } from '../../utils/dataParser';

export function AssetDetailDrawer({
  selected,
  keys,
  nameKey,
  typeKey,
  capacityKey,
  feederKey,
  onClose,
  onZoomToAsset,
  onInspectRadius,
  onCopySuccess
}) {
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'electrical' | 'coordinates'

  if (!selected) return null;

  const { row, lat, lng } = selected;
  const nameVal = row[nameKey] || 'Aset Gardu';
  const typeVal = row[typeKey] || 'Tidak diisi';
  const capVal = capacityKey ? toNumber(row[capacityKey]) : 0;
  const feederVal = feederKey ? row[feederKey] : 'Tidak diisi';
  const typeColor = TYPE_COLORS[typeVal] || '#0284c7';
  const dms = convertDDtoDMS(lat, lng);

  // Simulated operational load (e.g. 68% load factor)
  const simulatedLoadPercent = capVal > 0 ? ((nameVal.length * 13) % 45) + 40 : 50;
  const loadStatus =
    simulatedLoadPercent > 85 ? 'Kritis' : simulatedLoadPercent > 70 ? 'Tinggi' : 'Normal (Optimal)';
  const loadStatusColor =
    simulatedLoadPercent > 85 ? '#ef4444' : simulatedLoadPercent > 70 ? '#f59e0b' : '#10b981';

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (onCopySuccess) onCopySuccess(`${label} berhasil disalin ke clipboard!`);
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <aside className="asset-detail-drawer-panel">
      {/* Header */}
      <div className="drawer-header-section">
        <div className="drawer-header-meta">
          <span
            className="drawer-type-chip"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor, borderColor: `${typeColor}50` }}
          >
            {typeVal}
          </span>
          <span className="drawer-voltage-tag">20 kV TM / TR</span>
        </div>

        <h3 className="drawer-asset-name" title={nameVal}>
          {nameVal}
        </h3>

        <button className="drawer-close-btn" onClick={onClose} title="Tutup Panel Detail">
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Action shortcuts */}
      <div className="drawer-quick-actions">
        <button className="btn-drawer-action" onClick={onZoomToAsset} title="Fokuskan Peta ke Aset Ini">
          <Icon name="map-pin" size={14} />
          <span>Fokus Peta</span>
        </button>
        <button className="btn-drawer-action" onClick={openGoogleMaps} title="Navigasi Petunjuk Arah Google Maps">
          <Icon name="compass" size={14} />
          <span>Google Maps</span>
        </button>
        <button className="btn-drawer-action" onClick={onInspectRadius} title="Inspeksi Radius Jangkauan Sekitar Gardu">
          <Icon name="radius" size={14} />
          <span>Buffer Radius</span>
        </button>
      </div>

      {/* Simulated Operational Load Banner */}
      {capVal > 0 && (
        <div className="drawer-load-meter-card">
          <div className="load-meter-header">
            <span className="load-meter-title">
              <Icon name="activity" size={14} color={loadStatusColor} />
              <span>Simulasi Beban Operasional:</span>
            </span>
            <b style={{ color: loadStatusColor }}>{simulatedLoadPercent}% ({loadStatus})</b>
          </div>
          <div className="load-meter-bar-track">
            <div
              className="load-meter-bar-fill"
              style={{
                width: `${simulatedLoadPercent}%`,
                backgroundColor: loadStatusColor
              }}
            />
          </div>
          <div className="load-meter-details">
            <small>Daya Terpasang: <b>{capVal} kVA</b></small>
            <small>Taksiran Beban: <b>{Math.round((capVal * simulatedLoadPercent) / 100)} kVA</b></small>
          </div>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="drawer-nav-tabs">
        <button
          className={`drawer-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          Spesifikasi
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'coordinates' ? 'active' : ''}`}
          onClick={() => setActiveTab('coordinates')}
        >
          Koordinat
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Semua Data ({keys.length})
        </button>
      </div>

      {/* Tab 1: Specs */}
      {activeTab === 'specs' && (
        <div className="drawer-tab-content">
          <div className="drawer-spec-grid">
            <div className="spec-card-item">
              <span className="spec-title">Tipe Gardu</span>
              <strong className="spec-val">{typeVal}</strong>
            </div>
            <div className="spec-card-item">
              <span className="spec-title">Kapasitas</span>
              <strong className="spec-val">{capVal > 0 ? `${capVal} kVA` : 'Tidak diisi'}</strong>
            </div>
            <div className="spec-card-item full-width">
              <span className="spec-title">Penyulang Utama (Feeder)</span>
              <strong className="spec-val">{feederVal}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coordinates */}
      {activeTab === 'coordinates' && (
        <div className="drawer-tab-content">
          <div className="coord-converter-card">
            <div className="coord-row-item">
              <div>
                <span className="coord-type-label">Derajat Desimal (DD)</span>
                <b className="coord-val-text">{lat.toFixed(6)}, {lng.toFixed(6)}</b>
              </div>
              <button
                className="btn-copy-mini"
                onClick={() => copyToClipboard(`${lat}, ${lng}`, 'Koordinat DD')}
                title="Salin Koordinat DD"
              >
                Salin
              </button>
            </div>

            <div className="coord-row-item">
              <div>
                <span className="coord-type-label">Derajat Menit Detik (DMS)</span>
                <b className="coord-val-text">{dms.formatted}</b>
              </div>
              <button
                className="btn-copy-mini"
                onClick={() => copyToClipboard(dms.formatted, 'Koordinat DMS')}
                title="Salin Koordinat DMS"
              >
                Salin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Raw Key-Value Attributes */}
      {activeTab === 'raw' && (
        <div className="drawer-tab-content">
          <div className="drawer-raw-attr-list">
            {keys.map(key => {
              const val = row[key];
              if (val === undefined || val === null || String(val).trim() === '') return null;

              return (
                <div key={key} className="raw-attr-row">
                  <span className="raw-attr-key">{key}</span>
                  <span className="raw-attr-val" title={String(val)}>
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Copy Raw JSON button */}
      <div className="drawer-footer-actions">
        <button
          className="btn-drawer-copy-json"
          onClick={() => copyToClipboard(JSON.stringify(row, null, 2), 'JSON Data')}
        >
          Salin Record sebagai JSON
        </button>
      </div>
    </aside>
  );
}
