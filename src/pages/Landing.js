import React, { useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import { getQuestions } from '../utils/api';
import './Landing.css';

export default function Landing() {
  const { setQuestions, setPhase, setStartTime, setUserId: setCtxUserId } = useQuiz();
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleStart = async (e) => {
    e.preventDefault();
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return setError('Please enter your Player ID');
    if (trimmed.length < 2) return setError('Player ID must be at least 2 characters');

    // Check if this player has already played
    const alreadyPlayed = localStorage.getItem(`played_${trimmed}`);
    if (alreadyPlayed) {
      setError('⛔ You have already played! Each Player ID gets only one attempt. Check the leaderboard for your rank.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await getQuestions();
      if (!res.data.questions || res.data.questions.length === 0) {
        setError('No questions found. Please contact the admin.');
        setLoading(false);
        return;
      }
      setCtxUserId(trimmed);
      setQuestions(res.data.questions);
      setStartTime(Date.now());
      setPhase('quiz');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="landing">
      <div className="stars-bg" />

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

        <p className="landing-sub">20 Questions · 10 Minutes · One Shot Only</p>

        <div className="divider-stars">
          <span>✦</span><span>★</span><span>✦</span>
        </div>

        <div className="landing-card">
          <h2 className="card-title">ENTER THE SCREENING ROOM</h2>
          <p className="card-sub">Enter your Player ID to begin. <strong style={{color:'#e50914'}}>You get only ONE attempt!</strong></p>

          <form onSubmit={handleStart} className="start-form">
            <div className="input-wrapper">
              <span className="input-icon">🎭</span>
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setError(''); }}
                placeholder="YOUR PLAYER ID"
                className="player-input"
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className="error-msg">⚠ {error}</p>}

            <button type="submit" className="btn-gold start-btn" disabled={loading}>
              {loading ? (
                <span className="loading-dots"><span /><span /><span /></span>
              ) : '🎬 START QUIZ'}
            </button>
          </form>

          <div className="rules-box">
            <h3>📋 RULES</h3>
            <ul>
              <li>⏱ Total time: <strong>10 minutes</strong> for all 20 questions</li>
              <li>🎯 No per-question timer — manage your time wisely</li>
              <li>✂️ 50:50 — eliminates 2 wrong options (once only)</li>
              <li>🎯 Double Try — 2 attempts on one question (once only)</li>
              <li>⛔ Each Player ID can play <strong>only once</strong></li>
              <li>🏆 Ranked by Score → Time → Lifelines Used</li>
            </ul>
          </div>
        </div>

        <div className="landing-stats">
          <div className="stat-item">
            <span className="stat-num">20</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">10</span>
            <span className="stat-label">Minutes</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">2000</span>
            <span className="stat-label">Max Score</span>
          </div>
        </div>

        <button className="btn-outline leaderboard-btn" onClick={() => setPhase('leaderboard')}>
          🏆 VIEW LEADERBOARD
        </button>
      </div>
    </div>
  );
}