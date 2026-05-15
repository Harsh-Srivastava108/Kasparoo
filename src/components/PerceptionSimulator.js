'use client';

export default function PerceptionSimulator({ perception }) {
  const { current, ideal, gaps } = perception;

  return (
    <div className="perception-section">
      <div className="section-header">
        <h3>🤖 AI Perception Simulator</h3>
        <p>How AI agents currently describe your store vs. how you want to be represented.</p>
      </div>
      <div className="perception-grid">
        <div className="perception-card current animate-in delay-1">
          <div className="perception-label">
            <span>⚠️</span> Current AI Perception
          </div>
          <p className="perception-text">"{current}"</p>
        </div>
        <div className="perception-card ideal animate-in delay-2">
          <div className="perception-label">
            <span>✨</span> Ideal AI Perception
          </div>
          <p className="perception-text">"{ideal}"</p>
        </div>
      </div>
      {gaps.length > 0 && (
        <div className="perception-gaps animate-in delay-3" style={{ marginTop: 16 }}>
          <h4>⚡ Key Gaps to Close</h4>
          {gaps.map((gap, i) => (
            <div key={i} className="gap-item">
              <span className="gap-icon">→</span>
              <span>{gap}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
