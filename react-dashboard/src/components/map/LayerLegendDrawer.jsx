import { Icon } from '../common/Icons';

export function LayerLegendDrawer({
  geoLayers,
  setGeoLayers,
  onClearAll,
  isOpen,
  onToggle
}) {
  if (!geoLayers || !geoLayers.length) return null;

  return (
    <div className={`map-layer-drawer ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="layer-drawer-header" onClick={onToggle}>
        <div className="drawer-header-left">
          <Icon name="layers" size={14} />
          <span>Layer GIS ({geoLayers.length})</span>
        </div>
        <div className="drawer-header-right">
          <button
            className="btn-clear-layers"
            onClick={e => {
              e.stopPropagation();
              onClearAll();
            }}
          >
            Hapus Semua
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="layer-drawer-body">
          {geoLayers.map(layer => (
            <div key={layer.id} className="layer-item-control">
              <div className="layer-item-top">
                <label className="layer-checkbox-label">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() =>
                      setGeoLayers(prev =>
                        prev.map(l =>
                          l.id === layer.id ? { ...l, visible: !l.visible } : l
                        )
                      )
                    }
                  />
                  <input
                    type="color"
                    value={layer.color}
                    className="layer-color-input"
                    title="Ubah warna garis/polygon"
                    onChange={e =>
                      setGeoLayers(prev =>
                        prev.map(l =>
                          l.id === layer.id ? { ...l, color: e.target.value } : l
                        )
                      )
                    }
                  />
                  <span className="layer-name-title" title={layer.name}>
                    {layer.name}
                  </span>
                </label>
              </div>

              <div className="layer-opacity-control">
                <span>Transparansi</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layer.opacity ?? 0.85}
                  onChange={e =>
                    setGeoLayers(prev =>
                      prev.map(l =>
                        l.id === layer.id
                          ? { ...l, opacity: parseFloat(e.target.value) }
                          : l
                      )
                    )
                  }
                  className="layer-opacity-slider"
                />
                <span className="opacity-percent">
                  {Math.round((layer.opacity ?? 0.85) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
