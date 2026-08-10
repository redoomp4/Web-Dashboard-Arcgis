# Web Dashboard ArcGIS

Dashboard aset distribusi PLN berbasis React, Leaflet, Chart.js, dan pembaca Excel/CSV.

## Menjalankan aplikasi

```powershell
cd react-dashboard
npm.cmd install
npm.cmd run dev
```

Buka alamat lokal yang dicetak Vite (umumnya `http://localhost:5173`).

## Input data

- Excel/CSV: gunakan kolom `LATITUDE`, `LONGITUDE`, nama aset, kategori, dan kapasitas.
- GeoJSON: ekspor layer dari ArcGIS Pro ke `EPSG:4326`, lalu unggah melalui **Tambah layer GIS**.

Folder ArcGIS Pro dan data mentah tidak disimpan di repository. Gunakan hasil ekspor GeoJSON untuk layer jaringan.
