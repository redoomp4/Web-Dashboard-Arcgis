import { Icon } from '../common/Icons';

export function KPIOverview({
  totalAssets,
  filteredAssets,
  validGeoPoints,
  totalCapacityKva,
  activeFeedersCount,
  qualityScore,
  onOpenAnalytics,
  onOpenQualityAudit
}) {
  const geoRatio = totalAssets > 0 ? Math.round((validGeoPoints / totalAssets) * 100) : 0;
  const filterRatio = totalAssets > 0 ? Math.round((filteredAssets / totalAssets) * 100) : 0;

  return (
    <section className="kpi-metrics-grid">
      {/* Total Assets */}
      <div className="kpi-metric-card" onClick={onOpenAnalytics}>
        <div className="kpi-card-top">
          <span className="kpi-label">TOTAL ASET JARINGAN</span>
          <div className="kpi-icon-badge blue">
            <Icon name="database" size={16} />
          </div>
        </div>
        <div className="kpi-value-row">
          <b className="kpi-main-number">{totalAssets.toLocaleString('id-ID')}</b>
          <span className="kpi-sub-tag">Unit Terdaftar</span>
        </div>
        <div className="kpi-card-footer">
          <span>{activeFeedersCount} Penyulang Teridentifikasi</span>
        </div>
      </div>

      {/* Filtered Assets */}
      <div className="kpi-metric-card kpi-card-highlight">
        <div className="kpi-card-top">
          <span className="kpi-label">HASIL FILTER AKTIF</span>
          <div className="kpi-icon-badge amber">
            <Icon name="filter" size={16} />
          </div>
        </div>
        <div className="kpi-value-row">
          <b className="kpi-main-number">{filteredAssets.toLocaleString('id-ID')}</b>
          <span className="kpi-sub-tag">{filterRatio}% dari total</span>
        </div>
        <div className="kpi-card-footer">
          <span>Siap diekspor ke Excel / GeoJSON</span>
        </div>
      </div>

      {/* Valid Geocodes */}
      <div className="kpi-metric-card">
        <div className="kpi-card-top">
          <span className="kpi-label">TITIK VALID DI PETA</span>
          <div className="kpi-icon-badge emerald">
            <Icon name="map-pin" size={16} />
          </div>
        </div>
        <div className="kpi-value-row">
          <b className="kpi-main-number">{validGeoPoints.toLocaleString('id-ID')}</b>
          <span className="kpi-sub-tag">{geoRatio}% Terpetakan</span>
        </div>
        <div className="kpi-card-footer">
          <span>Koordinat lintang & bujur valid</span>
        </div>
      </div>

      {/* Total Capacity */}
      <div className="kpi-metric-card">
        <div className="kpi-card-top">
          <span className="kpi-label">TOTAL DAYA TERPASANG</span>
          <div className="kpi-icon-badge purple">
            <Icon name="bolt" size={16} />
          </div>
        </div>
        <div className="kpi-value-row">
          <b className="kpi-main-number">
            {totalCapacityKva > 0 ? (totalCapacityKva / 1000).toFixed(1) : '0'}
          </b>
          <span className="kpi-unit-label">MVA</span>
        </div>
        <div className="kpi-card-footer">
          <span>{totalCapacityKva.toLocaleString('id-ID')} kVA (Aset Terfilter)</span>
        </div>
      </div>
    </section>
  );
}
