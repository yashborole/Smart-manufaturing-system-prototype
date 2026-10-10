import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    ArrowLeft, Activity, Settings, AlertTriangle, Factory, 
    Layers, Sliders, User, LogOut, Menu, X, CheckCircle2, Clock,
    Sun, Moon, RefreshCw, Zap, Calendar
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const MachineInsight = () => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const { user, selectedPlant, logout, selectPlant, theme, toggleTheme } = useContext(AuthContext);

    const [machine, setMachine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [error, setError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePlant = () => {
        selectPlant(null);
        navigate('/select-plant');
    };

    const handleBack = () => {
        navigate('/dashboard', { state: { activeTab: 'insights' } });
    };

    const fetchMachineDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/plants/machines/${machineId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Machine not found');
                }
                throw new Error('Failed to load machine data');
            }
            const data = await res.json();
            setMachine(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error occurred while loading machine details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (machineId) {
            fetchMachineDetails();
        }
    }, [machineId]);

    if (!selectedPlant) {
        return null;
    }

    return (
        <div className="app-layout">
            {/* Mobile Sidebar Overlay */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
                onClick={() => setSidebarOpen(false)} 
                style={{
                    display: sidebarOpen ? 'block' : 'none',
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 95
                }}
            />

            {/* Left Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div>
                    <div className="sidebar-brand">
                        <div>
                            <div className="sidebar-brand-title">Factory MES</div>
                            <div className="sidebar-brand-sub">Manufacturing System</div>
                        </div>
                    </div>

                    <div className="sidebar-node-card">
                        <div className="sidebar-node-label">Current Factory</div>
                        <div className="sidebar-node-name">{selectedPlant.name}</div>
                        <button onClick={handleChangePlant} className="sidebar-node-btn">
                            <Layers size={13} />
                            Change Factory
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="sidebar-nav-item"
                        >
                            <Activity size={16} />
                            Plant Overview
                        </button>

                        <button
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'insights' } })}
                            className="sidebar-nav-item active"
                        >
                            <Sliders size={16} />
                            Machine Status
                        </button>

                        <button
                            onClick={() => navigate('/scheduling')}
                            className="sidebar-nav-item"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '12px' }}
                        >
                            <Calendar size={16} color="#c4b5fd" />
                            Job Scheduling
                        </button>

                        <button
                            onClick={() => navigate('/kiosk')}
                            className="sidebar-nav-item"
                        >
                            <Zap size={16} color="#38bdf8" />
                            Machine Kiosk
                        </button>
                    </nav>
                </div>

                <div className="sidebar-profile">
                    <div className="sidebar-profile-info">
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                        }}>
                            <User size={16} />
                        </div>
                        <div>
                            <div className="sidebar-profile-name">{user?.name}</div>
                            <div className="sidebar-profile-role">Operator</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-logout-btn">
                        <LogOut size={13} />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Right Workspace */}
            <div className="workspace-wrapper">
                
                <header className="workspace-header">
                    <div className="workspace-header-left">
                        <button 
                            onClick={handleBack}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px' }}
                        >
                            <ArrowLeft size={14} />
                            Back to Machines
                        </button>
                        <div className="workspace-header-title">
                            {machine ? `${machine.name} Details` : 'Machine Diagnostics'}
                        </div>
                    </div>

                    <div className="workspace-header-right">
                        <button 
                            onClick={toggleTheme}
                            className="theme-toggle-btn"
                        >
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                    </div>
                </header>

                <main className="workspace-content">
                    {error && (
                        <div style={{ 
                            background: 'var(--status-stopped-bg)', 
                            border: '1px solid var(--status-stopped-border)',
                            color: 'var(--status-stopped)', 
                            padding: '10px 14px', 
                            borderRadius: '6px', 
                            marginBottom: '16px', 
                            fontSize: '13px'
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            Loading machine details...
                        </div>
                    ) : machine ? (
                        <>
                            {/* Top Info Banner */}
                            <div className="card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                        {machine.name}
                                    </h1>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Machine Type: <strong>{machine.machine_type || 'General Equipment'}</strong> • Plant: <strong>{machine.plant_name}</strong>
                                    </div>
                                </div>
                                <div>
                                    <span className={`badge ${machine.status?.toLowerCase() === 'running' ? 'badge-running' : machine.status?.toLowerCase() === 'maintenance' ? 'badge-maintenance' : 'badge-stopped'}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                                        Status: {machine.status}
                                    </span>
                                </div>
                            </div>

                            {/* 4 Cards */}
                            <div className="kpi-grid">
                                <div className="kpi-card">
                                    <div className="kpi-title">7-Day Average Efficiency</div>
                                    <div className="kpi-value" style={{ color: machine.avg_efficiency_7d >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>
                                        {machine.avg_efficiency_7d}%
                                    </div>
                                    <div className="kpi-status" style={{ color: machine.avg_efficiency_7d >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>
                                        {machine.avg_efficiency_7d >= 85 ? 'Normal Operation' : 'Check Tooling / Speed'}
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-title">Today's Produced Parts</div>
                                    <div className="kpi-value" style={{ color: 'var(--primary)' }}>
                                        {machine.latest_production.produced} / {machine.latest_production.target}
                                    </div>
                                    <div className="kpi-status" style={{ color: 'var(--text-muted)' }}>
                                        {machine.latest_production.efficiency}% of today's target
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-title">7-Day Total Parts</div>
                                    <div className="kpi-value" style={{ color: 'var(--text-main)' }}>
                                        {machine.total_produced_7d.toLocaleString()}
                                    </div>
                                    <div className="kpi-status" style={{ color: 'var(--text-muted)' }}>
                                        Finished parts completed
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-title">Machine ID</div>
                                    <div className="kpi-value" style={{ color: 'var(--text-main)' }}>
                                        #{machine.id}
                                    </div>
                                    <div className="kpi-status" style={{ color: 'var(--status-running)' }}>
                                        Registered in System
                                    </div>
                                </div>
                            </div>

                            {/* Daily Production Table (Simple and very clear for operators) */}
                            <div className="card">
                                <h2 className="card-title">Daily Production History (Last 7 Days)</h2>
                                <p className="card-subtitle">List of daily parts produced and target numbers</p>

                                {machine.history.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                        No production records found for the past 7 days.
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '10px 12px' }}>Day & Date</th>
                                                    <th style={{ padding: '10px 12px' }}>Parts Produced</th>
                                                    <th style={{ padding: '10px 12px' }}>Target Goal</th>
                                                    <th style={{ padding: '10px 12px' }}>Efficiency</th>
                                                    <th style={{ padding: '10px 12px' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {machine.history.map((day, idx) => {
                                                    const metTarget = day.produced >= day.target;
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                                                                {day.day_name}, {day.date}
                                                            </td>
                                                            <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                                                                {day.produced.toLocaleString()} parts
                                                            </td>
                                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                                                {day.target.toLocaleString()} parts
                                                            </td>
                                                            <td style={{ padding: '12px', fontWeight: '700', color: day.efficiency >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>
                                                                {day.efficiency}%
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span className={`badge ${metTarget ? 'badge-running' : 'badge-idle'}`}>
                                                                    {metTarget ? 'Target Achieved' : 'Below Target'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default MachineInsight;
