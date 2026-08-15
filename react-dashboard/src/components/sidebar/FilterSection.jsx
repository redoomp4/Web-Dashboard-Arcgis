import { Icon } from '../common/Icons';

export function FilterSection({
  query,
  setQuery,
  area,
  setArea,
  areas,
  type,
  setType,
  types,
  feeder,
  setFeeder,
  feeders,
  areaKey,
  feederKey,
  onResetFilters,
  hasActiveFilters
}) {
  return (
    <section className="sidebar-filter-card">
      <div className="filter-card-header">
        <div className="sidebar-section-title">
          <Icon name="filter" size={13} />
          <span>FILTER SPASIAL & ASET</span>
        </div>
        {hasActiveFilters && (
          <button className="btn-reset-filters" onClick={onResetFilters}>
            Reset
          </button>
        )}
      </div>

      <div className="filter-form-group">
        <label htmlFor="search-asset-input">
          <span>Pencarian Kata Kunci</span>
        </label>
        <div className="input-with-icon">
          <Icon name="search" size={14} className="input-icon" />
          <input
            id="search-asset-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nama gardu, kode, jalan..."
          />
          {query && (
            <button className="input-clear-btn" onClick={() => setQuery('')}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>

      {areaKey && (
        <div className="filter-form-group">
          <label htmlFor="area-select">
            <span>Wilayah / ULP</span>
          </label>
          <select
            id="area-select"
            value={area}
            onChange={e => setArea(e.target.value)}
          >
            <option value="">Semua Wilayah ({areas.length})</option>
            {areas.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {feederKey && feeders.length > 0 && (
        <div className="filter-form-group">
          <label htmlFor="feeder-select">
            <span>Penyulang / Feeder</span>
          </label>
          <select
            id="feeder-select"
            value={feeder}
            onChange={e => setFeeder(e.target.value)}
          >
            <option value="">Semua Penyulang ({feeders.length})</option>
            {feeders.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-form-group">
        <label htmlFor="type-select">
          <span>Kategori / Tipe Gardu</span>
        </label>
        <select
          id="type-select"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="">Semua Tipe ({types.length})</option>
          {types.map(([typeName, count]) => (
            <option key={typeName} value={typeName}>
              {typeName} ({count})
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
