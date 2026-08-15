import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function exportToCSV(data, filename = 'pln-network-assets.csv') {
  if (!data || !data.length) return false;
  const csv = Papa.unparse(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportToExcel(data, summaryData = {}, filename = 'pln-network-assets.xlsx') {
  if (!data || !data.length) return false;
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Main Data
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Aset');

  // Sheet 2: Summary Info if provided
  if (Object.keys(summaryData).length > 0) {
    const summaryRows = [
      { Metrik: 'Waktu Ekspor', Nilai: new Date().toLocaleString('id-ID') },
      { Metrik: 'Total Baris Terfilter', Nilai: data.length },
      ...Object.entries(summaryData).map(([k, v]) => ({ Metrik: k, Nilai: v }))
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Laporan');
  }

  XLSX.writeFile(workbook, filename);
  return true;
}

export function exportToGeoJSON(points, filename = 'pln-network-assets.geojson') {
  if (!points || !points.length) return false;
  const featureCollection = {
    type: 'FeatureCollection',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    },
    features: points.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat]
      },
      properties: p.row
    }))
  };

  const jsonStr = JSON.stringify(featureCollection, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/geo+json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
