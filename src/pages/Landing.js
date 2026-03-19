import React, { useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import { getQuestions } from '../utils/api';
import './Landing.css';

export default function Landing() {
  const { setUserId, setQuestions, setPhase, setStartTime, userId, setUserId: setCtxUserId } = useQuiz();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e) => {
    e.preventDefault();
    if (!input.trim()) return setError('Please enter your Player ID');
    if (input.trim().length < 2) return setError('Player ID must be at least 2 characters');

    setLoading(true);
    setError('');
    try {
      const res = await getQuestions();
      if (res.data.questions.length === 0) {
        setError('No questions found. Please seed questions first.');
        setLoading(false);
        return;
      }
      setCtxUserId(input.trim().toUpperCase());
      setQuestions(res.data.questions);
      setStartTime(Date.now());
      setPhase('quiz');
    } catch (err) {
      setError('Failed to connect to server. Check your connection.');
    }
    setLoading(false);
  };

  return (
    <div className="landing">
      <div className="stars-bg" />

      {/* Film strip decorations */}
      <div className="film-strip film-strip-left">
        {Array(20).fill(0).map((_, i) => <div key={i} className="film-hole" />)}
      </div>
      <div className="film-strip film-strip-right">
        {Array(20).fill(0).map((_, i) => <div key={i} className="film-hole" />)}
      </div>

      <div className="landing-content">
        <div className="landing-badge">🎬 ULTIMATE CHALLENGE</div>

        <h1 className="landing-title">
          <span className="title-line1">LIGHTS</span>
          <span className="title-line2">CAMERA</span>
          <span className="title-line3">QUIZ</span>
        </h1>

        <p className="landing-sub">
          20 Questions · 3 Lifelines · One Champion
        </p>

        <div className="divider-stars">
          <span>✦</span><span>★</span><span>✦</span>
        </div>

        <div className="landing-card">
          <h2 className="card-title">ENTER THE SCREENING ROOM</h2>
          <p className="card-sub">Enter your Player ID to begin the ultimate movie quiz experience</p>

          <form onSubmit={handleStart} className="start-form">
            <div className="input-wrapper">
              <span className="input-icon">🎭</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="YOUR PLAYER ID"
                className="player-input"
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className="error-msg">⚠ {error}</p>}

            <button type="submit" className="btn-gold start-btn" disabled={loading}>
              {loading ? (
                <span className="loading-dots">
                  <span /><span /><span />
                </span>
              ) : '🎬 START QUIZ'}
            </button>
          </form>

          <div className="lifelines-preview">
            <h3>AVAILABLE LIFELINES</h3>
            <div className="lifeline-pills">
              <div className="lifeline-pill">
                <span className="ll-icon">✂️</span>
                <span>50:50</span>
                <small>Eliminate 2 wrong options</small>
              </div>
              <div className="lifeline-pill">
                <span className="ll-icon">🎯</span>
                <span>Double Try</span>
                <small>Get 2 attempts per question</small>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-stats">
          <div className="stat-item">
            <span className="stat-num">20</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">2000</span>
            <span className="stat-label">Max Score</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">2</span>
            <span className="stat-label">Lifelines</span>
          </div>
        </div>

        <button className="btn-outline leaderboard-btn" onClick={() => setPhase('leaderboard')}>
          🏆 VIEW LEADERBOARD
        </button>
      </div>
    </div>
  );
}
