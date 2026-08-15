import { useState } from 'react';
import { Icon } from '../common/Icons';

export function AnomalyDetectorModal({
  isOpen,
  onClose,
  auditResult,
  onInspectAsset
}) {
  const [activeCategory, setActiveCategory] = useState('missingCoords');

  if (!isOpen || !auditResult) return null;

  const { anomalies, totalIssues, qualityScore, totalRowsScanned } = auditResult;

  const categoryTabs = [
    { key: 'missingCoords', label: 'Koordinat Kosong', list: anomalies.missingCoords, badgeColor: 'red' },
    { key: 'zeroCoords', label: 'Koordinat (0,0)', list: anomalies.zeroCoords, badgeColor: 'orange' },
    { key: 'outOfRegionBounds', label: 'Di Luar Paser/Kaltim', list: anomalies.outOfRegionBounds, badgeColor: 'purple' },
    { key: 'duplicateNames', label: 'Nama Terduplikasi', list: anomalies.duplicateNames, badgeColor: 'amber' },
    { key: 'missingCapacity', label: 'Kapasitas Kosong / 0', list: anomalies.missingCapacity, badgeColor: 'blue' },
    { key: 'missingFeeder', label: 'Penyulang Kosong', list: anomalies.missingFeeder, badgeColor: 'slate' }
  ];

  const currentTab = categoryTabs.find(t => t.key === activeCategory) || categoryTabs[0];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="anomaly-modal-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header">
          <div className="header-title-group">
            <div className={`modal-icon-badge ${qualityScore >= 80 ? 'green' : 'amber'}`}>
              <Icon name="alert-triangle" size={18} />
            </div>
            <div>
              <h3>Auditor Kualitas Data GIS & Jaringan</h3>
              <small>
                {totalRowsScanned} baris dipindai · Skor Kualitas: <b>{qualityScore}%</b>
              </small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="anomaly-modal-body">
          {/* Quality Score Banner */}
          <div className="quality-score-banner">
            <div className="score-meter-box">
              <span className="score-num">{qualityScore}%</span>
              <span className="score-label">Indeks Integritas GIS</span>
            </div>
            <div className="score-desc-box">
              <strong>
                {totalIssues === 0
                  ? '🎉 Dataset Sempurna! Tidak ditemukan anomali spasial.'
                  : `Ditemukan ${totalIssues} potensi masalah pada data aset geospasial.`}
              </strong>
              <p>
                Gunakan daftar di bawah ini untuk memeriksa ketidaklengkapan koordinat, duplikasi nama, atau data daya gardu yang belum terisi.
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="anomaly-category-tabs">
            {categoryTabs.map(cat => (
              <button
                key={cat.key}
                className={`anomaly-tab-pill ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span>{cat.label}</span>
                <span className={`cat-count-badge ${cat.badgeColor}`}>{cat.list.length}</span>
              </button>
            ))}
          </div>

          {/* Anomaly Records List */}
          <div className="anomaly-records-container">
            {currentTab.list.length === 0 ? (
              <div className="anomaly-empty-state">
                <Icon name="check" size={24} color="#10b981" />
                <span>Kategori ini bersih! Tidak ditemukan anomali.</span>
              </div>
            ) : (
              <div className="anomaly-items-list">
                {currentTab.list.map((item, idx) => (
                  <div key={`anomaly-${idx}`} className="anomaly-record-card">
                    <div className="record-header">
                      <span className="record-row-tag">Baris #{item.rowNum}</span>
                      <strong className="record-name">{item.name}</strong>
                    </div>
                    <p className="record-reason">{item.reason}</p>
                    <button
                      className="btn-inspect-anomaly"
                      onClick={() => {
                        onInspectAsset(item.row);
                        onClose();
                      }}
                    >
                      Buka Record Aset →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-window-footer">
          <button className="btn-modal-primary" onClick={onClose}>
            Tutup Auditor
          </button>
        </div>
      </div>
    </div>
  );
}
