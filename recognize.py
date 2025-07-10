import cv2
import face_recognition
import numpy as np
import json

ENCODINGS_FILE = "encodings.json"
TOLERANCE = 0.5  # Adjust based on your validation

# Load encodings
try:
    with open(ENCODINGS_FILE, "r") as f:
        known_data = json.load(f)
        known_names = list(known_data.keys())
        known_encodings = [np.array(known_data[name]) for name in known_names]
        print(f"[INFO] Loaded {len(known_encodings)} users from {ENCODINGS_FILE}")
except FileNotFoundError:
    print(f"[ERROR] {ENCODINGS_FILE} not found. Run train_encodings.py first.")
    exit(1)

# Start webcam
cam = cv2.VideoCapture(0)
if not cam.isOpened():
    print("[ERROR] Could not access webcam.")
    exit(1)

print("[INFO] Press ESC to exit.")

while True:
    ret, frame = cam.read()
    if not ret:
        print("[ERROR] Failed to grab frame.")
        break

    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_small)
    face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

    for (top, right, bottom, left), encoding in zip(face_locations, face_encodings):
        distances = face_recognition.face_distance(known_encodings, encoding)
        if len(distances) == 0:
            name = "Unknown"
            confidence = 0.0
        else:
            best_index = np.argmin(distances)
            best_distance = distances[best_index]
            confidence = max(0, 1.0 - best_distance) * 100  # Percentage

            if best_distance < TOLERANCE:
                name = known_names[best_index]
            else:
                name = "Unknown"

        # Scale back up for original frame size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        label = f"{name} ({confidence:.1f}%)"
        cv2.putText(frame, label, (left + 6, bottom - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow("Smart Face Recognition", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()
print("[INFO] Video stream ended.")
