
import cv2
import os
import numpy as np
import imutils
import random

from datetime import datetime

# Helper: Align face using landmarks (if available later)
def align_face(image, face_locations):
    # For now, we just crop and resize
    aligned_faces = []
    for top, right, bottom, left in face_locations:
        face = image[top:bottom, left:right]
        face = cv2.resize(face, (160, 160))  # Resize for consistency
        aligned_faces.append(face)
    return aligned_faces

# Helper: Apply simple augmentation
def augment_image(image):
    augmentations = []
    augmentations.append(image)  # Original
    augmentations.append(cv2.flip(image, 1))  # Horizontal flip
    brightness = cv2.convertScaleAbs(image, alpha=1.2, beta=30)
    augmentations.append(brightness)
    rot = imutils.rotate_bound(image, angle=random.uniform(-15, 15))
    augmentations.append(rot)
    return augmentations

def capture_images(person_name, num_images=30):
    cam = cv2.VideoCapture(0)
    save_path = f"dataset/{person_name}"
    os.makedirs(save_path, exist_ok=True)
    count = 0

    print("[INFO] Press SPACE to capture, ESC to stop.")

    while count < num_images:
        ret, frame = cam.read()
        if not ret:
            break

        frame = imutils.resize(frame, width=640)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)

        if face_locations:
            aligned_faces = align_face(rgb_frame, face_locations)
            for face in aligned_faces:
                aug_faces = augment_image(face)
                for img in aug_faces:
                    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                    img_name = f"{save_path}/{person_name}_{count}_{datetime.now().strftime('%H%M%S%f')}.jpg"
                    cv2.imwrite(img_name, img_bgr)
                    print(f"[SAVED] {img_name}")
                    count += 1
                    if count >= num_images:
                        break

        cv2.imshow("Capture Faces", frame)
        key = cv2.waitKey(1)
        if key == 27:
            break

    cam.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Collected {count} images for {person_name}")

# Example usage
# capture_images("Alice", num_images=40)