from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
import json
import time
from datetime import datetime

# Import the backend capture logic and training functions
from backend_capture import process_and_save_frame # New backend capture utility
from train import compute_encodings, save_encodings # Re-use your training functions

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# Configuration
DATASET_DIR = "dataset"
ENCODINGS_FILE = "encodings.json"
TARGET_AUGMENTED_IMAGES_PER_PERSON = 50 # Total target images after augmentation

# In-memory tracking for registration process
# This will store how many images have been collected for a person during a session
registration_sessions = {} # {person_name: current_count}

@app.route('/api/register_face', methods=['POST'])
def register_face():
    data = request.json
    person_name = data.get('personName')
    image_data = data.get('image') # Base64 encoded image from frontend

    if not person_name or not image_data:
        return jsonify({"status": "error", "message": "Person name and image data are required."}), 400

    # Ensure dataset directory exists for the person
    person_save_path = os.path.join(DATASET_DIR, person_name)
    os.makedirs(person_save_path, exist_ok=True)

    # Decode the base64 image
    try:
        # The image data comes as "data:image/jpeg;base64,..."
        header, encoded = image_data.split(",", 1)
        np_arr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            raise ValueError("Could not decode image.")

    except Exception as e:
        return jsonify({"status": "error", "message": f"Invalid image data: {str(e)}"}), 400

    # Get current count for this person or initialize
    current_count = registration_sessions.get(person_name, 0)

    # Process the frame and save augmented images
    saved_this_frame_count, face_locations, message = \
        process_and_save_frame(frame_bgr, person_name, current_count,
                               TARGET_AUGMENTED_IMAGES_PER_PERSON, person_save_path)

    new_total_count = current_count + saved_this_frame_count
    registration_sessions[person_name] = new_total_count

    response_data = {
        "status": "processing",
        "message": message,
        "person_name": person_name,
        "images_captured": new_total_count,
        "target_images": TARGET_AUGMENTED_IMAGES_PER_PERSON,
        "face_detected": bool(face_locations) # True if a face was detected
    }

    # Check if we have enough images
    if new_total_count >= TARGET_AUGMENTED_IMAGES_PER_PERSON:
        response_data["status"] = "complete"
        response_data["message"] = f"Finished capturing {new_total_count} images for {person_name}. Starting training..."
        print(f"[INFO] Training triggered for {person_name}...")
        try:
            # Trigger the training process
            encodings_data = compute_encodings(DATASET_DIR)
            save_encodings(encodings_data, ENCODINGS_FILE)
            # You might want to reload encodings in the recognition module here if it's running
            # For simplicity, if recognition is a separate process, it would load on startup.
            # If integrated, need to add a global reload for `known_encodings`
            response_data["training_status"] = "success"
            response_data["message"] += " Training complete!"
            del registration_sessions[person_name] # Clear session
        except Exception as e:
            response_data["training_status"] = "error"
            response_data["message"] += f" Error during training: {str(e)}"
            print(f"[ERROR] Training error: {e}")

    return jsonify(response_data)

# You can add the /api/video_feed and /api/attendance_records here later
# to make this a complete Flask app for the whole system.
# For now, let's keep it focused on registration.

# Basic health check endpoint
@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "running", "message": "Face recognition backend is up."})

if __name__ == '__main__':
    # Ensure the dataset root directory exists
    os.makedirs(DATASET_DIR, exist_ok=True)
    print("Starting Flask API. Visit http://127.0.0.1:5000")
    print(f"Dataset will be saved in: {os.path.abspath(DATASET_DIR)}")
    app.run(host='0.0.0.0', port=5000, debug=True)