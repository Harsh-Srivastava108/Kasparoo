'use client';

function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function formatMetricName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function DimensionCard({ dimension, animDelay = 0 }) {
  const { label, score, weight, details } = dimension;
  const scoreClass = getScoreClass(score);

  return (
    <div className={`dimension-card animate-in`} style={{ animationDelay: `${animDelay}s` }}>
      <div className="dimension-header">
        <div>
          <div className="dimension-label">{label}</div>
          <span className="dimension-weight">Weight: {weight}%</span>
        </div>
        <div className={`dimension-score score-${scoreClass}`}>{score}</div>
      </div>
      <div className="dimension-metrics">
        {Object.entries(details).map(([key, value]) => (
          <div className="metric-row" key={key}>
            <span className="metric-name">{formatMetricName(key)}</span>
            <div className="metric-bar-container">
              <div
                className={`metric-bar bar-${getScoreClass(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={`metric-value score-${getScoreClass(value)}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
