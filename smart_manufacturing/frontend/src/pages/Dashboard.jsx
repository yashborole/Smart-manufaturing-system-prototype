import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    LogOut, Factory, Activity, AlertTriangle, Settings, Bell, 
    CheckCircle2, Clock, AlertCircle, Sliders, Layers, User, Menu, X, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Dashboard = () => {
    const { user, selectedPlant, logout, selectPlant } = useContext(AuthContext);
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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePlant = () => {
        selectPlant(null);
        navigate('/select-plant');
    };

    // Fetch plant overview data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!selectedPlant) return;
            setLoading(true);
            setError('');
            try {
                const [kpiRes, activityRes, alertsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/dashboard/kpis/${selectedPlant.id}`),
                    fetch(`${API_BASE_URL}/dashboard/activity/${selectedPlant.id}`),
                    fetch(`${API_BASE_URL}/dashboard/alerts/${selectedPlant.id}`)
                ]);

                if (!kpiRes.ok || !activityRes.ok || !alertsRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const kpiData = await kpiRes.json();
                const activityData = await activityRes.json();
                const alertsData = await alertsRes.json();

                setKpis(kpiData);
                setActivities(activityData);
                setAlerts(alertsData);
            } catch (err) {
                console.error(err);
                setError(err.message || 'An error occurred while loading dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'overview') {
            fetchDashboardData();
        }
    }, [selectedPlant, activeTab]);

    // Fetch machine insights data
    useEffect(() => {
        const fetchMachineInsights = async () => {
            if (!selectedPlant || activeTab !== 'insights') return;
            setMachinesLoading(true);
            setError('');
            try {
                const res = await fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/machines`);
                if (!res.ok) throw new Error('Failed to fetch machine insights');
                const data = await res.json();
                setMachines(data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch machine insights data');
            } finally {
                setMachinesLoading(false);
            }
        };

        fetchMachineInsights();
    }, [selectedPlant, activeTab]);

    if (!selectedPlant) {
        return null; // Redirects handled by ProtectedRoute
    }

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'running':
                return { bg: 'var(--status-running-bg)', color: 'var(--status-running)' };
            case 'maintenance':
                return { bg: 'var(--status-maintenance-bg)', color: 'var(--status-maintenance)' };
            default:
                return { bg: 'var(--status-stopped-bg)', color: 'var(--status-stopped)' };
        }
    };

    const getSeverityStyle = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return { border: '1px solid #fca5a5', bg: '#fef2f2', color: '#b91c1c', iconColor: '#ef4444' };
            case 'warning':
                return { border: '1px solid #fcd34d', bg: '#fffbeb', color: '#b45309', iconColor: '#f59e0b' };
            default:
                return { border: '1px solid #bfdbfe', bg: '#eff6ff', color: '#1d4ed8', iconColor: '#3b82f6' };
        }
    };

    return (
        <div className="app-layout">
            
            {/* Mobile Sidebar Overlay */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
                onClick={() => setSidebarOpen(false)} 
            />

            {/* Sticky Left Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Brand Identifier */}
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <Factory size={18} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '0.05em' }}>SMART MES</h1>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Control Room</span>
                        </div>
                        {/* Close button for mobile */}
                        <button 
                            className="mobile-menu-toggle" 
                            style={{ marginLeft: 'auto', color: '#94a3b8' }}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Plant Workspace Details */}
                    <div className="sidebar-node-card">
                        <div>
                            <div className="sidebar-node-title">Active Node</div>
                            <div className="sidebar-node-name">{selectedPlant.name}</div>
                        </div>
                        <button onClick={handleChangePlant} className="sidebar-node-btn">
                            <Layers size={13} />
                            Change Plant
                        </button>
                    </div>

                    {/* Navigation Options */}
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
                            Machine Insights
                        </button>
                        <button
                            onClick={() => navigate('/kiosk')}
                            className="sidebar-nav-item"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4, paddingTop: 12 }}
                        >
                            <Zap size={16} />
                            Machine Kiosk
                        </button>
                    </nav>
                </div>

                {/* Operator Profile & Sign Out */}
                <div className="sidebar-profile">
                    <div className="sidebar-profile-details">
                        <div className="sidebar-profile-avatar">
                            <User size={16} />
                        </div>
                        <div>
                            <div className="sidebar-profile-name">{user?.name}</div>
                            <div className="sidebar-profile-role">Operator</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-logout-btn">
                        <LogOut size={13} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Right Workspace Area */}
            <div className="workspace-wrapper">
                
                {/* Header (Breadcrumb context & Info) */}
                <header className="workspace-header">
                    <div className="workspace-header-left">
                        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="workspace-breadcrumbs">
                            <span>Home</span>
                            <span>/</span>
                            <span>{selectedPlant.name}</span>
                            <span>/</span>
                            <span className="active">
                                {activeTab === 'overview' ? 'Overview' : 'Machine Insights'}
                            </span>
                        </div>
                    </div>

                    <div className="workspace-status-badge">
                        <span className="workspace-status-dot" />
                        <span className="workspace-status-text">SYS CONNECTED</span>
                    </div>
                </header>

                {/* Workspace Main */}
                <main className="workspace-content">
                    {error && (
                        <div style={{ 
                            background: '#fef2f2', 
                            border: '1px solid #fee2e2',
                            color: '#b91c1c', 
                            padding: '12px 16px', 
                            borderRadius: '6px', 
                            marginBottom: '24px', 
                            display: 'flex', 
                            gap: '8px', 
                            alignItems: 'center',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* --- PLANT OVERVIEW --- */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ marginBottom: '28px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Plant Overview</h2>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>General performance and activity logs for {selectedPlant.name}.</p>
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
                                    <div className="spinner" />
                                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Loading plant dashboard...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Grid of KPIs */}
                                    <div className="kpis-grid">
                                        {[
                                            { 
                                                title: 'Plant Efficiency', 
                                                value: `${kpis?.efficiency ?? 0}%`, 
                                                status: kpis?.efficiency >= 85 ? 'NOMINAL' : 'INSUFFICIENT', 
                                                statusColor: kpis?.efficiency >= 85 ? '#10b981' : '#d97706',
                                                icon: <Activity size={16} />, 
                                                color: '#2563eb',
                                                accentClass: 'accent-blue'
                                            },
                                            { 
                                                title: 'Active Machines', 
                                                value: `${kpis?.active_machines ?? 0} / ${kpis?.total_machines ?? 0}`, 
                                                status: `${kpis?.downtime_machines ?? 0} in maintenance`, 
                                                statusColor: '#d97706',
                                                icon: <Factory size={16} />, 
                                                color: '#10b981',
                                                accentClass: 'accent-green'
                                            },
                                            { 
                                                title: 'Output (7d)', 
                                                value: kpis?.total_production?.toLocaleString() ?? '0', 
                                                status: 'total units logged', 
                                                statusColor: '#64748b',
                                                icon: <Settings size={16} />, 
                                                color: '#6366f1',
                                                accentClass: 'accent-blue'
                                            },
                                            { 
                                                title: 'Active Alerts', 
                                                value: kpis?.active_alerts ?? '0', 
                                                status: kpis?.active_alerts > 0 ? 'ATTENTION REQUIRED' : 'NO WARNINGS', 
                                                statusColor: kpis?.active_alerts > 0 ? '#ef4444' : '#10b981',
                                                icon: <Bell size={16} />, 
                                                color: kpis?.active_alerts > 0 ? '#ef4444' : '#64748b',
                                                accentClass: kpis?.active_alerts > 0 ? 'accent-red' : 'accent-blue'
                                            }
                                        ].map((kpi, index) => (
                                            <div key={index} className={`panel-card ${kpi.accentClass}`} style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                        {kpi.title}
                                                    </span>
                                                    <div style={{ 
                                                        color: kpi.color, 
                                                        background: 'var(--bg-hover)',
                                                        padding: '6px', 
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {kpi.icon}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                                                    {kpi.value}
                                                </div>
                                                <div style={{ fontSize: '10px', color: kpi.statusColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                    {kpi.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Two Column details */}
                                    <div className="details-grid">
                                        
                                        {/* Activity Log */}
                                        <div className="panel-card" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Activity Log</h3>
                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Latest events recorded on manufacturing lines.</p>
                                                </div>
                                                <Clock size={14} style={{ color: '#94a3b8' }} />
                                            </div>

                                            {activities.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                                                    <p style={{ fontSize: '13px' }}>No recent activity records.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {activities.map((act) => {
                                                        const statusStyle = getStatusStyle(act.status);
                                                        return (
                                                            <div key={act.id} style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '10px 12px',
                                                                background: '#f8fafc',
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--border-light)'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ 
                                                                        width: '6px', 
                                                                        height: '6px', 
                                                                        borderRadius: '50%', 
                                                                        background: statusStyle.color 
                                                                    }} />
                                                                    <div>
                                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{act.event}</div>
                                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatTime(act.timestamp)}</div>
                                                                    </div>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '9px',
                                                                    fontWeight: '700',
                                                                    textTransform: 'uppercase',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: statusStyle.bg,
                                                                    color: statusStyle.color,
                                                                    letterSpacing: '0.02em'
                                                                }}>
                                                                    {act.status}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Alerts Log */}
                                        <div className="panel-card" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Active Alerts</h3>
                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>Current machinery alarms and faults.</p>
                                                </div>
                                                <AlertTriangle size={14} style={{ color: '#94a3b8' }} />
                                            </div>

                                            {alerts.length === 0 ? (
                                                <div style={{ 
                                                    textAlign: 'center', 
                                                    padding: '24px', 
                                                    color: 'var(--status-running)', 
                                                    background: 'var(--status-running-bg)', 
                                                    borderRadius: '8px',
                                                    border: '1px solid #a7f3d0' 
                                                }}>
                                                    <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: 'var(--status-running)' }} />
                                                    <p style={{ fontSize: '13px', fontWeight: '600' }}>All systems nominal. No warnings.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {alerts.map((alert) => {
                                                        const sevStyle = getSeverityStyle(alert.severity);
                                                        return (
                                                            <div key={alert.id} style={{
                                                                display: 'flex',
                                                                gap: '10px',
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                background: sevStyle.bg,
                                                                border: sevStyle.border
                                                            }}>
                                                                <div style={{ color: sevStyle.iconColor, marginTop: '2px' }}>
                                                                    <AlertTriangle size={16} />
                                                                </div>
                                                                <div style={{ flexGrow: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                                        <span style={{ 
                                                                            fontSize: '10px', 
                                                                            fontWeight: '700', 
                                                                            textTransform: 'uppercase', 
                                                                            color: sevStyle.color
                                                                        }}>
                                                                            {alert.severity}
                                                                        </span>
                                                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                            {formatTime(alert.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4', margin: 0 }}>
                                                                        {alert.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* --- MACHINE INSIGHTS --- */}
                    {activeTab === 'insights' && (
                        <div>
                            <div style={{ marginBottom: '28px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Machine Insights</h2>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>Performance diagnostics and output logging per registered equipment.</p>
                            </div>

                            {machinesLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
                                    <div className="spinner" />
                                    <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Loading equipment analytics...</p>
                                </div>
                            ) : machines.length === 0 ? (
                                <div className="panel-card" style={{ padding: '48px', textAlign: 'center' }}>
                                    <Settings size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#94a3b8' }} />
                                    <h3 style={{ fontSize: '16px', color: '#334155', marginBottom: '6px' }}>No Nodes Available</h3>
                                    <p style={{ color: '#64748b', fontSize: '14px' }}>No active machines detected for this plant.</p>
                                </div>
                            ) : (
                                <div className="machines-grid">
                                    {machines.map((m) => {
                                        let accentClass = 'accent-blue';
                                        let effColor = 'var(--status-running)';
                                        
                                        if (m.status?.toLowerCase() === 'maintenance') {
                                            accentClass = 'accent-amber';
                                        } else if (m.status?.toLowerCase() === 'stopped') {
                                            accentClass = 'accent-red';
                                        } else {
                                            accentClass = 'accent-green';
                                        }

                                        if (m.efficiency < 60) {
                                            effColor = 'var(--status-stopped)';
                                        } else if (m.efficiency < 85) {
                                            effColor = 'var(--status-maintenance)';
                                        }

                                        return (
                                            <div 
                                                key={m.id}
                                                className={`panel-card ${accentClass}`}
                                                onClick={() => navigate(`/machine-insight/${m.id}`)}
                                                style={{
                                                    padding: '20px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '16px',
                                                    height: '220px',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{m.name}</h3>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            marginTop: '4px', 
                                                            fontSize: '10px', 
                                                            color: '#64748b', 
                                                            background: '#f8fafc', 
                                                            border: '1px solid var(--border-light)',
                                                            padding: '2px 6px', 
                                                            borderRadius: '4px',
                                                            fontWeight: '700'
                                                        }}>
                                                            {m.machine_type || 'General'}
                                                        </span>
                                                    </div>
                                                    <span className={`status-pill ${m.status?.toLowerCase()}`}>
                                                        {m.status?.toLowerCase() === 'running' && (
                                                            <span style={{
                                                                width: '5px',
                                                                height: '5px',
                                                                borderRadius: '50%',
                                                                background: '#10b981',
                                                                display: 'inline-block'
                                                            }} />
                                                        )}
                                                        {m.status}
                                                    </span>
                                                </div>

                                                {/* Efficiency Progress Bar */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: '700' }}>
                                                        <span style={{ color: '#64748b' }}>Efficiency</span>
                                                        <span style={{ color: '#0f172a' }}>{m.efficiency}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${m.efficiency}%`, height: '100%', background: effColor, borderRadius: '3px' }} />
                                                    </div>
                                                </div>

                                                {/* Production details */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    padding: '8px 12px', 
                                                    background: '#f8fafc', 
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    border: '1px solid var(--border-light)',
                                                    marginTop: 'auto'
                                                }}>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' }}>Output</div>
                                                        <div style={{ color: '#334155', fontWeight: '700', marginTop: '2px' }}>{m.total_produced.toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' }}>Target</div>
                                                        <div style={{ color: '#334155', fontWeight: '700', marginTop: '2px' }}>{m.target_units.toLocaleString()}</div>
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
