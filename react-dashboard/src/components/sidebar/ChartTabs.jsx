import { useState } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Icon } from '../common/Icons';
import { TYPE_COLORS } from '../../constants/config';

export function ChartTabs({ chartEntries, rows, trendData, isDark }) {
  const [activeTab, setActiveTab] = useState('donut');

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Donut chart config
  const doughnutData = {
    labels: chartEntries.map(e => e[0]),
    datasets: [
      {
        data: chartEntries.map(e => e[1]),
        backgroundColor: chartEntries.map(e => TYPE_COLORS[e[0]] || '#38bdf8'),
        borderWidth: isDark ? 2 : 2,
        borderColor: isDark ? '#1e293b' : '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: { size: 10, family: 'Inter' },
          boxWidth: 10,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#1e293b',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 11 }
      }
    }
  };

  // Bar chart config
  const barData = {
    labels: chartEntries.map(e => e[0]),
    datasets: [
      {
        label: 'Jumlah Aset',
        data: chartEntries.map(e => e[1]),
        backgroundColor: chartEntries.map(e => TYPE_COLORS[e[0]] || '#0284c7'),
        borderRadius: 6,
        maxBarThickness: 32
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#1e293b'
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 9, family: 'Inter' } }
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0, font: { size: 9, family: 'Inter' } }
      }
    }
  };

  // Line trend config
  const lineData = trendData
    ? {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Penambahan Aset',
            data: trendData.data,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0284c7'
          }
        ]
      }
    : null;

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 8 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0, font: { size: 9 } }
      }
    }
  };

  return (
    <section className="sidebar-chart-card">
      <div className="chart-tabs-header">
        <div className="chart-tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'donut' ? 'active' : ''}`}
            onClick={() => setActiveTab('donut')}
          >
            Komposisi
          </button>
          <button
            className={`tab-btn ${activeTab === 'bar' ? 'active' : ''}`}
            onClick={() => setActiveTab('bar')}
          >
            Distribusi
          </button>
          {trendData && (
            <button
              className={`tab-btn ${activeTab === 'trend' ? 'active' : ''}`}
              onClick={() => setActiveTab('trend')}
            >
              Tren Waktu
            </button>
          )}
        </div>
      </div>

      <div className="chart-canvas-wrapper">
        {rows.length === 0 ? (
          <div className="chart-placeholder">
            <Icon name="bar-chart" size={24} />
            <span>Menunggu dataset dimuat...</span>
          </div>
        ) : activeTab === 'donut' ? (
          <Doughnut data={doughnutData} options={donutOptions} />
        ) : activeTab === 'bar' ? (
          <Bar data={barData} options={barOptions} />
        ) : lineData ? (
          <Line data={lineData} options={lineOptions} />
        ) : (
          <div className="chart-placeholder">Data tren tidak tersedia</div>
        )}
      </div>
    </section>
  );
}
