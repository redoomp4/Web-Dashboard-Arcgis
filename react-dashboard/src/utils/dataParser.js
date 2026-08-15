import { PASER_REGION_BOUNDS } from '../constants/config';

export const normalize = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const toNumber = v => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const cleaned = String(v)
    .trim()
    .replace(/\.(?=\d{3}(\D|$))/g, '') // remove thousand separator dots
    .replace(',', '.'); // replace decimal comma
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

export const findColumn = (keys, names) => {
  if (!keys || !keys.length) return '';
  return keys.find(k => names.includes(normalize(k))) || '';
};

export const detectColumnMappings = keys => {
  if (!keys || !keys.length) return {};
  return {
    latKey: findColumn(keys, ['latitude', 'lat', 'y', 'lintang', 'latitude_y']),
    lngKey: findColumn(keys, ['longitude', 'lng', 'lon', 'long', 'x', 'bujur', 'longitude_x']),
    nameKey:
      findColumn(keys, [
        'namagardu',
        'namatransformator',
        'descriptiongardu',
        'nama',
        'namasegmen',
        'assetname',
        'kode_gardu',
        'locationgardu'
      ]) || keys[0],
    typeKey:
      findColumn(keys, [
        'typegardu',
        'tipegardu',
        'jenisgardu',
        'line_type',
        'feature',
        'classification',
        'status',
        'category',
        'kategori',
        'tipe'
      ]) || keys[0],
    capacityKey: findColumn(keys, [
      'kapasitasmaximo',
      'kapasitasbaru',
      'kapasitas',
      'capacity',
      'daya',
      'dayatransformator',
      'kva'
    ]),
    areaKey: findColumn(keys, [
      'ulp',
      'wilayah',
      'area',
      'city',
      'kota',
      'kecamatan',
      'kabupaten',
      'unit',
      'formattedaddress',
      'location',
      'locationgardu',
      'streetaddress'
    ]),
    feederKey: findColumn(keys, ['penyulang', 'feeder', 'penyulangutama', 'namafeeder', 'trafo']),
    dateKey: findColumn(keys, [
      'tanggal',
      'date',
      'tgl_pasang',
      'tgl',
      'created_at',
      'tahun',
      'waktu',
      'time'
    ])
  };
};

/**
 * Scan dataset for GIS & operational anomalies
 */
export function scanGISDataQuality(rows, mappings) {
  const { latKey, lngKey, nameKey, capacityKey, feederKey } = mappings;
  const anomalies = {
    missingCoords: [],
    zeroCoords: [],
    outOfRegionBounds: [],
    duplicateNames: [],
    missingCapacity: [],
    missingFeeder: []
  };

  const nameMap = new Map();

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const name = String(row[nameKey] || `Row #${rowNum}`).trim();
    const lat = toNumber(row[latKey]);
    const lng = toNumber(row[lngKey]);
    const capacity = capacityKey ? toNumber(row[capacityKey]) : null;
    const feeder = feederKey ? String(row[feederKey] || '').trim() : null;

    // Check Coords
    if (!lat || !lng) {
      anomalies.missingCoords.push({ rowNum, name, row, reason: 'Koordinat kosong atau tidak valid' });
    } else if (lat === 0 && lng === 0) {
      anomalies.zeroCoords.push({ rowNum, name, row, reason: 'Koordinat berada di titik (0, 0)' });
    } else if (
      lat < PASER_REGION_BOUNDS.minLat ||
      lat > PASER_REGION_BOUNDS.maxLat ||
      lng < PASER_REGION_BOUNDS.minLng ||
      lng > PASER_REGION_BOUNDS.maxLng
    ) {
      anomalies.outOfRegionBounds.push({
        rowNum,
        name,
        lat,
        lng,
        row,
        reason: `Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)}) di luar batas wilayah Paser/Kaltim`
      });
    }

    // Check Duplicate Names
    if (name) {
      if (nameMap.has(name)) {
        anomalies.duplicateNames.push({
          rowNum,
          name,
          firstOccurrence: nameMap.get(name),
          row,
          reason: `Nama aset "${name}" terduplikasi (sama dengan baris ${nameMap.get(name)})`
        });
      } else {
        nameMap.set(name, rowNum);
      }
    }

    // Check Missing Capacity
    if (capacityKey && (!capacity || capacity === 0)) {
      anomalies.missingCapacity.push({ rowNum, name, row, reason: 'Kapasitas (kVA) belum diisi / 0' });
    }

    // Check Missing Feeder
    if (feederKey && !feeder) {
      anomalies.missingFeeder.push({ rowNum, name, row, reason: 'Kolom Penyulang tidak terisi' });
    }
  });

  const totalIssues =
    anomalies.missingCoords.length +
    anomalies.zeroCoords.length +
    anomalies.outOfRegionBounds.length +
    anomalies.duplicateNames.length +
    anomalies.missingCapacity.length +
    anomalies.missingFeeder.length;

  const qualityScore = rows.length > 0
    ? Math.max(0, Math.round(((rows.length * 4 - totalIssues) / (rows.length * 4)) * 100))
    : 100;

  return {
    anomalies,
    totalIssues,
    qualityScore,
    totalRowsScanned: rows.length
  };
}
