import { useRef } from 'react';
import { Icon } from '../common/Icons';

export function Header({
  isDark,
  onToggleTheme,
  onUploadClick,
  onGeoUploadClick,
  onOpenAnomalyModal,
  onOpenAnalyticsModal,
  anomalyCount = 0,
  qualityScore = 100,
  datasetName
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <Icon name="bolt" size={22} color="#0a192f" />
        </div>
        <div className="brand-text">
          <div className="brand-title">
            <strong>PLN UP3 GROGOT</strong>
            <span className="brand-badge">GIS Intelligence</span>
          </div>
          <small className="brand-sub">Sistem Informasi Geografis Jaringan Distribusi</small>
        </div>
      </div>

      <div className="header-center-metrics">
        <button
          className="header-metric-pill"
          onClick={onOpenAnalyticsModal}
          title="Buka Analytics Deep Dive"
        >
          <Icon name="activity" size={15} />
          <span>Analisis Beban & Jaringan</span>
        </button>

        <button
          className={`header-metric-pill ${anomalyCount > 0 ? 'pill-warning' : 'pill-healthy'}`}
          onClick={onOpenAnomalyModal}
          title="Buka Auditor Kualitas Data Spasial"
        >
          <Icon name="alert-triangle" size={15} />
          <span>Kualitas Data: <b>{qualityScore}%</b></span>
          {anomalyCount > 0 && <span className="badge-count">{anomalyCount}</span>}
        </button>
      </div>

      <div className="header-actions">
        <button
          className="btn-theme-toggle"
          onClick={onToggleTheme}
          title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Toggle Theme"
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>

        <button
          className="btn-header-secondary"
          onClick={onGeoUploadClick}
          title="Import Layer GeoJSON / ESRI JSON"
        >
          <Icon name="layers" size={15} />
          <span>+ Layer GIS</span>
        </button>

        <button
          className="btn-header-primary"
          onClick={onUploadClick}
          title="Unggah Dataset Excel / CSV"
        >
          <Icon name="upload" size={15} />
          <span>Unggah Data</span>
        </button>
      </div>
    </header>
  );
}
