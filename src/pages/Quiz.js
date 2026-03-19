import React, { useState, useEffect, useCallback } from 'react';
import { useQuiz } from '../context/QuizContext';
import { submitQuiz } from '../utils/api';
import './Quiz.css';

const TOTAL_TIME = 600; // ✅ 10 minutes
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
const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
const [submitting, setSubmitting] = useState(false);
const [showLifelineModal, setShowLifelineModal] = useState(null);

const q = questions[currentQ];
const totalQ = questions.length;
const progress = ((currentQ + 1) / totalQ) * 100;

// ✅ GLOBAL TIMER (10 minutes)
useEffect(() => {
const timer = setInterval(() => {
setTimeLeft(t => {
if (t <= 1) {
clearInterval(timer);
finishQuiz(answers); // auto submit
return 0;
}
return t - 1;
});
}, 1000);

```
return () => clearInterval(timer);
```

}, []);

// Reset per question (without timer reset)
useEffect(() => {
setSelected(null);
if (!doubleTryActive) {
setEliminatedOptions([]);
}
}, [currentQ]);

const handleSelect = (opt) => {
if (selected || eliminatedOptions.includes(opt)) return;

```
if (doubleTryActive && !doubleTryFirst) {
  setDoubleTryFirst(opt);
  setSelected(opt);
} else {
  setSelected(opt);
  handleNext(opt);
}
```

};

const handleNext = useCallback((opt) => {
const updatedAnswers = { ...answers, [q.id]: opt };
setAnswers(updatedAnswers);

```
if (currentQ + 1 >= totalQ) {
  finishQuiz(updatedAnswers);
} else {
  setDoubleTryFirst(null);
  setDoubleTryActive(false);
  setTimeout(() => {
    setCurrentQ(c => c + 1);
    setSelected(null);
  }, 300);
}
```

}, [answers, currentQ, q, totalQ]);

const finishQuiz = async (finalAnswers) => {
setSubmitting(true);
const timeTaken = Math.floor((Date.now() - startTime) / 1000);

```
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
```

};

// ✅ 50:50 FIXED
const useFiftyFifty = () => {
if (lifelinesUsed.fiftyFifty) return;

```
const available = OPTIONS.filter(o => o !== selected);
const shuffled = [...available].sort(() => Math.random() - 0.5);
const toEliminate = shuffled.slice(0, 2);

setEliminatedOptions(toEliminate);
setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }));
setShowLifelineModal(null);
```

};

const useDoubleTry = () => {
if (lifelinesUsed.doubleTry || selected) return;
setDoubleTryActive(true);
setLifelinesUsed(prev => ({ ...prev, doubleTry: true }));
setShowLifelineModal(null);
};

const formatTime = (s) => {
const min = Math.floor(s / 60);
const sec = s % 60;
return `${min}:${sec.toString().padStart(2, '0')}`;
};

const timerColor =
timeLeft <= 30 ? '#e50914' :
timeLeft <= 120 ? '#ff9800' :
'var(--gold)';

if (submitting) {
return ( <div className="quiz-loading"> <div className="submit-loader"> <div className="film-reel">🎬</div> <p>Calculating your score...</p> </div> </div>
);
}

return ( <div className="quiz-page">

```
  {/* Header */}
  <header className="quiz-header">
    <div>{userId}</div>

    <div>
      {currentQ + 1} / {totalQ}
    </div>

    <div className="timer-box" style={{ color: timerColor }}>
      ⏱ {formatTime(timeLeft)}
    </div>
  </header>

  {/* Progress */}
  <div className="progress-track">
    <div className="progress-fill" style={{ width: `${progress}%` }} />
    <div
      className="progress-timer"
      style={{
        width: `${(timeLeft / TOTAL_TIME) * 100}%`
      }}
    />
  </div>

  {/* Body */}
  <div className="quiz-body">

    <div className="question-card">
      <p className="question-text">{q?.question}</p>
    </div>

    {/* Options */}
    <div className="options-grid">
      {OPTIONS.map(opt => {
        const isEliminated = eliminatedOptions.includes(opt);

        return (
          <button
            key={opt}
            className={`option-btn ${isEliminated ? 'eliminated' : ''}`}
            onClick={() => handleSelect(opt)}
            disabled={isEliminated}
          >
            <span className="opt-label">{opt}</span>
            <span className="opt-text">{q?.options?.[opt]}</span>
          </button>
        );
      })}
    </div>

    {!selected && (
      <button className="skip-btn" onClick={() => handleNext(null)}>
        Skip Question →
      </button>
    )}

  </div>
</div>


);
}
