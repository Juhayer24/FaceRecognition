import cv2
import os
import numpy as np
import imutils
import face_recognition
from datetime import datetime
import time
import random # <--- ADD THIS LINE

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
    These are the augmentations we'll apply to each captured image before saving.
    """
    augmentations = [image]  # Always include the original

    augmentations.append(cv2.flip(image, 1)) # Horizontal flip

    alpha = random.uniform(0.8, 1.2)
    beta = random.randint(-20, 20)
    brightness_contrast = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    augmentations.append(brightness_contrast)

    angle = random.uniform(-10, 10)
    rot_matrix = cv2.getRotation2D((image.shape[1]/2, image.shape[0]/2), angle, 1) # Corrected function name
    rotated_image = cv2.warpAffine(image, rot_matrix, (image.shape[1], image.shape[0]))
    augmentations.append(rotated_image)

    blur_amount = random.choice([0, 1])
    if blur_amount > 0:
        blurred_image = cv2.GaussianBlur(image, (3, 3), 0)
        augmentations.append(blurred_image)

    return augmentations

def process_and_save_frame(frame_bgr, person_name, current_image_count, total_images_target, save_path):
    """
    Processes a single BGR frame: detects faces, augments, and saves.
    Returns the number of new images saved and a list of detected face locations.
    """
    rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    saved_this_frame = 0
    message = ""

    if face_locations:
        # We'll only process the first detected face for registration for simplicity
        face_location = face_locations[0]
        aligned_face = align_face(rgb_frame, face_location)

        if aligned_face is not None:
            aug_faces = augment_image(aligned_face)
            for img_idx, img in enumerate(aug_faces):
                if current_image_count + saved_this_frame >= total_images_target:
                    break # Stop if we've reached the target with augmentations from this frame

                img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                img_name = f"{save_path}/{person_name}_{current_image_count + saved_this_frame}_{timestamp}_{img_idx}.jpg"
                cv2.imwrite(img_name, img_bgr)
                saved_this_frame += 1
        message = f"Detected and saved {saved_this_frame} augmented images."
    else:
        message = "No face detected in the frame."

    return saved_this_frame, face_locations, message