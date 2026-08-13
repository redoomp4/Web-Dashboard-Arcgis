import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const BASEMAPS = {
  street: { name: 'Street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors' },
  light: { name: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap contributors © CARTO' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles © Esri' },
}
const TYPE_COLORS = { 'Gardu Portal': '#1d6fbe', 'Gardu Cantol': '#d49516', 'Gardu Beton': '#2d9c73' }
const normal = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
const number = v => Number(String(v ?? '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0
const findColumn = (keys, names) => keys.find(key => names.includes(normal(key))) || ''
const grouped = (rows, key) => Object.entries(rows.reduce((out, row) => { const value = row[key] || 'Tidak diisi'; out[value] = (out[value] || 0) + 1; return out }, {})).sort((a, b) => b[1] - a[1])

function MapController({ points, geoLayers, selected, zoomSignal }) {
  const map = useMap()
  useEffect(() => { const timers = [100, 500, 1200].map(delay => setTimeout(() => map.invalidateSize(), delay)); return () => timers.forEach(clearTimeout) }, [map])
  useEffect(() => { const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng])); geoLayers.filter(layer => layer.visible).forEach(layer => { const layerBounds = L.geoJSON(layer.data).getBounds(); if (layerBounds.isValid()) bounds.extend(layerBounds) }); if (bounds.isValid()) map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14 }) }, [map, points, geoLayers, zoomSignal])
  useEffect(() => { if (selected) map.flyTo([selected.lat, selected.lng], 16, { duration: .7 }) }, [map, selected])
  return null
}
function pinIcon(type, active) { const color = TYPE_COLORS[type] || '#61758a'; return L.divIcon({ className: 'asset-pin-wrapper', html: `<span class="asset-pin${active ? ' selected' : ''}" style="--pin:${color}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }) }

export default function App() {
const [rows, setRows] = useState([]), [fileName, setFileName] = useState('Belum ada dataset')
  const [query, setQuery] = useState(''), [type, setType] = useState(''), [area, setArea] = useState(''), [basemap, setBasemap] = useState('street'), [selected, setSelected] = useState(null), [message, setMessage] = useState(''), [geoLayers, setGeoLayers] = useState([]), [zoomSignal, setZoomSignal] = useState(0)
  const inputRef = useRef(), geoInputRef = useRef()
  const keys = useMemo(() => rows.length ? Object.keys(rows[0]) : [], [rows])
  const latKey = useMemo(() => findColumn(keys, ['latitude', 'lat']), [keys])
  const lngKey = useMemo(() => findColumn(keys, ['longitude', 'lng', 'lon', 'long']), [keys])
  const typeKey = useMemo(() => findColumn(keys, ['typegardu', 'line_type', 'feature', 'classification', 'status', 'category', 'kategori']) || keys[0], [keys])
  const nameKey = useMemo(() => findColumn(keys, ['namagardu', 'descriptiongardu', 'nama', 'namasegmen', 'locationgardu']) || keys[0], [keys])
  const capacityKey = useMemo(() => findColumn(keys, ['kapasitasmaximo', 'kapasitasbaru', 'kapasitas', 'capacity']), [keys])
  const areaKey = useMemo(() => findColumn(keys, ['ulp', 'wilayah', 'area', 'city', 'kota', 'formattedaddress', 'location', 'locationgardu', 'streetaddress']), [keys])
  const filtered = useMemo(() => rows.filter(row => (!type || row[typeKey] === type) && (!query || Object.values(row).some(v => String(v ?? '').toLowerCase().includes(query.toLowerCase())))), [rows, type, typeKey, query])
  const points = useMemo(() => filtered.map(row => ({ row, lat: number(row[latKey]), lng: number(row[lngKey]) })).filter(p => p.lat && p.lng && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180), [filtered, latKey, lngKey])
  const categories = useMemo(() => grouped(rows, typeKey), [rows, typeKey])
  const chartEntries = useMemo(() => grouped(filtered, typeKey), [filtered, typeKey])
  const capacity = filtered.reduce((total, row) => total + number(row[capacityKey]), 0)
  const readFile = useCallback(file => {
    if (!file) return
    const done = data => { const clean = data.filter(row => Object.values(row).some(value => String(value ?? '').trim())); setRows(clean); setFileName(file.name); setQuery(''); setType(''); setArea(''); setSelected(null); setMessage(clean.length ? '' : 'Tidak ada baris data yang dapat dibaca.') }
    if (/\.csv$/i.test(file.name)) Papa.parse(file, { header: true, skipEmptyLines: true, complete: result => done(result.data), error: () => setMessage('CSV tidak dapat dibaca.') })
    else { const reader = new FileReader(); reader.onload = event => { try { const book = XLSX.read(event.target.result, { type: 'array' }); done(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '' })) } catch { setMessage('Excel tidak dapat dibaca. Pastikan menggunakan .xlsx atau .xls.') } }; reader.readAsArrayBuffer(file) }
  }, [])
  useEffect(() => {
    fetch('/data-gardu.csv')
      .then(response => response.ok ? response.blob() : Promise.reject())
      .then(blob => readFile(new File([blob], 'data-gardu.csv', { type: 'text/csv' })))
      .catch(() => setMessage('Dataset contoh tidak dapat dimuat. Pilih file Excel atau CSV.'))
  }, [readFile])
  const addGeoLayers = files => Array.from(files || []).forEach(file => { const reader = new FileReader(); reader.onload = event => { try { const data = JSON.parse(event.target.result); if (!data?.type || !['FeatureCollection', 'Feature', 'GeometryCollection', 'LineString', 'MultiLineString', 'Point', 'MultiPoint', 'Polygon', 'MultiPolygon'].includes(data.type)) throw new Error(); setGeoLayers(current => [...current, { id: `${file.name}-${Date.now()}-${Math.random()}`, name: file.name.replace(/\.(geo)?json$/i, ''), data, visible: true, color: paletteColor(current.length) }]); setMessage('') } catch { setMessage(`${file.name} bukan GeoJSON yang valid.`) } }; reader.readAsText(file) })
  const exportCsv = () => { if (!filtered.length) return; const url = URL.createObjectURL(new Blob([Papa.unparse(filtered)], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = `aset-terfilter-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url) }
  const doughnut = { labels: chartEntries.map(e => e[0]), datasets: [{ data: chartEntries.map(e => e[1]), backgroundColor: chartEntries.map(e => TYPE_COLORS[e[0]] || '#6d8fac'), borderWidth: 0, spacing: 3 }] }
  const bars = { labels: chartEntries.map(e => e[0]), datasets: [{ label: 'Aset', data: chartEntries.map(e => e[1]), backgroundColor: '#1d6fbe', borderRadius: 5, maxBarThickness: 38 }] }
  const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } }, grid: { color: '#e8eef3' } } } }
  return <div className="app-shell">
    <header className="app-header"><div className="brand"><b>ϟ</b><div><strong>Network Operations</strong><small>Dashboard aset distribusi</small></div></div><button className="upload-button" onClick={() => inputRef.current.click()}>Unggah Excel / CSV</button><input ref={inputRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => readFile(e.target.files[0])} /><input ref={geoInputRef} hidden multiple type="file" accept=".geojson,.json" onChange={e => addGeoLayers(e.target.files)} /></header>
    <div className="workspace">
      <aside className="sidebar"><div className="dataset-label">DATASET AKTIF</div><h2>{fileName}</h2><p className="dataset-meta">{rows.length ? `${rows.length} baris · ${keys.length} kolom` : 'Pilih Excel atau CSV untuk memulai'}</p>
        <button className="drop-box" onClick={() => inputRef.current.click()}><span>⇧</span><div><b>Pilih file data</b><small>Format .xlsx, .xls, atau .csv</small></div></button>
        <section className="filter-card"><div className="card-title"><b>Filter data</b><button onClick={() => { setQuery(''); setType('') }}>Reset</button></div><label>Cari aset<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nama, kode, alamat…" /></label><label>Kategori<select value={type} onChange={e => setType(e.target.value)}><option value="">Semua kategori</option>{categories.map(([value]) => <option value={value} key={value}>{value}</option>)}</select></label></section>
        <section className="side-chart"><h3>Komposisi aset</h3><div className="chart-box">{rows.length ? <Doughnut data={doughnut} options={{ responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 9, font: { size: 10 }, padding: 10 } } } }} /> : <EmptyChart />}</div></section>
        <section className="side-chart"><h3>Jumlah per kategori</h3><div className="chart-box">{rows.length ? <Bar data={bars} options={barOptions} /> : <EmptyChart />}</div></section>
      </aside>
      <main className="main"><div className="page-title"><div><div className="dataset-label">RINGKASAN OPERASIONAL</div><h1>Jaringan distribusi</h1></div><span className="local-state"><i /> Data lokal</span></div>
        {message && <div className="alert">{message}</div>}
        <section className="stats"><Stat label="Total aset" value={rows.length} caption="baris terdeteksi" /><Stat dark label="Hasil filter" value={filtered.length} caption="aset ditampilkan" /><Stat label="Titik di peta" value={points.length} caption={latKey && lngKey ? 'koordinat valid' : 'koordinat tidak ditemukan'} /><Stat label="Total kapasitas" value={capacityKey ? capacity.toLocaleString('id-ID') : '—'} caption={capacityKey ? 'berdasarkan data aktif' : 'kolom kapasitas tidak ada'} /></section>
        <section className="map-panel"><div className="map-toolbar"><div><div className="dataset-label">SEBARAN ASET</div><h2>Peta operasional</h2></div><div className="map-actions"><button className="secondary-button" onClick={() => geoInputRef.current.click()}>+ Tambah layer GIS</button><button className="secondary-button" onClick={() => setZoomSignal(value => value + 1)}>Zoom semua</button><div className="layer-switcher" aria-label="Pilih basemap">{Object.entries(BASEMAPS).map(([key, layer]) => <button className={basemap === key ? 'active' : ''} onClick={() => setBasemap(key)} key={key}>{layer.name}</button>)}</div></div></div>
          <div className="map-wrap">{points.length || geoLayers.length ? <MapContainer center={points.length ? [points[0].lat, points[0].lng] : [-1.85, 116.15]} zoom={12} scrollWheelZoom className="map"><TileLayer key={basemap} url={BASEMAPS[basemap].url} attribution={BASEMAPS[basemap].attribution} /><MapController points={points} geoLayers={geoLayers} selected={selected} zoomSignal={zoomSignal} />{geoLayers.filter(layer => layer.visible).map(layer => <GeoJSON key={layer.id} data={layer.data} style={{ color: layer.color, weight: 3, opacity: .9 }} onEachFeature={(feature, leafletLayer) => { const attributes = Object.entries(feature.properties || {}).filter(([, value]) => value !== null && value !== '').slice(0, 8); if (attributes.length) leafletLayer.bindPopup(`<strong>${layer.name}</strong><dl>${attributes.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>`) }} />)}{points.map(point => <Marker key={`${point.lat}-${point.lng}-${point.row[nameKey]}`} position={[point.lat, point.lng]} icon={pinIcon(point.row[typeKey], selected?.row === point.row)} eventHandlers={{ click: () => setSelected(point) }}><Popup><strong>{point.row[nameKey] || 'Aset jaringan'}</strong><dl>{[[typeKey, point.row[typeKey]], [capacityKey, point.row[capacityKey]], ['PENYULANG', point.row.PENYULANG], ['STREETADDRESS', point.row.STREETADDRESS]].filter(([,v]) => v).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></Popup></Marker>)}</MapContainer> : <div className="map-empty"><b>Belum ada layer peta</b><span>Unggah Excel/CSV dengan koordinat atau GeoJSON dari ArcGIS Pro.</span></div>}{geoLayers.length > 0 && <aside className="map-legend"><div className="legend-heading"><b>Layer peta</b><button onClick={() => setGeoLayers([])}>Hapus semua</button></div>{geoLayers.map(layer => <label key={layer.id}><input type="checkbox" checked={layer.visible} onChange={() => setGeoLayers(current => current.map(item => item.id === layer.id ? { ...item, visible: !item.visible } : item))} /><i style={{ background: layer.color }} />{layer.name}</label>)}</aside>}</div>
        </section>
        <section className="table-panel"><div className="table-title"><div><div className="dataset-label">RINCIAN</div><h2>Daftar aset</h2></div><div className="table-tools"><span>{filtered.length} baris</span><button className="export-button" onClick={exportCsv}>Ekspor CSV</button></div></div><div className="table-wrap"><table><thead><tr>{keys.slice(0, 8).map(key => <th key={key}>{key}</th>)}</tr></thead><tbody>{filtered.slice(0, 100).map((row, index) => <tr key={index} onClick={() => { const lat = number(row[latKey]), lng = number(row[lngKey]); if (lat && lng) setSelected({ row, lat, lng }) }} className={selected?.row === row ? 'selected-row' : ''}>{keys.slice(0, 8).map(key => <td title={row[key]} key={key}>{row[key]}</td>)}</tr>)}</tbody></table>{!filtered.length && <p className="no-data">Tidak ada data sesuai filter.</p>}</div></section>
      </main>
    </div>
  </div>
}
function Stat({ label, value, caption, dark }) { return <article className={`stat ${dark ? 'stat-dark' : ''}`}><span>{label}</span><b>{Number.isFinite(value) ? value.toLocaleString('id-ID') : value}</b><small>{caption}</small></article> }
function EmptyChart() { return <div className="empty-chart">Menunggu data</div> }
function paletteColor(index) { return ['#df6b36', '#436f9e', '#2a9b75', '#975bb1', '#be8a1d'][index % 5] }
