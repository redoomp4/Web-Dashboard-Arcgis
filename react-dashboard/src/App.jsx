import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import { Circle, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

// ─── Constants ────────────────────────────────────────────────────────────────
const BASEMAPS = {
  street:    { name: 'Street',    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                            attribution: '© OpenStreetMap contributors' },
  light:     { name: 'Light',     url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',                               attribution: '© OpenStreetMap contributors © CARTO' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles © Esri' },
  dark:      { name: 'Dark',      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',                                attribution: '© OpenStreetMap contributors © CARTO' },
}

const TYPE_COLORS = {
  'Gardu Portal': '#1d6fbe',
  'Gardu Cantol': '#d49516',
  'Gardu Beton':  '#2d9c73',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalize  = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
const toNumber   = v => Number(String(v ?? '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0
const findColumn = (keys, names) => keys.find(k => names.includes(normalize(k))) || ''
const grouped    = (rows, key) =>
  Object.entries(
    rows.reduce((acc, row) => { const v = row[key] || 'Tidak diisi'; acc[v] = (acc[v] || 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1])

const paletteColor = i => ['#df6b36', '#436f9e', '#2a9b75', '#975bb1', '#be8a1d'][i % 5]

/** Haversine distance (km) */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Detect a date-like column name */
function detectDateKey(keys) {
  return keys.find(k => /tanggal|date|tgl|bulan|tahun|waktu|time/i.test(k)) || ''
}

/** Build monthly trend data from rows */
function buildTrendData(rows, dateKey) {
  if (!dateKey) return null
  const monthly = {}
  rows.forEach(row => {
    const d = new Date(row[dateKey])
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = (monthly[key] || 0) + 1
  })
  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]))
  return sorted.length >= 2 ? { labels: sorted.map(e => e[0]), data: sorted.map(e => e[1]) } : null
}

// ─── Map marker icon ───────────────────────────────────────────────────────────
function pinIcon(type, active) {
  const color = TYPE_COLORS[type] || '#61758a'
  return L.divIcon({
    className: 'asset-pin-wrapper',
    html: `<span class="asset-pin${active ? ' selected' : ''}" style="--pin:${color}"></span>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  })
}

const geocodeMarkerIcon = L.divIcon({
  className: 'geocode-pin-wrapper',
  html: `<span class="geocode-pin"></span>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
})

// ─── MapController ─────────────────────────────────────────────────────────────
function MapController({ points, geoLayers, selected, zoomSignal }) {
  const map = useMap()

  useEffect(() => {
    const timers = [100, 500, 1200].map(d => setTimeout(() => map.invalidateSize(), d))
    return () => timers.forEach(clearTimeout)
  }, [map])

  useEffect(() => {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
    geoLayers.filter(l => l.visible).forEach(layer => {
      const lb = L.geoJSON(layer.data).getBounds()
      if (lb.isValid()) bounds.extend(lb)
    })
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14 })
  }, [map, points, geoLayers, zoomSignal])

  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], 16, { duration: 0.7 })
  }, [map, selected])

  return null
}

