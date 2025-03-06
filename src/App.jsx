import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Import employee components (to be created later)
import EmployeeDashboard from './components/attendance/EmployeeDashboard';
import CheckIn from './components/attendance/CheckIn';
import CheckOut from './components/attendance/CheckOut';
import AttendanceHistory from './components/attendance/AttendanceHistory';
import LeaveRequest from './components/leave/LeaveRequest';

// Import security components (to be created later)
import SecurityDashboard from './components/security/SecurityDashboard';
import ConfirmAttendance from './components/security/ConfirmAttendance';
import LeaveApproval from './components/leave/LeaveApproval';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'Security' ? '/security-dashboard' : '/employee-dashboard'} replace />;
  }
  
  return children;
};

// Main layout wrapper with header and footer
const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />
          
          {/* Employee routes */}
          <Route path="/employee-dashboard" element={
            <ProtectedRoute requiredRole="Employee">
              <MainLayout>
                <EmployeeDashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/check-in" element={
            <ProtectedRoute requiredRole="Employee">
              <MainLayout>
                <CheckIn />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/check-out" element={
            <ProtectedRoute requiredRole="Employee">
              <MainLayout>
                <CheckOut />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance-history" element={
            <ProtectedRoute requiredRole="Employee">
              <MainLayout>
                <AttendanceHistory />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/leave-request" element={
            <ProtectedRoute requiredRole="Employee">
              <MainLayout>
                <LeaveRequest />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Security routes */}
          <Route path="/security-dashboard" element={
            <ProtectedRoute requiredRole="Security">
              <MainLayout>
                <SecurityDashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/confirm-attendance" element={
            <ProtectedRoute requiredRole="Security">
              <MainLayout>
                <ConfirmAttendance />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/leave-approvals" element={
            <ProtectedRoute requiredRole="Security">
              <MainLayout>
                <LeaveApproval />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;