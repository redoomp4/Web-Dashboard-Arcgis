import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from '../common/Icons';

export function SpatialRadiusFilter({
  active,
  centerPoint,
  radiusKm,
  setRadiusKm,
  nearbyCount,
  nearbyCapacity,
  onClear
}) {
  if (!active || !centerPoint) return null;

  const centerPin = L.divIcon({
    className: 'spatial-center-pin-wrapper',
    html: `
      <div class="spatial-radius-center-pin">
        <div class="center-pulse"></div>
        <div class="center-core"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <>
      <Circle
        center={[centerPoint.lat, centerPoint.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: '#0284c7',
          fillColor: '#0284c7',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '4,4'
        }}
      />

      <Marker position={[centerPoint.lat, centerPoint.lng]} icon={centerPin}>
        <Popup>
          <div className="spatial-radius-popup">
            <strong>Pusat Inspeksi Radius</strong>
            <p>Radius Aktif: <b>{radiusKm} km</b></p>
            <p>Aset Terdeteksi: <b>{nearbyCount} unit</b></p>
            <p>Total Kapasitas: <b>{nearbyCapacity.toLocaleString('id-ID')} kVA</b></p>
          </div>
        </Popup>
      </Marker>

      <div className="spatial-radius-floating-control">
        <div className="spatial-control-header">
          <div className="spatial-control-title">
            <Icon name="radius" size={15} color="#0284c7" />
            <span>Inspeksi Radius Spasial</span>
          </div>
          <button className="spatial-control-close" onClick={onClear}>
            <Icon name="x" size={13} />
          </button>
        </div>

        <div className="spatial-slider-row">
          <label htmlFor="radius-range-slider">
            <span>Radius:</span>
            <b>{radiusKm >= 1 ? `${radiusKm} km` : `${radiusKm * 1000} m`}</b>
          </label>
          <input
            id="radius-range-slider"
            type="range"
            min="0.2"
            max="10"
            step="0.2"
            value={radiusKm}
            onChange={e => setRadiusKm(parseFloat(e.target.value))}
            className="radius-range-input"
          />
        </div>

        <div className="spatial-metrics-summary">
          <div className="metric-item">
            <span>Aset Terjangkau</span>
            <b>{nearbyCount} unit</b>
          </div>
          <div className="metric-item">
            <span>Total Daya</span>
            <b>{nearbyCapacity.toLocaleString('id-ID')} kVA</b>
          </div>
        </div>
      </div>
    </>
  );
}
