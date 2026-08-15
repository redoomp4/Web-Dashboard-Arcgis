import { useState, useRef, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  calculateHaversineDistance,
  formatDistance,
  calculatePolygonArea,
  formatArea
} from '../../utils/gisCalculations';
import { measureVertexIcon } from './CustomPins';

export function MeasureTool({ mode = 'distance', active = false, onReset }) {
  const map = useMap();
  const [points, setPoints] = useState([]);
  const [measurementResult, setMeasurementResult] = useState(null);

  const polylineRef = useRef(null);
  const polygonRef = useRef(null);
  const vertexMarkersRef = useRef([]);
  const tooltipMarkerRef = useRef(null);

  // Clear all map measurement layers
  const clearLayers = () => {
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
    if (tooltipMarkerRef.current) {
      map.removeLayer(tooltipMarkerRef.current);
      tooltipMarkerRef.current = null;
    }
    vertexMarkersRef.current.forEach(m => map.removeLayer(m));
    vertexMarkersRef.current = [];
  };

  useEffect(() => {
    if (!active) {
      clearLayers();
      setPoints([]);
      setMeasurementResult(null);
    }
  }, [active, mode, map]);

  useMapEvents({
    click(e) {
      if (!active) return;
      const { lat, lng } = e.latlng;
      const newPoints = [...points, { lat, lng }];
      setPoints(newPoints);

      // Add vertex marker
      const vertex = L.marker([lat, lng], { icon: measureVertexIcon, interactive: false }).addTo(map);
      vertexMarkersRef.current.push(vertex);

      if (mode === 'distance') {
        if (newPoints.length >= 2) {
          if (polylineRef.current) map.removeLayer(polylineRef.current);

          polylineRef.current = L.polyline(
            newPoints.map(p => [p.lat, p.lng]),
            { color: '#f97316', weight: 3, dashArray: '6,6' }
          ).addTo(map);

          let totalDist = 0;
          for (let i = 1; i < newPoints.length; i++) {
            totalDist += calculateHaversineDistance(
              newPoints[i - 1].lat,
              newPoints[i - 1].lng,
              newPoints[i].lat,
              newPoints[i].lng
            );
          }

          const formatted = formatDistance(totalDist);
          setMeasurementResult({ type: 'distance', value: formatted, raw: totalDist });

          if (tooltipMarkerRef.current) map.removeLayer(tooltipMarkerRef.current);
          tooltipMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'measure-floating-tag',
              html: `<span>Jarak: <b>${formatted}</b> (${newPoints.length} titik)</span>`,
              iconSize: [160, 32],
              iconAnchor: [80, -10]
            }),
            interactive: false
          }).addTo(map);
        }
      } else if (mode === 'area') {
        if (newPoints.length >= 3) {
          if (polygonRef.current) map.removeLayer(polygonRef.current);

          polygonRef.current = L.polygon(
            newPoints.map(p => [p.lat, p.lng]),
            { color: '#8b5cf6', weight: 2.5, fillColor: '#8b5cf6', fillOpacity: 0.2, dashArray: '5,5' }
          ).addTo(map);

          const areaSqM = calculatePolygonArea(newPoints);
          const formatted = formatArea(areaSqM);
          setMeasurementResult({ type: 'area', value: formatted, raw: areaSqM });

          if (tooltipMarkerRef.current) map.removeLayer(tooltipMarkerRef.current);
          tooltipMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'measure-floating-tag tag-purple',
              html: `<span>Luas Area: <b>${formatted}</b></span>`,
              iconSize: [160, 32],
              iconAnchor: [80, -10]
            }),
            interactive: false
          }).addTo(map);
        }
      }
    }
  });

  const handleUndo = () => {
    if (points.length <= 1) {
      clearLayers();
      setPoints([]);
      setMeasurementResult(null);
      return;
    }

    const lastMarker = vertexMarkersRef.current.pop();
    if (lastMarker) map.removeLayer(lastMarker);

    const newPoints = points.slice(0, -1);
    setPoints(newPoints);

    // Re-draw
    if (mode === 'distance') {
      if (polylineRef.current) map.removeLayer(polylineRef.current);
      if (newPoints.length >= 2) {
        polylineRef.current = L.polyline(
          newPoints.map(p => [p.lat, p.lng]),
          { color: '#f97316', weight: 3, dashArray: '6,6' }
        ).addTo(map);
      }
    } else if (mode === 'area') {
      if (polygonRef.current) map.removeLayer(polygonRef.current);
      if (newPoints.length >= 3) {
        polygonRef.current = L.polygon(
          newPoints.map(p => [p.lat, p.lng]),
          { color: '#8b5cf6', weight: 2.5, fillColor: '#8b5cf6', fillOpacity: 0.2, dashArray: '5,5' }
        ).addTo(map);
      }
    }
  };

  if (!active) return null;

  return (
    <div className="map-measure-control-banner">
      <div className="measure-banner-info">
        <span className="measure-pulse-indicator" />
        <span>
          {mode === 'distance'
            ? 'Klik di peta untuk mengukur jarak polyline'
            : 'Klik minimal 3 titik untuk mengukur luas area polygon'}
        </span>
        {measurementResult && (
          <span className="measure-live-badge">{measurementResult.value}</span>
        )}
      </div>
      <div className="measure-banner-actions">
        {points.length > 0 && (
          <button className="btn-measure-undo" onClick={handleUndo}>
            Undo
          </button>
        )}
        <button className="btn-measure-done" onClick={onReset}>
          Selesai
        </button>
      </div>
    </div>
  );
}
