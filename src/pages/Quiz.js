import React, { useState, useEffect, useCallback } from 'react';
import { useQuiz } from '../context/QuizContext';
import { submitQuiz } from '../utils/api';
import './Quiz.css';

const TOTAL_TIME = 600; // 10 minutes in seconds
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

  const [selected, setSelected]     = useState(null);
  const [timeLeft, setTimeLeft]     = useState(TOTAL_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [showLifelineModal, setShowLifelineModal] = useState(null);
  const [locked, setLocked]         = useState(false);

  const q      = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  // Overall 10-minute countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          // Time's up — auto submit with whatever answers we have
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // only runs once on mount

  const handleTimeUp = useCallback(() => {
    setLocked(true);
    finishQuiz(answers);
  }, [answers]);

  // Reset selection state on question change (but NOT timer)
  useEffect(() => {
    setSelected(null);
    setLocked(false);
    if (!doubleTryActive) setEliminatedOptions([]);
  }, [currentQ]);

  const goNext = useCallback((opt) => {
    setLocked(true);
    const updatedAnswers = { ...answers, [q.id]: opt };
    setAnswers(updatedAnswers);
    setTimeout(() => {
      if (currentQ + 1 >= totalQ) {
        finishQuiz(updatedAnswers);
      } else {
        setDoubleTryFirst(null);
        setDoubleTryActive(false);
        setCurrentQ(c => c + 1);
      }
    }, 600);
  }, [answers, currentQ, q, totalQ]);

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

  const finishQuiz = async (finalAnswers) => {
    setSubmitting(true);
    const timeTaken = TOTAL_TIME - timeLeft;
    try {
      const res = await submitQuiz({ userId, answers: finalAnswers, timeTaken, lifelinesUsed });
      setScore(res.data.result);
      // Mark user as played in localStorage so they can't play again
      localStorage.setItem(`played_${userId}`, 'true');
      setPhase('result');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty || locked) return;
    const available = OPTIONS.filter(o => o !== selected);
    const toEliminate = available.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }));
    setShowLifelineModal(null);
  };

  const useDoubleTry = () => {
    if (lifelinesUsed.doubleTry || selected || locked) return;
    setDoubleTryActive(true);
    setLifelinesUsed(prev => ({ ...prev, doubleTry: true }));
    setShowLifelineModal(null);
  };

  // Format mm:ss
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= 60 ? '#e50914' : timeLeft <= 120 ? '#ff9800' : 'var(--gold)';

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
        <div className="quiz-header-left">
          <div className="player-badge"><span className="player-icon">🎭</span><span>{userId}</span></div>
        </div>
        <div className="quiz-header-center">
          <div className="question-counter">
            <span className="q-num">{currentQ + 1}</span>
            <span className="q-sep">/</span>
            <span className="q-total">{totalQ}</span>
          </div>
        </div>
        <div className="quiz-header-right">
          <div className="timer-box" style={{ color: timerColor, borderColor: timerColor }}>
            <span className="timer-icon">⏱</span>
            <span className="timer-val">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Overall progress bar (questions) */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        {/* Time bar */}
        <div className="progress-timer" style={{
          width: `${(timeLeft / TOTAL_TIME) * 100}%`,
          background: timerColor
        }} />
      </div>

      <div className="quiz-body">
        <div className="lifelines-bar">
          <button className={`lifeline-btn ${lifelinesUsed.fiftyFifty ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.fiftyFifty && !locked && setShowLifelineModal('fiftyFifty')}>
            <span className="ll-icon">✂️</span>
            <span>50:50</span>
            {lifelinesUsed.fiftyFifty && <span className="used-badge">USED</span>}
          </button>
          <button className={`lifeline-btn ${lifelinesUsed.doubleTry ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.doubleTry && !selected && !locked && setShowLifelineModal('doubleTry')}>
            <span className="ll-icon">🎯</span>
            <span>Double Try</span>
            {lifelinesUsed.doubleTry && <span className="used-badge">USED</span>}
          </button>
          {doubleTryActive && (
            <div className="double-try-active">
              {doubleTryFirst ? `🎯 Selected: ${doubleTryFirst} — Confirm or change` : '🎯 DOUBLE TRY ACTIVE — Pick carefully!'}
            </div>
          )}
        </div>

        <div className="question-card">
          <div className="q-number-tag">Q{currentQ + 1}</div>
          <div className="question-points"><span>💎 {q?.points || 100} pts</span></div>
          <p className="question-text">{q?.question}</p>
        </div>

        {/* Always render all 4 options */}
        <div className="options-grid">
          {OPTIONS.map(opt => {
            const isEliminated = eliminatedOptions.includes(opt);
            const isSelected   = selected === opt;
            const isFirstPick  = doubleTryFirst === opt;
            return (
              <button
                key={opt}
                className={['option-btn', isEliminated ? 'eliminated' : '', isSelected && !isFirstPick ? 'selected' : '', isFirstPick ? 'double-first' : ''].join(' ').trim()}
                onClick={() => handleSelect(opt)}
                disabled={isEliminated || (locked && !isSelected)}
              >
                <span className="opt-label">{opt}</span>
                <span className="opt-text">{q?.options?.[opt]}</span>
              </button>
            );
          })}
        </div>

        {doubleTryActive && doubleTryFirst && !locked && (
          <button className="confirm-btn btn-gold" onClick={() => { setSelected(doubleTryFirst); goNext(doubleTryFirst); }}>
            ✅ Confirm Answer → {doubleTryFirst}
          </button>
        )}

        {!selected && !locked && (
          <button className="skip-btn" onClick={() => goNext(null)}>Skip Question →</button>
        )}
      </div>

      {showLifelineModal && (
        <div className="modal-overlay" onClick={() => setShowLifelineModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{showLifelineModal === 'fiftyFifty' ? '✂️ USE 50:50?' : '🎯 USE DOUBLE TRY?'}</h3>
            <p>{showLifelineModal === 'fiftyFifty' ? 'Two wrong options will be eliminated. This cannot be undone.' : 'You will get 2 attempts on this question. Use it wisely!'}</p>
            <div className="modal-btns">
              <button className="btn-gold" onClick={showLifelineModal === 'fiftyFifty' ? useFiftyFifty : useDoubleTry}>Yes, Use It!</button>
              <button className="btn-outline" onClick={() => setShowLifelineModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}