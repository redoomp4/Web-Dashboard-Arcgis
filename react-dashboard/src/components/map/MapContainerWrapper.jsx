import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { MapToolbar } from './MapToolbar';
import { MapController } from './MapController';
import { GeocoderSearch } from './GeocoderSearch';
import { MeasureTool } from './MeasureTool';
import { SpatialRadiusFilter } from './SpatialRadiusFilter';
import { HeatmapLayer } from './HeatmapLayer';
import { LayerLegendDrawer } from './LayerLegendDrawer';
import { CoordinateTracker } from './CoordinateTracker';
import { createPinIcon, geocodeResultIcon } from './CustomPins';
import { BASEMAPS } from '../../constants/config';
import { Icon } from '../common/Icons';

export function MapContainerWrapper({
  points,
  geoLayers,
  setGeoLayers,
  selected,
  onSelectAsset,
  basemap,
  setBasemap,
  zoomSignal,
  onResetZoom,
  targetLocation,
  onSelectBookmark,
  nameKey,
  typeKey,
  capacityKey,
  feederKey,
  // Spatial radius filter props
  spatialRadiusActive,
  setSpatialRadiusActive,
  spatialCenter,
  setSpatialCenter,
  spatialRadiusKm,
  setSpatialRadiusKm,
  nearbyPoints,
  nearbyCapacity
}) {
  const [measureMode, setMeasureMode] = useState(null); // 'distance' | 'area' | null
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(true);

  const defaultCenter = points.length ? [points[0].lat, points[0].lng] : [-1.85, 116.15];

  const handleMarkerClick = point => {
    onSelectAsset(point);
    if (spatialRadiusActive) {
      setSpatialCenter(point);
    }
  };

  return (
    <section className="map-view-card">
      <MapToolbar
        basemap={basemap}
        setBasemap={setBasemap}
        measureMode={measureMode}
        setMeasureMode={setMeasureMode}
        heatmapActive={heatmapActive}
        setHeatmapActive={setHeatmapActive}
        spatialRadiusActive={spatialRadiusActive}
        setSpatialRadiusActive={setSpatialRadiusActive}
        onResetZoom={onResetZoom}
        onSelectBookmark={onSelectBookmark}
        pointsCount={points.length}
        onOpenLayers={() => setLayerDrawerOpen(true)}
      />

      <div className="map-viewport-wrapper">
        {points.length === 0 && geoLayers.length === 0 ? (
          <div className="map-empty-state">
            <div className="empty-state-card">
              <Icon name="compass" size={36} />
              <h3>Belum ada data geospasial yang dimuat</h3>
              <p>Unggah file Excel / CSV berkoordinat atau import layer GeoJSON dari ArcGIS.</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="leaflet-map-canvas"
          >
            <TileLayer
              key={basemap}
              url={BASEMAPS[basemap]?.url || BASEMAPS.street.url}
              attribution={BASEMAPS[basemap]?.attribution || BASEMAPS.street.attribution}
            />

            <MapController
              points={points}
              geoLayers={geoLayers}
              selected={selected}
              zoomSignal={zoomSignal}
              targetLocation={targetLocation}
            />

            <GeocoderSearch
              onSelectResult={res => setGeocodeResult(res)}
              onClear={() => setGeocodeResult(null)}
            />

            <MeasureTool
              mode={measureMode}
              active={Boolean(measureMode)}
              onReset={() => setMeasureMode(null)}
            />

            <SpatialRadiusFilter
              active={spatialRadiusActive}
              centerPoint={spatialCenter || (selected ? { lat: selected.lat, lng: selected.lng } : null)}
              radiusKm={spatialRadiusKm}
              setRadiusKm={setSpatialRadiusKm}
              nearbyCount={nearbyPoints.length}
              nearbyCapacity={nearbyCapacity}
              onClear={() => {
                setSpatialRadiusActive(false);
                setSpatialCenter(null);
              }}
            />

            <HeatmapLayer points={points} active={heatmapActive} />

            {/* Geocode Search Pin */}
            {geocodeResult && (
              <Marker position={[geocodeResult.lat, geocodeResult.lng]} icon={geocodeResultIcon}>
                <Popup>
                  <div className="custom-leaflet-popup">
                    <strong className="popup-title">Hasil Pencarian</strong>
                    <p className="popup-desc">{geocodeResult.displayName}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* GeoJSON Layers */}
            {geoLayers
              .filter(layer => layer.visible)
              .map(layer => (
                <GeoJSON
                  key={`${layer.id}-${layer.color}-${layer.opacity}`}
                  data={layer.data}
                  style={{
                    color: layer.color,
                    weight: 3,
                    opacity: layer.opacity ?? 0.85,
                    fillColor: layer.color,
                    fillOpacity: (layer.opacity ?? 0.85) * 0.25
                  }}
                  onEachFeature={(feature, leafletLayer) => {
                    const props = feature.properties || {};
                    const entries = Object.entries(props)
                      .filter(([, v]) => v !== null && v !== '')
                      .slice(0, 8);

                    if (entries.length > 0) {
                      leafletLayer.bindPopup(`
                        <div class="custom-leaflet-popup">
                          <strong class="popup-title">${layer.name}</strong>
                          <dl class="popup-attr-list">
                            ${entries
                              .map(
                                ([k, v]) => `
                              <div class="popup-attr-row">
                                <dt>${k}</dt>
                                <dd>${v}</dd>
                              </div>
                            `
                              )
                              .join('')}
                          </dl>
                        </div>
                      `);
                    }
                  }}
                />
              ))}

            {/* Asset Point Markers */}
            {points.map(point => {
              const isSelected = selected?.row === point.row;
              const typeVal = point.row[typeKey] || 'Tidak diisi';
              const nameVal = point.row[nameKey] || 'Aset Gardu';
              const capVal = point.row[capacityKey];
              const feederVal = point.row[feederKey];

              return (
                <Marker
                  key={`${point.lat}-${point.lng}-${nameVal}`}
                  position={[point.lat, point.lng]}
                  icon={createPinIcon(typeVal, isSelected)}
                  eventHandlers={{
                    click: () => handleMarkerClick(point)
                  }}
                >
                  <Popup>
                    <div className="custom-leaflet-popup">
                      <div className="popup-header-row">
                        <span className="popup-type-tag">{typeVal}</span>
                      </div>
                      <strong className="popup-title">{nameVal}</strong>
                      <dl className="popup-attr-list">
                        {capVal && (
                          <div className="popup-attr-row">
                            <dt>Kapasitas:</dt>
                            <dd><b>{capVal} kVA</b></dd>
                          </div>
                        )}
                        {feederVal && (
                          <div className="popup-attr-row">
                            <dt>Penyulang:</dt>
                            <dd>{feederVal}</dd>
                          </div>
                        )}
                        <div className="popup-attr-row">
                          <dt>Koordinat:</dt>
                          <dd>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</dd>
                        </div>
                      </dl>
                      <button
                        className="btn-popup-inspect"
                        onClick={() => handleMarkerClick(point)}
                      >
                        Buka Inspeksi Teknis →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <CoordinateTracker />
          </MapContainer>
        )}

        {/* GeoJSON Layer Drawer */}
        <LayerLegendDrawer
          geoLayers={geoLayers}
          setGeoLayers={setGeoLayers}
          onClearAll={() => setGeoLayers([])}
          isOpen={layerDrawerOpen}
          onToggle={() => setLayerDrawerOpen(prev => !prev)}
        />
      </div>
    </section>
  );
}
