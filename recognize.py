import cv2
import face_recognition
import pickle
import numpy as np

# Load the saved encodings
try:
    with open("encodings.pkl", "rb") as f:
        data = pickle.load(f)
    print(f"[INFO] Loaded {len(data['encodings'])} face encodings")
except FileNotFoundError:
    print("[ERROR] encodings.pkl not found. Please run train_encodings.py first.")
    exit(1)

# Start the webcam
cam = cv2.VideoCapture(0)

if not cam.isOpened():
    print("[ERROR] Could not open webcam")
    exit(1)

print("[INFO] Starting video stream. Press ESC to quit.")

while True:
    ret, frame = cam.read()
    if not ret:
        print("[ERROR] Failed to read frame from webcam")
        break

    # Resize for faster processing
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    # Find face locations and encodings
    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

    face_names = []

    for encoding in face_encodings:
        # Compare faces with known encodings
        matches = face_recognition.compare_faces(data["encodings"], encoding, tolerance=0.6)
        name = "Unknown"

        # Find the best match
        face_distances = face_recognition.face_distance(data["encodings"], encoding)
        if len(face_distances) > 0:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = data["names"][best_match_index]

        face_names.append(name)

    # Display results
    for (top, right, bottom, left), name in zip(face_locations, face_names):
        # Scale face locations back to original frame size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Choose color based on recognition
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        
        # Draw bounding box and label
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow("Face Recognition", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == 27:  # ESC key to quit
        break

print("[INFO] Cleaning up...")
cam.release()
cv2.destroyAllWindows()