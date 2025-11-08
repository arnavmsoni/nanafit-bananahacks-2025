import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

cap = cv2.VideoCapture(0)
counter = 0
stage = None
feedback = ""

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while cap.isOpened():
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

            # Draw data on frame
            cv2.putText(image, f'Reps: {counter}', (20, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 3)
            cv2.putText(image, f'Stage: {stage}', (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)
            cv2.putText(image, f'{feedback}', (frame.shape[1]//2 - 150, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 3)
            cv2.putText(image, f'Elbow: {int(elbow_angle)}°', 
                        tuple(np.multiply(elbow, [frame.shape[1], frame.shape[0]]).astype(int)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
            cv2.putText(image, f'Body: {int(body_angle)}°', 
                        tuple(np.multiply(hip, [frame.shape[1], frame.shape[0]]).astype(int)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

            # Draw skeleton
            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0,0,255), thickness=2, circle_radius=3),
                mp_drawing.DrawingSpec(color=(255,255,255), thickness=2, circle_radius=2)
            )

        except Exception:
            pass

        cv2.imshow('NanaFit Side Push-Up Tracker 🍌', image)

        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
