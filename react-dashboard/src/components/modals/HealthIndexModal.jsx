import { useState, useMemo } from 'react';
import { Icon } from '../common/Icons';
import { analyzeFleetHealth } from '../../utils/healthIndex';

export function HealthIndexModal({
  isOpen,
  onClose,
  allRows,
  mappings,
  onSelectCriticalAsset,
  onFilterByHealthStatus
}) {
  const [activeTab, setActiveTab] = useState('critical'); // 'critical' | 'caution' | 'fair' | 'good'

  const fleetAnalysis = useMemo(() => {
    return analyzeFleetHealth(allRows, mappings);
  }, [allRows, mappings]);

  if (!isOpen) return null;

  const currentList = fleetAnalysis.categories[activeTab] || [];
  const { nameKey, capacityKey, feederKey } = mappings;

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="analytics-modal-window health-modal-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header health-header">
          <div className="header-title-group">
            <div className="modal-icon-badge health-badge">
              <Icon name="activity" size={20} color="#10b981" />
            </div>
            <div>
              <h3>Diagnostik Indeks Kesehatan Armada Trafo (THI)</h3>
              <small>Condition-Based Monitoring (CBM) · {fleetAnalysis.totalAnalyzed} Unit Trafo Terdaftar</small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="analytics-modal-body">
          {/* Average Health Index Score Banner */}
          <div className="quality-score-banner health-score-banner">
            <div className="score-meter-box">
              <span className="score-num" style={{ color: fleetAnalysis.averageHealth >= 75 ? '#10b981' : '#f59e0b' }}>
                {fleetAnalysis.averageHealth}%
              </span>
              <span className="score-label">Rata-rata Fleet THI</span>
            </div>
            <div className="score-desc-box">
              <strong>
                {fleetAnalysis.criticalCount > 0
                  ? `⚠️ Terdeteksi ${fleetAnalysis.criticalCount} unit trafo dalam status Kritis / Perlu Overhaul.`
                  : '✅ Kesehatan armada trafo distribusi dalam kondisi optimal.'}
              </strong>
              <p>
                Sistem menghitung indeks kesehatan (Transformer Health Index) berbasis estimasi degradasi dielektrik minyak, stres termal, dan histori operasional.
              </p>
            </div>
          </div>

          {/* Health Category Selector Tabs */}
          <div className="anomaly-category-tabs">
            <button
              className={`anomaly-tab-pill ${activeTab === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveTab('critical')}
            >
              <span>Kritis (&lt;50%)</span>
              <span className="cat-count-badge red">{fleetAnalysis.criticalCount}</span>
            </button>
            <button
              className={`anomaly-tab-pill ${activeTab === 'caution' ? 'active' : ''}`}
              onClick={() => setActiveTab('caution')}
            >
              <span>Waspada (50-69%)</span>
              <span className="cat-count-badge amber">{fleetAnalysis.cautionCount}</span>
            </button>
            <button
              className={`anomaly-tab-pill ${activeTab === 'fair' ? 'active' : ''}`}
              onClick={() => setActiveTab('fair')}
            >
              <span>Monitoring (70-84%)</span>
              <span className="cat-count-badge blue">{fleetAnalysis.fairCount}</span>
            </button>
            <button
              className={`anomaly-tab-pill ${activeTab === 'good' ? 'active' : ''}`}
              onClick={() => setActiveTab('good')}
            >
              <span>Kondisi Prima (≥85%)</span>
              <span className="cat-count-badge green">{fleetAnalysis.goodCount}</span>
            </button>
          </div>

          {/* Items List */}
          <div className="anomaly-records-container health-records-container">
            {currentList.length === 0 ? (
              <div className="anomaly-empty-state">
                <Icon name="check" size={24} color="#10b981" />
                <span>Tidak ada unit trafo dalam kategori ini.</span>
              </div>
            ) : (
              <div className="anomaly-items-list">
                {currentList.map(item => {
                  const name = item.row[nameKey] || `Gardu #${item.index}`;
                  const cap = item.row[capacityKey] || '—';
                  const feeder = item.row[feederKey] || '—';

                  return (
                    <div key={`thi-${item.index}`} className="anomaly-record-card health-record-card">
                      <div className="health-record-main">
                        <div className="record-header">
                          <span
                            className="health-score-pill"
                            style={{ backgroundColor: `${item.statusColor}20`, color: item.statusColor }}
                          >
                            THI: {item.score}%
                          </span>
                          <strong className="record-name">{name}</strong>
                          <span className="record-feeder-tag">Penyulang: {feeder}</span>
                        </div>
                        <p className="health-recommendation-text">
                          <Icon name="settings" size={12} />
                          <span>{item.recommendation}</span>
                        </p>
                        <div className="health-technical-metrics">
                          <span>Estimasi BDV Minyak: <b>{item.estimatedOilBreakdownKv} kV</b></span>
                          <span>Kadar Air: <b>{item.moisturePpm} ppm</b></span>
                          <span>Kapasitas: <b>{cap} kVA</b></span>
                        </div>
                      </div>

                      <button
                        className="btn-inspect-anomaly"
                        onClick={() => {
                          if (onSelectCriticalAsset) onSelectCriticalAsset(item.row);
                          onClose();
                        }}
                      >
                        Buka Detail →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-window-footer">
          <button className="btn-modal-primary" onClick={onClose}>
            Tutup Diagnostik
          </button>
        </div>
      </div>
    </div>
  );
}
