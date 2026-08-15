import { TYPE_COLORS } from '../../constants/config';

export function AssetTypeLegend({ categories, selectedType, onSelectType }) {
  if (!categories || !categories.length) return null;

  return (
    <div className="sidebar-legend-card">
      <div className="legend-header">
        <span>LEGENDA & FILTER CEPAT</span>
        {selectedType && (
          <button className="legend-clear-btn" onClick={() => onSelectType('')}>
            Semua
          </button>
        )}
      </div>
      <div className="legend-items-list">
        {categories.slice(0, 8).map(([typeName, count]) => {
          const color = TYPE_COLORS[typeName] || '#64748b';
          const isSelected = selectedType === typeName;

          return (
            <button
              key={typeName}
              className={`legend-item-row ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectType(isSelected ? '' : typeName)}
            >
              <span className="legend-color-indicator" style={{ backgroundColor: color }} />
              <span className="legend-label-text" title={typeName}>{typeName}</span>
              <span className="legend-badge-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
