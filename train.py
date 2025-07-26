import os
import face_recognition
import numpy as np
import json
from collections import defaultdict
import cv2 # For align_face if needed, though face_recognition handles alignment well

DATASET_DIR = "dataset"
OUTPUT_FILE = "encodings.json"

# It's good practice to keep align_face consistent if you use it in both places.
# However, face_recognition.face_encodings usually works well without explicit pre-alignment
# as long as face_locations provides accurate bounds.
def align_face_for_encoding(image, face_location, target_size=(160, 160)):
    """
    Crops and resizes a detected face for consistent encoding input.
    """
    top, right, bottom, left = face_location
    face_image = image[top:bottom, left:right]
    if face_image.size == 0:
        return None
    # Resize only if necessary, face_recognition library handles different sizes well but 160x160 is common for models like FaceNet
    # Here, we'll just return the cropped face for face_recognition to handle
    return face_image

def compute_encodings(dataset_dir):
    """
    Computes face encodings for all images in the dataset directory.
    Stores them per person.
    """
    encodings_dict = defaultdict(list)

    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset directory '{dataset_dir}' not found. Please run capture.py first.")
        return {}

    for person_name in os.listdir(dataset_dir):
        person_path = os.path.join(dataset_dir, person_name)
        if not os.path.isdir(person_path):
            continue

        print(f"[INFO] Processing images for {person_name}...")
        image_files = [f for f in os.listdir(person_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

        if not image_files:
            print(f"[WARNING] No image files found for {person_name} in {person_path}. Skipping.")
            continue

        for image_name in image_files:
            image_path = os.path.join(person_path, image_name)
            try:
                # Load image in RGB format (face_recognition expects RGB)
                image = face_recognition.load_image_file(image_path)
                face_locations = face_recognition.face_locations(image)

                if not face_locations:
                    # print(f"[WARNING] No faces found in {image_path}. Skipping.")
                    continue # Skip images where no face is detected

                # We only expect one face per image for training data
                if len(face_locations) > 1:
                    print(f"[WARNING] Multiple faces found in {image_path}. Using the first one detected.")

                # Get encoding for the first detected face
                face_encoding = face_recognition.face_encodings(image, known_face_locations=[face_locations[0]])
                if face_encoding:
                    encodings_dict[person_name].append(face_encoding[0].tolist()) # Convert numpy array to list for JSON

            except Exception as e:
                print(f"[ERROR] Failed to process {image_path}: {e}")

    return encodings_dict

def save_encodings(encodings_dict, output_file):
    """
    Saves the collected encodings to a JSON file.
    Calculates the average encoding for each person for recognition.
    """
    final_encodings = {}
    for name, enc_list in encodings_dict.items():
        if not enc_list:
            print(f"[WARNING] No encodings found for {name}. Skipping.")
            continue
        # Calculate the mean of all encodings for a person
        avg_encoding = np.mean(np.array(enc_list), axis=0)
        final_encodings[name] = avg_encoding.tolist() # Convert back to list for JSON

    with open(output_file, 'w') as f:
        json.dump(final_encodings, f, indent=4) # Use indent for readability

    print(f"[INFO] Encodings saved to {output_file}")
    print(f"[INFO] Total unique users encoded: {len(final_encodings)}")

def main():
    print("[INFO] Starting face encoding training process...")
    encodings_data = compute_encodings(DATASET_DIR)
    if not encodings_data:
        print("[ERROR] No encodings were generated. Please check your dataset directory.")
        return

    save_encodings(encodings_data, OUTPUT_FILE)
    print("[INFO] Training process completed.")

if __name__ == "__main__":
    main()