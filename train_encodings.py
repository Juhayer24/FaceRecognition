import os
import face_recognition
import numpy as np
import cv2
import json
from collections import defaultdict

DATASET_DIR = "dataset"
OUTPUT_FILE = "encodings.json"

def align_face(image, face_locations):
    aligned_faces = []
    for top, right, bottom, left in face_locations:
        face = image[top:bottom, left:right]
        if face.size == 0:
            continue
        face = cv2.resize(face, (160, 160))  # Standardized size
        aligned_faces.append(face)
    return aligned_faces

def compute_encodings(dataset_dir):
    encodings_dict = defaultdict(list)

    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset directory '{dataset_dir}' not found!")
        exit(1)

    for person_name in os.listdir(dataset_dir):
        person_path = os.path.join(dataset_dir, person_name)
        if not os.path.isdir(person_path):
            continue

        print(f"[INFO] Processing {person_name}")
        for image_name in os.listdir(person_path):
            if not image_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue

            image_path = os.path.join(person_path, image_name)
            try:
                image = face_recognition.load_image_file(image_path)
                face_locations = face_recognition.face_locations(image)
                if not face_locations:
                    print(f"[WARNING] No faces found in {image_path}")
                    continue

                aligned_faces = align_face(image, face_locations)

                for face in aligned_faces:
                    encodings = face_recognition.face_encodings(face)
                    if encodings:
                        encodings_dict[person_name].append(encodings[0])
            except Exception as e:
                print(f"[ERROR] Failed to process {image_path}: {str(e)}")

    return encodings_dict

def save_average_encodings(encodings_dict, output_file):
    final_encodings = {}

    for name, enc_list in encodings_dict.items():
        if len(enc_list) == 0:
            continue
        avg_encoding = np.mean(enc_list, axis=0).tolist()
        final_encodings[name] = avg_encoding
        print(f"[ENCODED] {name}: {len(enc_list)} samples averaged")

    with open(output_file, 'w') as f:
        json.dump(final_encodings, f)

    print(f"[INFO] Encodings saved to {output_file}")
    print(f"[INFO] Total users encoded: {len(final_encodings)}")

def main():
    print("[INFO] Starting encoding process...")
    encodings_dict = compute_encodings(DATASET_DIR)
    if not encodings_dict:
        print("[ERROR] No encodings were generated.")
        exit(1)
    save_average_encodings(encodings_dict, OUTPUT_FILE)

if __name__ == "__main__":
    main()
