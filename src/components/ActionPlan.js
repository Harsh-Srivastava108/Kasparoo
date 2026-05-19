'use client';
import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className="btn-copy-code" onClick={handleCopy}>
      {copied ? '✓ Copied!' : '📋 Copy Code'}
    </button>
  );
}

export default function ActionPlan({ issues }) {
  const [expandedSnippets, setExpandedSnippets] = useState({});

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

  const toggleSnippet = (i) => {
    setExpandedSnippets((prev) => ({ ...prev, [i]: !prev[i] }));
  };

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
            {issue.codeSnippet && (
              <div className="code-snippet-section">
                <button
                  className="btn-toggle-snippet"
                  onClick={() => toggleSnippet(i)}
                >
                  {expandedSnippets[i] ? '▼' : '▶'} {issue.codeSnippet.label}
                </button>
                {expandedSnippets[i] && (
                  <div className="code-snippet-container">
                    <div className="code-snippet-header">
                      <span className="code-lang-badge">{issue.codeSnippet.language.toUpperCase()}</span>
                      <CopyButton text={issue.codeSnippet.code} />
                    </div>
                    <pre className="code-snippet-block"><code>{issue.codeSnippet.code}</code></pre>
                  </div>
                )}
              </div>
            )}
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
