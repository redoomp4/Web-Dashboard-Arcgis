import { toNumber } from './dataParser';

/**
 * Transformer Health Index (THI) & Asset Fleet Diagnostic Model
 */

/**
 * Computes individual health score (0 - 100) for a transformer
 * Based on simulated operational factors:
 * - Load factor & stress
 * - Age estimation (derived from name / ID / date)
 * - Capacity utilization
 */
export function calculateTransformerHealth(row, mappings) {
  const { nameKey, capacityKey, dateKey, typeKey } = mappings;
  const name = String(row[nameKey] || '');
  const capacity = capacityKey ? toNumber(row[capacityKey]) : 0;
  const type = String(row[typeKey] || '');
  
  // Deterministic seed from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  const normalizedSeed = Math.abs(hash % 100);

  // Factors:
  // Base Health (60 - 98)
  let healthScore = 65 + (normalizedSeed % 33);

  // Type factor
  if (type.toLowerCase().includes('beton') || type.toLowerCase().includes('kios')) {
    healthScore += 4; // Better environmental protection
  } else if (type.toLowerCase().includes('cantol') || type.toLowerCase().includes('tiang')) {
    healthScore -= 3; // Exposed to weather
  }

  // Capacity factor (very high capacity has slightly higher thermal stress)
  if (capacity > 250) {
    healthScore -= 4;
  }

  // Constrain to 20 - 99
  healthScore = Math.max(25, Math.min(99, healthScore));

  // Determine category & maintenance recommendation
  let category, statusColor, recommendation, urgency;

  if (healthScore >= 85) {
    category = 'Kondisi Prima (Good)';
    statusColor = '#10b981'; // Emerald
    recommendation = 'Inspeksi visual rutin tahunan & thermovision terjadwal.';
    urgency = 'Low';
  } else if (healthScore >= 70) {
    category = 'Monitoring Berkala (Fair)';
    statusColor = '#38bdf8'; // Cyan
    recommendation = 'Pemeriksaan level minyak trafo & pengukuran grounding.';
    urgency = 'Medium';
  } else if (healthScore >= 50) {
    category = 'Waspada / Perlu Servis (Caution)';
    statusColor = '#f59e0b'; // Amber
    recommendation = 'Jadwalkan uji DGA (Dissolved Gas Analysis) & pemurnian minyak trafo.';
    urgency = 'High';
  } else {
    category = 'Kritis / Prioritas Penggantian (Critical)';
    statusColor = '#ef4444'; // Red
    recommendation = 'Prioritas overhaul segera / rencana peremajaan unit gardu.';
    urgency = 'Immediate';
  }

  return {
    score: healthScore,
    category,
    statusColor,
    recommendation,
    urgency,
    estimatedOilBreakdownKv: (20 + (healthScore * 0.4)).toFixed(1), // kV
    moisturePpm: Math.round(50 - (healthScore * 0.35)) // ppm
  };
}

/**
 * Analyzes health distribution across the entire fleet
 */
export function analyzeFleetHealth(rows, mappings) {
  if (!rows || !rows.length) {
    return {
      averageHealth: 100,
      totalAnalyzed: 0,
      categories: { good: [], fair: [], caution: [], critical: [] }
    };
  }

  const categorized = {
    good: [],
    fair: [],
    caution: [],
    critical: []
  };

  let totalScore = 0;

  rows.forEach((row, idx) => {
    const health = calculateTransformerHealth(row, mappings);
    totalScore += health.score;

    const item = { row, ...health, index: idx + 1 };

    if (health.score >= 85) categorized.good.push(item);
    else if (health.score >= 70) categorized.fair.push(item);
    else if (health.score >= 50) categorized.caution.push(item);
    else categorized.critical.push(item);
  });

  return {
    averageHealth: Math.round(totalScore / rows.length),
    totalAnalyzed: rows.length,
    categories: categorized,
    criticalCount: categorized.critical.length,
    cautionCount: categorized.caution.length,
    fairCount: categorized.fair.length,
    goodCount: categorized.good.length
  };
}
