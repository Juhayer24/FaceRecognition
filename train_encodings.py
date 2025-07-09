# train_encodings.py
import os
import face_recognition
import pickle

DATASET_DIR = "dataset"
ENCODINGS_FILE = "encodings.pkl"

known_encodings = []
known_names = []

# Loop through each person in the dataset
for person_name in os.listdir(DATASET_DIR):
    person_folder = os.path.join(DATASET_DIR, person_name)

    if not os.path.isdir(person_folder):
        continue

    # Loop through each image for this person
    for image_name in os.listdir(person_folder):
        image_path = os.path.join(person_folder, image_name)
        print(f"[INFO] Processing {image_path}")

        image = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(image)
        encodings = face_recognition.face_encodings(image, face_locations)

        if len(encodings) > 0:
            known_encodings.append(encodings[0])
            known_names.append(person_name)

# Save encodings to file
print("[INFO] Saving encodings...")
data = {"encodings": known_encodings, "names": known_names}

with open(ENCODINGS_FILE, "wb") as f:
    pickle.dump(data, f)

print("[INFO] Encodings saved to encodings.pkl")
