import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { convertDDtoDMS } from '../../utils/gisCalculations';

export function CoordinateTracker() {
  const [coords, setCoords] = useState(null);
  const [zoom, setZoom] = useState(12);

  useMapEvents({
    mousemove(e) {
      setCoords(e.latlng);
    },
    zoomend(e) {
      setZoom(e.target.getZoom());
    }
  });

  if (!coords) {
    return (
      <div className="map-coordinates-badge">
        <span>Zoom: <b>{zoom}</b></span>
      </div>
    );
  }

  const dms = convertDDtoDMS(coords.lat, coords.lng);

  return (
    <div className="map-coordinates-badge" title="Koordinat Kursor & Tingkat Zoom">
      <span className="coord-dms">{dms.formatted}</span>
      <span className="coord-dd">({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})</span>
      <span className="coord-zoom">Zoom: <b>{zoom}</b></span>
    </div>
  );
}
