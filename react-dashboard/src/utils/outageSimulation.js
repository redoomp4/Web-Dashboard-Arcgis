import { toNumber } from './dataParser';
import { calculateHaversineDistance } from './gisCalculations';

/**
 * Outage and Network Switching Maneuver Simulation Engine
 */

/**
 * Simulates a feeder trip or blackout on a selected feeder or substation
 * @param {Array} allRows - All asset rows in the dataset
 * @param {string} targetFeeder - The tripped feeder name
 * @param {Object} mappings - Column mappings
 * @returns {Object} Outage impact analysis and transfer recommendations
 */
export function simulateFeederOutage(allRows, targetFeeder, mappings) {
  if (!targetFeeder || !allRows || !allRows.length) {
    return null;
  }

  const { feederKey, capacityKey, nameKey, latKey, lngKey, areaKey } = mappings;

  // 1. Identify all affected assets (Gardu Padam)
  const affectedAssets = allRows.filter(r => {
    const f = String(r[feederKey] || '').trim();
    return f.toLowerCase() === targetFeeder.toLowerCase();
  });

  // 2. Identify healthy assets on other feeders
  const healthyAssets = allRows.filter(r => {
    const f = String(r[feederKey] || '').trim();
    return f.toLowerCase() !== targetFeeder.toLowerCase();
  });

  // 3. Compute lost metrics
  const totalCapacityLostKva = affectedAssets.reduce((sum, r) => {
    return sum + (capacityKey ? toNumber(r[capacityKey]) : 0);
  }, 0);

  // Estimated customers affected (~4-6 customers per kVA for standard residential/commercial distribution)
  const estimatedCustomers = Math.round(totalCapacityLostKva * 4.8);

  // Group healthy assets by feeder to find candidate backup feeders
  const candidateFeedersMap = new Map();
  healthyAssets.forEach(r => {
    const f = String(r[feederKey] || '').trim();
    if (!f) return;
    if (!candidateFeedersMap.has(f)) {
      candidateFeedersMap.set(f, {
        name: f,
        assets: [],
        totalCapacityKva: 0,
        centerLat: 0,
        centerLng: 0
      });
    }
    const entry = candidateFeedersMap.get(f);
    entry.assets.push(r);
    entry.totalCapacityKva += capacityKey ? toNumber(r[capacityKey]) : 0;
  });

  // 4. Calculate centroid of affected area
  let sumLat = 0;
  let sumLng = 0;
  let validCoordCount = 0;

  affectedAssets.forEach(r => {
    const lat = toNumber(r[latKey]);
    const lng = toNumber(r[lngKey]);
    if (lat && lng) {
      sumLat += lat;
      sumLng += lng;
      validCoordCount++;
    }
  });

  const outageCentroid = validCoordCount > 0 ? {
    lat: sumLat / validCoordCount,
    lng: sumLng / validCoordCount
  } : null;

  // 5. Recommend Backup Feeders based on proximity and spare capacity
  const backupRecommendations = [];
  candidateFeedersMap.forEach(feederInfo => {
    // calculate centroid for this candidate feeder
    let cLat = 0;
    let cLng = 0;
    let cCount = 0;
    feederInfo.assets.forEach(r => {
      const lat = toNumber(r[latKey]);
      const lng = toNumber(r[lngKey]);
      if (lat && lng) {
        cLat += lat;
        cLng += lng;
        cCount++;
      }
    });

    if (cCount > 0 && outageCentroid) {
      const centroidLat = cLat / cCount;
      const centroidLng = cLng / cCount;
      const distanceKm = calculateHaversineDistance(
        outageCentroid.lat,
        outageCentroid.lng,
        centroidLat,
        centroidLng
      );

      // Estimated available reserve capacity (assuming 20MVA express feeder rating minus current load)
      const feederRatingKva = 20000; 
      const estimatedAvailableKva = Math.max(0, feederRatingKva - feederInfo.totalCapacityKva);
      const canAbsorb = estimatedAvailableKva >= totalCapacityLostKva;

      backupRecommendations.push({
        feederName: feederInfo.name,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        totalAssets: feederInfo.assets.length,
        currentLoadKva: feederInfo.totalCapacityKva,
        estimatedAvailableKva,
        canAbsorb,
        compatibilityScore: Math.max(10, Math.round(100 - (distanceKm * 5) + (canAbsorb ? 20 : -30)))
      });
    }
  });

  // Sort recommendations by compatibility score descending
  backupRecommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return {
    trippedFeeder: targetFeeder,
    outageTimestamp: new Date().toISOString(),
    affectedCount: affectedAssets.length,
    totalCapacityLostKva,
    totalCapacityLostMva: parseFloat((totalCapacityLostKva / 1000).toFixed(2)),
    estimatedCustomers,
    affectedAssets,
    outageCentroid,
    backupRecommendations: backupRecommendations.slice(0, 4)
  };
}
