'use client';
import { useState, useEffect } from 'react';
import ScoreGauge from '@/components/ScoreGauge';
import RadarChart from '@/components/RadarChart';
import DimensionCard from '@/components/DimensionCard';
import ActionPlan from '@/components/ActionPlan';
import PerceptionSimulator from '@/components/PerceptionSimulator';
import ProductTable from '@/components/ProductTable';
import ImpactSummary from '@/components/ImpactSummary';
import QuickWins from '@/components/QuickWins';
import ExportButton from '@/components/ExportButton';

const SCAN_STEPS = [
  'Validating Shopify store...',
  'Fetching product catalog...',
  'Analyzing policies & FAQs...',
  'Parsing structured data...',
  'Scoring AI readiness...',
  'Generating report...',
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setScanStep((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);
    setScanStep(0);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setResults(data);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    setResults(null);
    setUrl('');
    setError('');
  };

  // ─── Landing / Input View ───
  if (!results && !loading) {
    return (
      <main className="container">
        <section className="hero">
          <div className="hero-badge animate-in">
            <span className="dot" />
            Kasparro AI Readiness Scanner
          </div>
          <h1 className="animate-in delay-1">
            Will ChatGPT & Gemini<br />
            <span className="gradient-text">recommend your products?</span>
          </h1>
          <p className="animate-in delay-2">
            Shopify&apos;s Agentic Storefronts syndicate your product data to ChatGPT, Gemini,
            Perplexity, and CoPilot. Paste your store URL to discover what these AI agents
            see — and what they&apos;re missing.
          </p>
          <div className="scanner-container animate-in delay-3">
            <form onSubmit={handleScan}>
              <div className="scanner-input-group">
                <input
                  type="text"
                  placeholder="Enter your Shopify store URL (e.g. mystore.myshopify.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  id="store-url-input"
                />
                <button type="submit" className="btn-scan" id="scan-button">
                  🔍 Scan Store
                </button>
              </div>
            </form>
            {error && <div className="scanner-error">{error}</div>}
          </div>
          <div className="features-grid animate-in delay-4">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>5-Dimension Scoring</h3>
              <p>Product quality, trust signals, policies, structured data, and conversational readiness.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Chat Simulator</h3>
              <p>See how ChatGPT, Gemini & Perplexity respond when shoppers ask about your products.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Prioritized Action Plan</h3>
              <p>Ranked improvements by impact and effort — not just problems, but solutions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Per-Product Analysis</h3>
              <p>Detailed data quality breakdown for every product in your catalog.</p>
            </div>
          </div>
        </section>
        <footer className="footer">
          Built for the <a href="https://kasparro.com" target="_blank" rel="noopener">Kasparro</a> Internship Challenge — Track 5: AI Representation Optimizer
        </footer>
      </main>
    );
  }

  // ─── Loading View ───
  if (loading) {
    return (
      <main className="container">
        <div className="scanning-overlay">
          <div className="scan-animation">
            <div className="scan-ring" />
            <div className="scan-ring" />
            <div className="scan-ring" />
            <div className="scan-icon">🔍</div>
          </div>
          <h2 style={{ marginBottom: 8, fontSize: '1.4rem' }}>Scanning Store</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 30, fontSize: '0.9rem' }}>{url}</p>
          <ul className="scan-steps">
            {SCAN_STEPS.map((step, i) => (
              <li
                key={i}
                className={`scan-step ${i < scanStep ? 'done' : i === scanStep ? 'active' : ''}`}
              >
                <span className="scan-step-icon">
                  {i < scanStep ? '✓' : i === scanStep ? '◉' : '○'}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  // ─── Results View ───
  const dimEntries = Object.entries(results.dimensions);

  return (
    <main className="container">
      {/* Header */}
      <div className="results-header animate-in">
        <div className="agentic-badge">
          <span>🔗</span> Shopify Agentic Storefronts Readiness Report
        </div>
        <h2>AI Readiness Report</h2>
        <p className="store-url">{results.storeName} — {results.productCount} products, {results.collectionCount} collections</p>
        {results.category && results.category.confidence > 0 && (
          <p className="category-badge">
            📂 Detected: <strong>{results.category.primary}</strong>
            {results.category.secondary && <span> · {results.category.secondary}</span>}
          </p>
        )}
        <p className="agentic-subtitle">How ChatGPT, Gemini, Perplexity & CoPilot perceive your store</p>
        <div className="results-header-actions">
          <button className="btn-new-scan" onClick={handleNewScan}>← Scan Another Store</button>
          <ExportButton results={results} />
        </div>
      </div>

      {/* Impact Summary */}
      <ImpactSummary results={results} />

      {/* Score Overview */}
      <div className="score-overview animate-in delay-1">
        <div className="overall-score-card">
          <h3>Overall AI Readiness</h3>
          <ScoreGauge score={results.overallScore} />
          <span className="overall-score-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
            out of 100
          </span>
        </div>
        <div className="radar-card">
          <RadarChart dimensions={results.dimensions} />
        </div>
      </div>

      {/* Dimension Cards */}
      <div className="dimensions-grid">
        {dimEntries.map(([key, dim], i) => (
          <DimensionCard key={key} dimension={dim} animDelay={0.1 * i} />
        ))}
      </div>

      {/* AI Chat Simulator */}
      <PerceptionSimulator perception={results.perception} storeName={results.storeName} />

      {/* Quick Wins */}
      <QuickWins issues={results.issues} />

      {/* Prioritized Action Plan */}
      <ActionPlan issues={results.issues} />

      {/* Per-Product Table */}
      <ProductTable products={results.productSummary} />

      <footer className="footer">
        Scanned at {new Date(results.scannedAt).toLocaleString()} — Built for the <a href="https://kasparro.com" target="_blank" rel="noopener">Kasparro</a> Internship Challenge — Track 5
      </footer>
    </main>
  );
}
