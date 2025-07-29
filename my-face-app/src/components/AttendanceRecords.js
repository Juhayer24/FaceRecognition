// src/components/AttendanceRecords.js
import React, { useState, useEffect } from 'react';
import './AttendanceRecords.css';

function AttendanceRecords() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        employee: '',
        department: '',
        dateFrom: '',
        dateTo: '',
        status: 'all'
    });
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    useEffect(() => {
        fetchRecords();
        fetchEmployees();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [records, filters]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/attendance-records');
            if (response.ok) {
                const data = await response.json();
                setRecords(data);
            } else {
                throw new Error('Failed to fetch records');
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            // Set mock data for demo
            setRecords([
                {
                    id: 1,
                    employeeName: 'John Doe',
                    employeeId: 'EMP001',
                    department: 'IT',
                    date: '2024-01-15',
                    clockIn: '09:15:00',
                    clockOut: '17:30:00',
                    totalHours: 8.25,
                    status: 'present',
                    isLate: false
                },
                {
                    id: 2,
                    employeeName: 'Jane Smith',
                    employeeId: 'EMP002',
                    department: 'HR',
                    date: '2024-01-15',
                    clockIn: '08:45:00',
                    clockOut: '17:15:00',
                    totalHours: 8.5,
                    status: 'present',
                    isLate: false
                },
                {
                    id: 3,
                    employeeName: 'Mike Johnson',
                    employeeId: 'EMP003',
                    department: 'Sales',
                    date: '2024-01-15',
                    clockIn: '09:30:00',
                    clockOut: '18:00:00',
                    totalHours: 8.5,
                    status: 'late',
                    isLate: true
                },
                {
                    id: 4,
                    employeeName: 'Sarah Wilson',
                    employeeId: 'EMP004',
                    department: 'Finance',
                    date: '2024-01-15',
                    clockIn: null,
                    clockOut: null,
                    totalHours: 0,
                    status: 'absent',
                    isLate: false
                },
                {
                    id: 5,
                    employeeName: 'David Brown',
                    employeeId: 'EMP005',
                    department: 'Operations',
                    date: '2024-01-15',
                    clockIn: '08:30:00',
                    clockOut: '16:30:00',
                    totalHours: 8,
                    status: 'present',
                    isLate: false
                }
            ]);
        }
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
                const uniqueDepartments = [...new Set(data.map(emp => emp.department).filter(Boolean))];
                setDepartments(uniqueDepartments);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            // Set mock data
            const mockEmployees = [
                { id: 1, name: 'John Doe', employeeId: 'EMP001', department: 'IT' },
                { id: 2, name: 'Jane Smith', employeeId: 'EMP002', department: 'HR' },
                { id: 3, name: 'Mike Johnson', employeeId: 'EMP003', department: 'Sales' },
                { id: 4, name: 'Sarah Wilson', employeeId: 'EMP004', department: 'Finance' },
                { id: 5, name: 'David Brown', employeeId: 'EMP005', department: 'Operations' }
            ];
            setEmployees(mockEmployees);
            setDepartments(['IT', 'HR', 'Sales', 'Finance', 'Operations']);
        }
    };

    const applyFilters = () => {
        let filtered = [...records];

        if (filters.employee) {
            filtered = filtered.filter(record => 
                record.employeeName.toLowerCase().includes(filters.employee.toLowerCase()) ||
                record.employeeId.toLowerCase().includes(filters.employee.toLowerCase())
            );
        }

        if (filters.department) {
            filtered = filtered.filter(record => record.department === filters.department);
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(record => record.date >= filters.dateFrom);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(record => record.date <= filters.dateTo);
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(record => record.status === filters.status);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const aValue = new Date(a.date);
                const bValue = new Date(b.date);
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            } else if (sortConfig.key === 'totalHours') {
                return sortConfig.direction === 'asc' ? a.totalHours - b.totalHours : b.totalHours - a.totalHours;
            } else {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (sortConfig.direction === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            }
        });

        setFilteredRecords(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            employee: '',
            department: '',
            dateFrom: '',
            dateTo: '',
            status: 'all'
        });
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const exportToCSV = () => {
        const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(record => [
                record.employeeName,
                record.employeeId,
                record.department,
                record.date,
                record.clockIn || 'N/A',
                record.clockOut || 'N/A',
                record.totalHours,
                record.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status, isLate) => {
        let className = `status-badge status-${status}`;
        let icon = '';
        let text = '';

        switch (status) {
            case 'present':
                icon = isLate ? '⚠️' : '✅';
                text = isLate ? 'Late' : 'Present';
                className = isLate ? 'status-badge status-late' : 'status-badge status-present';
                break;
            case 'absent':
                icon = '❌';
                text = 'Absent';
                break;
            case 'late':
                icon = '⚠️';
                text = 'Late';
                break;
            default:
                icon = '❓';
                text = 'Unknown';
        }

        return (
            <span className={className}>
                <span className="status-icon">{icon}</span>
                {text}
            </span>
        );
    };

    return (
        <div className="attendance-records">
            <div className="records-header">
                <h1 className="records-title">Attendance Records</h1>
                <div className="header-actions">
                    <button onClick={exportToCSV} className="btn btn-export">
                        <span className="btn-icon">📊</span>
                        Export CSV
                    </button>
                    <button onClick={fetchRecords} className="btn btn-refresh">
                        <span className="btn-icon">🔄</span>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="filters-section">
                <div className="filters-container">
                    <div className="filter-group">
                        <label className="filter-label">Employee</label>
                        <input
                            type="text"
                            value={filters.employee}
                            onChange={(e) => handleFilterChange('employee', e.target.value)}
                            placeholder="Search by name or ID"
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Department</label>
                        <select
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>

                    <div className="filter-actions">
                        <button onClick={clearFilters} className="btn btn-clear">
                            <span className="btn-icon">🗑️</span>
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="records-summary">
                <div className="summary-card">
                    <span className="summary-label">Total Records:</span>
                    <span className="summary-value">{filteredRecords.length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Present:</span>
                    <span className="summary-value present">
                        {filteredRecords.filter(r => r.status === 'present' && !r.isLate).length}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Late:</span>
                    <span className="summary-value late">
                        {filteredRecords.filter(r => r.status === 'late' || r.isLate).length}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Absent:</span>
                    <span className="summary-value absent">
                        {filteredRecords.filter(r => r.status === 'absent').length}
                    </span>
                </div>
            </div>

            <div className="records-table-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">⏳</div>
                        <p>Loading attendance records...</p>
                    </div>
                ) : (
                    <>
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('employeeName')} className="sortable">
                                        Employee
                                        {sortConfig.key === 'employeeName' && (
                                            <span className="sort-indicator">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th onClick={() => handleSort('department')} className="sortable">
                                        Department
                                        {sortConfig.key === 'department' && (
                                            <span className="sort-indicator">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th onClick={() => handleSort('date')} className="sortable">
                                        Date
                                        {sortConfig.key === 'date' && (
                                            <span className="sort-indicator">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th>Clock In</th>
                                    <th>Clock Out</th>
                                    <th onClick={() => handleSort('totalHours')} className="sortable">
                                        Total Hours
                                        {sortConfig.key === 'totalHours' && (
                                            <span className="sort-indicator">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.map(record => (
                                    <tr key={record.id} className={`record-row status-${record.status}`}>
                                        <td className="employee-cell">
                                            <div className="employee-info">
                                                <div className="employee-avatar">
                                                    {record.employeeName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="employee-details">
                                                    <div className="employee-name">{record.employeeName}</div>
                                                    <div className="employee-id">{record.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="department-cell">{record.department}</td>
                                        <td className="date-cell">{formatDate(record.date)}</td>
                                        <td className="time-cell">{formatTime(record.clockIn)}</td>
                                        <td className="time-cell">{formatTime(record.clockOut)}</td>
                                        <td className="hours-cell">
                                            {record.totalHours > 0 ? `${record.totalHours}h` : 'N/A'}
                                        </td>
                                        <td className="status-cell">
                                            {getStatusBadge(record.status, record.isLate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredRecords.length === 0 && (
                            <div className="no-records">
                                <div className="no-records-icon">📋</div>
                                <h3>No Records Found</h3>
                                <p>Try adjusting your filters or date range</p>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    ← Previous
                                </button>
                                
                                <div className="pagination-info">
                                    Page {currentPage} of {totalPages}
                                    <span className="records-info">
                                        ({indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length})
                                    </span>
                                </div>
                                
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AttendanceRecords;