// ─── Geocoder Control ──────────────────────────────────────────────────────────
function GeocoderControl({ onResult }) {
  const map = useMap()
  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const wrapRef = useRef()

  // Close suggestions on outside click
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setSuggestions([]) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Prevent map drag while interacting with geocoder
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const stop = e => e.stopPropagation()
    el.addEventListener('mousedown', stop)
    el.addEventListener('wheel', stop)
    return () => { el.removeEventListener('mousedown', stop); el.removeEventListener('wheel', stop) }
  }, [])

  const search = async e => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setSuggestions(data)
    } catch { /* network error */ }
    setLoading(false)
  }

  const flyTo = item => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    map.flyTo([lat, lng], 15, { duration: 1 })
    onResult({ lat, lng, name: item.display_name })
    setSuggestions([])
    setQuery(item.display_name.split(',')[0])
  }

  return (
    <div className="geocoder-wrap" ref={wrapRef}>
      <form className="geocoder-form" onSubmit={search}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari lokasi di peta…"
          className="geocoder-input"
        />
        <button type="submit" className="geocoder-btn" disabled={loading}>
          {loading ? '…' : '🔍'}
        </button>
      </form>
      {suggestions.length > 0 && (
        <ul className="geocoder-suggestions">
          {suggestions.map(item => (
            <li key={item.place_id} onClick={() => flyTo(item)}>
              {item.display_name.length > 65 ? item.display_name.substring(0, 65) + '…' : item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Measure Control ───────────────────────────────────────────────────────────
function MeasureControl({ active }) {
  const map          = useMap()
  const ptsRef       = useRef([])
  const polyRef      = useRef(null)
  const dotRefs      = useRef([])
  const tooltipRef   = useRef(null)

  // Cleanup when deactivated
  useEffect(() => {
    if (!active) {
      ptsRef.current = []
      if (polyRef.current)    { map.removeLayer(polyRef.current);    polyRef.current = null }
      if (tooltipRef.current) { map.removeLayer(tooltipRef.current); tooltipRef.current = null }
      dotRefs.current.forEach(d => map.removeLayer(d))
      dotRefs.current = []
    }
  }, [active, map])

  useMapEvents({
    click(e) {
      if (!active) return
      const { lat, lng } = e.latlng
      ptsRef.current = [...ptsRef.current, { lat, lng }]
      const pts = ptsRef.current

      // Dot marker
      const dot = L.circleMarker([lat, lng], { radius: 5, color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 1, weight: 2 }).addTo(map)
      dotRefs.current.push(dot)

      if (pts.length >= 2) {
        if (polyRef.current) map.removeLayer(polyRef.current)
        polyRef.current = L.polyline(pts.map(p => [p.lat, p.lng]), { color: '#ff6b35', weight: 2.5, dashArray: '7,5' }).addTo(map)

        let dist = 0
        for (let i = 1; i < pts.length; i++) {
          dist += haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng)
        }
        const label = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(2)} km`

        if (tooltipRef.current) map.removeLayer(tooltipRef.current)
        tooltipRef.current = L.marker([lat, lng], {
          icon: L.divIcon({ className: 'measure-label', html: `<span>${label}</span>`, iconSize: [90, 28], iconAnchor: [45, -8] }),
          interactive: false,
        }).addTo(map)
      }
    },
  })

  return null
}

// ─── Heatmap Overlay ───────────────────────────────────────────────────────────
function HeatmapOverlay({ points }) {
  return (
    <>
      {points.map((p, i) => (
        <Circle
          key={i}
          center={[p.lat, p.lng]}
          radius={350}
          pathOptions={{ color: 'transparent', fillColor: '#e63946', fillOpacity: 0.15, weight: 0 }}
        />
      ))}
    </>
  )
}

// ─── Asset Detail Panel ────────────────────────────────────────────────────────
function AssetDetailPanel({ point, keys, nameKey, typeKey, onClose, onZoom }) {
  const { row, lat, lng } = point
  const typeColor = TYPE_COLORS[row[typeKey]] || '#61758a'

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="dataset-label">DETAIL ASET</div>
          <h3>{row[nameKey] || 'Aset jaringan'}</h3>
        </div>
        <button className="detail-close" onClick={onClose} title="Tutup">✕</button>
      </div>

      <div className="detail-type-badge" style={{ background: typeColor }}>
        {row[typeKey] || 'Tidak diisi'}
      </div>

      <div className="detail-coords">
        <span>📍</span>
        <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
      </div>

      <div className="detail-actions">
        <button className="secondary-button" onClick={onZoom}>🎯 Zoom ke lokasi</button>
      </div>

      <dl className="detail-attrs">
        {keys.map(key =>
          row[key] !== undefined && String(row[key]).trim() !== '' ? (
            <div className="detail-row" key={key}>
              <dt>{key}</dt>
              <dd title={String(row[key])}>{String(row[key])}</dd>
            </div>
          ) : null
        )}
      </dl>
    </aside>
  )
}

// ─── Column Picker Modal ───────────────────────────────────────────────────────
function ColumnPicker({ keys, visible, onChange, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <b>Pilih Kolom Tabel</b>
          <button onClick={onClose} className="detail-close">✕</button>
        </div>
        <div className="modal-body">
          {keys.map(key => (
            <label key={key} className="col-check">
              <input type="checkbox" checked={visible.includes(key)} onChange={() => onChange(key)} />
              <span>{key}</span>
            </label>
          ))}
        </div>
        <div className="modal-footer">
          <button className="secondary-button" onClick={() => onChange('__all__')}>Pilih semua</button>
          <button className="secondary-button" onClick={() => onChange('__none__')}>Kosongkan</button>
          <button className="upload-button" style={{ fontSize: '11px', padding: '8px 14px' }} onClick={onClose}>Terapkan</button>
        </div>
      </div>
    </div>
  )
}

// ─── Export Menu ───────────────────────────────────────────────────────────────
function ExportMenu({ filtered, points }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const act = fn => { fn(); setOpen(false) }

  const exportCsv = () => {
    if (!filtered.length) return
    const url  = URL.createObjectURL(new Blob([Papa.unparse(filtered)], { type: 'text/csv;charset=utf-8;' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: `aset-${new Date().toISOString().slice(0, 10)}.csv` })
    link.click(); URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    if (!filtered.length) return
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Aset')
    XLSX.writeFile(wb, `aset-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportGeoJson = () => {
    if (!points.length) return
    const geojson = {
      type: 'FeatureCollection',
      features: points.map(p => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: p.row })),
    }
    const url  = URL.createObjectURL(new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: `aset-${new Date().toISOString().slice(0, 10)}.geojson` })
    link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="export-menu-wrap" ref={ref}>
      <button className="export-button" onClick={() => setOpen(v => !v)}>
        Ekspor <span className="caret">▾</span>
      </button>
      {open && (
        <div className="export-dropdown">
          <button onClick={() => act(exportCsv)}>📄 CSV (.csv)</button>
          <button onClick={() => act(exportExcel)}>📊 Excel (.xlsx)</button>
          <button onClick={() => act(exportGeoJson)}>🌐 GeoJSON (.geojson)</button>
          <button onClick={() => act(() => window.print())}>🖨️ Cetak / PDF</button>
        </div>
      )}
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  // Core data state
  const [rows, setRows]         = useState([])
  const [fileName, setFileName] = useState('Belum ada dataset')

  // Filter state
  const [query, setQuery] = useState('')
  const [type, setType]   = useState('')
  const [area, setArea]   = useState('')
  const [page, setPage]   = useState(1)
  const [sort, setSort]   = useState({ key: '', direction: 'asc' })

  // Map state
  const [basemap, setBasemap]         = useState('street')
  const [selected, setSelected]       = useState(null)
  const [geoLayers, setGeoLayers]     = useState([])
  const [zoomSignal, setZoomSignal]   = useState(0)
  const [geocodeResult, setGeocodeResult] = useState(null)

  // UI state
  const [message, setMessage]               = useState('')
  const [darkMode, setDarkMode]             = useState(false)
  const [detailOpen, setDetailOpen]         = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [measureActive, setMeasureActive]   = useState(false)
  const [showHeatmap, setShowHeatmap]       = useState(false)
  const [viewMode, setViewMode]             = useState('table')  // 'table' | 'card'
  const [chartTab, setChartTab]             = useState('donut')  // 'donut' | 'bar' | 'trend'
  const [visibleColumns, setVisibleColumns] = useState([])

  const inputRef    = useRef()
  const geoInputRef = useRef()

  // ── Derived column keys ────────────────────────────────────────────────────
  const keys        = useMemo(() => rows.length ? Object.keys(rows[0]) : [], [rows])
  const latKey      = useMemo(() => findColumn(keys, ['latitude', 'lat']), [keys])
  const lngKey      = useMemo(() => findColumn(keys, ['longitude', 'lng', 'lon', 'long']), [keys])
  const typeKey     = useMemo(() => findColumn(keys, ['typegardu', 'line_type', 'feature', 'classification', 'status', 'category', 'kategori']) || keys[0], [keys])
  const nameKey     = useMemo(() => findColumn(keys, ['namagardu', 'descriptiongardu', 'nama', 'namasegmen', 'locationgardu']) || keys[0], [keys])
  const capacityKey = useMemo(() => findColumn(keys, ['kapasitasmaximo', 'kapasitasbaru', 'kapasitas', 'capacity']), [keys])
  const areaKey     = useMemo(() => findColumn(keys, ['ulp', 'wilayah', 'area', 'city', 'kota', 'formattedaddress', 'location', 'locationgardu', 'streetaddress']), [keys])
  const dateKey     = useMemo(() => detectDateKey(keys), [keys])

  // ── Filtered & derived data ────────────────────────────────────────────────
  const areas       = useMemo(() => areaKey ? [...new Set(rows.map(r => String(r[areaKey] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id')) : [], [rows, areaKey])
  const filtered    = useMemo(() => rows.filter(row =>
    (!area  || String(row[areaKey]  || '').trim() === area) &&
    (!type  || row[typeKey]   === type) &&
    (!query || Object.values(row).some(v => String(v ?? '').toLowerCase().includes(query.toLowerCase())))
  ), [rows, area, areaKey, type, typeKey, query])

  const points      = useMemo(() => filtered.map(row => ({ row, lat: toNumber(row[latKey]), lng: toNumber(row[lngKey]) })).filter(p => p.lat && p.lng && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180), [filtered, latKey, lngKey])
  const categories  = useMemo(() => grouped(rows, typeKey), [rows, typeKey])
  const chartEntries = useMemo(() => grouped(filtered, typeKey), [filtered, typeKey])
  const capacity    = filtered.reduce((t, row) => t + toNumber(row[capacityKey]), 0)
  const sortedRows  = useMemo(() => !sort.key ? filtered : [...filtered].sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), 'id', { numeric: true }) * (sort.direction === 'asc' ? 1 : -1)), [filtered, sort])
  const trendData   = useMemo(() => buildTrendData(rows, dateKey), [rows, dateKey])

  // Column visibility
  const displayColumns = useMemo(() =>
    visibleColumns.length ? keys.filter(k => visibleColumns.includes(k)) : keys.slice(0, 8),
    [keys, visibleColumns]
  )
  useEffect(() => setVisibleColumns([]), [keys])

  // Pagination
  const pageSize   = 50
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const pageRows   = sortedRows.slice((page - 1) * pageSize, page * pageSize)

  // ── Handlers ───────────────────────────────────────────────────────────────
  const resetFilters = () => { setQuery(''); setType(''); setArea(''); setPage(1) }
  const toggleSort   = key => { setSort(cur => cur.key === key ? { key, direction: cur.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); setPage(1) }

  const handleColumnToggle = key => {
    if (key === '__all__')  { setVisibleColumns([...keys]); return }
    if (key === '__none__') { setVisibleColumns([]);        return }
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const selectAsset = point => { setSelected(point); setDetailOpen(true) }

  const readFile = useCallback(file => {
    if (!file) return
    const done = data => {
      const clean = data.filter(row => Object.values(row).some(v => String(v ?? '').trim()))
      setRows(clean); setFileName(file.name); resetFilters(); setSelected(null); setDetailOpen(false)
      setMessage(clean.length ? '' : 'Tidak ada baris data yang dapat dibaca.')
    }
    if (/\.csv$/i.test(file.name)) {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => done(r.data), error: () => setMessage('CSV tidak dapat dibaca.') })
    } else {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const book = XLSX.read(e.target.result, { type: 'array' })
          done(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '' }))
        } catch { setMessage('Excel tidak dapat dibaca. Pastikan menggunakan .xlsx atau .xls.') }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  useEffect(() => {
    fetch('/data-gardu.csv')
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => readFile(new File([blob], 'data-gardu.csv', { type: 'text/csv' })))
      .catch(() => setMessage('Dataset contoh tidak dapat dimuat. Pilih file Excel atau CSV.'))
  }, [readFile])

  useEffect(() => { setPage(1) }, [query, type, area])

  const addGeoLayers = files => Array.from(files || []).forEach(file => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        const valid = ['FeatureCollection', 'Feature', 'GeometryCollection', 'LineString', 'MultiLineString', 'Point', 'MultiPoint', 'Polygon', 'MultiPolygon']
        if (!data?.type || !valid.includes(data.type)) throw new Error()
        setGeoLayers(cur => [...cur, { id: `${file.name}-${Date.now()}`, name: file.name.replace(/\.(geo)?json$/i, ''), data, visible: true, color: paletteColor(cur.length), opacity: 0.9 }])
        setMessage('')
      } catch { setMessage(`${file.name} bukan GeoJSON yang valid.`) }
    }
    reader.readAsText(file)
  })

  // Auto dark basemap when dark mode toggles
  useEffect(() => {
    if (darkMode  && basemap === 'street') setBasemap('dark')
    if (!darkMode && basemap === 'dark')   setBasemap('street')
  }, [darkMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart data ─────────────────────────────────────────────────────────────
  const doughnutData = {
    labels:   chartEntries.map(e => e[0]),
    datasets: [{ data: chartEntries.map(e => e[1]), backgroundColor: chartEntries.map(e => TYPE_COLORS[e[0]] || '#6d8fac'), borderWidth: 0, spacing: 3 }],
  }
  const barData = {
    labels:   chartEntries.map(e => e[0]),
    datasets: [{ label: 'Aset', data: chartEntries.map(e => e[1]), backgroundColor: '#1d6fbe', borderRadius: 5, maxBarThickness: 36 }],
  }
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { displayColors: false } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } }, grid: { color: '#e8eef3' } } },
  }
  const lineData = trendData ? {
    labels:   trendData.labels,
    datasets: [{ label: 'Aset', data: trendData.data, borderColor: '#1d6fbe', backgroundColor: 'rgba(29,111,190,0.12)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#1d6fbe' }],
  } : null
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { displayColors: false } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } } },
  }
  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '66%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 9, font: { size: 10 }, padding: 10 } } },
  }

  // ── Map center ─────────────────────────────────────────────────────────────
  const mapCenter = points.length ? [points[0].lat, points[0].lng] : [-1.85, 116.15]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell" data-theme={darkMode ? 'dark' : 'light'}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="brand">
          <b>ϟ</b>
          <div>
            <strong>Network Operations</strong>
            <small>Dashboard aset distribusi</small>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            title={darkMode ? 'Mode terang' : 'Mode gelap'}
            onClick={() => setDarkMode(v => !v)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="upload-button" onClick={() => inputRef.current.click()}>
            Unggah Excel / CSV
          </button>
        </div>
        <input ref={inputRef}    hidden type="file" accept=".xlsx,.xls,.csv"    onChange={e => readFile(e.target.files[0])} />
        <input ref={geoInputRef} hidden type="file" accept=".geojson,.json" multiple onChange={e => addGeoLayers(e.target.files)} />
      </header>

      <div className="workspace">
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="dataset-label">DATASET AKTIF</div>
          <h2>{fileName}</h2>
          <p className="dataset-meta">
            {rows.length ? `${rows.length} baris · ${keys.length} kolom` : 'Pilih Excel atau CSV untuk memulai'}
          </p>

          <button className="drop-box" onClick={() => inputRef.current.click()}>
            <span>⇧</span>
            <div>
              <b>Pilih file data</b>
              <small>Format .xlsx, .xls, atau .csv</small>
            </div>
          </button>

          {/* Filter */}
          <section className="filter-card">
            <div className="card-title">
              <b>Filter data</b>
              <button onClick={resetFilters}>Reset</button>
            </div>
            <label>
              Cari aset
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nama, kode, alamat…" />
            </label>
            {areaKey && (
              <label>
                Wilayah / ULP
                <select value={area} onChange={e => setArea(e.target.value)}>
                  <option value="">Semua wilayah</option>
                  {areas.map(v => <option value={v} key={v}>{v}</option>)}
                </select>
              </label>
            )}
            <label>
              Kategori
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="">Semua kategori</option>
                {categories.map(([v]) => <option value={v} key={v}>{v}</option>)}
              </select>
            </label>
          </section>

          {/* Charts with tabs */}
          <section className="side-chart">
            <div className="chart-tabs">
              <button className={chartTab === 'donut' ? 'active' : ''} onClick={() => setChartTab('donut')}>Komposisi</button>
              <button className={chartTab === 'bar'   ? 'active' : ''} onClick={() => setChartTab('bar')}>Kategori</button>
              {trendData && (
                <button className={chartTab === 'trend' ? 'active' : ''} onClick={() => setChartTab('trend')}>Tren</button>
              )}
            </div>
            <div className="chart-box">
              {!rows.length ? <EmptyChart /> :
               chartTab === 'donut' ? <Doughnut data={doughnutData} options={donutOpts} /> :
               chartTab === 'bar'   ? <Bar data={barData} options={barOpts} /> :
               lineData             ? <Line data={lineData} options={lineOpts} /> :
               <EmptyChart />}
            </div>
          </section>

          {/* Asset type legend */}
          {rows.length > 0 && (
            <section className="type-legend">
              <div className="legend-section-title">Legenda aset</div>
              {chartEntries.slice(0, 7).map(([label, count]) => (
                <div key={label} className="legend-entry">
                  <span className="legend-dot" style={{ background: TYPE_COLORS[label] || '#6d8fac' }} />
                  <span className="legend-name">{label}</span>
                  <span className="legend-count">{count}</span>
                </div>
              ))}
            </section>
          )}
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="main">
          <div className="page-title">
            <div>
              <div className="dataset-label">RINGKASAN OPERASIONAL</div>
              <h1>Jaringan distribusi</h1>
            </div>
            <span className="local-state"><i /> Data lokal</span>
          </div>

          {message && <div className="alert">{message}</div>}

          {/* Stats */}
          <section className="stats">
            <Stat label="Total aset"      value={rows.length}   caption="baris terdeteksi" />
            <Stat label="Hasil filter"    value={filtered.length} caption="aset ditampilkan" dark />
            <Stat label="Titik di peta"   value={points.length} caption={latKey && lngKey ? 'koordinat valid' : 'koordinat tidak ditemukan'} />
            <Stat label="Total kapasitas" value={capacityKey ? capacity.toLocaleString('id-ID') : '—'} caption={capacityKey ? 'berdasarkan data aktif' : 'kolom kapasitas tidak ada'} />
          </section>

          {/* ── Map Panel ──────────────────────────────────────────────────── */}
          <section className="map-panel">
            <div className="map-toolbar">
              <div>
                <div className="dataset-label">SEBARAN ASET</div>
                <h2>Peta operasional</h2>
              </div>
              <div className="map-actions">
                <button
                  className={`secondary-button${measureActive ? ' active-tool' : ''}`}
                  onClick={() => setMeasureActive(v => !v)}
                  title="Ukur jarak antar titik"
                >
                  📐 {measureActive ? 'Hentikan ukur' : 'Ukur jarak'}
                </button>
                <button
                  className={`secondary-button${showHeatmap ? ' active-tool' : ''}`}
                  onClick={() => setShowHeatmap(v => !v)}
                  title="Tampilkan kepadatan aset"
                >
                  🌡️ Heatmap
                </button>
                <button className="secondary-button" onClick={() => geoInputRef.current.click()}>
                  + Layer GIS
                </button>
                <button className="secondary-button" onClick={() => setZoomSignal(v => v + 1)}>
                  Zoom semua
                </button>
                <div className="layer-switcher" aria-label="Pilih basemap">
                  {Object.entries(BASEMAPS).map(([key, layer]) => (
                    <button key={key} className={basemap === key ? 'active' : ''} onClick={() => setBasemap(key)}>
                      {layer.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="map-wrap">
              {points.length || geoLayers.length ? (
                <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="map">
                  <TileLayer key={basemap} url={BASEMAPS[basemap].url} attribution={BASEMAPS[basemap].attribution} />
                  <MapController points={points} geoLayers={geoLayers} selected={selected} zoomSignal={zoomSignal} />
                  <GeocoderControl onResult={setGeocodeResult} />
                  <MeasureControl active={measureActive} />

                  {showHeatmap && <HeatmapOverlay points={points} />}

                  {geocodeResult && (
                    <Marker position={[geocodeResult.lat, geocodeResult.lng]} icon={geocodeMarkerIcon}>
                      <Popup>{geocodeResult.name.substring(0, 80)}</Popup>
                    </Marker>
                  )}

                  {geoLayers.filter(l => l.visible).map(layer => (
                    <GeoJSON
                      key={`${layer.id}-${layer.color}-${layer.opacity}`}
                      data={layer.data}
                      style={{ color: layer.color, weight: 3, opacity: layer.opacity ?? 0.9, fillOpacity: (layer.opacity ?? 0.9) * 0.25 }}
                      onEachFeature={(feature, leafletLayer) => {
                        const attrs = Object.entries(feature.properties || {}).filter(([, v]) => v !== null && v !== '').slice(0, 8)
                        if (attrs.length) leafletLayer.bindPopup(`<strong>${layer.name}</strong><dl>${attrs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`)
                      }}
                    />
                  ))}

                  {points.map(point => (
                    <Marker
                      key={`${point.lat}-${point.lng}-${point.row[nameKey]}`}
                      position={[point.lat, point.lng]}
                      icon={pinIcon(point.row[typeKey], selected?.row === point.row)}
                      eventHandlers={{ click: () => selectAsset(point) }}
                    >
                      <Popup>
                        <strong>{point.row[nameKey] || 'Aset jaringan'}</strong>
                        <dl>
                          {[[typeKey, point.row[typeKey]], [capacityKey, point.row[capacityKey]], ['PENYULANG', point.row.PENYULANG], ['STREETADDRESS', point.row.STREETADDRESS]].filter(([, v]) => v).map(([k, v]) => (
                            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                          ))}
                        </dl>
                        <button className="popup-detail-btn" onClick={() => selectAsset(point)}>
                          Lihat detail lengkap →
                        </button>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="map-empty">
                  <b>Belum ada layer peta</b>
                  <span>Unggah Excel/CSV dengan koordinat atau GeoJSON dari ArcGIS Pro.</span>
                </div>
              )}

              {/* GeoJSON Layer Panel */}
              {geoLayers.length > 0 && (
                <aside className="map-legend">
                  <div className="legend-heading">
                    <b>Layer peta</b>
                    <button onClick={() => setGeoLayers([])}>Hapus semua</button>
                  </div>
                  {geoLayers.map(layer => (
                    <div key={layer.id} className="layer-item">
                      <div className="layer-label">
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={() => setGeoLayers(cur => cur.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l))}
                        />
                        <input
                          type="color"
                          value={layer.color}
                          className="layer-color-picker"
                          title="Ubah warna layer"
                          onChange={e => setGeoLayers(cur => cur.map(l => l.id === layer.id ? { ...l, color: e.target.value } : l))}
                        />
                        <span className="layer-name">{layer.name}</span>
                      </div>
                      <div className="opacity-row">
                        <span>Opacity</span>
                        <input
                          type="range" min="0.1" max="1" step="0.1"
                          value={layer.opacity ?? 0.9}
                          className="opacity-slider"
                          onChange={e => setGeoLayers(cur => cur.map(l => l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l))}
                        />
                        <span className="opacity-val">{Math.round((layer.opacity ?? 0.9) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </aside>
              )}

              {/* Measure active hint */}
              {measureActive && (
                <div className="measure-hint">
                  📐 Mode ukur aktif — klik titik-titik di peta untuk menghitung jarak.
                  <button onClick={() => setMeasureActive(false)}>✕ Selesai</button>
                </div>
              )}
            </div>
          </section>

          {/* ── Table / Card Panel ─────────────────────────────────────────── */}
          <section className="table-panel">
            <div className="table-title">
              <div>
                <div className="dataset-label">RINCIAN</div>
                <h2>Daftar aset</h2>
              </div>
              <div className="table-tools">
                <div className="view-mode-toggle">
                  <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>☰ Tabel</button>
                  <button className={viewMode === 'card'  ? 'active' : ''} onClick={() => setViewMode('card')}>⊞ Kartu</button>
                </div>
                <span className="row-count">{filtered.length} baris</span>
                <button className="secondary-button" onClick={() => setShowColumnPicker(true)} title="Pilih kolom yang tampil">
                  ⚙ Kolom
                </button>
                <ExportMenu filtered={filtered} points={points} />
              </div>
            </div>

            {viewMode === 'table' ? (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {displayColumns.map(key => (
                          <th key={key}>
                            <button className="sort-button" onClick={() => toggleSort(key)}>
                              {key}{sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, idx) => (
                        <tr
                          key={`${page}-${idx}`}
                          className={selected?.row === row ? 'selected-row' : ''}
                          onClick={() => { const lat = toNumber(row[latKey]), lng = toNumber(row[lngKey]); if (lat && lng) selectAsset({ row, lat, lng }) }}
                        >
                          {displayColumns.map(key => <td key={key} title={row[key]}>{row[key]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered.length && <p className="no-data">Tidak ada data sesuai filter.</p>}
                </div>
                {filtered.length > pageSize && (
                  <div className="pagination">
                    <span>Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length}</span>
                    <div>
                      <button disabled={page === 1}          onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
                      <b>Halaman {page} / {totalPages}</b>
                      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="card-grid">
                  {pageRows.map((row, idx) => (
                    <article
                      key={`card-${page}-${idx}`}
                      className={`asset-card${selected?.row === row ? ' selected-card' : ''}`}
                      onClick={() => { const lat = toNumber(row[latKey]), lng = toNumber(row[lngKey]); if (lat && lng) selectAsset({ row, lat, lng }) }}
                    >
                      <div className="asset-card-type" style={{ background: TYPE_COLORS[row[typeKey]] || '#61758a' }}>
                        {row[typeKey] || 'Tidak diisi'}
                      </div>
                      <h4 className="asset-card-name">{row[nameKey] || 'Aset jaringan'}</h4>
                      <dl className="asset-card-attrs">
                        {displayColumns.slice(0, 5).filter(k => row[k]).map(key => (
                          <div key={key}><dt>{key}</dt><dd>{String(row[key])}</dd></div>
                        ))}
                      </dl>
                    </article>
                  ))}
                  {!filtered.length && <p className="no-data">Tidak ada data sesuai filter.</p>}
                </div>
                {filtered.length > pageSize && (
                  <div className="pagination">
                    <span>Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length}</span>
                    <div>
                      <button disabled={page === 1}          onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
                      <b>Halaman {page} / {totalPages}</b>
                      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* ── Asset Detail Panel (slide-in) ─────────────────────────────────── */}
        {detailOpen && selected && (
          <AssetDetailPanel
            point={selected}
            keys={keys}
            nameKey={nameKey}
            typeKey={typeKey}
            onClose={() => setDetailOpen(false)}
            onZoom={() => { setZoomSignal(v => v + 1) }}
          />
        )}
      </div>

      {/* ── Column Picker Modal ──────────────────────────────────────────────── */}
      {showColumnPicker && (
        <ColumnPicker
          keys={keys}
          visible={visibleColumns.length ? visibleColumns : keys.slice(0, 8)}
          onChange={handleColumnToggle}
          onClose={() => setShowColumnPicker(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Stat({ label, value, caption, dark }) {
  return (
    <article className={`stat${dark ? ' stat-dark' : ''}`}>
      <span>{label}</span>
      <b>{Number.isFinite(value) ? value.toLocaleString('id-ID') : value}</b>
      <small>{caption}</small>
    </article>
  )
}

function EmptyChart() {
  return <div className="empty-chart">Menunggu data</div>
}
