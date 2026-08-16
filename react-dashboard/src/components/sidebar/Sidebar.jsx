import { DatasetUploadCard } from './DatasetUploadCard';
import { FilterSection } from './FilterSection';
import { ChartTabs } from './ChartTabs';
import { AssetTypeLegend } from './AssetTypeLegend';
import { CapacityTierLegend } from './CapacityTierLegend';

export function Sidebar({
  fileName,
  rows,
  keys,
  query,
  setQuery,
  area,
  setArea,
  areas,
  type,
  setType,
  categories,
  feeder,
  setFeeder,
  feeders,
  areaKey,
  feederKey,
  chartEntries,
  trendData,
  onResetFilters,
  onUploadClick,
  isDark,
  capacityTier,
  setCapacityTier,
  capacityKey
}) {
  const hasActiveFilters = Boolean(query || area || type || feeder || capacityTier);

  return (
    <aside className="app-sidebar">
      <DatasetUploadCard
        fileName={fileName}
        rowsCount={rows.length}
        keysCount={keys.length}
        onUploadClick={onUploadClick}
      />

      <FilterSection
        query={query}
        setQuery={setQuery}
        area={area}
        setArea={setArea}
        areas={areas}
        type={type}
        setType={setType}
        types={categories}
        feeder={feeder}
        setFeeder={setFeeder}
        feeders={feeders}
        areaKey={areaKey}
        feederKey={feederKey}
        onResetFilters={onResetFilters}
        hasActiveFilters={hasActiveFilters}
        capacityTier={capacityTier}
        setCapacityTier={setCapacityTier}
      />

      <ChartTabs
        chartEntries={chartEntries}
        rows={rows}
        trendData={trendData}
        isDark={isDark}
      />

      <AssetTypeLegend
        categories={categories}
        selectedType={type}
        onSelectType={setType}
      />

      <CapacityTierLegend
        rows={rows}
        capacityKey={capacityKey}
        selectedTier={capacityTier}
        onSelectTier={setCapacityTier}
      />
    </aside>
  );
}
