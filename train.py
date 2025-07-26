# train.py (ensure this part is correct for JSON saving)
import os
import face_recognition
import numpy as np
import json
from collections import defaultdict
import cv2

DATASET_DIR = "dataset"
OUTPUT_FILE = "encodings.json"

def align_face_for_encoding(image, face_location, target_size=(160, 160)):
    top, right, bottom, left = face_location
    face_image = image[top:bottom, left:right]
    if face_image.size == 0:
        return None
    return face_image

def compute_encodings(dataset_dir):
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
                image = face_recognition.load_image_file(image_path)
                face_locations = face_recognition.face_locations(image)

                if not face_locations:
                    continue

                if len(face_locations) > 1:
                    print(f"[WARNING] Multiple faces found in {image_path}. Using the first one detected.")

                face_encoding = face_recognition.face_encodings(image, known_face_locations=[face_locations[0]])
                if face_encoding:
                    # IMPORTANT: Convert numpy array to list for JSON serialization
                    encodings_dict[person_name].append(face_encoding[0].tolist())

            except Exception as e:
                print(f"[ERROR] Failed to process {image_path}: {e}")

    return encodings_dict

def save_encodings(encodings_dict, output_file):
    final_encodings = {}
    for name, enc_list in encodings_dict.items():
        if not enc_list:
            print(f"[WARNING] No encodings found for {name}. Skipping.")
            continue
        avg_encoding = np.mean(np.array(enc_list), axis=0)
        # IMPORTANT: Convert numpy array to list for JSON serialization
        final_encodings[name] = avg_encoding.tolist()

    with open(output_file, 'w') as f:
        json.dump(final_encodings, f, indent=4)

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