import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export function MapController({ points, geoLayers, selected, zoomSignal, targetLocation }) {
  const map = useMap();

  // Invalidate size on mount / resize
  useEffect(() => {
    const timers = [100, 300, 800].map(delay =>
      setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);

  // Fit bounds when points or geoLayers change, or on zoomSignal
  useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 14, {
        duration: 1
      });
      return;
    }

    if (selected) {
      map.flyTo([selected.lat, selected.lng], 16, { duration: 0.8 });
      return;
    }

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));

    geoLayers
      .filter(layer => layer.visible)
      .forEach(layer => {
        try {
          const layerBounds = L.geoJSON(layer.data).getBounds();
          if (layerBounds.isValid()) bounds.extend(layerBounds);
        } catch {
          // ignore invalid bounds
        }
      });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points, geoLayers, zoomSignal, selected, targetLocation]);

  return null;
}
