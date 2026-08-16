import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Design System
import './styles/design-system.css';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';

// Components
import { ToastContainer } from './components/common/ToastContainer';
import { Header } from './components/header/Header';
import { Sidebar } from './components/sidebar/Sidebar';
import { KPIOverview } from './components/analytics/KPIOverview';
import { AnalyticsDeepDiveModal } from './components/analytics/AnalyticsDeepDiveModal';
import { MapContainerWrapper } from './components/map/MapContainerWrapper';
import { TableToolbar } from './components/table/TableToolbar';
import { AssetDataTable } from './components/table/AssetDataTable';
import { AssetCardGrid } from './components/table/AssetCardGrid';
import { ColumnPickerModal } from './components/table/ColumnPickerModal';
import { AssetDetailDrawer } from './components/detail/AssetDetailDrawer';
import { AnomalyDetectorModal } from './components/modals/AnomalyDetectorModal';

// Utilities
import {
  detectColumnMappings,
  scanGISDataQuality,
  toNumber
} from './utils/dataParser';
import {
  exportToCSV,
  exportToExcel,
  exportToGeoJSON
} from './utils/exportUtils';
import {
  filterPointsInRadius
} from './utils/gisCalculations';

export default function App() {
  // Theme & Notifications
  const { isDark, toggleTheme } = useTheme();
  const { toasts, removeToast, toastSuccess, toastError, toastInfo, toastWarning } = useToast();

  // Core Dataset State
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('data-gardu.csv');
  const [geoLayers, setGeoLayers] = useState([]);

  // Filters State
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [feeder, setFeeder] = useState('');

  // Table & View State
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Map & Spatial State
  const [basemap, setBasemap] = useState('street');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoomSignal, setZoomSignal] = useState(0);
  const [targetLocation, setTargetLocation] = useState(null);

  // Spatial Radius Filter State (Buffer query)
  const [spatialRadiusActive, setSpatialRadiusActive] = useState(false);
  const [spatialCenter, setSpatialCenter] = useState(null);
  const [spatialRadiusKm, setSpatialRadiusKm] = useState(2);

  // Modals & Drawers
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const geoInputRef = useRef(null);

  // 1. Column Mappings
  const keys = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);
  const mappings = useMemo(() => detectColumnMappings(keys), [keys]);
  const { latKey, lngKey, nameKey, typeKey, capacityKey, areaKey, feederKey, dateKey } = mappings;

  // Initialize visible columns
  useEffect(() => {
    if (keys.length > 0) {
      setVisibleColumns(keys.slice(0, 8));
    }
  }, [keys]);

  // 2. Scan Dataset for GIS Data Quality & Anomalies
  const auditResult = useMemo(() => {
    if (!rows.length) return null;
    return scanGISDataQuality(rows, mappings);
  }, [rows, mappings]);

  // 3. Extract Unique Filter Options
  const areas = useMemo(() => {
    if (!areaKey) return [];
    return [...new Set(rows.map(r => String(r[areaKey] || '').trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'id')
    );
  }, [rows, areaKey]);

  const feeders = useMemo(() => {
    if (!feederKey) return [];
    return [...new Set(rows.map(r => String(r[feederKey] || '').trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'id')
    );
  }, [rows, feederKey]);

  const categories = useMemo(() => {
    const counts = rows.reduce((acc, row) => {
      const val = row[typeKey] || 'Tidak diisi';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [rows, typeKey]);

  // 4. Time Trend Calculation
  const trendData = useMemo(() => {
    if (!dateKey) return null;
    const monthly = {};
    rows.forEach(row => {
      const d = new Date(row[dateKey]);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[k] = (monthly[k] || 0) + 1;
    });
    const entries = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.length >= 2 ? { labels: entries.map(e => e[0]), data: entries.map(e => e[1]) } : null;
  }, [rows, dateKey]);

  // 5. Filter & Sort Rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (area && String(row[areaKey] || '').trim() !== area) return false;
      if (type && (row[typeKey] || 'Tidak diisi') !== type) return false;
      if (feeder && String(row[feederKey] || '').trim() !== feeder) return false;
      if (query) {
        const q = query.toLowerCase();
        const hasMatch = Object.values(row).some(v =>
          String(v ?? '').toLowerCase().includes(q)
        );
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [rows, area, type, feeder, query, areaKey, typeKey, feederKey]);

  // Sorted Rows
  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = String(a[sortConfig.key] ?? '');
      const valB = String(b[sortConfig.key] ?? '');
      return (
        valA.localeCompare(valB, 'id', { numeric: true }) *
        (sortConfig.direction === 'asc' ? 1 : -1)
      );
    });
  }, [filteredRows, sortConfig]);

  // Valid GIS Map Points from Filtered Rows
  const mapPoints = useMemo(() => {
    return filteredRows
      .map(row => ({
        row,
        lat: toNumber(row[latKey]),
        lng: toNumber(row[lngKey])
      }))
      .filter(
        p => p.lat && p.lng && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
      );
  }, [filteredRows, latKey, lngKey]);

  // Spatial Radius Filter calculation
  const nearbyPoints = useMemo(() => {
    if (!spatialRadiusActive || !spatialCenter) return [];
    return filterPointsInRadius(mapPoints, spatialCenter.lat, spatialCenter.lng, spatialRadiusKm);
  }, [spatialRadiusActive, spatialCenter, spatialRadiusKm, mapPoints]);

  const nearbyCapacity = useMemo(() => {
    return nearbyPoints.reduce((sum, p) => sum + (capacityKey ? toNumber(p.row[capacityKey]) : 0), 0);
  }, [nearbyPoints, capacityKey]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  // Stats
  const totalCapacityKva = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + (capacityKey ? toNumber(r[capacityKey]) : 0), 0);
  }, [filteredRows, capacityKey]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, area, type, feeder]);

  // 6. Data Ingestion Handlers
  const handleReadFile = useCallback(file => {
    if (!file) return;
    const processData = cleanData => {
      const valid = cleanData.filter(r =>
        Object.values(r).some(v => String(v ?? '').trim() !== '')
      );
      setRows(valid);
      setFileName(file.name);
      setQuery('');
      setArea('');
      setType('');
      setFeeder('');
      setSelectedAsset(null);
      setPage(1);
      toastSuccess(`Berhasil memuat dataset ${file.name} (${valid.length} baris)`);
    };

    if (/\.csv$/i.test(file.name)) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: res => processData(res.data),
        error: () => toastError('Gagal membaca file CSV. Pastikan format valid.')
      });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          processData(json);
        } catch {
          toastError('Gagal membaca file Excel. Pastikan format .xlsx atau .xls valid.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [toastSuccess, toastError]);

  // Initial load of sample dataset
  useEffect(() => {
    fetch('/data-gardu.csv')
      .then(res => (res.ok ? res.blob() : Promise.reject()))
      .then(blob => handleReadFile(new File([blob], 'data-gardu.csv', { type: 'text/csv' })))
      .catch(() => {
        toastInfo('Pilih file dataset Excel / CSV untuk memulai analisis jaringan.');
      });
  }, [handleReadFile, toastInfo]);

  // GeoJSON Layer Ingestion
  const handleAddGeoLayers = files => {
    Array.from(files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data?.type) throw new Error('Format GeoJSON tidak valid');
          const colors = ['#ef4444', '#0284c7', '#10b981', '#8b5cf6', '#f59e0b'];
          const newLayer = {
            id: `geo-${Date.now()}-${Math.random()}`,
            name: file.name.replace(/\.(geo)?json$/i, ''),
            data,
            visible: true,
            color: colors[geoLayers.length % colors.length],
            opacity: 0.85
          };
          setGeoLayers(prev => [...prev, newLayer]);
          toastSuccess(`Layer GIS "${newLayer.name}" berhasil ditambahkan ke peta!`);
        } catch {
          toastError(`File "${file.name}" bukan format GeoJSON yang valid.`);
        }
      };
      reader.readAsText(file);
    });
  };

  // Sort toggle
  const handleSort = key => {
    setSortConfig(current =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  // Asset selection
  const handleSelectAsset = point => {
    setSelectedAsset(point);
  };

  const handleSelectRow = row => {
    const lat = toNumber(row[latKey]);
    const lng = toNumber(row[lngKey]);
    setSelectedAsset({ row, lat, lng });
    if (lat && lng) {
      setTargetLocation({ lat, lng, zoom: 16 });
    }
  };

  return (
    <div className="pln-dashboard-shell">
      {/* ── HEADER ── */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onUploadClick={() => fileInputRef.current?.click()}
        onGeoUploadClick={() => geoInputRef.current?.click()}
        onOpenAnomalyModal={() => setIsAnomalyModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        anomalyCount={auditResult?.totalIssues || 0}
        qualityScore={auditResult?.qualityScore ?? 100}
        datasetName={fileName}
      />

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".xlsx,.xls,.csv"
        onChange={e => handleReadFile(e.target.files[0])}
      />
      <input
        ref={geoInputRef}
        type="file"
        hidden
        multiple
        accept=".geojson,.json"
        onChange={e => handleAddGeoLayers(e.target.files)}
      />

      {/* ── WORKSPACE ── */}
      <div className="pln-workspace-grid">
        {/* Sidebar */}
        <Sidebar
          fileName={fileName}
          rows={rows}
          keys={keys}
          query={query}
          setQuery={setQuery}
          area={area}
          setArea={setArea}
          areas={areas}
          type={type}
          setType={setType}
          categories={categories}
          feeder={feeder}
          setFeeder={setFeeder}
          feeders={feeders}
          areaKey={areaKey}
          feederKey={feederKey}
          chartEntries={categories}
          trendData={trendData}
          onResetFilters={() => {
            setQuery('');
            setArea('');
            setType('');
            setFeeder('');
          }}
          onUploadClick={() => fileInputRef.current?.click()}
          isDark={isDark}
        />

        {/* Main Content */}
        <main className="app-main-content">
          {/* KPI Stat Cards */}
          <KPIOverview
            totalAssets={rows.length}
            filteredAssets={filteredRows.length}
            validGeoPoints={mapPoints.length}
            totalCapacityKva={totalCapacityKva}
            activeFeedersCount={feeders.length}
            qualityScore={auditResult?.qualityScore ?? 100}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            onOpenQualityAudit={() => setIsAnomalyModalOpen(true)}
          />

          {/* Interactive GIS Map */}
          <MapContainerWrapper
            points={mapPoints}
            geoLayers={geoLayers}
            setGeoLayers={setGeoLayers}
            selected={selectedAsset}
            onSelectAsset={handleSelectAsset}
            basemap={basemap}
            setBasemap={setBasemap}
            zoomSignal={zoomSignal}
            onResetZoom={() => setZoomSignal(v => v + 1)}
            targetLocation={targetLocation}
            onSelectBookmark={bm => setTargetLocation({ lat: bm.lat, lng: bm.lng, zoom: bm.zoom })}
            nameKey={nameKey}
            typeKey={typeKey}
            capacityKey={capacityKey}
            feederKey={feederKey}
            spatialRadiusActive={spatialRadiusActive}
            setSpatialRadiusActive={setSpatialRadiusActive}
            spatialCenter={spatialCenter}
            setSpatialCenter={setSpatialCenter}
            spatialRadiusKm={spatialRadiusKm}
            setSpatialRadiusKm={setSpatialRadiusKm}
            nearbyPoints={nearbyPoints}
            nearbyCapacity={nearbyCapacity}
          />

          {/* Data Table & Card Grid Section */}
          <section className="table-data-section">
            <TableToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              filteredCount={filteredRows.length}
              onOpenColumnPicker={() => setIsColumnPickerOpen(true)}
              onExportCSV={() => {
                if (exportToCSV(filteredRows, `pln-aset-terfilter-${new Date().toISOString().slice(0, 10)}.csv`)) {
                  toastSuccess('Data berhasil diekspor ke CSV!');
                }
              }}
              onExportExcel={() => {
                if (
                  exportToExcel(
                    filteredRows,
                    {
                      Wilayah: area || 'Semua',
                      Tipe: type || 'Semua',
                      Penyulang: feeder || 'Semua',
                      TotalKapasitaskVA: totalCapacityKva
                    },
                    `pln-aset-terfilter-${new Date().toISOString().slice(0, 10)}.xlsx`
                  )
                ) {
                  toastSuccess('Laporan Excel berhasil diunduh!');
                }
              }}
              onExportGeoJSON={() => {
                if (
                  exportToGeoJSON(
                    mapPoints,
                    `pln-spatial-aset-${new Date().toISOString().slice(0, 10)}.geojson`
                  )
                ) {
                  toastSuccess('Format Spatial GeoJSON berhasil dibuat!');
                }
              }}
              onPrint={() => window.print()}
            />

            {viewMode === 'table' ? (
              <AssetDataTable
                rows={paginatedRows}
                visibleColumns={visibleColumns}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectedAsset={selectedAsset}
                onSelectRow={handleSelectRow}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                totalFilteredCount={filteredRows.length}
              />
            ) : (
              <AssetCardGrid
                rows={paginatedRows}
                nameKey={nameKey}
                typeKey={typeKey}
                capacityKey={capacityKey}
                feederKey={feederKey}
                areaKey={areaKey}
                selectedAsset={selectedAsset}
                onSelectRow={handleSelectRow}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                totalFilteredCount={filteredRows.length}
              />
            )}
          </section>
        </main>

        {/* Slide-In Asset Detail Inspector */}
        {selectedAsset && (
          <AssetDetailDrawer
            selected={selectedAsset}
            keys={keys}
            nameKey={nameKey}
            typeKey={typeKey}
            capacityKey={capacityKey}
            feederKey={feederKey}
            onClose={() => setSelectedAsset(null)}
            onZoomToAsset={() => {
              if (selectedAsset.lat && selectedAsset.lng) {
                setTargetLocation({ lat: selectedAsset.lat, lng: selectedAsset.lng, zoom: 16 });
              }
            }}
            onInspectRadius={() => {
              if (selectedAsset.lat && selectedAsset.lng) {
                setSpatialCenter(selectedAsset);
                setSpatialRadiusActive(true);
                setTargetLocation({ lat: selectedAsset.lat, lng: selectedAsset.lng, zoom: 14 });
                toastInfo(`Inspeksi radius diaktifkan di sekitar ${selectedAsset.row[nameKey]}`);
              }
            }}
            onCopySuccess={msg => toastSuccess(msg)}
          />
        )}
      </div>

      {/* ── MODALS ── */}
      <ColumnPickerModal
        isOpen={isColumnPickerOpen}
        onClose={() => setIsColumnPickerOpen(false)}
        allColumns={keys}
        visibleColumns={visibleColumns}
        onToggleColumn={col => {
          setVisibleColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
          );
        }}
        onSelectAll={() => setVisibleColumns([...keys])}
        onResetDefault={() => setVisibleColumns(keys.slice(0, 8))}
      />

      <AnalyticsDeepDiveModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        rows={filteredRows}
        capacityKey={capacityKey}
        feederKey={feederKey}
        typeKey={typeKey}
        isDark={isDark}
      />

      <AnomalyDetectorModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        auditResult={auditResult}
        onInspectAsset={row => {
          handleSelectRow(row);
          toastInfo(`Membuka data ${row[nameKey] || 'Aset'}`);
        }}
      />

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
