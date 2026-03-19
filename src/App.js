import React from 'react';
import { QuizProvider, useQuiz } from './context/QuizContext';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Leaderboard from './pages/Leaderboard';
import './App.css';

function AppContent() {
  const { phase } = useQuiz();
  return (
    <div className="app">
      {phase === 'landing' && <Landing />}
      {phase === 'quiz' && <Quiz />}
      {phase === 'result' && <Result />}
      {phase === 'leaderboard' && <Leaderboard />}
    </div>
  );
}

export default function App() {
  return (
    <QuizProvider>
      <AppContent />
    </QuizProvider>
  );
}
