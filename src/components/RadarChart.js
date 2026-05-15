'use client';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

// Wrap long labels for the radar chart
function wrapLabel(label, maxLen = 14) {
  if (label.length <= maxLen) return label;
  const words = label.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && (current + ' ' + word).length > maxLen) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function RadarChart({ dimensions }) {
  const labels = Object.values(dimensions).map((d) => wrapLabel(d.label));
  const scores = Object.values(dimensions).map((d) => d.score);

  const data = {
    labels,
    datasets: [
      {
        label: 'AI Readiness',
        data: scores,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        pointBackgroundColor: scores.map((s) =>
          s >= 80 ? '#10b981' : s >= 60 ? '#22d3ee' : s >= 40 ? '#f59e0b' : '#f43f5e'
        ),
        pointBorderColor: 'transparent',
        pointRadius: 6,
        pointHoverRadius: 9,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#64748b',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter', weight: '500' },
          padding: 20,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13, 13, 20, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const label = items[0]?.label;
            return Array.isArray(label) ? label.join(' ') : label;
          },
          label: (item) => `Score: ${item.raw}/100`,
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
      <Radar data={data} options={options} />
    </div>
  );
}
