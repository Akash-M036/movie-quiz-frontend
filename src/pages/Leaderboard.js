import React, { useEffect, useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import { getLeaderboard } from '../utils/api';
import './Leaderboard.css';

const formatTime = (sec) => {
  if (!sec && sec !== 0) return '--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const getMedal = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function Leaderboard() {
  const { setPhase, resetQuiz } = useQuiz();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaderboard()
      .then(res => { setData(res.data.leaderboard); setLoading(false); })
      .catch(() => { setError('Failed to load leaderboard'); setLoading(false); });
  }, []);

  return (
    <div className="leaderboard-page">
      <div className="stars-bg" />

      <div className="lb-content">
        {/* Header */}
        <div className="lb-header">
          <button className="back-btn" onClick={() => { resetQuiz(); setPhase('landing'); }}>
            ← Back
          </button>
          <div className="lb-title-wrap">
            <h1 className="lb-title">🏆 LEADERBOARD</h1>
            <p className="lb-subtitle">Ranked by Score · Time · Lifelines Used</p>
          </div>
        </div>

        {/* Top 3 podium */}
        {!loading && data.length >= 3 && (
          <div className="podium">
            {/* 2nd */}
            <div className="podium-spot second">
              <div className="podium-avatar">🎭</div>
              <div className="podium-name">{data[1]?.userId}</div>
              <div className="podium-score">{data[1]?.score?.toLocaleString()}</div>
              <div className="podium-block second-block">
                <span>🥈</span>
                <span className="podium-rank">2ND</span>
              </div>
            </div>
            {/* 1st */}
            <div className="podium-spot first">
              <div className="crown">👑</div>
              <div className="podium-avatar champion">🎬</div>
              <div className="podium-name champion-name">{data[0]?.userId}</div>
              <div className="podium-score champion-score">{data[0]?.score?.toLocaleString()}</div>
              <div className="podium-block first-block">
                <span>🥇</span>
                <span className="podium-rank">1ST</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="podium-spot third">
              <div className="podium-avatar">🎭</div>
              <div className="podium-name">{data[2]?.userId}</div>
              <div className="podium-score">{data[2]?.score?.toLocaleString()}</div>
              <div className="podium-block third-block">
                <span>🥉</span>
                <span className="podium-rank">3RD</span>
              </div>
            </div>
          </div>
        )}

        {/* Full table */}
        <div className="lb-table-wrap">
          <div className="lb-table-header">
            <span className="th-rank">RANK</span>
            <span className="th-player">PLAYER</span>
            <span className="th-score">SCORE</span>
            <span className="th-correct">CORRECT</span>
            <span className="th-time">TIME</span>
            <span className="th-lifelines">LIFELINES</span>
          </div>

          {loading && (
            <div className="lb-loading">
              <span className="film-reel-spin">🎬</span>
              <p>Loading rankings...</p>
            </div>
          )}

          {error && <div className="lb-error">⚠ {error}</div>}

          {!loading && !error && data.length === 0 && (
            <div className="lb-empty">
              <span>🎥</span>
              <p>No scores yet. Be the first to play!</p>
            </div>
          )}

          {!loading && data.map((entry, i) => (
            <div
              key={i}
              className={`lb-row ${i === 0 ? 'gold-row' : i === 1 ? 'silver-row' : i === 2 ? 'bronze-row' : ''}`}
            >
              <span className="td-rank">{getMedal(entry.rank)}</span>
              <span className="td-player">
                <span className="player-dot" />
                {entry.userId}
              </span>
              <span className="td-score">{entry.score?.toLocaleString()}</span>
              <span className="td-correct">{entry.correctAnswers}/{entry.totalQuestions}</span>
              <span className="td-time">{formatTime(entry.timeTaken)}</span>
              <span className="td-lifelines">
                {entry.lifelinesUsed?.fiftyFifty && <span title="50:50 Used">✂️</span>}
                {entry.lifelinesUsed?.doubleTry && <span title="Double Try Used">🎯</span>}
                {entry.lifelinesCount === 0 && <span className="no-lifeline">—</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="lb-actions">
          <button className="btn-gold" onClick={() => { resetQuiz(); setPhase('landing'); }}>
            🎬 Play Now
          </button>
        </div>
      </div>
    </div>
  );
}
