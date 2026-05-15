'use client';
import { useEffect, useState } from 'react';

function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#22d3ee';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

export default function ScoreGauge({ score, size = 180 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = mounted
    ? circumference - (score / 100) * circumference
    : circumference;
  const color = getScoreColor(score);
  const center = size / 2;

  useEffect(() => {
    setMounted(true);
    // Animate the number counting up
    const duration = 1500;
    const startTime = performance.now();
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="score-gauge-bg"
          cx={center}
          cy={center}
          r={radius}
        />
        <circle
          className="score-gauge-fill"
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 10px ${color}60)`,
          }}
        />
      </svg>
      <div className="score-gauge-text">
        <span className="score-gauge-number" style={{ color }}>
          {displayScore}
        </span>
        <span className="score-gauge-label">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}
