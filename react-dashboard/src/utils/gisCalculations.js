/**
 * GIS Math and Calculation Utilities
 */

const R_EARTH_KM = 6371;

/**
 * Calculates Haversine great-circle distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_KM * c;
}

/**
 * Format distance in meter or km
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Approximate spherical polygon area in square meters using Shoelace formula on equirectangular projection
 */
export function calculatePolygonArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0;
  const avgLat = (latLngs.reduce((sum, p) => sum + p.lat, 0) / latLngs.length) * (Math.PI / 180);
  const kx = Math.cos(avgLat) * 111320; // meters per degree lon
  const ky = 110540; // meters per degree lat

  let area = 0;
  for (let i = 0; i < latLngs.length; i++) {
    const j = (i + 1) % latLngs.length;
    const xi = latLngs[i].lng * kx;
    const yi = latLngs[i].lat * ky;
    const xj = latLngs[j].lng * kx;
    const yj = latLngs[j].lat * ky;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

export function formatArea(areaSqMeters) {
  if (areaSqMeters >= 1000000) {
    return `${(areaSqMeters / 1000000).toFixed(2)} km²`;
  }
  if (areaSqMeters >= 10000) {
    return `${(areaSqMeters / 10000).toFixed(2)} Ha`;
  }
  return `${Math.round(areaSqMeters).toLocaleString('id-ID')} m²`;
}

/**
 * Convert Decimal Degrees to DMS string (e.g., 1° 52' 4.8" S, 116° 8' 31.2" E)
 */
export function convertDDtoDMS(lat, lng) {
  const formatCoord = (coord, isLat) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

    let direction = '';
    if (isLat) {
      direction = coord >= 0 ? 'N' : 'S';
    } else {
      direction = coord >= 0 ? 'E' : 'W';
    }

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  return {
    latDMS: formatCoord(lat, true),
    lngDMS: formatCoord(lng, false),
    formatted: `${formatCoord(lat, true)}, ${formatCoord(lng, false)}`
  };
}

/**
 * Filter points located within a specified radius (km) from a center point
 */
export function filterPointsInRadius(points, centerLat, centerLng, radiusKm) {
  return points.filter(point => {
    const dist = calculateHaversineDistance(centerLat, centerLng, point.lat, point.lng);
    return dist <= radiusKm;
  });
}
