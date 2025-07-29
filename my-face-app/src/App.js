// src/App.js
import React, { useState } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import EmployeeRegistration from './components/EmployeeRegistration';
import LiveClockInOut from './components/LiveClockInOut';
import AttendanceRecords from './components/AttendanceRecords';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'register':
        return <EmployeeRegistration />;
      case 'clockin':
        return <LiveClockInOut />;
      case 'records':
        return <AttendanceRecords />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="App">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;