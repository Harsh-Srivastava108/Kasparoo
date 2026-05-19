'use client';

export default function QuickWins({ issues }) {
  const quickWins = issues.filter((i) => i.effort === 'easy' && i.impact >= 10);

  if (!quickWins.length) return null;

  return (
    <div className="quick-wins animate-in">
      <div className="section-header">
        <h3>⚡ Quick Wins — Do These Today</h3>
        <p>{quickWins.length} easy fixes with high impact — most take under 30 minutes.</p>
      </div>
      <div className="quick-wins-grid">
        {quickWins.map((issue, i) => (
          <div key={i} className="quick-win-card">
            <div className="quick-win-header">
              <span className="quick-win-impact">+{issue.impact} pts</span>
              <span className="quick-win-effort">~15 min</span>
            </div>
            <h4>{issue.area}</h4>
            <p className="quick-win-fix">{issue.fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
