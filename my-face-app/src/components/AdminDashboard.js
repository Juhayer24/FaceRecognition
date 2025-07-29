// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateArrivals: 0,
    systemStatus: 'active'
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
    fetchRecentActivity();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivity();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo
      setStats({
        totalEmployees: 25,
        presentToday: 18,
        lateArrivals: 3,
        systemStatus: 'active'
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/recent-activity');
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
        { id: 3, name: 'Mike Johnson', action: 'Clock In', time: '09:45 AM', status: 'late' },
        { id: 4, name: 'Sarah Wilson', action: 'Clock In', time: '08:30 AM', status: 'success' },
        { id: 5, name: 'David Brown', action: 'Clock Out', time: '06:15 PM', status: 'success' }
      ]);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {description && <p className="stat-description">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <div className="dashboard-date">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon="👥"
          color="blue"
          description="Registered in system"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon="✅"
          color="green"
          description="Currently clocked in"
        />
        <StatCard
          title="Late Arrivals"
          value={stats.lateArrivals}
          icon="⏰"
          color="orange"
          description="After 9:00 AM"
        />
        <StatCard
          title="System Status"
          value={stats.systemStatus === 'active' ? 'Active' : 'Inactive'}
          icon="🟢"
          color={stats.systemStatus === 'active' ? 'green' : 'red'}
          description="Camera & Recognition"
        />
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
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

        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button className="quick-action-btn btn-primary">
              <span className="action-icon">📊</span>
              <span>Generate Report</span>
            </button>
            <button className="quick-action-btn btn-secondary">
              <span className="action-icon">🔄</span>
              <span>Sync Data</span>
            </button>
            <button className="quick-action-btn btn-warning">
              <span className="action-icon">⚙️</span>
              <span>System Settings</span>
            </button>
            <button className="quick-action-btn btn-info">
              <span className="action-icon">📤</span>
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;