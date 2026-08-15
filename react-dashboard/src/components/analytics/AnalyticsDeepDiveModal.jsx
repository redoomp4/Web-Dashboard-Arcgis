import { Bar, Doughnut } from 'react-chartjs-2';
import { Icon } from '../common/Icons';
import { CAPACITY_TIERS } from '../../constants/config';
import { toNumber } from '../../utils/dataParser';

export function AnalyticsDeepDiveModal({
  isOpen,
  onClose,
  rows,
  capacityKey,
  feederKey,
  typeKey,
  isDark
}) {
  if (!isOpen) return null;

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // 1. Feeder Capacity Sum
  const feederSums = {};
  const feederCounts = {};
  rows.forEach(r => {
    const feeder = String(r[feederKey] || 'Non-Penyulang').trim();
    const cap = capacityKey ? toNumber(r[capacityKey]) : 0;
    feederSums[feeder] = (feederSums[feeder] || 0) + cap;
    feederCounts[feeder] = (feederCounts[feeder] || 0) + 1;
  });

  const sortedFeeders = Object.entries(feederSums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const feederBarData = {
    labels: sortedFeeders.map(e => e[0]),
    datasets: [
      {
        label: 'Total Kapasitas (kVA)',
        data: sortedFeeders.map(e => e[1]),
        backgroundColor: '#0284c7',
        borderRadius: 6
      }
    ]
  };

  const feederBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#1e293b',
        callbacks: {
          afterLabel: function (context) {
            const feederName = context.label;
            return `Jumlah Gardu: ${feederCounts[feederName] || 0} unit`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 10 } }
      }
    }
  };

  // 2. Capacity Tiers Distribution
  const tierCounts = CAPACITY_TIERS.map(tier => {
    const count = rows.filter(r => {
      const cap = capacityKey ? toNumber(r[capacityKey]) : 0;
      return cap >= tier.min && cap <= tier.max;
    }).length;
    return { label: tier.label, count };
  });

  const tierChartData = {
    labels: tierCounts.map(t => t.label),
    datasets: [
      {
        data: tierCounts.map(t => t.count),
        backgroundColor: ['#38bdf8', '#0284c7', '#0369a1', '#f59e0b', '#10b981'],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff'
      }
    ]
  };

  const tierChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          font: { size: 11, family: 'Inter' },
          padding: 10
        }
      }
    }
  };

  const totalDaya = rows.reduce((s, r) => s + (capacityKey ? toNumber(r[capacityKey]) : 0), 0);
  const avgDaya = rows.length > 0 ? Math.round(totalDaya / rows.length) : 0;

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="analytics-modal-window" onClick={e => e.stopPropagation()}>
        <div className="modal-window-header">
          <div className="header-title-group">
            <div className="modal-icon-badge">
              <Icon name="activity" size={18} color="#0284c7" />
            </div>
            <div>
              <h3>Analisis Mendalam Jaringan & Beban Trafo</h3>
              <small>PLN UP3 Grogot · Distribusi Beban per Penyulang dan Kapasitas</small>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="analytics-modal-body">
          {/* Quick Metrics */}
          <div className="analytics-summary-row">
            <div className="summary-stat-box">
              <span>Total Beban Terpasang</span>
              <b>{(totalDaya / 1000).toFixed(2)} MVA</b>
              <small>{totalDaya.toLocaleString('id-ID')} kVA</small>
            </div>
            <div className="summary-stat-box">
              <span>Rata-rata Kapasitas Trafo</span>
              <b>{avgDaya} kVA</b>
              <small>per Gardu Distribusi</small>
            </div>
            <div className="summary-stat-box">
              <span>Total Penyulang Aktif</span>
              <b>{Object.keys(feederSums).length} Penyulang</b>
              <small>Jaringan 20 kV</small>
            </div>
          </div>

          {/* Charts Row */}
          <div className="analytics-charts-grid">
            <div className="analytics-chart-panel">
              <div className="panel-title-row">
                <h4>Top 10 Penyulang Terbesar (kVA)</h4>
                <span className="panel-badge">Beban Daya</span>
              </div>
              <div className="analytics-chart-canvas h-260">
                <Bar data={feederBarData} options={feederBarOptions} />
              </div>
            </div>

            <div className="analytics-chart-panel">
              <div className="panel-title-row">
                <h4>Klasifikasi Rating Kapasitas Trafo</h4>
                <span className="panel-badge">kVA Tier</span>
              </div>
              <div className="analytics-chart-canvas h-260">
                <Doughnut data={tierChartData} options={tierChartOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-window-footer">
          <button className="btn-modal-primary" onClick={onClose}>
            Tutup Analisis
          </button>
        </div>
      </div>
    </div>
  );
}
