# server.py
from flask import Flask, request, jsonify
import subprocess
from flask_cors import CORS # Import CORS

app = Flask(__name__)
# Enable CORS for all routes, allowing your React frontend (on a different port) to access the API
CORS(app)

@app.route('/capture', methods=['POST'])
def capture():
    """
    Endpoint to trigger image capture for a new person.
    Expects a JSON body with 'name'.
    Runs the 'capture.py' script as a subprocess.
    """
    try:
        name = request.json.get('name')
        if not name:
            return jsonify({'error': 'Name is required'}), 400

        # Run capture.py as a subprocess.
        # Ensure capture.py is in the same directory or its path is specified.
        # The output of the subprocess will not be directly returned to the frontend.
        # You might want to add more robust error handling or status checking if capture.py
        # provides detailed exit codes or output.
        result = subprocess.run(['python', 'capture.py', name], capture_output=True, text=True)
        
        if result.returncode != 0:
            # If the subprocess returned an error
            print(f"Error in capture.py: {result.stderr}")
            return jsonify({'message': f'Error capturing images for {name}: {result.stderr}', 'status': 'error'}), 500

        print(f"Capture for {name} completed: {result.stdout}")
        return jsonify({'message': f'Captured images for {name}', 'status': 'success'}), 200
    except Exception as e:
        print(f"Server error during capture: {e}")
        return jsonify({'message': f'Server error: {str(e)}', 'status': 'error'}), 500

@app.route('/train', methods=['POST'])
def train():
    """
    Endpoint to trigger the face recognition model training.
    Runs the 'train.py' script as a subprocess.
    """
    try:
        # Run train.py as a subprocess.
        result = subprocess.run(['python', 'train.py'], capture_output=True, text=True)
        
        if result.returncode != 0:
            # If the subprocess returned an error
            print(f"Error in train.py: {result.stderr}")
            return jsonify({'message': f'Error during training: {result.stderr}', 'status': 'error'}), 500

        print(f"Training completed: {result.stdout}")
        return jsonify({'message': 'Training complete', 'status': 'success'}), 200
    except Exception as e:
        print(f"Server error during training: {e}")
        return jsonify({'message': f'Server error: {str(e)}', 'status': 'error'}), 500

@app.route('/recognize', methods=['GET'])
def recognize():
    """
    Endpoint to start the face recognition process.
    Runs the 'recognize.py' script as a subprocess.
    Note: 'recognize.py' is expected to open a webcam window independently.
    """
    try:
        # Use Popen for recognize.py as it opens a separate window and might not
        # terminate immediately, allowing the Flask response to be sent.
        subprocess.Popen(['python', 'recognize.py'])
        print("Recognition started via subprocess.")
        return jsonify({'message': 'Recognition started. Check webcam window.', 'status': 'success'}), 200
    except Exception as e:
        print(f"Server error during recognition: {e}")
        return jsonify({'message': f'Server error: {str(e)}', 'status': 'error'}), 500

if __name__ == '__main__':
    # Run the Flask app on port 5000
    # Ensure this port is free or adjust it if needed (and update React accordingly)
    print("Starting Flask API. Visit http://127.0.0.1:5000")
    app.run(port=5000, debug=True) # debug=True provides helpful error messages during development
