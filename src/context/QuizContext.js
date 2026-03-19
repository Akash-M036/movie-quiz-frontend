import React, { createContext, useContext, useState, useCallback } from 'react';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [userId, setUserId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [phase, setPhase] = useState('landing'); // landing | quiz | result | leaderboard
  const [lifelinesUsed, setLifelinesUsed] = useState({ fiftyFifty: false, doubleTry: false });
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [doubleTryActive, setDoubleTryActive] = useState(false);
  const [doubleTryFirst, setDoubleTryFirst] = useState(null);

  const resetQuiz = useCallback(() => {
    setCurrentQ(0);
    setAnswers({});
    setScore(null);
    setStartTime(null);
    setLifelinesUsed({ fiftyFifty: false, doubleTry: false });
    setEliminatedOptions([]);
    setDoubleTryActive(false);
    setDoubleTryFirst(null);
  }, []);

  return (
    <QuizContext.Provider value={{
      userId, setUserId,
      questions, setQuestions,
      currentQ, setCurrentQ,
      answers, setAnswers,
      score, setScore,
      startTime, setStartTime,
      phase, setPhase,
      lifelinesUsed, setLifelinesUsed,
      eliminatedOptions, setEliminatedOptions,
      doubleTryActive, setDoubleTryActive,
      doubleTryFirst, setDoubleTryFirst,
      resetQuiz
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
