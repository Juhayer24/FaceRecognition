// src/components/RegisterFace.js
import React, { useRef, useEffect, useState } from 'react';

function RegisterFace() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [personName, setPersonName] = useState('');
    const [status, setStatus] = useState('idle'); // idle, capturing, processing, complete, error
    const [message, setMessage] = useState('');
    const [imagesCaptured, setImagesCaptured] = useState(0);
    const [targetImages, setTargetImages] = useState(0);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const intervalIdRef = useRef(null); // To store interval ID for clearing

    const startCapture = async () => {
        if (!personName.trim()) {
            setMessage("Please enter a name before starting capture.");
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

            setMessage("Camera started. Please center your face. Capturing frames...");

            // Start sending frames periodically
            intervalIdRef.current = setInterval(sendFrameToBackend, 200); // Send every 200ms
        } catch (err) {
            console.error("Error accessing camera:", err);
            setMessage("Failed to access camera. Please ensure it's connected and allowed. " + err.message);
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

        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7); // Get JPEG data, 70% quality

        try {
            const response = await fetch('http://localhost:5000/api/register_face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ personName: personName.trim(), image: imageData }),
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
                    stopCapture(); // Stop camera once registration is complete
                    // Optionally, you could trigger a page redirect or display final success message
                }
            }
        } catch (err) {
            console.error("Error sending frame to backend:", err);
            setMessage("Failed to communicate with backend. " + err.message);
            setStatus('error');
            stopCapture();
        }
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            stopCapture();
        };
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h1>Register New Person</h1>
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="personName" style={{ display: 'block', marginBottom: '5px' }}>Person Name:</label>
                <input
                    type="text"
                    id="personName"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={isCapturing}
                    style={{ padding: '80x', fontSize: '16px', width: '300px' }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                {!isCapturing ? (
                    <button
                        onClick={startCapture}
                        disabled={!personName.trim()}
                        style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Start Capture
                    </button>
                ) : (
                    <button
                        onClick={stopCapture}
                        style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Stop Capture
                    </button>
                )}
            </div>

            <div style={{ border: '1px solid #ddd', padding: '10px', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                {status === 'idle' && <p>Click "Start Capture" to begin.</p>}
                {status === 'capturing' && (
                    <>
                        <video ref={videoRef} autoPlay muted style={{ width: '100%', maxWidth: '640px', height: 'auto', border: '2px solid #333' }}></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <p>Status: {message}</p>
                        {faceDetected ? (
                            <p style={{ color: 'green', fontWeight: 'bold' }}>Face Detected!</p>
                        ) : (
                            <p style={{ color: 'red', fontWeight: 'bold' }}>No Face Detected - Please center your face.</p>
                        )}
                        <p>Images Captured: {imagesCaptured} / {targetImages}</p>
                        <progress value={imagesCaptured} max={targetImages} style={{ width: '80%', height: '20px' }}></progress>
                    </>
                )}
                {(status === 'complete' || status === 'error') && (
                    <>
                        <p>{message}</p>
                        {status === 'complete' && <p style={{ color: 'green', fontWeight: 'bold' }}>Registration Complete!</p>}
                        {status === 'error' && <p style={{ color: 'red', fontWeight: 'bold' }}>Registration Failed!</p>}
                    </>
                )}
            </div>
        </div>
    );
}

export default RegisterFace;