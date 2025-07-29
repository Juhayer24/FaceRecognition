// src/components/LiveClockInOut.js
import React, { useRef, useEffect, useState } from 'react';
import './LiveClockInOut.css';

function LiveClockInOut() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, active, processing
    const [message, setMessage] = useState('');
    const [lastRecognition, setLastRecognition] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSystemActive, setIsSystemActive] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);

    const intervalIdRef = useRef(null);
    const timeIntervalRef = useRef(null);

    useEffect(() => {
        // Update current time every second
        timeIntervalRef.current = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Fetch recent activity on component mount
        fetchRecentActivity();

        return () => {
            stopSystem();
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, []);

    const fetchRecentActivity = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/recent-activity');
            if (response.ok) {
                const data = await response.json();
                setRecentActivity(data);
            }
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            // Set mock data for demo
            setRecentActivity([
                { id: 1, name: 'John Doe', action: 'Clock In', time: '09:15 AM', status: 'success' },
                { id: 2, name: 'Jane Smith', action: 'Clock Out', time: '05:30 PM', status: 'success' },
                { id: 3, name: 'Mike Johnson', action: 'Clock In', time: '09:45 AM', status: 'late' }
            ]);
        }
    };

    const startSystem = async () => {
        setStatus('active');
        setMessage('Starting camera system...');
        setIsSystemActive(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setMessage('System active. Please look at the camera to clock in/out.');

            // Start face recognition processing
            intervalIdRef.current = setInterval(processFrame, 1000); // Process every second
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMessage("Failed to access camera. Please ensure it's connected and permission is granted.");
            setStatus('idle');
            setIsSystemActive(false);
        }
    };

    const stopSystem = () => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsSystemActive(false);
        setStatus('idle');
        setMessage('System stopped.');
        setLastRecognition(null);
    };

    const processFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);

        try {
            setStatus('processing');
            const response = await fetch('http://localhost:5000/api/recognize_face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });

            const data = await response.json();
            setStatus('active');

            if (data.status === 'recognized') {
                setLastRecognition({
                    name: data.name,
                    employeeId: data.employee_id,
                    action: data.action,
                    time: new Date().toLocaleTimeString(),
                    confidence: data.confidence,
                    isLate: data.is_late || false
                });
                setMessage(`${data.action} successful for ${data.name}`);
                
                // Refresh recent activity
                fetchRecentActivity();
            } else if (data.status === 'no_face') {
                setMessage('System active. Please look at the camera to clock in/out.');
                setLastRecognition(null);
            } else if (data.status === 'unknown') {
                setMessage('Face not recognized. Please contact admin if you are registered.');
                setLastRecognition(null);
            }
        } catch (err) {
            console.error("Error processing frame:", err);
            setMessage("Error communicating with server.");
            setStatus('active');
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="live-clockin-out">
            <div className="clockin-header">
                <h1 className="clockin-title">Employee Clock In/Out</h1>
                <div className="current-time">
                    <div className="time-display">{formatTime(currentTime)}</div>
                    <div className="date-display">{formatDate(currentTime)}</div>
                </div>
            </div>

            <div className="clockin-content">
                <div className="camera-section">
                    <div className="system-controls">
                        <div className={`system-status ${isSystemActive ? 'active' : 'inactive'}`}>
                            <span className="status-indicator">
                                {isSystemActive ? '🟢' : '🔴'}
                            </span>
                            <span className="status-text">
                                System {isSystemActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {!isSystemActive ? (
                            <button onClick={startSystem} className="btn btn-primary">
                                <span className="btn-icon">🎥</span>
                                Start System
                            </button>
                        ) : (
                            <button onClick={stopSystem} className="btn btn-danger">
                                <span className="btn-icon">⏹️</span>
                                Stop System
                            </button>
                        )}
                    </div>

                    <div className="camera-container">
                        {!isSystemActive ? (
                            <div className="camera-placeholder">
                                <div className="placeholder-icon">📷</div>
                                <p>Click "Start System" to activate the camera</p>
                            </div>
                        ) : (
                            <div className="camera-active">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    className="camera-video"
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                
                                <div className={`processing-overlay ${status === 'processing' ? 'visible' : ''}`}>
                                    <div className="processing-spinner">🔄</div>
                                    <p>Recognizing...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`status-message ${status}`}>
                        <p>{message}</p>
                    </div>
                </div>

                <div className="info-section">
                    {lastRecognition && (
                        <div className="recognition-result">
                            <h3 className="result-title">Latest Recognition</h3>
                            <div className={`result-card ${lastRecognition.action.toLowerCase().replace(' ', '-')}`}>
                                <div className="result-avatar">
                                    {lastRecognition.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="result-details">
                                    <h4 className="employee-name">{lastRecognition.name}</h4>
                                    <p className="employee-id">ID: {lastRecognition.employeeId}</p>
                                    <div className="action-info">
                                        <span className={`action-badge ${lastRecognition.action.toLowerCase().replace(' ', '-')}`}>
                                            {lastRecognition.action === 'Clock In' ? '🟢' : '🔴'}
                                            {lastRecognition.action}
                                        </span>
                                        {lastRecognition.isLate && (
                                            <span className="late-badge">⚠️ Late</span>
                                        )}
                                    </div>
                                    <p className="recognition-time">{lastRecognition.time}</p>
                                    <p className="confidence">Confidence: {Math.round(lastRecognition.confidence * 100)}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="recent-activity">
                        <h3 className="activity-title">Recent Activity</h3>
                        <div className="activity-list">
                            {recentActivity.length > 0 ? (
                                recentActivity.map(activity => (
                                    <div key={activity.id} className={`activity-item activity-${activity.status}`}>
                                        <div className="activity-avatar">
                                            {activity.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-name">{activity.name}</p>
                                            <p className="activity-action">{activity.action}</p>
                                        </div>
                                        <div className="activity-time">
                                            <span className={`activity-status status-${activity.status}`}>
                                                {activity.status === 'late' ? '⚠️' : '✅'}
                                            </span>
                                            <span className="activity-timestamp">{activity.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-activity">
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="instructions">
                        <h3 className="instructions-title">How to Use</h3>
                        <div className="instruction-steps">
                            <div className="step">
                                <span className="step-number">1</span>
                                <p>Click "Start System" to activate the camera</p>
                            </div>
                            <div className="step">
                                <span className="step-number">2</span>
                                <p>Look directly at the camera for recognition</p>
                            </div>
                            <div className="step">
                                <span className="step-number">3</span>
                                <p>Wait for confirmation of clock in/out</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LiveClockInOut;