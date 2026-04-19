import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentDatabase from './pages/StudentDatabase';
import Scheduler from './pages/Scheduler';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import ActivityForm from './pages/ActivityForm';
import MonitoringList from './pages/MonitoringList';
import { useStore } from './store/useStore';

// ProtectedRoute Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/database" element={<ProtectedRoute><StudentDatabase /></ProtectedRoute>} />
        <Route path="/scheduler" element={<ProtectedRoute><Scheduler /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityForm /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><MonitoringList /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
