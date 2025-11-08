import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, CheckCircle, AlertCircle, Heart, Play, Square, RefreshCw } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState('Ready to go bananas? 🍌');
  const [totalBananas, setTotalBananas] = useState(0);
  const [streak, setStreak] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const exercises = [
    { id: 'squat', name: 'Squats', icon: '🦵', tips: 'Keep chest up, knees behind toes' },
    { id: 'pushup', name: 'Push-ups', icon: '💪', tips: 'Straight back, elbows at 45°' },
    { id: 'plank', name: 'Plank', icon: '🏋️', tips: 'Straight line from head to heels' },
    { id: 'curl', name: 'Bicep Curls', icon: '💪', tips: 'Keep elbows stationary' }
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      if (response.data.status === 'healthy') setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraError('');
      videoRef.current.onloadedmetadata = () => processVideoFrame();
    } catch {
      setCameraError('Camera access denied. Please enable permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const processVideoFrame = () => {
    if (!isStarted) return;
    animationRef.current = requestAnimationFrame(processVideoFrame);
  };

  const handleStart = async () => {
    setIsStarted(true);
    setFeedback('Get ready to train! 🍌');
    await startCamera();
  };

  const handleStop = async () => {
    setIsStarted(false);
    stopCamera();
    setFeedback('Great workout! You earned bananas! 🍌');
    setTotalBananas(prev => prev + Math.floor(repCount / 5));
  };

  return (
    <div className="app-container banana-theme">
      {/* Floating bananas */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="floating-banana"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, -200, -200, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: i * 0.8 }}
        >
          🍌
        </motion.div>
      ))}

      {/* Header */}
      <header className="app-header">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <h1 className="app-title">🍌 NanaFit</h1>
          <p className="tagline">Go Bananas with Perfect Form!</p>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <div className="video-grid">
          {/* Left: Banana AI Trainer */}
          <motion.div
            className="trainer-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2VydGlwZTVpY3kwbXFoMnZpYWptMHRxazJtd2U3M3dwdmcwYmQ1MCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zhJRK1McS6kqY/giphy.gif"
              alt="Banana Trainer"
              className="banana-trainer"
            />
            <p className="trainer-caption">Follow the Banana Man!</p>
          </motion.div>

          {/* Right: User camera */}
          <div className="user-camera">
            <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
            <canvas ref={canvasRef} className="video-overlay" />
            {cameraError && <p className="error-msg">{cameraError}</p>}
          </div>
        </div>

        {/* Bottom panel */}
        <motion.div
          className="control-panel"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="stats-row">
            <div className="stat-card">
              <Trophy className="stat-icon trophy" />
              <span>{totalBananas}</span>
              <p>Bananas</p>
            </div>
            <div className="stat-card">
              <TrendingUp className="stat-icon streak" />
              <span>{streak}</span>
              <p>Streak</p>
            </div>
          </div>

          <div className="exercise-buttons">
            {exercises.map(ex => (
              <motion.button
                key={ex.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`exercise-btn ${selectedExercise === ex.id ? 'selected' : ''}`}
                onClick={() => setSelectedExercise(ex.id)}
                disabled={isStarted}
              >
                {ex.icon} {ex.name}
              </motion.button>
            ))}
          </div>

          <div className="control-buttons">
            {!isStarted ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={handleStart}
                className="start-btn"
              >
                <Play /> Start Workout
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={handleStop}
                className="stop-btn"
              >
                <Square /> Stop Workout
              </motion.button>
            )}
            <motion.button
              whileHover={{ rotate: 180 }}
              onClick={checkConnection}
              className="refresh-btn"
              disabled={isStarted}
            >
              <RefreshCw />
            </motion.button>
          </div>

          <div className="feedback-msg">
            {formScore >= 90 ? <CheckCircle className="good" /> : <AlertCircle className="warn" />}
            <p>{feedback}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
