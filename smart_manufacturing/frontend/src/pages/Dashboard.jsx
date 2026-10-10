import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    LogOut, Factory, Activity, AlertTriangle, Settings, Bell, 
    CheckCircle2, Clock, AlertCircle, Sliders, Layers, User, Menu, X, Zap, Calendar,
    Moon, Sun, RefreshCw, ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Dashboard = () => {
    const { user, selectedPlant, logout, selectPlant, theme, toggleTheme } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [kpis, setKpis] = useState(null);
    const [activities, setActivities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [machinesLoading, setMachinesLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePlant = () => {
        selectPlant(null);
        navigate('/select-plant');
    };

    // Fetch plant overview data
    const fetchDashboardData = async () => {
        if (!selectedPlant) return;
        try {
            const [kpisRes, activitiesRes, alertsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/dashboard/kpis/${selectedPlant.id}`),
                fetch(`${API_BASE_URL}/dashboard/activity/${selectedPlant.id}?limit=6`),
                fetch(`${API_BASE_URL}/dashboard/alerts/${selectedPlant.id}`)
            ]);

            if (!kpisRes.ok || !activitiesRes.ok || !alertsRes.ok) {
                throw new Error('Could not update live data. Trying again...');
            }

            const [kpisData, activitiesData, alertsData] = await Promise.all([
                kpisRes.json(),
                activitiesRes.json(),
                alertsRes.json()
            ]);

            setKpis(kpisData);
            setActivities(activitiesData);
            setAlerts(alertsData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            setError('Connection issue with plant server. Retrying...');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError('');
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 4000);
        return () => clearInterval(interval);
    }, [selectedPlant]);

    // Fetch machines when switching to insights tab
    useEffect(() => {
        const fetchMachineInsights = async () => {
            if (!selectedPlant || activeTab !== 'insights') return;
            setMachinesLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/machines`);
                if (!res.ok) throw new Error('Could not load machine list');
                const data = await res.json();
                setMachines(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load machines data');
            } finally {
                setMachinesLoading(false);
            }
        };

        fetchMachineInsights();
    }, [selectedPlant, activeTab]);

    if (!selectedPlant) {
        return null;
    }

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '';
        }
    };

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
                    {/* Plant Logo / Title */}
                    <div className="sidebar-brand">
                        <div>
                            <div className="sidebar-brand-title">Factory MES</div>
                            <div className="sidebar-brand-sub">Manufacturing System</div>
                        </div>
                        <button 
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'none' }}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Active Plant Info */}
                    <div className="sidebar-node-card">
                        <div className="sidebar-node-label">Current Factory</div>
                        <div className="sidebar-node-name">{selectedPlant.name}</div>
                        <button onClick={handleChangePlant} className="sidebar-node-btn">
                            <Layers size={13} />
                            Change Factory
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="sidebar-nav">
                        <button
                            onClick={() => {
                                setActiveTab('overview');
                                setSidebarOpen(false);
                            }}
                            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        >
                            <Activity size={16} />
                            Plant Overview
                        </button>

                        <button
                            onClick={() => {
                                setActiveTab('insights');
                                setSidebarOpen(false);
                            }}
                            className={`sidebar-nav-item ${activeTab === 'insights' ? 'active' : ''}`}
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

                {/* Operator Profile */}
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
                
                {/* Header with Title and Mode Switcher */}
                <header className="workspace-header">
                    <div className="workspace-header-left">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '4px' }}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="workspace-header-title">
                            {activeTab === 'overview' ? `${selectedPlant.name} — Overview` : `${selectedPlant.name} — All Machines`}
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

                        <div className="status-live-indicator">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-running)' }} />
                            <span>Live Connected</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="workspace-content">
                    {error && (
                        <div style={{ 
                            background: 'var(--status-stopped-bg)', 
                            border: '1px solid var(--status-stopped-border)',
                            color: 'var(--status-stopped)', 
                            padding: '10px 14px', 
                            borderRadius: '6px', 
                            marginBottom: '16px', 
                            display: 'flex', 
                            gap: '8px', 
                            alignItems: 'center',
                            fontSize: '13px'
                        }}>
                            <AlertCircle size={15} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* --- PLANT OVERVIEW TAB --- */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                        Factory Production Overview
                                    </h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                                        Current live output and machinery health for {selectedPlant.name}
                                    </p>
                                </div>
                                <button 
                                    onClick={fetchDashboardData}
                                    className="btn btn-secondary"
                                >
                                    <RefreshCw size={13} />
                                    Refresh Data
                                </button>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                                    Loading live factory data...
                                </div>
                            ) : (
                                <>
                                    {/* Clean Big Number Cards */}
                                    <div className="kpi-grid">
                                        <div className="kpi-card">
                                            <div className="kpi-title">Plant Efficiency</div>
                                            <div className="kpi-value" style={{ color: (kpis?.efficiency ?? 0) >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>
                                                {kpis ? `${kpis.efficiency}%` : '—'}
                                            </div>
                                            <div className="kpi-status" style={{ color: (kpis?.efficiency ?? 0) >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>
                                                {kpis ? ((kpis.efficiency >= 85) ? 'Normal' : 'Attention') : 'Loading'}
                                            </div>
                                        </div>

                                        <div className="kpi-card">
                                            <div className="kpi-title">Active Machines</div>
                                            <div className="kpi-value" style={{ color: 'var(--status-running)' }}>
                                                {kpis ? `${kpis.active_machines} / ${kpis.total_machines}` : '—'}
                                            </div>
                                            <div className="kpi-status" style={{ color: 'var(--text-muted)' }}>
                                                {kpis ? `${kpis.downtime_machines} in maintenance` : '—'}
                                            </div>
                                        </div>

                                        <div className="kpi-card">
                                            <div className="kpi-title">Total Output Recorded</div>
                                            <div className="kpi-value" style={{ color: 'var(--primary)' }}>
                                                {kpis ? Number(kpis.total_production || 0).toLocaleString() : '—'}
                                            </div>
                                            <div className="kpi-status" style={{ color: 'var(--text-muted)' }}>
                                                Units produced
                                            </div>
                                        </div>

                                        <div className="kpi-card">
                                            <div className="kpi-title">Active Alerts</div>
                                            <div className="kpi-value" style={{ color: (kpis?.active_alerts ?? 0) > 0 ? 'var(--status-stopped)' : 'var(--status-running)' }}>
                                                {kpis ? kpis.active_alerts : '—'}
                                            </div>
                                            <div className="kpi-status" style={{ color: (kpis?.active_alerts ?? 0) > 0 ? 'var(--status-stopped)' : 'var(--status-running)' }}>
                                                {kpis ? (kpis.active_alerts > 0 ? 'Active Warnings' : 'None') : '—'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Two Columns: Recent Events & Active Warnings */}
                                    <div className="two-col-grid">
                                        
                                        {/* Activity Log */}
                                        <div className="card">
                                            <h2 className="card-title">Recent Factory Activity</h2>
                                            <p className="card-subtitle">Last recorded machine actions and events</p>

                                            {activities.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                                    No activity recorded yet today.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {activities.map((act) => (
                                                        <div key={act.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '10px 12px',
                                                            background: 'var(--bg-subtle)',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)'
                                                        }}>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                                                                    {act.event}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                    {formatTime(act.timestamp)}
                                                                </div>
                                                            </div>
                                                            <span className={`badge ${act.status?.toLowerCase() === 'running' || act.status?.toLowerCase() === 'completed' ? 'badge-running' : 'badge-stopped'}`}>
                                                                {act.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Machine Alerts */}
                                        <div className="card">
                                            <h2 className="card-title">Machine Alerts & Warnings</h2>
                                            <p className="card-subtitle">Current machinery notices requiring operator attention</p>

                                            {alerts.length === 0 ? (
                                                <div style={{ 
                                                    textAlign: 'center', 
                                                    padding: '24px', 
                                                    background: 'var(--status-running-bg)', 
                                                    color: 'var(--status-running)',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--status-running-border)'
                                                }}>
                                                    <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>All Machines Normal</div>
                                                    <div style={{ fontSize: '12px', marginTop: '2px' }}>There are no active errors or warnings.</div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {alerts.map((alert) => (
                                                        <div key={alert.id} style={{
                                                            display: 'flex',
                                                            gap: '10px',
                                                            padding: '10px 12px',
                                                            borderRadius: '6px',
                                                            background: alert.severity === 'critical' ? 'var(--status-stopped-bg)' : 'var(--status-idle-bg)',
                                                            border: `1px solid ${alert.severity === 'critical' ? 'var(--status-stopped-border)' : 'var(--status-idle-border)'}`
                                                        }}>
                                                            <AlertTriangle size={18} style={{ color: alert.severity === 'critical' ? 'var(--status-stopped)' : 'var(--status-idle)', flexShrink: 0, marginTop: '2px' }} />
                                                            <div style={{ flexGrow: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: alert.severity === 'critical' ? 'var(--status-stopped)' : 'var(--status-idle)' }}>
                                                                        {alert.severity} Alert
                                                                    </strong>
                                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                        {formatTime(alert.created_at)}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '2px', fontWeight: '500' }}>
                                                                    {alert.message}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* --- MACHINE STATUS TAB --- */}
                    {activeTab === 'insights' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                        Factory Machines
                                    </h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                                        Click on any machine to see full details and history
                                    </p>
                                </div>
                            </div>

                            {machinesLoading ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                                    Loading machine list...
                                </div>
                            ) : machines.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                    No machines registered for this plant.
                                </div>
                            ) : (
                                <div className="machine-cards-grid">
                                    {machines.map((m) => {
                                        const isRunning = m.status?.toLowerCase() === 'running';
                                        const isMaintenance = m.status?.toLowerCase() === 'maintenance';
                                        const badgeClass = isRunning ? 'badge-running' : isMaintenance ? 'badge-maintenance' : 'badge-stopped';

                                        return (
                                            <div 
                                                key={m.id}
                                                className="card"
                                                onClick={() => navigate(`/machine-insight/${m.id}`)}
                                                style={{
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    gap: '14px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                                                            {m.name}
                                                        </h3>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            {m.machine_type || 'General'}
                                                        </span>
                                                    </div>
                                                    <span className={`badge ${badgeClass}`}>
                                                        {m.status}
                                                    </span>
                                                </div>

                                                {/* Efficiency bar */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Efficiency</span>
                                                        <span style={{ color: m.efficiency >= 85 ? 'var(--status-running)' : 'var(--status-idle)' }}>{m.efficiency}%</span>
                                                    </div>
                                                    <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                        <div style={{ 
                                                            width: `${m.efficiency}%`, 
                                                            height: '100%', 
                                                            background: m.efficiency >= 85 ? 'var(--status-running)' : 'var(--status-idle)', 
                                                            borderRadius: '4px' 
                                                        }} />
                                                    </div>
                                                </div>

                                                {/* Output numbers */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 12px',
                                                    background: 'var(--bg-subtle)',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Produced</div>
                                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                                                            {m.total_produced.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Target</div>
                                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            {m.target_units.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
