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

/**
 * Convert Lat/Lng decimal degrees to UTM coordinates (Universal Transverse Mercator)
 */
export function convertDDtoUTM(lat, lng) {
  const zone = Math.floor((lng + 180) / 6) + 1;
  const isSouth = lat < 0;
  
  const a = 6378137.0;
  const f = 1.0 / 298.257223563;
  const k0 = 0.9996;
  
  const b = a * (1 - f);
  const esq = (a*a - b*b) / (a*a);
  const eprimeSqr = (a*a - b*b) / (b*b);
  
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const lngOriginRad = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180;
  
  const N = a / Math.sqrt(1 - esq * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = eprimeSqr * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lngRad - lngOriginRad);
  
  const M = a * (
    (1 - esq/4 - 3*esq*esq/64 - 5*esq*esq*esq/256) * latRad -
    (3*esq/8 + 3*esq*esq/32 + 45*esq*esq*esq/1024) * Math.sin(2*latRad) +
    (15*esq*esq/256 + 45*esq*esq*esq/1024) * Math.sin(4*latRad) -
    (35*esq*esq*esq/3072) * Math.sin(6*latRad)
  );
  
  let easting = k0 * N * (
    A + (1 - T + C) * A*A*A / 6 +
    (5 - 18*T + T*T + 72*C - 58*eprimeSqr) * A*A*A*A*A / 120
  ) + 500000.0;
  
  let northing = k0 * (
    M + N * Math.tan(latRad) * (
      A*A / 2 +
      (5 - T + 9*C + 4*C*C) * A*A*A*A / 24 +
      (61 - 58*T + T*T + 600*C - 330*eprimeSqr) * A*A*A*A*A*A / 720
    )
  );
  
  if (isSouth) {
    northing += 10000000.0;
  }
  
  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    zone: `${zone}${isSouth ? 'S' : 'N'}`,
    formatted: `UTM Zone ${zone}${isSouth ? 'S' : 'N'} E: ${Math.round(easting)} N: ${Math.round(northing)}`
  };
}

