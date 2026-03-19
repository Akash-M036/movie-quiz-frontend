import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

export const getQuestions = () => API.get('/quiz/questions');
export const submitQuiz = (data) => API.post('/quiz/submit', data);
export const getLeaderboard = () => API.get('/leaderboard');
export const getUserStats = (userId) => API.get(`/leaderboard/user/${userId}`);

export default API;
