// src/components/EmployeeRegistration.js
import React, { useRef, useEffect, useState } from 'react';
import './EmployeeRegistration.css';

function EmployeeRegistration() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [personName, setPersonName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('idle'); // idle, capturing, processing, complete, error
    const [message, setMessage] = useState('');
    const [imagesCaptured, setImagesCaptured] = useState(0);
    const [targetImages, setTargetImages] = useState(0);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const intervalIdRef = useRef(null);

    const startCapture = async () => {
        if (!personName.trim() || !employeeId.trim()) {
            setMessage("Please enter both name and employee ID before starting capture.");
            return;
        }

        setStatus('capturing');
        setMessage('Starting camera...');
        setImagesCaptured(0);
        setTargetImages(0);
        setFaceDetected(false);
        setIsCapturing(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setMessage("Camera started. Please center your face in the frame and look directly at the camera.");

            intervalIdRef.current = setInterval(sendFrameToBackend, 200);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMessage("Failed to access camera. Please ensure it's connected and permission is granted.");
            setStatus('error');
            setIsCapturing(false);
        }
    };

    const stopCapture = () => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCapturing(false);
        setStatus('idle');
        setMessage('Capture stopped.');
    };

    const sendFrameToBackend = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);

        try {
            const response = await fetch('http://localhost:5000/api/register_face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    personName: personName.trim(), 
                    employeeId: employeeId.trim(),
                    department: department.trim(),
                    image: imageData 
                }),
            });

            const data = await response.json();

            if (data.status === 'error') {
                setMessage(`Error: ${data.message}`);
                setStatus('error');
                stopCapture();
            } else {
                setImagesCaptured(data.images_captured);
                setTargetImages(data.target_images);
                setFaceDetected(data.face_detected);
                setMessage(data.message);

                if (data.status === 'complete') {
                    setStatus('complete');
                    stopCapture();
                }
            }
        } catch (err) {
            console.error("Error sending frame to backend:", err);
            setMessage("Failed to communicate with server. Please check your connection.");
            setStatus('error');
            stopCapture();
        }
    };

    const resetForm = () => {
        setPersonName('');
        setEmployeeId('');
        setDepartment('');
        setStatus('idle');
        setMessage('');
        setImagesCaptured(0);
        setTargetImages(0);
        setFaceDetected(false);
    };

    useEffect(() => {
        return () => {
            stopCapture();
        };
    }, []);

    return (
        <div className="employee-registration">
            <div className="registration-header">
                <h1 className="registration-title">Register New Employee</h1>
                <p className="registration-subtitle">Add a new employee to the facial recognition system</p>
            </div>

            <div className="registration-content">
                <div className="registration-form">
                    <div className="form-section">
                        <h2 className="section-title">Employee Information</h2>
                        
                        <div className="form-group">
                            <label htmlFor="personName" className="form-label">
                                <span className="label-icon">👤</span>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="personName"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                placeholder="Enter employee's full name"
                                disabled={isCapturing}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="employeeId" className="form-label">
                                <span className="label-icon">🆔</span>
                                Employee ID *
                            </label>
                            <input
                                type="text"
                                id="employeeId"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                placeholder="Enter unique employee ID"
                                disabled={isCapturing}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="department" className="form-label">
                                <span className="label-icon">🏢</span>
                                Department
                            </label>
                            <select
                                id="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                disabled={isCapturing}
                                className="form-select"
                            >
                                <option value="">Select Department</option>
                                <option value="Administration">Administration</option>
                                <option value="Human Resources">Human Resources</option>
                                <option value="IT">Information Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                                <option value="Sales">Sales</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            {!isCapturing ? (
                                <button
                                    onClick={startCapture}
                                    disabled={!personName.trim() || !employeeId.trim()}
                                    className="btn btn-primary"
                                >
                                    <span className="btn-icon">📷</span>
                                    Start Face Capture
                                </button>
                            ) : (
                                <button
                                    onClick={stopCapture}
                                    className="btn btn-danger"
                                >
                                    <span className="btn-icon">⏹️</span>
                                    Stop Capture
                                </button>
                            )}
                            
                            {(status === 'complete' || status === 'error') && (
                                <button
                                    onClick={resetForm}
                                    className="btn btn-secondary"
                                >
                                    <span className="btn-icon">🔄</span>
                                    Register Another
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="camera-section">
                    <div className="camera-container">
                        {status === 'idle' && (
                            <div className="camera-placeholder">
                                <div className="placeholder-icon">📹</div>
                                <p>Fill in the form and click "Start Face Capture" to begin</p>
                            </div>
                        )}

                        {status === 'capturing' && (
                            <div className="camera-active">
                                <div className="video-container">
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        muted 
                                        className="camera-video"
                                    />
                                    <div className={`face-overlay ${faceDetected ? 'face-detected' : 'no-face'}`}>
                                        <div className="face-frame"></div>
                                    </div>
                                </div>
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                
                                <div className="capture-status">
                                    <div className={`status-indicator ${faceDetected ? 'success' : 'warning'}`}>
                                        <span className="status-icon">
                                            {faceDetected ? '✅' : '⚠️'}
                                        </span>
                                        <span className="status-text">
                                            {faceDetected ? 'Face Detected' : 'Position your face in the frame'}
                                        </span>
                                    </div>
                                    
                                    <div className="progress-section">
                                        <div className="progress-label">
                                            Images Captured: {imagesCaptured} / {targetImages}
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${targetImages > 0 ? (imagesCaptured / targetImages) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(status === 'complete' || status === 'error') && (
                            <div className={`result-container ${status}`}>
                                <div className="result-icon">
                                    {status === 'complete' ? '🎉' : '❌'}
                                </div>
                                <div className="result-message">
                                    <h3>{status === 'complete' ? 'Registration Successful!' : 'Registration Failed'}</h3>
                                    <p>{message}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`message-container ${status}`}>
                            <p className="status-message">{message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmployeeRegistration;