import React, { useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import './Result.css';

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const getRank = (rank) => {
  if (rank === 1) return { label: '🥇 #1 CHAMPION', color: '#ffd700' };
  if (rank === 2) return { label: '🥈 #2 RUNNER-UP', color: '#c0c0c0' };
  if (rank === 3) return { label: '🥉 #3 THIRD PLACE', color: '#cd7f32' };
  return { label: `🎬 RANK #${rank}`, color: 'var(--gold)' };
};

const getGrade = (correct, total) => {
  const pct = correct / total;
  if (pct >= 0.9) return { label: 'MASTERPIECE', emoji: '🏆', color: '#ffd700' };
  if (pct >= 0.75) return { label: 'BLOCKBUSTER', emoji: '⭐', color: '#f5c518' };
  if (pct >= 0.6) return { label: 'CROWD PLEASER', emoji: '🎬', color: '#4caf50' };
  if (pct >= 0.4) return { label: 'INDIE FILM', emoji: '🎥', color: '#ff9800' };
  return { label: 'B-MOVIE', emoji: '📽️', color: '#e50914' };
};

export default function Result() {
  const { score, resetQuiz, setPhase, userId } = useQuiz();
  const [showDetails, setShowDetails] = useState(false);

  if (!score) return null;

  const rankInfo = getRank(score.rank);
  const grade = getGrade(score.correctAnswers, score.totalQuestions);
  const pct = Math.round((score.correctAnswers / score.totalQuestions) * 100);
  const lifelinesUsedCount = (score.lifelinesUsed?.fiftyFifty ? 1 : 0) + (score.lifelinesUsed?.doubleTry ? 1 : 0);

  return (
    <div className="result-page">
      <div className="stars-bg" />

      {/* Confetti-style particles */}
      <div className="particles">
        {Array(20).fill(0).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            background: ['var(--gold)', '#e50914', '#7c4dff', '#4caf50'][i % 4]
          }} />
        ))}
      </div>

      <div className="result-content">
        {/* Header */}
        <div className="result-header">
          <div className="clapperboard">🎬</div>
          <h2 className="result-subtitle">QUIZ COMPLETE</h2>
          <div className="result-player">{userId}</div>
        </div>

        {/* Grade */}
        <div className="grade-banner" style={{ borderColor: grade.color }}>
          <span className="grade-emoji">{grade.emoji}</span>
          <div>
            <div className="grade-label" style={{ color: grade.color }}>{grade.label}</div>
            <div className="grade-sub">{pct}% accuracy</div>
          </div>
        </div>

        {/* Score card */}
        <div className="score-showcase">
          <div className="score-main">
            <span className="score-num">{score.score.toLocaleString()}</span>
            <span className="score-unit">POINTS</span>
          </div>
          <div className="rank-badge" style={{ color: rankInfo.color, borderColor: rankInfo.color }}>
            {rankInfo.label}
          </div>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-val">{score.correctAnswers}/{score.totalQuestions}</span>
            <span className="stat-name">Correct</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱</span>
            <span className="stat-val">{formatTime(score.timeTaken)}</span>
            <span className="stat-name">Time Taken</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🛡</span>
            <span className="stat-val">{lifelinesUsedCount}/2</span>
            <span className="stat-name">Lifelines Used</span>
          </div>
        </div>

        {/* Lifeline details */}
        {lifelinesUsedCount > 0 && (
          <div className="lifelines-summary">
            {score.lifelinesUsed?.fiftyFifty && (
              <span className="ll-used-tag">✂️ 50:50 Used</span>
            )}
            {score.lifelinesUsed?.doubleTry && (
              <span className="ll-used-tag">🎯 Double Try Used</span>
            )}
          </div>
        )}

        {/* Question details toggle */}
        {score.details && (
          <div className="details-section">
            <button className="btn-outline details-toggle" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? '▲ Hide Details' : '▼ Show Answer Details'}
            </button>

            {showDetails && (
              <div className="details-list">
                {score.details.map((d, i) => (
                  <div key={i} className={`detail-row ${d.isCorrect ? 'correct' : 'wrong'}`}>
                    <span className="d-num">Q{i + 1}</span>
                    <span className="d-icon">{d.isCorrect ? '✅' : '❌'}</span>
                    <span className="d-question">{d.question}</span>
                    <div className="d-answers">
                      {d.userAnswer
                        ? <span>Your: <b>{d.userAnswer}</b></span>
                        : <span className="skipped">Skipped</span>
                      }
                      {!d.isCorrect && (
                        <span className="correct-ans">Correct: <b>{d.correctAnswer}</b></span>
                      )}
                    </div>
                    <span className="d-pts">+{d.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-gold" onClick={() => { resetQuiz(); setPhase('landing'); }}>
            🎬 Play Again
          </button>
          <button className="btn-outline" onClick={() => setPhase('leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
