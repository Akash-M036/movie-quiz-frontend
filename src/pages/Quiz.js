import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../context/QuizContext';
import { submitQuiz } from '../utils/api';
import './Quiz.css';

const TOTAL_TIME = 600;
const OPTIONS = ['A', 'B', 'C', 'D'];

export default function Quiz() {
  const {
    userId, questions, currentQ, setCurrentQ,
    answers, setAnswers, setScore, setPhase,
    startTime, lifelinesUsed, setLifelinesUsed,
    eliminatedOptions, setEliminatedOptions,
    doubleTryActive, setDoubleTryActive,
    doubleTryFirst, setDoubleTryFirst
  } = useQuiz();

  const [selected, setSelected]           = useState(null);
  const [timeLeft, setTimeLeft]           = useState(TOTAL_TIME);
  const [submitting, setSubmitting]       = useState(false);
  const [showModal, setShowModal]         = useState(null);
  const [locked, setLocked]              = useState(false);

  const answersRef   = useRef(answers);
  const timeLeftRef  = useRef(timeLeft);
  const lockedRef    = useRef(locked);

  answersRef.current  = answers;
  timeLeftRef.current = timeLeft;
  lockedRef.current   = locked;

  const q      = questions[currentQ];
  const totalQ = questions.length;

  // One-time 10-minute countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!lockedRef.current) doFinish(answersRef.current, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // Reset per-question state ONLY — never touch eliminatedOptions here
  useEffect(() => {
    setSelected(null);
    setLocked(false);
  }, [currentQ]);

  const doFinish = async (finalAnswers, remainingTime) => {
    setSubmitting(true);
    const timeTaken = TOTAL_TIME - (remainingTime ?? timeLeftRef.current);
    try {
      const res = await submitQuiz({ userId, answers: finalAnswers, timeTaken, lifelinesUsed });
      setScore(res.data.result);
      localStorage.setItem(`played_${userId}`, 'true');
      setPhase('result');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const goNext = (opt) => {
    if (lockedRef.current) return;
    setLocked(true);

    const updated = { ...answersRef.current, [q.id]: opt };
    setAnswers(updated);

    setTimeout(() => {
      if (currentQ + 1 >= totalQ) {
        doFinish(updated, timeLeftRef.current);
      } else {
        // Clear eliminated options for next question
        setEliminatedOptions([]);
        setDoubleTryFirst(null);
        setDoubleTryActive(false);
        setCurrentQ(c => c + 1);
      }
    }, 700);
  };

  const handleSelect = (opt) => {
    if (locked || eliminatedOptions.includes(opt)) return;
    if (doubleTryActive && !doubleTryFirst) {
      setDoubleTryFirst(opt);
      setSelected(opt);
      return;
    }
    setSelected(opt);
    goNext(opt);
  };

  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty || locked) return;
    // Pick 2 options that are NOT already selected to eliminate
    const pool = OPTIONS.filter(o => o !== selected && o !== doubleTryFirst);
    const toEliminate = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }));
    setShowModal(null);
  };

  const useDoubleTry = () => {
    if (lifelinesUsed.doubleTry || locked) return;
    setDoubleTryActive(true);
    setLifelinesUsed(prev => ({ ...prev, doubleTry: true }));
    setShowModal(null);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const timerColor = timeLeft <= 60 ? '#e50914' : timeLeft <= 120 ? '#ff9800' : 'var(--gold)';
  const progress   = ((currentQ + 1) / totalQ) * 100;

  if (submitting) return (
    <div className="quiz-loading">
      <div className="stars-bg" />
      <div className="submit-loader">
        <div className="film-reel">🎬</div>
        <p>Calculating your score...</p>
      </div>
    </div>
  );

  return (
    <div className="quiz-page">
      <div className="stars-bg" />

      <header className="quiz-header">
        <div className="player-badge"><span>🎭</span><span>{userId}</span></div>
        <div className="question-counter">
          <span className="q-num">{currentQ + 1}</span>
          <span className="q-sep">/</span>
          <span className="q-total">{totalQ}</span>
        </div>
        <div className="timer-box" style={{ color: timerColor, borderColor: timerColor }}>
          <span>⏱</span>
          <span className="timer-val">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-body">

        {/* Lifelines */}
        <div className="lifelines-bar">
          <button
            className={`lifeline-btn ${lifelinesUsed.fiftyFifty ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.fiftyFifty && !locked && setShowModal('fiftyFifty')}
          >
            <span>✂️</span><span>50:50</span>
            {lifelinesUsed.fiftyFifty && <span className="used-badge">USED</span>}
          </button>
          <button
            className={`lifeline-btn ${lifelinesUsed.doubleTry ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.doubleTry && !locked && setShowModal('doubleTry')}
          >
            <span>🎯</span><span>Double Try</span>
            {lifelinesUsed.doubleTry && <span className="used-badge">USED</span>}
          </button>
          {doubleTryActive && (
            <div className="double-try-active">
              {doubleTryFirst ? `🎯 Selected: ${doubleTryFirst} — Confirm below` : '🎯 DOUBLE TRY — Pick carefully!'}
            </div>
          )}
        </div>

        {/* Question */}
        <div className="question-card">
          <div className="q-number-tag">Q{currentQ + 1}</div>
          <div className="question-points">💎 {q?.points || 100} PTS</div>
          <p className="question-text">{q?.question}</p>
        </div>

        {/* All 4 Options — always rendered */}
        <div className="options-grid">
          {OPTIONS.map(opt => {
            const isElim   = eliminatedOptions.includes(opt);
            const isSel    = selected === opt && !doubleTryFirst;
            const isFirst  = doubleTryFirst === opt;

            let className = 'option-btn';
            if (isElim)  className += ' eliminated';
            if (isSel)   className += ' selected';
            if (isFirst) className += ' double-first';

            return (
              <button
                key={opt}
                className={className}
                onClick={() => handleSelect(opt)}
                disabled={isElim || locked}
              >
                <span className="opt-label">{opt}</span>
                <span className="opt-text">{q?.options?.[opt]}</span>
              </button>
            );
          })}
        </div>

        {/* Confirm double try */}
        {doubleTryActive && doubleTryFirst && !locked && (
          <button className="confirm-btn btn-gold"
            onClick={() => { setSelected(doubleTryFirst); goNext(doubleTryFirst); }}>
            ✅ Confirm → {doubleTryFirst}
          </button>
        )}

        {/* Skip */}
        {!locked && !selected && (
          <button className="skip-btn" onClick={() => goNext(null)}>
            Skip →
          </button>
        )}
      </div>

      {/* Lifeline Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{showModal === 'fiftyFifty' ? '✂️ USE 50:50?' : '🎯 USE DOUBLE TRY?'}</h3>
            <p>{showModal === 'fiftyFifty'
              ? 'Eliminates 2 wrong options. Cannot be undone.'
              : 'Get 2 attempts on this question. Use wisely!'}</p>
            <div className="modal-btns">
              <button className="btn-gold" onClick={showModal === 'fiftyFifty' ? useFiftyFifty : useDoubleTry}>
                Yes, Use It!
              </button>
              <button className="btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}