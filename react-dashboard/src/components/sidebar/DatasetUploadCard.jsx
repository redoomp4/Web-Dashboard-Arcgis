import { Icon } from '../common/Icons';

export function DatasetUploadCard({ fileName, rowsCount, keysCount, onUploadClick }) {
  return (
    <div className="dataset-card">
      <div className="sidebar-section-title">
        <Icon name="database" size={13} />
        <span>DATASET AKTIF</span>
      </div>
      <h2 className="dataset-filename" title={fileName}>{fileName}</h2>
      <p className="dataset-meta">
        {rowsCount > 0 ? `${rowsCount.toLocaleString('id-ID')} baris · ${keysCount} kolom` : 'Pilih file Excel / CSV'}
      </p>

      <button className="upload-dropzone" onClick={onUploadClick}>
        <div className="dropzone-icon">
          <Icon name="upload" size={16} />
        </div>
        <div className="dropzone-text">
          <b>Ganti / Unggah Dataset</b>
          <small>Mendukung .xlsx, .xls, .csv</small>
        </div>
      </button>
    </div>
  );
}
