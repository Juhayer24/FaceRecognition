// src/App.js
import React from 'react';
import RegisterFace from './components/RegisterFace';

// import FaceRecognition from './components/FaceRecognition'; // You'd add this later for clock-in/out

function App() {
  return (
    <div className="App">
      <RegisterFace />
      {/* You can add routing here to switch between registration and clock-in/out */}
      {/* <FaceRecognition /> */}
    </div>
  );
}

export default App;