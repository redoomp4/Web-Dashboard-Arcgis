/**
 * Simulated Operational Load and Phase Balance Calculations for PLN Transformers
 */

/**
 * Calculates simulated transformer load percent based on asset properties and name.
 */
export function getSimulatedLoadPercent(name, capacityKva) {
  if (!capacityKva) return 0;
  const hash = String(name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Returns a pseudo-random load percentage between 35% and 92%
  return (hash % 58) + 35;
}

/**
 * Categorizes load status
 */
export function getLoadStatus(loadPercent) {
  if (loadPercent > 85) return { status: 'Kritis (Overload)', color: '#ef4444' };
  if (loadPercent > 70) return { status: 'Tinggi (Warning)', color: '#f59e0b' };
  return { status: 'Normal (Optimal)', color: '#10b981' };
}

/**
 * Generates simulated R-S-T phase loading (imbalance factor)
 */
export function getPhaseLoading(loadPercent, capacityKva) {
  const totalLoadKva = (capacityKva * loadPercent) / 100;
  const basePhase = totalLoadKva / 3;
  
  // Create slight imbalance
  const rLoad = Math.round(basePhase * 1.05);
  const sLoad = Math.round(basePhase * 0.97);
  const tLoad = Math.round(basePhase * 0.98);
  
  const imbalancePercent = Math.round(((Math.max(rLoad, sLoad, tLoad) - Math.min(rLoad, sLoad, tLoad)) / basePhase) * 100);
  
  return {
    r: rLoad,
    s: sLoad,
    t: tLoad,
    imbalancePercent
  };
}
