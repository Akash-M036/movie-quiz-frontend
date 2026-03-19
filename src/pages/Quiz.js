import React, { useState, useEffect, useCallback } from 'react';
import { useQuiz } from '../context/QuizContext';
import { submitQuiz } from '../utils/api';
import './Quiz.css';

const QUESTION_TIME = 30; // seconds per question
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

  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [showLifelineModal, setShowLifelineModal] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct' | 'wrong' | null
  const [wrongFirst, setWrongFirst] = useState(false);

  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  // Timer
  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelected(null);
    setAnswerStatus(null);
    setWrongFirst(false);
    if (!doubleTryActive) {
      setEliminatedOptions([]);
    }
  }, [currentQ]);

  useEffect(() => {
    if (answerStatus) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleNext(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQ, answerStatus]);

  const handleSelect = (opt) => {
    if (selected || eliminatedOptions.includes(opt) || answerStatus === 'correct') return;

    if (doubleTryActive && !doubleTryFirst) {
      // First attempt with double try
      setDoubleTryFirst(opt);
      setSelected(opt);
      // We don't reveal answer yet - just mark selection visually
    } else {
      setSelected(opt);
      handleNext(opt);
    }
  };

  const handleNext = useCallback((opt) => {
    const updatedAnswers = { ...answers, [q.id]: opt };
    setAnswers(updatedAnswers);

    if (currentQ + 1 >= totalQ) {
      finishQuiz(updatedAnswers);
    } else {
      setDoubleTryFirst(null);
      setDoubleTryActive(false);
      setTimeout(() => {
        setCurrentQ(c => c + 1);
        setSelected(null);
        setAnswerStatus(null);
      }, 400);
    }
  }, [answers, currentQ, q, totalQ]);

  const finishQuiz = async (finalAnswers) => {
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await submitQuiz({
        userId,
        answers: finalAnswers,
        timeTaken,
        lifelinesUsed
      });
      setScore(res.data.result);
      setPhase('result');
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty) return;
    const wrong = OPTIONS.filter(o => o !== 'X'); // We don't know correct answer client-side
    // Eliminate 2 random non-selected options (we just pick 2 from available)
    const available = OPTIONS.filter(o => o !== selected);
    const toEliminate = available.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions(toEliminate);
    setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }));
    setShowLifelineModal(null);
  };

  const useDoubleTry = () => {
    if (lifelinesUsed.doubleTry || selected) return;
    setDoubleTryActive(true);
    setLifelinesUsed(prev => ({ ...prev, doubleTry: true }));
    setShowLifelineModal(null);
  };

  const formatTime = (s) => s.toString().padStart(2, '0');
  const timerColor = timeLeft <= 5 ? '#e50914' : timeLeft <= 10 ? '#ff9800' : 'var(--gold)';

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

      {/* Header */}
      <header className="quiz-header">
        <div className="quiz-header-left">
          <div className="player-badge">
            <span className="player-icon">🎭</span>
            <span>{userId}</span>
          </div>
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

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div className="progress-timer" style={{
          width: `${(timeLeft / QUESTION_TIME) * 100}%`,
          background: timerColor
        }} />
      </div>

      {/* Main content */}
      <div className="quiz-body">
        {/* Lifelines */}
        <div className="lifelines-bar">
          <button
            className={`lifeline-btn ${lifelinesUsed.fiftyFifty ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.fiftyFifty && setShowLifelineModal('fiftyFifty')}
            title="50:50 - Eliminate 2 wrong options"
          >
            <span className="ll-icon">✂️</span>
            <span>50:50</span>
            {lifelinesUsed.fiftyFifty && <span className="used-badge">USED</span>}
          </button>
          <button
            className={`lifeline-btn ${lifelinesUsed.doubleTry ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.doubleTry && !selected && setShowLifelineModal('doubleTry')}
            title="Double Try - 2 attempts on this question"
          >
            <span className="ll-icon">🎯</span>
            <span>Double Try</span>
            {lifelinesUsed.doubleTry && <span className="used-badge">USED</span>}
          </button>
          {doubleTryActive && (
            <div className="double-try-active">🎯 DOUBLE TRY ACTIVE — Pick carefully!</div>
          )}
        </div>

        {/* Question card */}
        <div className="question-card">
          <div className="q-number-tag">Q{currentQ + 1}</div>
          <div className="question-points">
            <span>💎 {q?.points || 100} pts</span>
          </div>
          <p className="question-text">{q?.question}</p>
        </div>

        {/* Options */}
        <div className="options-grid">
          {OPTIONS.map(opt => {
            const isEliminated = eliminatedOptions.includes(opt);
            const isSelected = selected === opt;

            return (
              <button
                key={opt}
                className={`option-btn 
                  ${isEliminated ? 'eliminated' : ''}
                  ${isSelected && !doubleTryActive ? 'selected' : ''}
                  ${doubleTryFirst === opt ? 'double-first' : ''}
                `}
                onClick={() => handleSelect(opt)}
                disabled={isEliminated || (selected && !doubleTryActive)}
              >
                <span className="opt-label">{opt}</span>
                <span className="opt-text">{q?.options?.[opt]}</span>
              </button>
            );
          })}
        </div>

        {/* Skip button */}
        {selected && doubleTryActive && (
          <button className="confirm-btn btn-gold" onClick={() => handleNext(selected)}>
            Confirm Answer → {selected}
          </button>
        )}

        {!selected && (
          <button className="skip-btn" onClick={() => handleNext(null)}>
            Skip Question →
          </button>
        )}
      </div>

      {/* Lifeline confirmation modal */}
      {showLifelineModal && (
        <div className="modal-overlay" onClick={() => setShowLifelineModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{showLifelineModal === 'fiftyFifty' ? '✂️ USE 50:50?' : '🎯 USE DOUBLE TRY?'}</h3>
            <p>
              {showLifelineModal === 'fiftyFifty'
                ? 'Two wrong options will be eliminated. This cannot be undone.'
                : 'You will get 2 attempts on this question. Use it wisely!'}
            </p>
            <div className="modal-btns">
              <button className="btn-gold" onClick={showLifelineModal === 'fiftyFifty' ? useFiftyFifty : useDoubleTry}>
                Yes, Use It!
              </button>
              <button className="btn-outline" onClick={() => setShowLifelineModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
