import cv2
import face_recognition
import pickle
import numpy as np

# Load the saved encodings
with open("encodings.pkl", "rb") as f:
    data = pickle.load(f)

# Start the webcam
cam = cv2.VideoCapture(0)

print("[INFO] Starting video stream. Press ESC to quit.")

while True:
    ret, frame = cam.read()
    if not ret:
        break

    # Resize for faster processing
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small_frame = small_frame[:, :, ::-1]  # BGR to RGB

    # Detect faces and encodings
    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame)

    face_names = []

    for encoding in face_encodings:
        matches = face_recognition.compare_faces(data["encodings"], encoding)
        name = "Unknown"

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

        # Draw bounding box and label
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

    cv2.imshow("Face Recognition", frame)

    key = cv2.waitKey(1)
    if key == 27:  # ESC key to quit
        break

cam.release()
cv2.destroyAllWindows()
