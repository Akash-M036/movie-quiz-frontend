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
    lifelinesUsed, setLifelinesUsed,
    doubleTryActive, setDoubleTryActive,
    doubleTryFirst, setDoubleTryFirst
  } = useQuiz();

  const [selected, setSelected]     = useState(null);
  const [eliminated, setEliminated] = useState([]);
  const [timeLeft, setTimeLeft]     = useState(TOTAL_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal]   = useState(null);
  const [locked, setLocked]         = useState(false);

  const answersRef  = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  answersRef.current  = answers;
  timeLeftRef.current = timeLeft;

  const q      = questions[currentQ];
  const totalQ = questions.length;

  // Log question data to debug
  console.log('Current Q:', currentQ, 'Question object:', q);
  console.log('Options:', q?.options);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); doFinish(answersRef.current, 0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  useEffect(() => {
    setSelected(null);
    setEliminated([]);
    setLocked(false);
    setDoubleTryFirst(null);
  }, [currentQ]);

  const doFinish = async (finalAnswers, remaining) => {
    setSubmitting(true);
    const timeTaken = TOTAL_TIME - (remaining ?? timeLeftRef.current);
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
    setLocked(true);
    const updated = { ...answersRef.current, [q.id]: opt };
    setAnswers(updated);
    setTimeout(() => {
      if (currentQ + 1 >= totalQ) {
        doFinish(updated, timeLeftRef.current);
      } else {
        setDoubleTryActive(false);
        setCurrentQ(c => c + 1);
      }
    }, 700);
  };

  const handleSelect = (opt) => {
    if (locked || eliminated.includes(opt)) return;
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
    const pool = OPTIONS.filter(o => o !== selected && o !== doubleTryFirst);
    const toElim = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(toElim);
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
    const sc = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
  };

  const timerColor = timeLeft <= 60 ? '#e50914' : timeLeft <= 120 ? '#ff9800' : '#f5c518';
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

  // Safety check — if question not loaded yet
  if (!q || !q.options) return (
    <div className="quiz-loading">
      <div className="stars-bg" />
      <div className="submit-loader">
        <div className="film-reel">⏳</div>
        <p>Loading question...</p>
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
          <button className={`lifeline-btn ${lifelinesUsed.fiftyFifty ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.fiftyFifty && !locked && setShowModal('fiftyFifty')}>
            <span>✂️</span><span>50:50</span>
            {lifelinesUsed.fiftyFifty && <span className="used-badge">USED</span>}
          </button>
          <button className={`lifeline-btn ${lifelinesUsed.doubleTry ? 'used' : ''}`}
            onClick={() => !lifelinesUsed.doubleTry && !locked && setShowModal('doubleTry')}>
            <span>🎯</span><span>Double Try</span>
            {lifelinesUsed.doubleTry && <span className="used-badge">USED</span>}
          </button>
          {doubleTryActive && (
            <div className="double-try-active">
              {doubleTryFirst ? `🎯 Selected: ${doubleTryFirst}` : '🎯 DOUBLE TRY — Pick!'}
            </div>
          )}
        </div>

        {/* Question */}
        <div className="question-card">
          <div className="q-number-tag">Q{currentQ + 1}</div>
          <div className="question-points">💎 {q.points || 100} PTS</div>
          <p className="question-text">{q.question}</p>
        </div>

        {/* OPTIONS — hardcoded A B C D, no map, no CSS classes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', width:'100%' }}>

          {['A','B','C','D'].map(opt => {
            const val     = q.options[opt] || '—';
            const isElim  = eliminated.includes(opt);
            const isSel   = selected === opt && opt !== doubleTryFirst;
            const isFirst = doubleTryFirst === opt;

            const bg     = isSel ? 'rgba(245,197,24,0.15)' : isFirst ? 'rgba(124,77,255,0.15)' : '#1e1e2e';
            const border = isSel ? '#f5c518' : isFirst ? '#7c4dff' : 'rgba(255,255,255,0.1)';
            const color  = isSel ? '#f5c518' : isFirst ? '#ce93d8' : '#e8e8f0';

            return (
              <div
                key={opt}
                onClick={() => !isElim && !locked && handleSelect(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 18px',
                  borderRadius: '10px',
                  border: `1px solid ${border}`,
                  background: bg,
                  color: color,
                  cursor: isElim || locked ? 'default' : 'pointer',
                  opacity: isElim ? 0.2 : 1,
                  textDecoration: isElim ? 'line-through' : 'none',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  userSelect: 'none',
                  minHeight: '60px',
                }}
              >
                <span style={{
                  minWidth:'32px', height:'32px',
                  borderRadius:'50%',
                  background:'#12121a',
                  border:'1px solid rgba(255,255,255,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Cinzel,serif', fontWeight:700,
                  fontSize:'0.8rem', color:'#f5c518', flexShrink:0
                }}>
                  {opt}
                </span>
                <span style={{ flex:1, lineHeight:1.4 }}>{val}</span>
              </div>
            );
          })}

        </div>

        {doubleTryActive && doubleTryFirst && !locked && (
          <button className="confirm-btn btn-gold"
            onClick={() => { setSelected(doubleTryFirst); goNext(doubleTryFirst); }}>
            ✅ Confirm → {doubleTryFirst}
          </button>
        )}

        {!locked && !selected && (
          <button className="skip-btn" onClick={() => goNext(null)}>Skip →</button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{showModal === 'fiftyFifty' ? '✂️ USE 50:50?' : '🎯 USE DOUBLE TRY?'}</h3>
            <p>{showModal === 'fiftyFifty'
              ? 'Eliminates 2 wrong options. Cannot be undone.'
              : 'Get 2 attempts on this question. Use wisely!'}</p>
            <div className="modal-btns">
              <button className="btn-gold" onClick={showModal === 'fiftyFifty' ? useFiftyFifty : useDoubleTry}>Yes, Use It!</button>
              <button className="btn-outline" onClick={() => setShowModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}