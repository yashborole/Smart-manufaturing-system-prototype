import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import SelectPlant from './pages/SelectPlant';
import Dashboard from './pages/Dashboard';
import MachineInsight from './pages/MachineInsight';
import MachineKiosk from './pages/MachineKiosk';
import JobScheduling from './pages/JobScheduling';
import './App.css';

const ProtectedRoute = ({ children, requirePlant = false }) => {
    const { user, selectedPlant } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requirePlant && !selectedPlant) {
        return <Navigate to="/select-plant" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route 
                            path="/select-plant" 
                            element={
                                <ProtectedRoute>
                                    <SelectPlant />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute requirePlant={true}>
                                    <Dashboard />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/machine-insight/:machineId" 
                            element={
                                <ProtectedRoute requirePlant={true}>
                                    <MachineInsight />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/kiosk" 
                            element={
                                <ProtectedRoute requirePlant={true}>
                                    <MachineKiosk />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/scheduling" 
                            element={
                                <ProtectedRoute requirePlant={true}>
                                    <JobScheduling />
                                </ProtectedRoute>
                            } 
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
