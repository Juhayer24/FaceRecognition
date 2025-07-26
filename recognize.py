import cv2
import face_recognition
import numpy as np
import json
import time # For frame rate management or displaying "processing"

ENCODINGS_FILE = "encodings.json"
# LOWER tolerance means stricter match (less distance allowed)
# This value often requires tuning based on your dataset and desired accuracy vs. false positives
TOLERANCE = 0.52 # A good starting point, adjust as needed (0.6 is common too)

# Load encodings
try:
    with open(ENCODINGS_FILE, "r") as f:
        known_data = json.load(f)
        known_names = list(known_data.keys())
        # Convert list back to numpy array for face_recognition comparison
        known_encodings = [np.array(known_data[name]) for name in known_names]
        print(f"[INFO] Loaded {len(known_encodings)} users from {ENCODINGS_FILE}")
except FileNotFoundError:
    print(f"[ERROR] {ENCODINGS_FILE} not found. Run train.py first to generate encodings.")
    exit(1)
except json.JSONDecodeError:
    print(f"[ERROR] Could not decode {ENCODINGS_FILE}. Please check if it's valid JSON.")
    exit(1)
except Exception as e:
    print(f"[ERROR] An unexpected error occurred while loading encodings: {e}")
    exit(1)

# Start webcam
cam = cv2.VideoCapture(0)
if not cam.isOpened():
    print("[ERROR] Could not access webcam. Please ensure it's connected and not in use.")
    exit(1)

print("[INFO] Press 'ESC' to exit the recognition window.")

while True:
    ret, frame = cam.read()
    if not ret:
        print("[ERROR] Failed to grab frame from camera. Exiting...")
        break

    # Resize frame for faster processing
    # Adjust fx, fy as needed for performance vs. accuracy trade-off
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    # Find all face locations and encodings in the current frame
    face_locations = face_recognition.face_locations(rgb_small)
    face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

    for (top, right, bottom, left), encoding in zip(face_locations, face_encodings):
        name = "Unknown"
        confidence = 0.0

        if known_encodings: # Ensure there are known encodings to compare against
            # Compare current face encoding with all known encodings
            distances = face_recognition.face_distance(known_encodings, encoding)

            # Find the best match (smallest distance)
            best_match_index = np.argmin(distances)
            best_distance = distances[best_match_index]

            # Calculate "confidence" (inverse of distance, normalized)
            # This is a heuristic, not a true probability
            confidence = max(0, 1.0 - best_distance) * 100

            if best_distance < TOLERANCE:
                name = known_names[best_match_index]
            else:
                name = "Unknown"
        else:
            print("[WARNING] No known encodings loaded. All faces will be 'Unknown'.")


        # Scale back up face locations to the original frame size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Draw box and label
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255) # Green for known, Red for unknown
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        label = f"{name} ({confidence:.1f}%)"
        cv2.putText(frame, label, (left + 6, bottom - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imshow("Smart Face Recognition", frame)

    # Exit on ESC key press
    if cv2.waitKey(1) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()
print("[INFO] Video stream ended.")