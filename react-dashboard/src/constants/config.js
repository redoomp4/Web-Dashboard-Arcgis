export const BASEMAPS = {
  street: {
    id: 'street',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    thumbnail: '🗺️'
  },
  light: {
    id: 'light',
    name: 'Carto Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    thumbnail: '⚪'
  },
  dark: {
    id: 'dark',
    name: 'Carto Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    thumbnail: '⚫'
  },
  satellite: {
    id: 'satellite',
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri, Maxar, Earthstar Geographics',
    thumbnail: '🛰️'
  },
  topo: {
    id: 'topo',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    thumbnail: '⛰️'
  }
}

export const TYPE_COLORS = {
  'Gardu Portal': '#0284c7', // Cyan Blue
  'Gardu Cantol': '#f59e0b', // Amber
  'Gardu Beton': '#10b981',  // Emerald
  'Gardu Kios': '#8b5cf6',   // Purple
  'Gardu Bergerak': '#ec4899', // Pink
  'Gardu Hubung': '#ef4444',  // Red
  'Trafo Tiang': '#3b82f6',
  'Saluran Udara': '#14b8a6',
  'Saluran Kabel': '#6366f1',
  'Tidak diisi': '#64748b'
}

export const PASER_REGION_BOUNDS = {
  minLat: -2.5,
  maxLat: -1.2,
  minLng: 115.5,
  maxLng: 116.8
}

export const REGIONAL_BOOKMARKS = [
  { id: 'grogot', name: 'Tanah Grogot (Pusat)', lat: -1.868, lng: 116.142, zoom: 14 },
  { id: 'kuaro', name: 'Kec. Kuaro', lat: -1.789, lng: 116.036, zoom: 13 },
  { id: 'belengkong', name: 'Paser Belengkong', lat: -1.932, lng: 116.183, zoom: 13 },
  { id: 'longikis', name: 'Kec. Long Ikis', lat: -1.545, lng: 116.168, zoom: 13 },
  { id: 'batukajang', name: 'Batu Kajang (Batu Sopang)', lat: -1.835, lng: 115.895, zoom: 13 },
  { id: 'muarasamu', name: 'Kec. Muara Samu', lat: -2.052, lng: 115.823, zoom: 12 },
  { id: 'up3_all', name: 'Seluruh Wilayah UP3 Grogot', lat: -1.85, lng: 116.15, zoom: 10 }
]

export const CAPACITY_TIERS = [
  { label: '< 50 kVA', min: 0, max: 49 },
  { label: '50 - 100 kVA', min: 50, max: 100 },
  { label: '160 - 200 kVA', min: 101, max: 200 },
  { label: '250 - 315 kVA', min: 201, max: 315 },
  { label: '> 400 kVA', min: 316, max: 999999 }
]
