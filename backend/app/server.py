from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MediaPipe setup
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Global variables
cap = None
pose = None
counter = 0
stage = None
feedback = ""

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def generate_frames():
    global cap, pose, counter, stage, feedback
    
    # Initialize camera and pose
    if cap is None:
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if pose is None:
        pose = mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ No camera feed detected.")
            break

        # Mirror horizontally for natural view
        frame = cv2.flip(frame, 1)

        # Convert for MediaPipe
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = pose.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        try:
            landmarks = results.pose_landmarks.landmark
            
            # Use LEFT side (facing camera sideways)
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]

            # Calculate elbow and back angles
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            body_angle = calculate_angle(shoulder, hip, ankle)

            # Rep counting: elbow bends below ~90° and returns above ~160°
            if elbow_angle > 160:
                stage = "up"
            if elbow_angle < 90 and stage == "up":
                stage = "down"
                counter += 1
                print(f"✅ REP COUNTED! Total: {counter}")

            # Posture feedback
            if body_angle < 160:
                feedback = "LOWER HIPS"
                color = (0, 0, 255)  # Red
            elif body_angle > 175:
                feedback = "LOWER CHEST"
                color = (0, 165, 255)  # Orange
            else:
                feedback = "GOOD FORM"
                color = (0, 255, 0)  # Green

            # Draw data on frame
            cv2.putText(image, f'Reps: {counter}', (20, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 3)
            cv2.putText(image, f'Stage: {stage}', (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
            cv2.putText(image, f'{feedback}', (frame.shape[1]//2 - 150, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 3)
            cv2.putText(image, f'Elbow: {int(elbow_angle)}°', 
                        tuple(np.multiply(elbow, [frame.shape[1], frame.shape[0]]).astype(int)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(image, f'Body: {int(body_angle)}°', 
                        tuple(np.multiply(hip, [frame.shape[1], frame.shape[0]]).astype(int)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # Draw skeleton
            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=3),
                mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2, circle_radius=2)
            )

        except Exception as e:
            # If no landmarks detected, show message
            feedback = "POSITION YOURSELF SIDEWAYS"
            cv2.putText(image, feedback, (frame.shape[1]//2 - 200, frame.shape[0]//2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 140, 0), 3)

        # Encode frame to JPEG
        ret, buffer = cv2.imencode('.jpg', image)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_session', methods=['POST'])
def start_session():
    """Start a new workout session"""
    global counter, stage, feedback
    counter = 0
    stage = None
    feedback = "POSITION SIDEWAYS!"
    print("🍌 Session started! Position yourself sideways to the camera.")
    return jsonify({'status': 'started', 'message': 'Session started'}), 200

@app.route('/end_session', methods=['POST'])
def end_session():
    """End workout session"""
    global counter
    print(f"🏁 Session ended! Total reps: {counter}")
    return jsonify({
        'status': 'ended',
        'total_reps': counter,
        'streak': 1
    }), 200

@app.route('/get_stats', methods=['GET'])
def get_stats():
    """Get current workout stats"""
    global counter, feedback
    return jsonify({
        'reps': counter,
        'feedback': feedback
    }), 200

if __name__ == '__main__':
    print("🍌 NanaFit Backend Starting...")
    print("📹 Camera will initialize when /video_feed is accessed")
    print("👉 POSITION YOURSELF SIDEWAYS to the camera!")
    print("🍌 Server running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)