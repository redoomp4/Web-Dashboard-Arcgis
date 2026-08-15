import { Circle } from 'react-leaflet';

export function HeatmapLayer({ points, active }) {
  if (!active || !points || !points.length) return null;

  return (
    <>
      {points.map((p, i) => (
        <Circle
          key={`heat-${i}-${p.lat}`}
          center={[p.lat, p.lng]}
          radius={450}
          pathOptions={{
            color: 'transparent',
            fillColor: '#ef4444',
            fillOpacity: 0.14,
            weight: 0
          }}
        />
      ))}
    </>
  );
}
