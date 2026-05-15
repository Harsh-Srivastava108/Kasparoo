'use client';

export default function ActionPlan({ issues }) {
  if (!issues.length) {
    return (
      <div className="action-plan">
        <div className="section-header">
          <h3>🎉 Action Plan</h3>
          <p>No critical issues found — your store is well-optimized for AI agents!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="action-plan">
      <div className="section-header">
        <h3>📋 Prioritized Action Plan</h3>
        <p>{issues.length} improvements found, ranked by impact — tackle the top ones first.</p>
      </div>
      {issues.map((issue, i) => (
        <div key={i} className="action-item animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="action-rank">#{i + 1}</div>
          <div className="action-content">
            <div className="action-meta">
              <span className={`severity-badge severity-${issue.severity}`}>
                {issue.severity}
              </span>
              <span className="action-area">{issue.area}</span>
            </div>
            <p className="action-message">{issue.message}</p>
            <div className="action-fix">
              <strong>💡 Fix: </strong>{issue.fix}
            </div>
            <div className="action-tags">
              <span className="tag">Impact: +{issue.impact}pts</span>
              <span className="tag">Effort: {issue.effort}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
