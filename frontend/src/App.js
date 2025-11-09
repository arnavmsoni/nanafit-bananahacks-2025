import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, CheckCircle, AlertCircle, Play, Square, RefreshCw, ArrowLeft, Dumbbell } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5001';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'exercises', or 'workout'
  const [isStarted, setIsStarted] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState('Ready to go bananas? 🍌');
  const [totalBananas, setTotalBananas] = useState(0);
  const [streak, setStreak] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [backendFeedError, setBackendFeedError] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // eslint-disable-next-line no-unused-vars

  const muscleGroups = [
    {
      id: 'legs',
      name: 'Legs',
      icon: '🦵',
      color: '#22c55e',
      image: 'https://i.imgur.com/placeholder-legs.png',
      exercises: [
        { 
          id: 'squat', 
          name: 'Squats', 
          tips: 'Keep chest up, knees behind toes',
          instructions: [
            'Stand with feet shoulder-width apart',
            'Keep your chest up and core engaged',
            'Lower your hips back and down like sitting in a chair',
            'Go down until thighs are parallel to ground',
            'Push through your heels to stand back up',
            'Keep knees aligned with toes, not caving inward'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'lunge', 
          name: 'Lunges', 
          tips: 'Step forward, bend both knees to 90°',
          instructions: [
            'Start standing with feet hip-width apart',
            'Step forward with one leg about 2-3 feet',
            'Lower your hips until both knees are at 90°',
            'Front knee should be directly above ankle',
            'Back knee should hover just above the floor',
            'Push through front heel to return to start',
            'Alternate legs for each rep'
          ],
          difficulty: 'Beginner'
        }
      ]
    },
    {
      id: 'chest',
      name: 'Chest',
      icon: '💪',
      color: '#ef4444',
      exercises: [
        { 
          id: 'pushup', 
          name: 'Push-ups', 
          tips: 'Straight back, elbows at 45°',
          videoUrl: '/videos/pushup.mp4',
          instructions: [
            'Start in high plank position, hands shoulder-width',
            'Keep body in straight line from head to heels',
            'Engage your core and glutes throughout',
            'Lower chest toward floor, elbows at 45° angle',
            'Go down until chest nearly touches ground',
            'Push back up to starting position',
            'Keep neck neutral, looking slightly ahead'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'chest-press', 
          name: 'Chest Press', 
          tips: 'Push weights up, squeeze at top',
          videoUrl: '/videos/chest-press.mp4',
          instructions: [
            'Lie on bench with feet flat on floor',
            'Hold dumbbells at chest level, elbows bent',
            'Press weights straight up above chest',
            'Fully extend arms without locking elbows',
            'Squeeze chest muscles at the top',
            'Lower weights slowly back to chest level',
            'Maintain control throughout the movement'
          ],
          difficulty: 'Intermediate'
        },
        { 
          id: 'chest-dip', 
          name: 'Chest Dips', 
          tips: 'Lean forward, lower until shoulders at elbow level',
          videoUrl: '/videos/chest-dip.mp4',
          instructions: [
            'Grip parallel bars and lift yourself up',
            'Start with arms fully extended, body upright',
            'Lean your torso forward about 30 degrees',
            'Lower yourself by bending elbows outward',
            'Go down until shoulders are at elbow level',
            'Keep elbows flared out slightly for chest focus',
            'Push back up to starting position',
            'Maintain the forward lean throughout'
          ],
          difficulty: 'Intermediate'
        }
      ]
    },
    {
      id: 'back',
      name: 'Back',
      icon: '🏋️',
      color: '#3b82f6',
      exercises: [
        { 
          id: 'row', 
          name: 'Dumbbell Rows', 
          tips: 'Pull elbows back, squeeze shoulder blades',
          instructions: [
            'Place one knee and hand on bench for support',
            'Hold dumbbell in opposite hand, arm extended',
            'Keep back flat and core engaged',
            'Pull weight up toward your hip, elbow close to body',
            'Squeeze shoulder blade at the top',
            'Lower weight with control back to start',
            'Complete reps then switch sides'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'pullup', 
          name: 'Pull-ups', 
          tips: 'Full range, control descent',
          instructions: [
            'Hang from bar with overhand grip, hands shoulder-width',
            'Start from dead hang with arms fully extended',
            'Engage core and pull shoulder blades down',
            'Pull yourself up until chin clears the bar',
            'Keep elbows moving down and back',
            'Lower yourself with control back to dead hang',
            'Avoid swinging or using momentum'
          ],
          difficulty: 'Advanced'
        }
      ]
    },
    {
      id: 'arms',
      name: 'Arms',
      icon: '💪',
      color: '#f59e0b',
      exercises: [
        { 
          id: 'curl', 
          name: 'Bicep Curls', 
          tips: 'Keep elbows stationary, control motion',
          instructions: [
            'Stand with feet shoulder-width apart',
            'Hold dumbbells at sides with palms facing forward',
            'Keep elbows tucked close to your sides',
            'Curl weights up toward shoulders',
            'Squeeze biceps at the top of the movement',
            'Lower weights slowly with control',
            'Don\'t swing or use momentum'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'tricep-dip', 
          name: 'Tricep Dips', 
          tips: 'Lower body, extend arms fully',
          instructions: [
            'Sit on edge of bench, hands gripping edge beside hips',
            'Slide hips off bench with legs extended forward',
            'Lower body by bending elbows to 90°',
            'Keep elbows pointing straight back, not flaring',
            'Push through palms to straighten arms',
            'Keep shoulders down away from ears',
            'Bend knees to make it easier'
          ],
          difficulty: 'Intermediate'
        }
      ]
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      icon: '🤸',
      color: '#8b5cf6',
      exercises: [
        { 
          id: 'shoulder-press', 
          name: 'Shoulder Press', 
          tips: 'Press overhead, core tight',
          instructions: [
            'Stand or sit with dumbbells at shoulder height',
            'Palms facing forward, elbows bent at 90°',
            'Engage your core for stability',
            'Press weights straight up overhead',
            'Extend arms fully without locking elbows',
            'Lower weights with control back to shoulders',
            'Avoid arching your lower back'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'lateral-raise', 
          name: 'Lateral Raises', 
          tips: 'Lift to shoulder height',
          instructions: [
            'Stand with feet hip-width apart',
            'Hold dumbbells at sides, palms facing inward',
            'Keep slight bend in elbows throughout',
            'Lift weights out to sides until shoulder height',
            'Lead with elbows, not hands',
            'Pause briefly at the top',
            'Lower weights slowly back to start',
            'Don\'t use momentum or swing'
          ],
          difficulty: 'Beginner'
        }
      ]
    },
    {
      id: 'core',
      name: 'Core',
      icon: '🔥',
      color: '#ec4899',
      exercises: [
        { 
          id: 'plank', 
          name: 'Plank', 
          tips: 'Straight line from head to heels',
          instructions: [
            'Start in forearm plank position',
            'Elbows directly under shoulders',
            'Form straight line from head to heels',
            'Engage core by pulling belly button toward spine',
            'Squeeze glutes and keep hips level',
            'Look at floor just ahead of hands',
            'Breathe steadily, don\'t hold your breath',
            'Hold position for target time'
          ],
          difficulty: 'Beginner'
        },
        { 
          id: 'crunch', 
          name: 'Crunches', 
          tips: 'Lift shoulders, engage core',
          instructions: [
            'Lie on back with knees bent, feet flat',
            'Place hands behind head, elbows wide',
            'Press lower back into floor',
            'Lift shoulders off ground using abs',
            'Exhale as you crunch up',
            'Keep chin slightly tucked, not pulled to chest',
            'Lower back down with control',
            'Don\'t pull on your neck'
          ],
          difficulty: 'Beginner'
        }
      ]
    }
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      if (response.data.status === 'healthy') {
        setConnectionStatus('connected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Backend connection failed:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraError('');
      
      videoRef.current.onloadedmetadata = () => {
        processVideoFrame();
      };
    } catch (err) {
      setCameraError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const processVideoFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isStarted) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      canvas.toBlob(async (blob) => {
        if (blob && isStarted) {
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          formData.append('exercise', selectedExercise.id);

          try {
            const response = await axios.post(`${API_BASE_URL}/process_frame`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data) {
              if (response.data.rep_count !== undefined) {
                setRepCount(response.data.rep_count);
              }
              if (response.data.form_score !== undefined) {
                setFormScore(response.data.form_score);
              }
              if (response.data.feedback) {
                setFeedback(response.data.feedback);
              }
              if (response.data.annotated_frame) {
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                };
                img.src = `data:image/jpeg;base64,${response.data.annotated_frame}`;
              }
            }
          } catch (error) {
            console.error('Frame processing error:', error);
          }
        }

        if (isStarted) {
          animationRef.current = requestAnimationFrame(processVideoFrame);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Canvas error:', error);
    }
  };

  const handleMuscleGroupClick = (muscleGroup) => {
    setSelectedMuscleGroup(muscleGroup);
    setCurrentView('exercises');
  };

  const handleExerciseClick = (exercise) => {
    console.log('Exercise clicked:', exercise);
    console.log('Video URL:', exercise.videoUrl);
    setSelectedExercise(exercise);
    setCurrentView('workout');
    setBackendFeedError(false);
  };

  const handleBackToHome = () => {
    if (isStarted) {
      handleStop();
    }
    setCurrentView('home');
    setSelectedMuscleGroup(null);
    setSelectedExercise(null);
  };

  const handleBackToExercises = () => {
    if (isStarted) {
      handleStop();
    }
    setCurrentView('exercises');
    setSelectedExercise(null);
  };

  const handleStart = async () => {
    setIsStarted(true);
    setRepCount(0);
    setFormScore(100);
    setFeedback('Get ready to train! 🍌');
    
    try {
      await axios.post(`${API_BASE_URL}/start_session`, {
        exercise: selectedExercise.id
      });
      await startCamera();
    } catch (error) {
      console.error('Failed to start session:', error);
      setFeedback('Failed to connect to backend 😢');
    }
  };

  const handleStop = async () => {
    setIsStarted(false);
    stopCamera();
    
    try {
      const response = await axios.post(`${API_BASE_URL}/end_session`);
      if (response.data) {
        setTotalBananas(prev => prev + Math.floor(repCount / 5));
        if (response.data.streak) {
          setStreak(response.data.streak);
        }
      }
      setFeedback('Great workout! You earned it! 🍌');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Check if current exercise is push-up
  const isPushupExercise = selectedExercise?.id === 'pushup';

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            {currentView === 'exercises' && (
              <button onClick={handleBackToHome} className="back-button">
                <ArrowLeft className="back-icon" />
              </button>
            )}
            {currentView === 'workout' && (
              <button onClick={handleBackToExercises} className="back-button">
                <ArrowLeft className="back-icon" />
              </button>
            )}
            <div className="banana-icon">🍌</div>
            <div>
              <h1>NanaFit</h1>
              <p className="tagline">Go Bananas with Perfect Form!</p>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon-value">
                <Trophy className="stat-icon trophy" />
                <span className="stat-number">{totalBananas}</span>
              </div>
              <div className="stat-label">Bananas Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-value">
                <TrendingUp className="stat-icon streak" />
                <span className="stat-number">{streak}</span>
              </div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {currentView === 'home' ? (
          /* HOME PAGE - Muscle Group Selection */
          <div className="home-page">
            <div className="welcome-section">
              <h2 className="welcome-title">Choose Your Muscle Group</h2>
              <p className="welcome-subtitle">Select a muscle group to start your workout</p>
            </div>
            
            <div className="muscle-groups-grid">
              {muscleGroups.map((group) => (
                <button
                  key={group.id}
                  className="muscle-group-card"
                  onClick={() => handleMuscleGroupClick(group)}
                  style={{ '--card-color': group.color }}
                >
                  <div className="muscle-group-image-wrapper">
                    <img 
                      src={`/images/${group.id}.png`}
                      alt={`${group.name} Banana Character`}
                      className="banana-muscle-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="banana-fallback" style={{ display: 'none' }}>
                      {group.icon}
                    </div>
                  </div>
                  <h3 className="muscle-group-name">{group.name}</h3>
                  <p className="muscle-group-exercises">
                    {group.exercises.length} exercises
                  </p>
                  <div className="muscle-group-hover">
                    <Dumbbell className="hover-icon" />
                    <span>View Exercises</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="tips-section">
              <h3 className="tips-title">🍌 Beginner Tips</h3>
              <div className="tips-grid">
                <div className="tip-item">
                  <span className="tip-icon">📹</span>
                  <p>Position yourself so your full body is visible in the camera</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">⏱️</span>
                  <p>Move slowly and focus on form over speed</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <p>Listen to the feedback and adjust your posture</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🍌</span>
                  <p>Earn bananas by completing sets with good form!</p>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'exercises' ? (
          /* EXERCISE SELECTION PAGE */
          <div className="exercises-page">
            <div className="exercise-selection-header">
              <div 
                className="muscle-group-badge"
                style={{ '--badge-color': selectedMuscleGroup?.color }}
              >
                <span className="badge-icon">{selectedMuscleGroup?.icon}</span>
                <h2 className="badge-title">{selectedMuscleGroup?.name} Exercises</h2>
              </div>
              <p className="exercise-selection-subtitle">
                Choose an exercise to begin your {selectedMuscleGroup?.name.toLowerCase()} workout
              </p>
            </div>

            <div className="exercises-grid">
              {selectedMuscleGroup?.exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  className="exercise-card"
                  onClick={() => handleExerciseClick(exercise)}
                  style={{ '--exercise-color': selectedMuscleGroup.color }}
                >
                  <div className="exercise-card-header">
                    <span className="exercise-number">#{index + 1}</span>
                    <div className="difficulty-badge" data-difficulty={exercise.difficulty}>
                      {exercise.difficulty}
                    </div>
                  </div>
                  <h3 className="exercise-card-title">{exercise.name}</h3>
                  <p className="exercise-card-tips">💡 {exercise.tips}</p>
                  
                  <div className="exercise-instructions">
                    <h4 className="instructions-title">Step-by-Step:</h4>
                    <ol className="instructions-list">
                      {exercise.instructions.slice(0, 4).map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                      {exercise.instructions.length > 4 && (
                        <li className="more-steps">+{exercise.instructions.length - 4} more steps...</li>
                      )}
                    </ol>
                  </div>

                  <div className="exercise-card-footer">
                    <span className="start-text">Start Exercise</span>
                    <ArrowLeft className="arrow-icon" style={{ transform: 'rotate(180deg)' }} />
                  </div>
                </button>
              ))}
            </div>

            <div className="exercise-info-section">
              <div className="info-card">
                <h3 className="info-title">🎯 Training Tips for {selectedMuscleGroup?.name}</h3>
                <ul className="info-list">
                  <li>Warm up for 5-10 minutes before starting</li>
                  <li>Focus on controlled movements, not speed</li>
                  <li>Breathe consistently throughout each rep</li>
                  <li>Rest 30-60 seconds between sets</li>
                  <li>Stay hydrated during your workout</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* WORKOUT PAGE - Split Screen View */
          <div className="workout-page">
            {/* Split Screen: Banana Bot | User Camera */}
            <div className="split-screen-container">
              {/* Left Side - Banana Bot */}
              <div className="banana-bot-side">
                <div className="side-header"> 
                  <div className="side-label">
                    <span className="label-icon">🍌</span>
                    <span className="label-text">Banana Bot</span>
                  </div>
                  <div className="exercise-name">{selectedExercise?.name}</div>
                </div>
                <div className="bot-video-wrapper">
                  {selectedExercise?.videoUrl ? (
                    <video
                      key={selectedExercise.id}
                      className="banana-bot-video"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      style={{ pointerEvents: 'none' }}
                      onError={(e) => {
                        console.error('❌ Video failed to load:', selectedExercise.videoUrl);
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    >
                      <source src={selectedExercise.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="video-fallback" style={{ display: 'flex' }}>
                      <div className="fallback-content">
                        <div className="big-banana">🍌</div>
                        <p className="fallback-text">No Video Available</p>
                        <p className="fallback-subtext">{selectedExercise?.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="bot-overlay-badge">Exercise Demo</div>
                </div>
              </div>

              {/* Right Side - User Camera */}
              <div className="user-camera-side">
                <div className="user-video-wrapper">
                  {isPushupExercise ? (
                    <>
                      <img
                        src={`${API_BASE_URL}/video_feed`}
                        alt="Push-up Detection Feed"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: backendFeedError ? "none" : "block",
                        }}
                        onError={() => {
                          console.error('❌ Backend video feed failed to load');
                          setBackendFeedError(true);
                        }}
                      />
                      {backendFeedError && (
                        <div className="video-fallback" style={{ display: 'flex' }}>
                          <div className="fallback-content">
                            <AlertCircle style={{ width: '4rem', height: '4rem', color: '#ef4444', marginBottom: '1rem' }} />
                            <p className="fallback-text">Backend Not Connected</p>
                            <p className="fallback-subtext" style={{ marginTop: '0.5rem' }}>
                              Make sure Flask server is running on port 5001
                            </p>
                            <p className="fallback-subtext" style={{ fontSize: '0.875rem', marginTop: '1rem', color: '#9ca3af' }}>
                              Run: python server.py
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="camera-placeholder">
                      <div className="placeholder-content">
                        <div className="big-banana">🍌</div>
                        <p className="placeholder-title">AI Tracking Coming Soon!</p>
                        <p className="placeholder-subtitle">Currently only available for Push-ups</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;