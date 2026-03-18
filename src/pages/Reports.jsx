import { useState, useMemo } from 'react';
import { mockChartData, mockMetrics } from '../data/mockData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const metricOptions = [
  { value: 'followers', label: 'Seguidores' },
  { value: 'reach', label: 'Alcance' },
  { value: 'engagement', label: 'Engajamento (%)' },
];

const chartColors = {
  instagram: { border: '#E4405F', bg: 'rgba(228, 64, 95, 0.15)' },
  facebook: { border: '#1877F2', bg: 'rgba(24, 119, 242, 0.15)' },
  linkedin: { border: '#0A66C2', bg: 'rgba(10, 102, 194, 0.15)' },
};

export default function Reports() {
  const [selectedMetric, setSelectedMetric] = useState('followers');

  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { family: 'Inter', weight: 'bold' },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
      },
    },
  }), []);

  const lineData = useMemo(() => ({
    labels: mockChartData.labels,
    datasets: [
      {
        label: 'Instagram',
        data: mockChartData[selectedMetric].instagram,
        borderColor: chartColors.instagram.border,
        backgroundColor: chartColors.instagram.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Facebook',
        data: mockChartData[selectedMetric].facebook,
        borderColor: chartColors.facebook.border,
        backgroundColor: chartColors.facebook.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'LinkedIn',
        data: mockChartData[selectedMetric].linkedin,
        borderColor: chartColors.linkedin.border,
        backgroundColor: chartColors.linkedin.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  }), [selectedMetric]);

  const barData = useMemo(() => {
    const metrics = Object.values(mockMetrics);
    return {
      labels: metrics.map(m => m.platform),
      datasets: [
        {
          label: 'Seguidores',
          data: metrics.map(m => m.followers),
          backgroundColor: ['rgba(228, 64, 95, 0.7)', 'rgba(24, 119, 242, 0.7)', 'rgba(10, 102, 194, 0.7)'],
          borderColor: ['#E4405F', '#1877F2', '#0A66C2'],
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Alcance',
          data: metrics.map(m => m.reach),
          backgroundColor: ['rgba(228, 64, 95, 0.35)', 'rgba(24, 119, 242, 0.35)', 'rgba(10, 102, 194, 0.35)'],
          borderColor: ['#E4405F80', '#1877F280', '#0A66C280'],
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, []);

  const currentMetricLabel = metricOptions.find(m => m.value === selectedMetric)?.label || 'Seguidores';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-sm font-semibold text-dark-300">Métrica:</h2>
        <div className="flex bg-dark-700/50 rounded-xl border border-dark-600/50 p-1">
          {metricOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedMetric === option.value
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          Evolução de {currentMetricLabel} — Últimos 6 Meses
        </h3>
        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-dark-600/50 rounded-xl bg-dark-700/20">
          <span className="text-dark-400 text-sm font-medium">Dados Indisponíveis no Momento</span>
          <span className="text-dark-500 text-xs mt-1">Nenhuma conta conectada para exibir o histórico.</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          Comparação entre Plataformas — Seguidores e Alcance
        </h3>
        <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-dark-600/50 rounded-xl bg-dark-700/20">
          <span className="text-dark-400 text-sm font-medium">Dados Indisponíveis no Momento</span>
          <span className="text-dark-500 text-xs mt-1">Conecte suas redes para ver o comparativo.</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(mockMetrics).map(metric => (
          <div key={metric.platform} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
              <span className="font-semibold text-white text-sm">{metric.platform}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-dark-400">(indisponível)</p>
                <p className="text-xs text-dark-400">Seguidores</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-dark-400">(indisponível)</p>
                <p className="text-xs text-dark-400">Alcance</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-dark-400">(indisponível)</p>
                <p className="text-xs text-dark-400">Engajam.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
