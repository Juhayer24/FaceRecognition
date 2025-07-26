// src/App.js
import React, { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState(""); // State to display messages to the user

  // Function to handle API calls and update messages
  const callApi = async (url, method = "GET", body = null) => {
    setMessage("Processing request..."); // Show loading message
    try {
      const options = {
        method: method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.message || 'Something went wrong'}`);
      }
    } catch (error) {
      console.error("API call failed:", error);
      setMessage(`Failed to connect to backend: ${error.message}`);
    }
  };

  const handleCapture = () => {
    if (!name.trim()) {
      setMessage("Please enter a name before capturing.");
      return;
    }
    callApi("http://localhost:5000/capture", "POST", { name });
  };

  const handleTrain = () => {
    callApi("http://localhost:5000/train", "POST");
  };

  const handleRecognize = () => {
    callApi("http://localhost:5000/recognize");
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: 'auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f0f2f5', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>Face Clock-In System</h1>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name to capture"
          style={{ padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
        />
        <button
          onClick={handleCapture}
          disabled={!name.trim()}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, transform 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Capture Face
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleTrain}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, transform 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Train Model
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleRecognize}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, transform 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fb8c00'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Recognize Face
        </button>
      </div>

      {message && (
        <p style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e0f7fa',
          border: '1px solid #b2ebf2',
          borderRadius: '5px',
          textAlign: 'center',
          color: '#00796b'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default App;
