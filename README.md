# NanaFit — AI-Powered Fitness Trainer  

### 🏆 1st Place — BananaHacks (CornHacks 2025), University of Nebraska–Lincoln  
**Award:** iPads for all team members  

NanaFit is an AI-powered fitness application that provides **real-time exercise form feedback** and **rep tracking** directly through the browser.  
Built in 24 hours at BananaHacks 2025 (CornHacks @ UNL), NanaFit won **1st place overall** for its innovative use of real-time pose detection, computer vision, and intuitive design.

---

## 🚀 Overview  
NanaFit turns any webcam into a personal AI trainer. Users can select a muscle group, follow guided demonstration videos, and receive live feedback on their workout form during exercises such as push-ups and squats.  

The app uses **Google MediaPipe Pose Detection** to track 33 human body landmarks in real time and assess body alignment and motion. It then provides immediate, visual feedback on performance, helping users maintain proper form and avoid injury.

---

## ⚙️ Tech Stack  
- **React.js (Frontend):** Dynamic UI with real-time video comparison and interactive muscle-group selection  
- **Flask (Backend):** Python API managing video stream processing and pose analysis  
- **Google MediaPipe:** Performs 33-landmark pose detection using a lightweight machine-learning model optimized for 30+ FPS real-time inference  
- **OpenCV:** Captures, processes, and overlays pose skeletons and angle indicators onto the live video feed  
- **NumPy:** Calculates joint angles (e.g., elbows, shoulders, hips) using trigonometric functions (`arctan2`) to determine exercise quality  

---

## 🧩 How It Works  
1. The user’s webcam feed is captured and sent to the Flask backend.  
2. MediaPipe detects 33 pose landmarks per frame, returning `(x, y, z, visibility)` coordinates.  
3. NumPy computes relevant joint angles to assess form (e.g., elbow flexion or back alignment).  
4. Flask streams the processed video with overlayed pose lines and live feedback back to the React frontend.  
5. Users see immediate visual corrections, such as “hips too high” or “straighten back,” along with rep tracking.

---

## 🏁 Outcome  
NanaFit impressed judges for its **real-time accuracy**, **technical complexity**, and **smooth integration between AI and front-end design**.  
It showcased how **computer vision and open-source ML tools** like MediaPipe can democratize fitness tracking without expensive equipment.

---

## 🧠 Team & Recognition  
Developed at the **University of Nebraska–Lincoln’s BananaHacks (CornHacks) 2025**  
- **Award:** 1st Place Overall  
- **Prize:** iPads for all team members  
- **Focus:** Making intelligent, accessible fitness technology powered by AI and computer vision  

---
