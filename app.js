/* Dashboard data lokal: CSV diproses PapaParse, Excel diproses SheetJS. */
const DEFAULT_FILES = ['data.xlsx', 'data.csv', 'Olah_master - Sheet2.csv', 'Olah_master - Sheet1.csv'];
const state = { rows: [], filtered: [], fileName: '', categoryKey: '', latKey: '', lngKey: '', charts: {} };
const el = id => document.getElementById(id);
const map = L.map('map', { zoomControl: true }).setView([-1.5, 117], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const markers = L.layerGroup().addTo(map);

function norm(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }
function locateColumn(keys, names) { return keys.find(key => names.includes(norm(key))) || ''; }
function parseNumber(value) { const text = String(value ?? '').replace(/<null>|null/gi, '').trim(); if (!text) return NaN; return Number(text.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); }
function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char])); }
function getKeys() { return state.rows.length ? Object.keys(state.rows[0]) : []; }
function categoryCandidates(keys) { return ['line_type','feature','classification','status','penyulang','kategori','category','jenis'].map(n => locateColumn(keys, [n])).filter(Boolean); }

function processRows(rows, fileName) {
  state.rows = rows.filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));
  state.fileName = fileName;
  const keys = getKeys();
  state.latKey = locateColumn(keys, ['latitude','lat','y','latitute']);
  state.lngKey = locateColumn(keys, ['longitude','lng','lon','long','x']);
  state.categoryKey = categoryCandidates(keys)[0] || keys[0] || '';
  el('datasetName').textContent = fileName;
  el('datasetInfo').textContent = `${state.rows.length.toLocaleString('id-ID')} baris • ${keys.length} kolom`;
  const select = el('categoryFilter'); select.innerHTML = '<option value="">Semua kategori</option>';
  [...new Set(state.rows.map(r => r[state.categoryKey]).filter(v => v !== undefined && v !== ''))].sort().forEach(value => select.add(new Option(value, value)));
  renderTableHead(keys); applyFilters();
}

function applyFilters() {
  const query = el('searchInput').value.trim().toLowerCase(), category = el('categoryFilter').value;
  state.filtered = state.rows.filter(row => (!category || String(row[state.categoryKey]) === category) && (!query || Object.values(row).some(value => String(value ?? '').toLowerCase().includes(query))));
  el('totalCount').textContent = state.rows.length.toLocaleString('id-ID'); el('visibleCount').textContent = state.filtered.length.toLocaleString('id-ID'); el('rowLabel').textContent = `${state.filtered.length} baris`;
  renderMap(); renderCharts(); renderTable();
}
function renderMap() {
  markers.clearLayers(); const hasCoordinates = state.latKey && state.lngKey;
  const points = hasCoordinates ? state.filtered.map(r => ({ r, lat: parseNumber(r[state.latKey]), lng: parseNumber(r[state.lngKey]) })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) : [];
  el('locationCount').textContent = points.length.toLocaleString('id-ID');
  el('locationCaption').textContent = hasCoordinates ? 'marker sesuai filter' : 'kolom koordinat tidak ditemukan';
  const notice = el('mapNotice'); notice.hidden = points.length > 0;
  notice.textContent = hasCoordinates ? 'Tidak ada titik koordinat yang cocok dengan filter saat ini.' : 'Dataset ini belum memuat kolom Latitude dan Longitude. Unggah file dengan kolom tersebut untuk menampilkan marker.';
  points.forEach(({r, lat, lng}) => { const details = Object.entries(r).filter(([,v]) => String(v ?? '').trim()).slice(0, 10).map(([k,v]) => `<tr><th>${safeText(k)}</th><td>${safeText(v)}</td></tr>`).join(''); L.marker([lat, lng]).bindPopup(`<div class="popup"><strong>${safeText(r['NAMA SEGMEN'] || r['Nama'] || 'Detail lokasi')}</strong><table>${details}</table></div>`).addTo(markers); });
  if (points.length) { const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng])); map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 }); }
}
function tally(rows, key) { const counts = {}; rows.forEach(r => { const value = String(r[key] ?? 'Tidak diisi').trim() || 'Tidak diisi'; counts[value] = (counts[value] || 0) + 1; }); return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 8); }
function makeChart(id, type, entries, color) { state.charts[id]?.destroy(); state.charts[id] = new Chart(el(id), { type, data: { labels: entries.map(e => e[0]), datasets: [{ data: entries.map(e => e[1]), backgroundColor: type === 'doughnut' ? ['#1677c9','#ffd548','#56b6a5','#f38b66','#8b7ade','#7eb7e8','#d47ca4','#94a5b5'] : color, borderRadius: 6, borderWidth: 0 }] }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:type === 'doughnut', position:'bottom', labels:{boxWidth:9, font:{size:10}} } }, scales: type === 'bar' ? { x:{grid:{display:false},ticks:{font:{size:10},maxRotation:40}}, y:{beginAtZero:true,ticks:{precision:0,font:{size:10}}} } : {} } }); }
function renderCharts() { const keys = getKeys(); makeChart('categoryChart', 'doughnut', tally(state.filtered, state.categoryKey), '#1677c9'); const feederKey = locateColumn(keys, ['penyulang','nama_feeder','feeder','kode_penyulang']) || state.categoryKey; makeChart('feederChart', 'bar', tally(state.filtered, feederKey), '#1677c9'); }
function renderTableHead(keys) { el('tableHead').innerHTML = `<tr>${keys.slice(0, 7).map(key => `<th title="${safeText(key)}">${safeText(key)}</th>`).join('')}</tr>`; }
function renderTable() { const keys = getKeys().slice(0, 7); const body = el('tableBody'); body.innerHTML = state.filtered.slice(0, 100).map(row => `<tr>${keys.map(key => `<td title="${safeText(row[key])}">${safeText(row[key])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${Math.max(keys.length,1)}" class="empty-cell">Tidak ada data yang sesuai filter.</td></tr>`; }
function loadFile(file) { if (!file) return; const name = file.name; if (/\.csv$/i.test(name)) Papa.parse(file, { header:true, skipEmptyLines:true, complete: result => processRows(result.data, name), error: () => alert('CSV tidak dapat dibaca.') }); else { const reader = new FileReader(); reader.onload = event => { try { const workbook = XLSX.read(event.target.result, { type:'array' }); processRows(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval:'' }), name); } catch { alert('Excel tidak dapat dibaca.'); } }; reader.readAsArrayBuffer(file); } }
async function loadDefault() { for (const file of DEFAULT_FILES) { try { const response = await fetch(encodeURIComponent(file)); if (!response.ok) continue; const blob = await response.blob(); loadFile(new File([blob], file)); return; } catch {} } el('datasetName').textContent = 'Belum ada data'; el('datasetInfo').textContent = 'Unggah berkas Excel atau CSV untuk memulai'; applyFilters(); }
el('fileInput').addEventListener('change', event => loadFile(event.target.files[0])); el('searchInput').addEventListener('input', applyFilters); el('categoryFilter').addEventListener('change', applyFilters); el('resetFilters').addEventListener('click', () => { el('searchInput').value=''; el('categoryFilter').value=''; applyFilters(); });
loadDefault();
