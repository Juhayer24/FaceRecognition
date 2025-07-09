import os
import face_recognition
import pickle
import cv2

DATASET_DIR = "dataset"
ENCODINGS_FILE = "encodings.pkl"

known_encodings = []
known_names = []

# Check if dataset directory exists
if not os.path.exists(DATASET_DIR):
    print(f"[ERROR] Dataset directory '{DATASET_DIR}' not found!")
    exit(1)

# Loop through each person in the dataset
for person_name in os.listdir(DATASET_DIR):
    person_folder = os.path.join(DATASET_DIR, person_name)
    
    if not os.path.isdir(person_folder):
        continue
    
    print(f"[INFO] Processing images for {person_name}")
    
    # Loop through each image for this person
    for image_name in os.listdir(person_folder):
        if not image_name.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue
            
        image_path = os.path.join(person_folder, image_name)
        print(f"[INFO] Processing {image_path}")
        
        try:
            # Load image
            image = face_recognition.load_image_file(image_path)
            
            # Get face encodings - simplified approach
            encodings = face_recognition.face_encodings(image)
            
            if len(encodings) > 0:
                # Use the first encoding if multiple faces are found
                known_encodings.append(encodings[0])
                known_names.append(person_name)
                print(f"[SUCCESS] Encoded face for {person_name}")
            else:
                print(f"[WARNING] No faces found in {image_path}")
                
        except Exception as e:
            print(f"[ERROR] Failed to process {image_path}: {str(e)}")

if len(known_encodings) == 0:
    print("[ERROR] No faces were encoded! Please check your dataset.")
    exit(1)

# Save encodings to file
print(f"[INFO] Saving {len(known_encodings)} encodings...")
data = {"encodings": known_encodings, "names": known_names}

with open(ENCODINGS_FILE, "wb") as f:
    pickle.dump(data, f)

print(f"[INFO] Encodings saved to {ENCODINGS_FILE}")
print(f"[INFO] Total faces encoded: {len(known_encodings)}")

# Print summary
from collections import Counter
name_counts = Counter(known_names)
print("\n[INFO] Summary:")
for name, count in name_counts.items():
    print(f"  {name}: {count} images")