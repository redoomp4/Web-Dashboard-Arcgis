import { Circle, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Icon } from '../common/Icons';

export function MapOutageOverlay({ activeOutage, onClearOutage }) {
  if (!activeOutage || !activeOutage.outageCentroid) return null;

  const { affectedAssets, outageCentroid, trippedFeeder, totalCapacityLostMva, affectedCount } = activeOutage;

  const outageBlackoutPin = L.divIcon({
    className: 'outage-blackout-marker-wrapper',
    html: `
      <div class="outage-blackout-pin">
        <div class="blackout-pulse-ring"></div>
        <div class="blackout-center-core">⚡</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  return (
    <>
      {/* Centroid Buffer Circle */}
      <Circle
        center={[outageCentroid.lat, outageCentroid.lng]}
        radius={2500}
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.16,
          weight: 2.5,
          dashArray: '6,6'
        }}
      />

      {/* Outage Centroid Marker */}
      <Marker position={[outageCentroid.lat, outageCentroid.lng]} icon={outageBlackoutPin}>
        <Popup>
          <div className="custom-leaflet-popup">
            <div className="popup-type-tag" style={{ background: '#ef4444', color: '#ffffff' }}>
              AREA PEMADAMAN (TRIP)
            </div>
            <strong className="popup-title">Penyulang {trippedFeeder}</strong>
            <dl className="popup-attr-list">
              <div className="popup-attr-row">
                <dt>Total Padam:</dt>
                <dd><b style={{ color: '#ef4444' }}>{affectedCount} Gardu</b></dd>
              </div>
              <div className="popup-attr-row">
                <dt>Daya Hilang:</dt>
                <dd><b style={{ color: '#f59e0b' }}>{totalCapacityLostMva} MVA</b></dd>
              </div>
            </dl>
          </div>
        </Popup>
      </Marker>

      {/* Floating Outage Control Banner */}
      <div className="map-outage-banner">
        <div className="outage-banner-left">
          <span className="outage-live-pulse"></span>
          <div>
            <strong>Mode Simulasi Gangguan: Penyulang {trippedFeeder}</strong>
            <small>{affectedCount} Gardu Padam · {totalCapacityLostMva} MVA Hilang</small>
          </div>
        </div>
        <button className="btn-outage-clear" onClick={onClearOutage}>
          <Icon name="x" size={13} />
          <span>Tutup Simulasi</span>
        </button>
      </div>
    </>
  );
}
