import L from 'leaflet';
import { TYPE_COLORS } from '../../constants/config';

export function createPinIcon(type, isSelected) {
  const color = TYPE_COLORS[type] || '#0284c7';
  const size = isSelected ? 28 : 22;

  const html = `
    <div class="custom-marker-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color: ${color};">
      <div class="pin-head">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <div class="pin-arrow"></div>
      ${isSelected ? '<div class="pin-pulse"></div>' : ''}
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-custom-marker-wrapper',
    html,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 10)]
  });
}

export const geocodeResultIcon = L.divIcon({
  className: 'geocode-result-pin-wrapper',
  html: `
    <div class="geocode-pulse-marker">
      <div class="center-dot"></div>
      <div class="pulse-ring"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export const measureVertexIcon = L.divIcon({
  className: 'measure-vertex-pin-wrapper',
  html: '<div class="measure-vertex-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});
