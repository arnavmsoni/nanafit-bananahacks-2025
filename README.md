# NanaFit — AI-Powered Fitness Trainer  

### 🏆 1st Place — BananaHacks (CornHacks 2025), University of Nebraska–Lincoln  
**Award:** iPads for all team members  

NanaFit is an AI-powered fitness platform that provides **real-time exercise form feedback** and **rep tracking** through your browser.  
Built in 24 hours at BananaHacks 2025 (CornHacks @ UNL), NanaFit won **1st place overall** for its innovation, performance, and user-focused design.  

---

## 🚀 Overview  
NanaFit transforms any webcam into a personal trainer powered by **computer vision** and **AI pose estimation**.  
Users can select a muscle group, view guided demonstration videos, and perform exercises like pushups and squats while receiving **instant feedback** on form and posture.  

At its core, NanaFit uses **Google MediaPipe Pose Detection**, which achieves up to **95% landmark accuracy** on standard webcams and tracks **33 key human body points** (shoulders, elbows, hips, knees, etc.) at **30+ FPS**.  
This allows the system to detect subtle posture deviations in real time — for example, identifying when a user’s hips are too high during a pushup or when elbows fail to reach a full extension.

---

## ⚙️ Tech Stack  

- **Frontend — React.js:**  
  Component-based interface with real-time state management, exercise previews, and side-by-side live feedback.  

- **Backend — Flask (Python):**  
  Streams webcam frames to the AI model, processes body landmark data, and returns real-time analysis to the browser.  

- **Pose Estimation — Google MediaPipe:**  
  - Tracks **33 body landmarks** per frame using a lightweight ML model optimized for CPU and GPU execution.  
  - Operates with **~95% accuracy** in detecting joint positions under standard lighting conditions.  
  - Provides continuous real-time inference at **30–60 FPS**.  

- **Computer Vision — OpenCV:**  
  - Captures and processes webcam frames at **1280x720 resolution**.  
  - Draws pose skeletons, angle overlays, and form feedback indicators directly onto the video stream.  

- **Mathematics — NumPy:**  
  - Computes joint angles with **±1° precision** using `arctan2` trigonometric functions.  
  - Implements a simple state machine for rep counting based on joint angle thresholds (e.g., pushup: >160° → <90° transition).  

---

## 🧩 How It Works  

1. The React frontend initializes the user’s webcam feed.  
2. Frames are sent to the Flask backend where **MediaPipe Pose** extracts 3D coordinates `(x, y, z, visibility)` for each joint.  
3. NumPy calculates joint angles — such as elbow flexion and hip inclination — to measure proper form.  
4. Feedback logic detects deviations and streams live overlays (e.g., “Straighten your back,” “Lower hips”).  
5. The processed frames and accuracy data are streamed back to the frontend in real time (~30 FPS).  

The result is a seamless, low-latency feedback loop that mimics a real personal trainer — without requiring specialized hardware.

---

## 📊 Performance Metrics  

| Feature | Specification | Notes |
|----------|----------------|-------|
| Pose Landmark Detection | 33 points | Full-body skeleton tracking |
| Model Accuracy | ~95% | Based on Google MediaPipe validation benchmarks |
| Processing Speed | 30–60 FPS | Real-time on most modern laptops |
| Angle Precision | ±1° | NumPy trigonometric computation |
| Latency | <120 ms | End-to-end webcam-to-frontend feedback |
| Hardware Required | Standard webcam | No additional sensors or cloud processing |

---

## 🏁 Outcome  

NanaFit was recognized for its:  
- **High technical precision and real-time responsiveness**  
- **Practical application of open-source AI frameworks**  
- **Polished user experience and branding**  

The project demonstrated how **AI-powered motion tracking** can bring personal training to anyone with a webcam — democratizing fitness accessibility and data-driven exercise correction.

---

## 🧠 Team & Recognition  
**Competition:** BananaHacks (CornHacks) 2025 — University of Nebraska–Lincoln  
- **Award:** 1st Place Overall  
- **Prize:** iPads for all team members  
- **Focus:** Accessible AI fitness coaching through real-time pose estimation and browser-based visualization  

---

## 💻 Example Use Cases  
- Real-time posture correction during pushups or squats  
- Automatic rep counting and set completion tracking  
- Personalized form analysis for at-home fitness routines  

---

## 📚 Built With  
- React.js  
- Flask (Python)  
- Google MediaPipe  
- OpenCV  
- NumPy  
- Framer Motion + Lucide React (UI Enhancements)  

---
