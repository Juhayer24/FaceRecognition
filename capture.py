import cv2
import os
import numpy as np
import imutils
import random
import face_recognition # Added for face detection during capture
from datetime import datetime
import time # For slight delay between captures

def align_face(image, face_location, target_size=(160, 160)):
    """
    Crops and resizes a detected face to a standard size.
    """
    top, right, bottom, left = face_location
    face = image[top:bottom, left:right]
    if face.size == 0:
        return None
    face = cv2.resize(face, target_size)
    return face

def augment_image(image):
    """
    Applies a set of simple augmentations to a face image.
    """
    augmentations = [image]  # Always include the original

    # Horizontal flip
    augmentations.append(cv2.flip(image, 1))

    # Adjust brightness and contrast
    alpha = random.uniform(0.8, 1.2)
    beta = random.randint(-20, 20)
    brightness_contrast = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    augmentations.append(brightness_contrast)

    # Rotation
    angle = random.uniform(-10, 10) # Reduced angle for less distortion
    rot_matrix = cv2.getRotationMatrix2D((image.shape[1]/2, image.shape[0]/2), angle, 1)
    rotated_image = cv2.warpAffine(image, rot_matrix, (image.shape[1], image.shape[0]))
    augmentations.append(rotated_image)

    # Gaussian Blur (slight blur for noise robustness)
    blur_amount = random.choice([0, 1]) # Sometimes no blur, sometimes slight
    if blur_amount > 0:
        blurred_image = cv2.GaussianBlur(image, (3, 3), 0)
        augmentations.append(blurred_image)

    return augmentations

def capture_images(person_name, num_images_per_aug_type=5, total_images_target=30):
    """
    Captures images from webcam, detects faces, aligns them, and applies augmentations.
    Aims for a total number of unique augmented images.
    """
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("[ERROR] Could not access webcam. Please check if it's connected and not in use.")
        return

    dataset_root = "dataset"
    save_path = os.path.join(dataset_root, person_name)
    os.makedirs(save_path, exist_ok=True)

    captured_count = 0
    print(f"[INFO] Capturing images for: {person_name}")
    print("[INFO] Please ensure your face is well-lit and centered.")
    print("[INFO] Press 'S' to capture a set of images, 'ESC' to stop.")

    capture_triggered = False

    while True:
        ret, frame = cam.read()
        if not ret:
            print("[ERROR] Failed to grab frame from camera.")
            break

        frame = imutils.resize(frame, width=640)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect faces in the current frame
        face_locations = face_recognition.face_locations(rgb_frame)
        display_frame = frame.copy()

        if face_locations:
            for (top, right, bottom, left) in face_locations:
                # Draw a rectangle around the detected face
                cv2.rectangle(display_frame, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.putText(display_frame, "Face Detected", (left, top - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                if capture_triggered:
                    aligned_face = align_face(rgb_frame, (top, right, bottom, left))
                    if aligned_face is not None:
                        aug_faces = augment_image(aligned_face)
                        for img_idx, img in enumerate(aug_faces):
                            if captured_count >= total_images_target:
                                break

                            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                            img_name = f"{save_path}/{person_name}_{captured_count}_{timestamp}_{img_idx}.jpg"
                            cv2.imwrite(img_name, img_bgr)
                            print(f"[SAVED] {img_name}")
                            captured_count += 1
                            time.sleep(0.05) # Small delay to ensure unique filenames if rapid capture

            if captured_count >= total_images_target:
                print(f"[INFO] Reached target of {total_images_target} images.")
                break
        else:
            cv2.putText(display_frame, "No Face Detected", (20, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)


        cv2.imshow("Capture Faces", display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('s'): # Press 'S' to trigger capture
            capture_triggered = True
            print("[INFO] Capturing triggered...")
        elif key == 27: # ESC to exit
            break
        elif capture_triggered and captured_count < total_images_target:
            # Reset capture_triggered after a short burst to allow user to reposition
            if captured_count % num_images_per_aug_type == 0 and captured_count > 0:
                capture_triggered = False
                print("[INFO] Capture paused. Press 'S' to capture more, or ESC to stop.")

    cam.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Finished collecting {captured_count} images for {person_name}")

if __name__ == "__main__":
    # Example Usage:
    # To run, execute this script and press 'S' to start capturing
    # You might want to wrap this in a loop or user input for multiple people.
    # For now, let's keep it simple for testing:
    person_to_capture = input("Enter the name of the person to capture images for: ").strip()
    if person_to_capture:
        capture_images(person_to_capture, num_images_per_aug_type=5, total_images_target=50) # Aim for 50 images
    else:
        print("Person name cannot be empty. Exiting.")