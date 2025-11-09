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
is_in_position = False
position_confidence = 0

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def check_pushup_position(landmarks, frame_shape):
    """Check if user is in proper push-up starting position"""
    global is_in_position, position_confidence
    
    try:
        # Get key landmarks
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
        left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
        right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
        
        # Calculate average y-positions
        shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_y = (left_hip.y + right_hip.y) / 2
        ankle_y = (left_ankle.y + right_ankle.y) / 2
        
        # Check visibility (all key points should be visible)
        visibility_check = (
            left_shoulder.visibility > 0.5 and
            right_shoulder.visibility > 0.5 and
            left_hip.visibility > 0.5 and
            right_hip.visibility > 0.5 and
            left_ankle.visibility > 0.5 and
            right_ankle.visibility > 0.5
        )
        
        # Check if body is horizontal (push-up position)
        # In push-up, all body parts should be roughly at same height
        vertical_alignment = abs(shoulder_y - ankle_y) < 0.3
        
        # Check if shoulders are above hips (proper plank position)
        proper_plank = shoulder_y < hip_y + 0.1
        
        # Determine position confidence
        if visibility_check and vertical_alignment and proper_plank:
            position_confidence = min(position_confidence + 1, 10)
        else:
            position_confidence = max(position_confidence - 1, 0)
        
        # Only consider in position if confidence is high
        is_in_position = position_confidence >= 5
        
        return is_in_position, visibility_check, vertical_alignment, proper_plank
        
    except Exception as e:
        is_in_position = False
        position_confidence = 0
        return False, False, False, False

def generate_frames():
    global cap, pose, counter, stage, feedback, is_in_position, position_confidence
    
    # Initialize camera and pose
    if cap is None:
        cap = cv2.VideoCapture(0)
    
    if pose is None:
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    
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
            
            # Check if user is in proper push-up position
            in_pos, visible, aligned, plank = check_pushup_position(landmarks, frame.shape)

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

            # Only count reps if user is in proper position
            if is_in_position:
                # Rep counting: elbow bends below ~90° and returns above ~160°
                if elbow_angle > 160:
                    stage = "up"
                if elbow_angle < 90 and stage == "up":
                    stage = "down"
                    counter += 1

                # Posture feedback
                if body_angle < 160:
                    feedback = "LOWER HIPS"
                    color = (0, 0, 255)
                elif body_angle > 175:
                    feedback = "LOWER CHEST"
                    color = (0, 165, 255)
                else:
                    feedback = "GOOD FORM"
                    color = (0, 255, 0)
            else:
                # Setup mode feedback
                if not visible:
                    feedback = "MOVE BACK - SHOW FULL BODY"
                    color = (255, 140, 0)
                elif not aligned:
                    feedback = "GET IN PUSH-UP POSITION"
                    color = (255, 140, 0)
                elif not plank:
                    feedback = "POSITION SIDEWAYS"
                    color = (255, 140, 0)
                else:
                    feedback = "HOLD POSITION..."
                    color = (255, 255, 0)
                stage = "setup"

            # Draw position indicator
            position_text = "✓ READY" if is_in_position else "⚠ SETUP MODE"
            position_color = (0, 255, 0) if is_in_position else (255, 140, 0)
            cv2.rectangle(image, (10, 10), (280, 60), (0, 0, 0), -1)
            cv2.rectangle(image, (10, 10), (280, 60), position_color, 3)
            cv2.putText(image, position_text, (20, 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, position_color, 3)

            # Draw rep counter (ALWAYS VISIBLE)
            # Draw banana emoji background
            cv2.rectangle(image, (frame.shape[1] - 220, 10), (frame.shape[1] - 10, 120), (0, 0, 0), -1)
            cv2.rectangle(image, (frame.shape[1] - 220, 10), (frame.shape[1] - 10, 120), (255, 215, 0), 4)
            
            # Draw banana emoji at top
            cv2.putText(image, '🍌', (frame.shape[1] - 180, 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 215, 0), 2)
            
            # Draw rep count
            cv2.putText(image, f'{counter}', (frame.shape[1] - 170, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 215, 0), 4)
            
            # Draw "REPS" label
            cv2.putText(image, 'REPS', (frame.shape[1] - 190, 115),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Draw stage indicator
            if is_in_position and stage:
                cv2.putText(image, f'Stage: {stage.upper()}', (20, 140),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)

            # Draw feedback (larger and centered)
            text_size = cv2.getTextSize(feedback, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)[0]
            text_x = (frame.shape[1] - text_size[0]) // 2
            # Background box for feedback
            cv2.rectangle(image, 
                         (text_x - 20, 50), 
                         (text_x + text_size[0] + 20, 100), 
                         (0, 0, 0), -1)
            cv2.putText(image, feedback, (text_x, 85),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

            # Draw angle indicators (only if in position)
            if is_in_position:
                cv2.putText(image, f'Elbow: {int(elbow_angle)}', 
                            tuple(np.multiply(elbow, [frame.shape[1], frame.shape[0]]).astype(int)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
                cv2.putText(image, f'Body: {int(body_angle)}', 
                            tuple(np.multiply(hip, [frame.shape[1], frame.shape[0]]).astype(int)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

            # Draw skeleton
            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0,0,255), thickness=2, circle_radius=3),
                mp_drawing.DrawingSpec(color=(255,255,255), thickness=2, circle_radius=2)
            )

        except Exception as e:
            print(f"Error processing frame: {e}")
            # Reset position when no detection
            is_in_position = False
            position_confidence = 0
            pass

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
    global counter, stage, position_confidence
    counter = 0
    stage = None
    position_confidence = 0
    return jsonify({'status': 'started', 'message': 'Session started'}), 200

@app.route('/end_session', methods=['POST'])
def end_session():
    """End workout session"""
    global counter
    return jsonify({
        'status': 'ended',
        'total_reps': counter,
        'streak': 1  # You can implement streak logic here
    }), 200

@app.route('/get_stats', methods=['GET'])
def get_stats():
    """Get current workout stats"""
    global counter, is_in_position, feedback
    return jsonify({
        'reps': counter,
        'in_position': is_in_position,
        'feedback': feedback
    }), 200

if __name__ == '__main__':
    print("🍌 NanaFit Backend Starting...")
    print("📹 Camera will initialize when /video_feed is accessed")
    print("🌐 Server running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)