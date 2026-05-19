'use client';
import { useState } from 'react';

const AI_CHANNELS = [
  { name: 'ChatGPT', icon: '💬', color: '#10a37f' },
  { name: 'Gemini', icon: '✨', color: '#4285f4' },
  { name: 'Perplexity', icon: '🔍', color: '#20b2aa' },
];

export default function PerceptionSimulator({ perception, storeName }) {
  const [activeTab, setActiveTab] = useState('qa');
  const { current, ideal, gaps, qaScenarios } = perception;

  return (
    <div className="perception-section">
      <div className="section-header">
        <h3>🤖 AI Shopping Simulator</h3>
        <p>See how AI shopping agents respond when real customers ask about your products.</p>
      </div>

      {/* Tab switcher */}
      <div className="perception-tabs">
        <button
          className={`perception-tab ${activeTab === 'qa' ? 'active' : ''}`}
          onClick={() => setActiveTab('qa')}
        >
          💬 Simulated Conversations
        </button>
        <button
          className={`perception-tab ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          📊 Current vs. Ideal
        </button>
      </div>

      {/* Q&A Tab */}
      {activeTab === 'qa' && qaScenarios && (
        <div className="qa-scenarios">
          {qaScenarios.map((scenario, i) => {
            const channel = AI_CHANNELS[i % AI_CHANNELS.length];
            return (
              <div key={i} className="qa-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="qa-question">
                  <span className="qa-user-icon">👤</span>
                  <div>
                    <div className="qa-channel-name" style={{ color: channel.color }}>
                      {channel.icon} Asking {channel.name}
                    </div>
                    <p>&ldquo;{scenario.question}&rdquo;</p>
                  </div>
                </div>
                <div className="qa-responses">
                  <div className="qa-response current">
                    <div className="qa-response-label">
                      <span className="qa-dot bad" /> Current Response
                    </div>
                    <p>{scenario.currentAnswer}</p>
                  </div>
                  <div className="qa-response ideal">
                    <div className="qa-response-label">
                      <span className="qa-dot good" /> After Optimization
                    </div>
                    <p>{scenario.idealAnswer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <>
          <div className="perception-grid">
            <div className="perception-card current animate-in delay-1">
              <div className="perception-label">
                <span>⚠️</span> What AI Agents Say Now
              </div>
              <p className="perception-text">&ldquo;{current}&rdquo;</p>
            </div>
            <div className="perception-card ideal animate-in delay-2">
              <div className="perception-label">
                <span>✨</span> What They Could Say
              </div>
              <p className="perception-text">&ldquo;{ideal}&rdquo;</p>
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
        </>
      )}
    </div>
  );
}
