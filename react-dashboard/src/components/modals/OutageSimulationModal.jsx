import { useState, useMemo } from 'react';
import { Icon } from '../common/Icons';
import { simulateFeederOutage } from '../../utils/outageSimulation';

export function OutageSimulationModal({
  isOpen,
  onClose,
  feeders,
  allRows,
  mappings,
  onApplyOutageOnMap
}) {
  const [selectedFeeder, setSelectedFeeder] = useState(feeders[0] || '');

  const simulation = useMemo(() => {
    if (!selectedFeeder || !allRows.length) return null;
    return simulateFeederOutage(allRows, selectedFeeder, mappings);
  }, [selectedFeeder, allRows, mappings]);

  if (!isOpen) return null;

  const handleApplyToMap = () => {
    if (simulation && onApplyOutageOnMap) {
      onApplyOutageOnMap(simulation);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="analytics-modal-window outage-modal-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header outage-header">
          <div className="header-title-group">
            <div className="modal-icon-badge outage-badge">
              <Icon name="bolt" size={20} color="#ef4444" />
            </div>
            <div>
              <h3>Simulasi Pemadaman Jaringan & Manuver Beban</h3>
              <small>PLN UP3 Grogot · Analisis Dampak Feeder Trip & Rekomendasi Manuver Saklar</small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="analytics-modal-body">
          {/* Feeder Selector Control */}
          <div className="outage-select-card">
            <label htmlFor="outage-feeder-select">
              <Icon name="alert-triangle" size={14} color="#ef4444" />
              <span>Pilih Penyulang / Feeder yang Mengalami Trip (Gangguan):</span>
            </label>
            <div className="outage-select-row">
              <select
                id="outage-feeder-select"
                value={selectedFeeder}
                onChange={e => setSelectedFeeder(e.target.value)}
                className="outage-dropdown"
              >
                {feeders.map(f => (
                  <option key={f} value={f}>
                    Penyulang {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {simulation && (
            <>
              {/* Summary Impact Metrics */}
              <div className="analytics-summary-row">
                <div className="summary-stat-box outage-stat-box red">
                  <span>Total Gardu Padam</span>
                  <b style={{ color: '#ef4444' }}>{simulation.affectedCount} Unit</b>
                  <small>Gardu Distribusi Terisolasi</small>
                </div>
                <div className="summary-stat-box outage-stat-box amber">
                  <span>Daya Hilang (Lost Load)</span>
                  <b style={{ color: '#f59e0b' }}>{simulation.totalCapacityLostMva} MVA</b>
                  <small>{simulation.totalCapacityLostKva.toLocaleString('id-ID')} kVA</small>
                </div>
                <div className="summary-stat-box outage-stat-box blue">
                  <span>Estimasi Pelanggan Padam</span>
                  <b style={{ color: '#38bdf8' }}>~{simulation.estimatedCustomers.toLocaleString('id-ID')}</b>
                  <small>Pelanggan TR / TM</small>
                </div>
              </div>

              {/* Switching Maneuver Recommendations */}
              <div className="outage-maneuver-panel">
                <div className="panel-title-row">
                  <h4>Rekomendasi Manuver Beban ke Penyulang Cadangan Terdekat:</h4>
                  <span className="panel-badge">Switching Analysis</span>
                </div>

                <div className="backup-feeders-list">
                  {simulation.backupRecommendations.length === 0 ? (
                    <p className="no-data-hint">Tidak ada penyulang cadangan yang terdeteksi dalam jangkauan.</p>
                  ) : (
                    simulation.backupRecommendations.map((backup, idx) => (
                      <div key={backup.feederName} className={`backup-feeder-card ${backup.canAbsorb ? 'healthy' : 'overload'}`}>
                        <div className="backup-card-header">
                          <span className="backup-rank-badge">#{idx + 1}</span>
                          <strong>Penyulang {backup.feederName}</strong>
                          <span className={`backup-status-tag ${backup.canAbsorb ? 'tag-green' : 'tag-orange'}`}>
                            {backup.canAbsorb ? 'Mampu Menampung Beban' : 'Kapasitas Terbatas'}
                          </span>
                        </div>
                        <div className="backup-metrics-row">
                          <span>Jarak Sentroid: <b>{backup.distanceKm} km</b></span>
                          <span>Beban Eksisting: <b>{Math.round(backup.currentLoadKva / 1000)} MVA</b></span>
                          <span>Sisa Kapasitas: <b>{Math.round(backup.estimatedAvailableKva / 1000)} MVA</b></span>
                          <span>Skor Kompatibilitas: <b style={{ color: '#0284c7' }}>{backup.compatibilityScore}%</b></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-window-footer">
          <button className="btn-modal-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn-modal-primary btn-outage-apply" onClick={handleApplyToMap}>
            <Icon name="map-pin" size={14} />
            <span>Visualisasikan Area Padam di Peta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
