import { Icon } from '../common/Icons';
import { CAPACITY_TIERS } from '../../constants/config';
import { toNumber } from '../../utils/dataParser';

export function CapacityTierLegend({ rows, capacityKey, selectedTier, onSelectTier }) {
  if (!rows || !rows.length || !capacityKey) return null;

  // Calculate counts for each tier
  const tierCounts = CAPACITY_TIERS.map(tier => {
    const count = rows.filter(r => {
      const cap = toNumber(r[capacityKey]);
      return cap >= tier.min && cap <= tier.max;
    }).length;
    return { ...tier, count };
  });

  return (
    <div className="sidebar-legend-card" style={{ marginTop: '12px' }}>
      <div className="legend-header">
        <span>KLASIFIKASI BEBAN TRAFO</span>
        {selectedTier && (
          <button className="legend-clear-btn" onClick={() => onSelectTier('')}>
            Semua
          </button>
        )}
      </div>
      <div className="legend-items-list">
        {tierCounts.map(tier => {
          const isSelected = selectedTier === tier.label;
          const colors = ['#38bdf8', '#0284c7', '#0369a1', '#f59e0b', '#ef4444'];
          const idx = CAPACITY_TIERS.findIndex(t => t.label === tier.label);
          const color = colors[idx % colors.length];

          return (
            <button
              key={tier.label}
              className={`legend-item-row ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectTier(isSelected ? '' : tier.label)}
            >
              <span className="legend-color-indicator" style={{ backgroundColor: color }} />
              <span className="legend-label-text" title={tier.label}>{tier.label}</span>
              <span className="legend-badge-count">{tier.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
