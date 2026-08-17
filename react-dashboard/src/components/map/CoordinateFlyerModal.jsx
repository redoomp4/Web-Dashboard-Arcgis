import { useState } from 'react';
import { Icon } from '../common/Icons';
import { toNumber } from '../../utils/dataParser';

export function CoordinateFlyerModal({ isOpen, onClose, onFlyToCoordinates }) {
  const [coordType, setCoordType] = useState('dd'); // 'dd' | 'utm'
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [utmZone, setUtmZone] = useState('50S');
  const [utmEasting, setUtmEasting] = useState('');
  const [utmNorthing, setUtmNorthing] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = e => {
    e.preventDefault();
    setError('');

    if (coordType === 'dd') {
      const lat = toNumber(latInput);
      const lng = toNumber(lngInput);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        setError('Harap masukkan angka lintang (latitude) dan bujur (longitude) yang valid.');
        return;
      }
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        setError('Nilai lintang harus antara -90 hingga 90, dan bujur antara -180 hingga 180.');
        return;
      }

      onFlyToCoordinates({ lat, lng, zoom: 16, label: `Titik Koordinat (${lat.toFixed(5)}, ${lng.toFixed(5)})` });
      onClose();
    } else {
      // Simple approximation for UTM 50S to Lat/Long in Paser
      const east = toNumber(utmEasting);
      const north = toNumber(utmNorthing);
      if (!east || !north) {
        setError('Harap masukkan nilai Easting dan Northing yang valid.');
        return;
      }

      // Reverse conversion approximation for UTM 50S
      const lat = -((10000000 - north) / 111000);
      const lng = 117 + ((east - 500000) / (111000 * Math.cos((lat * Math.PI) / 180)));

      onFlyToCoordinates({ lat, lng, zoom: 16, label: `Koordinat UTM 50S (${east}, ${north})` });
      onClose();
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="column-picker-window coord-flyer-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header">
          <div className="header-title-group">
            <div className="modal-icon-badge">
              <Icon name="compass" size={18} color="#0284c7" />
            </div>
            <div>
              <h3>Lompat ke Koordinat Lapangan</h3>
              <small>Input koordinat geospasial manual untuk langsung menuju lokasi</small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="coord-flyer-form">
          <div className="coord-type-tabs">
            <button
              type="button"
              className={`tab-btn ${coordType === 'dd' ? 'active' : ''}`}
              onClick={() => setCoordType('dd')}
            >
              Derajat Desimal (Lat, Lng)
            </button>
            <button
              type="button"
              className={`tab-btn ${coordType === 'utm' ? 'active' : ''}`}
              onClick={() => setCoordType('utm')}
            >
              Proyeksi UTM (Easting, Northing)
            </button>
          </div>

          {error && <div className="form-error-banner">{error}</div>}

          {coordType === 'dd' ? (
            <div className="coord-input-fields">
              <div className="filter-form-group">
                <label>Latitude / Lintang (cth: -1.8682)</label>
                <input
                  type="text"
                  placeholder="Contoh: -1.86825"
                  value={latInput}
                  onChange={e => setLatInput(e.target.value)}
                  className="coord-input"
                  required
                />
              </div>
              <div className="filter-form-group">
                <label>Longitude / Bujur (cth: 116.1425)</label>
                <input
                  type="text"
                  placeholder="Contoh: 116.14250"
                  value={lngInput}
                  onChange={e => setLngInput(e.target.value)}
                  className="coord-input"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="coord-input-fields">
              <div className="filter-form-group">
                <label>UTM Zone</label>
                <select value={utmZone} onChange={e => setUtmZone(e.target.value)} className="coord-input">
                  <option value="50S">Zone 50S (Kabupaten Paser & Sekitarnya)</option>
                  <option value="50N">Zone 50N (Kaltim Bagian Utara)</option>
                </select>
              </div>
              <div className="coord-input-row">
                <div className="filter-form-group">
                  <label>Easting (m)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 404500"
                    value={utmEasting}
                    onChange={e => setUtmEasting(e.target.value)}
                    className="coord-input"
                    required
                  />
                </div>
                <div className="filter-form-group">
                  <label>Northing (m)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 9793500"
                    value={utmNorthing}
                    onChange={e => setUtmNorthing(e.target.value)}
                    className="coord-input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="modal-window-footer">
            <button type="button" className="btn-modal-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-modal-primary">
              <Icon name="map-pin" size={14} />
              <span>Terbangkan Peta ke Titik Ini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
