'use client';

function getVisibilityEstimate(score) {
  if (score >= 80) return { pct: '90%+', label: 'Excellent visibility', color: 'var(--accent-emerald)' };
  if (score >= 60) return { pct: '~65%', label: 'Good visibility', color: '#22d3ee' };
  if (score >= 40) return { pct: '~40%', label: 'Limited visibility', color: 'var(--accent-amber)' };
  return { pct: '<25%', label: 'Poor visibility', color: 'var(--accent-rose)' };
}

export default function ImpactSummary({ results }) {
  const { overallScore, issues, dimensions } = results;
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const totalImpact = issues.reduce((sum, i) => sum + (i.impact || 0), 0);
  const quickWins = issues.filter((i) => i.effort === 'easy' && i.impact >= 10);
  const visibility = getVisibilityEstimate(overallScore);
  const projectedScore = Math.min(100, overallScore + Math.round(totalImpact * 0.6));

  return (
    <div className="impact-summary animate-in delay-1">
      <div className="impact-header">
        <h3>📉 Business Impact</h3>
        <p>What your AI readiness score means for your store&apos;s visibility</p>
      </div>
      <div className="impact-cards">
        <div className="impact-card">
          <div className="impact-icon" style={{ color: visibility.color }}>🔍</div>
          <div className="impact-value" style={{ color: visibility.color }}>{visibility.pct}</div>
          <div className="impact-label">AI recommendation rate</div>
          <div className="impact-desc">
            Estimated chance ChatGPT, Gemini & Perplexity include your products in shopping recommendations
          </div>
        </div>
        <div className="impact-card">
          <div className="impact-icon" style={{ color: 'var(--accent-rose)' }}>⚠️</div>
          <div className="impact-value" style={{ color: 'var(--accent-rose)' }}>{criticalCount + highCount}</div>
          <div className="impact-label">Critical data gaps</div>
          <div className="impact-desc">
            {criticalCount > 0
              ? `${criticalCount} critical and ${highCount} high-severity issues prevent confident AI recommendations`
              : 'No critical issues — your store data is in good shape'}
          </div>
        </div>
        <div className="impact-card">
          <div className="impact-icon" style={{ color: 'var(--accent-emerald)' }}>📈</div>
          <div className="impact-value" style={{ color: 'var(--accent-emerald)' }}>{overallScore} → {projectedScore}</div>
          <div className="impact-label">Projected score after fixes</div>
          <div className="impact-desc">
            Fixing all {issues.length} issues could raise your score by ~{projectedScore - overallScore} points
            {quickWins.length > 0 ? ` — start with ${quickWins.length} quick wins` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
