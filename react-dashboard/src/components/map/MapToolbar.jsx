import { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { MapBookmarks } from './MapBookmarks';
import { BASEMAPS } from '../../constants/config';

export function MapToolbar({
  basemap,
  setBasemap,
  measureMode,
  setMeasureMode,
  heatmapActive,
  setHeatmapActive,
  spatialRadiusActive,
  setSpatialRadiusActive,
  onResetZoom,
  onSelectBookmark,
  pointsCount,
  onOpenLayers
}) {
  const [basemapOpen, setBasemapOpen] = useState(false);
  const basemapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (basemapRef.current && !basemapRef.current.contains(e.target)) {
        setBasemapOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMeasure = mode => {
    if (measureMode === mode) {
      setMeasureMode(null);
    } else {
      setMeasureMode(mode);
      if (spatialRadiusActive) setSpatialRadiusActive(false);
    }
  };

  const toggleSpatialRadius = () => {
    setSpatialRadiusActive(prev => !prev);
    if (measureMode) setMeasureMode(null);
  };

  return (
    <div className="map-toolbar-panel">
      <div className="map-toolbar-title-section">
        <div className="map-panel-indicator">
          <span className="live-dot" />
          <span className="panel-tag">GIS VIEWER</span>
        </div>
        <h2 className="map-panel-heading">Sebaran Spasial Aset Gardu & Jaringan</h2>
      </div>

      <div className="map-toolbar-actions">
        {/* Distance Measure */}
        <button
          className={`btn-map-tool ${measureMode === 'distance' ? 'active' : ''}`}
          onClick={() => toggleMeasure('distance')}
          title="Ukur Jarak Antar Titik / Panjang Kabel (Polyline)"
        >
          <Icon name="ruler" size={14} />
          <span>Ukur Jarak</span>
        </button>

        {/* Area Measure */}
        <button
          className={`btn-map-tool ${measureMode === 'area' ? 'active' : ''}`}
          onClick={() => toggleMeasure('area')}
          title="Ukur Luas Wilayah Gardu (Polygon Area)"
        >
          <Icon name="grid" size={14} />
          <span>Ukur Area</span>
        </button>

        {/* Spatial Radius Buffer Query */}
        <button
          className={`btn-map-tool ${spatialRadiusActive ? 'active' : ''}`}
          onClick={toggleSpatialRadius}
          title="Inspeksi Radius Jangkauan / Buffer Spasial di Sekitar Gardu"
        >
          <Icon name="radius" size={14} />
          <span>Inspeksi Radius</span>
        </button>

        {/* Heatmap Toggle */}
        <button
          className={`btn-map-tool ${heatmapActive ? 'active' : ''}`}
          onClick={() => setHeatmapActive(prev => !prev)}
          title="Tampilkan Heatmap Kepadatan Aset"
        >
          <Icon name="flame" size={14} />
          <span>Heatmap</span>
        </button>

        {/* Regional Bookmarks */}
        <MapBookmarks onSelectBookmark={onSelectBookmark} />

        {/* Fit All Zoom */}
        <button
          className="btn-map-tool"
          onClick={onResetZoom}
          title="Zoom Otomatis ke Seluruh Titik Aset"
        >
          <Icon name="maximize" size={14} />
          <span>Zoom Semua</span>
        </button>

        {/* Basemap Picker Dropdown */}
        <div className="basemap-selector-wrapper" ref={basemapRef}>
          <button
            className="btn-basemap-current"
            onClick={() => setBasemapOpen(prev => !prev)}
            title="Pilih Peta Dasar (Basemap)"
          >
            <span>{BASEMAPS[basemap]?.thumbnail || '🗺️'}</span>
            <span className="basemap-name-label">{BASEMAPS[basemap]?.name || 'Basemap'}</span>
          </button>

          {basemapOpen && (
            <div className="basemap-options-card">
              <div className="basemap-card-title">Pilih Basemap:</div>
              {Object.values(BASEMAPS).map(layer => (
                <button
                  key={layer.id}
                  className={`basemap-option-item ${basemap === layer.id ? 'selected' : ''}`}
                  onClick={() => {
                    setBasemap(layer.id);
                    setBasemapOpen(false);
                  }}
                >
                  <span className="option-thumb">{layer.thumbnail}</span>
                  <span className="option-name">{layer.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
