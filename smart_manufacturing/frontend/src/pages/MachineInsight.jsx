import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    ArrowLeft, Activity, Settings, AlertTriangle, Factory, 
    Layers, Sliders, User, LogOut, Menu, X, CheckCircle2, Clock 
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const MachineInsight = () => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const { user, selectedPlant, logout, selectPlant } = useContext(AuthContext);

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

    useEffect(() => {
        const fetchMachineDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`${API_BASE_URL}/plants/machines/${machineId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Machine not found');
                    }
                    throw new Error('Failed to fetch machine details');
                }
                const data = await res.json();
                setMachine(data);
            } catch (err) {
                console.error(err);
                setError(err.message || 'An error occurred while fetching machine diagnostics');
            } finally {
                setLoading(false);
            }
        };

        if (machineId) {
            fetchMachineDetails();
        }
    }, [machineId]);

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

    if (!selectedPlant) {
        return null;
    }

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
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'overview' } })}
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
                            Machine Insights
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
                
                {/* Header */}
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
                            <span>Machine Insights</span>
                            <span>/</span>
                            <span className="active">{machine ? machine.name : `Machine ${machineId}`}</span>
                        </div>
                    </div>

                    <div className="workspace-status-badge">
                        <span className="workspace-status-dot" />
                        <span className="workspace-status-text">SYS CONNECTED</span>
                    </div>
                </header>

                {/* Workspace Main */}
                <main className="workspace-content">
                    
                    {/* Header bar with Back button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                        <button 
                            onClick={handleBack}
                            className="btn-secondary"
                            style={{
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                        {machine && (
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                    {machine.name} Diagnostics
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                    Type: {machine.machine_type || 'General Equipment'} • Plant: {machine.plant_name}
                                </p>
                            </div>
                        )}
                    </div>

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
                            <AlertCircle size={16} style={{ color: '#ef4444' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
                            <div className="spinner" />
                            <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Loading machine telemetry...</p>
                        </div>
                    ) : machine ? (
                        <>
                            {/* KPIs grid */}
                            <div className="kpis-grid">
                                
                                {/* Status card */}
                                <div className="panel-card accent-blue" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Operational Status
                                        </span>
                                        <div style={{ color: 'var(--accent-primary)', background: 'var(--bg-hover)', padding: '6px', borderRadius: '6px' }}>
                                            <Settings size={16} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`status-pill ${machine.status.toLowerCase()}`}>
                                            {machine.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        Registered Node ID: #{machine.id}
                                    </div>
                                </div>

                                {/* Efficiency 7d */}
                                <div className="panel-card accent-green" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Efficiency (7d avg)
                                        </span>
                                        <div style={{ color: 'var(--status-running)', background: 'var(--status-running-bg)', padding: '6px', borderRadius: '6px' }}>
                                            <Activity size={16} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                                        {machine.avg_efficiency_7d}%
                                    </div>
                                    <div style={{ fontSize: '10px', color: machine.avg_efficiency_7d >= 85 ? 'var(--status-running)' : 'var(--status-maintenance)', fontWeight: '700', textTransform: 'uppercase' }}>
                                        {machine.avg_efficiency_7d >= 85 ? 'OPTIMAL RUNNING' : 'CALIBRATION RECOMMENDED'}
                                    </div>
                                </div>

                                {/* Current Output vs Target */}
                                <div className="panel-card accent-blue" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Today's Output
                                        </span>
                                        <div style={{ color: '#6366f1', background: '#eff6ff', padding: '6px', borderRadius: '6px' }}>
                                            <CheckCircle2 size={16} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                                        {machine.latest_production.produced} / {machine.latest_production.target}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        units produced today ({machine.latest_production.efficiency}% eff)
                                    </div>
                                </div>

                                {/* Total 7d Output */}
                                <div className="panel-card accent-blue" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Total 7d Output
                                        </span>
                                        <div style={{ color: '#8b5cf6', background: '#f5f3ff', padding: '6px', borderRadius: '6px' }}>
                                            <Factory size={16} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                                        {machine.total_produced_7d.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                                        total logged units
                                    </div>
                                </div>

                            </div>

                            {/* Chart & History */}
                            <div className="details-grid" style={{ marginBottom: '32px' }}>
                                
                                {/* Production Performance Chart */}
                                <div className="panel-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                                        Production History (Last 7 Days)
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                                        Comparison of actual units produced vs daily target.
                                    </p>

                                    {machine.history.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                            No production history logged.
                                        </div>
                                    ) : (
                                        <div className="chart-container">
                                            <div className="chart-bars-wrapper">
                                                {machine.history.map((day, idx) => {
                                                    // Calculate height percentage for produced
                                                    const maxVal = Math.max(...machine.history.map(d => Math.max(d.produced, d.target)));
                                                    const producedHeight = maxVal > 0 ? (day.produced / maxVal) * 100 : 0;
                                                    const targetMarkerHeight = maxVal > 0 ? (day.target / maxVal) * 100 : 0;

                                                    return (
                                                        <div key={idx} className="chart-bar-group">
                                                            <div className="chart-bar-value">{day.produced}</div>
                                                            <div className="chart-bar-capsule">
                                                                <div 
                                                                    className="chart-bar-fill" 
                                                                    style={{ 
                                                                        height: `${producedHeight}%`,
                                                                        background: day.produced >= day.target ? 'var(--status-running)' : 'var(--accent-primary)'
                                                                    }} 
                                                                />
                                                                <div 
                                                                    className="chart-bar-target-marker" 
                                                                    style={{ bottom: `${targetMarkerHeight}%` }}
                                                                    title={`Target: ${day.target}`}
                                                                />
                                                            </div>
                                                            <div className="chart-bar-label">{day.day_name}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '11px', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '10px', height: '10px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
                                            <span style={{ color: '#64748b' }}>Produced (Normal)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '10px', height: '10px', background: 'var(--status-running)', borderRadius: '2px' }} />
                                            <span style={{ color: '#64748b' }}>Target Met</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '12px', height: '2px', background: '#ef4444' }} />
                                            <span style={{ color: '#64748b' }}>Target Level</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table breakdown of historical logs */}
                                <div className="panel-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                                        Historical Performance Run
                                    </h3>
                                    
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#64748b', textAlign: 'left' }}>
                                                    <th style={{ padding: '10px 8px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                                                    <th style={{ padding: '10px 8px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Output</th>
                                                    <th style={{ padding: '10px 8px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Target</th>
                                                    <th style={{ padding: '10px 8px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Efficiency</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {machine.history.map((day, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                        <td style={{ padding: '10px 8px', fontWeight: '600', color: '#334155' }}>
                                                            {day.date} ({day.day_name})
                                                        </td>
                                                        <td style={{ padding: '10px 8px', color: '#0f172a', fontWeight: '700' }}>{day.produced}</td>
                                                        <td style={{ padding: '10px 8px', color: '#475569' }}>{day.target}</td>
                                                        <td style={{ 
                                                            padding: '10px 8px', 
                                                            textAlign: 'right', 
                                                            fontWeight: '700',
                                                            color: day.efficiency >= 85 ? 'var(--status-running)' : day.efficiency >= 60 ? 'var(--status-maintenance)' : 'var(--status-stopped)'
                                                        }}>
                                                            {day.efficiency}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* Activity Logs & Alerts */}
                            <div className="details-grid">
                                
                                {/* Machine Specific Activities */}
                                <div className="panel-card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Equipment Logs</h3>
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>Operations and handovers logs for this machine.</p>
                                        </div>
                                        <Clock size={14} style={{ color: '#94a3b8' }} />
                                    </div>

                                    {machine.activities.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                                            <p style={{ fontSize: '13px' }}>No logs recorded for this equipment.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {machine.activities.map((act) => {
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
                                                            color: statusStyle.color
                                                        }}>
                                                            {act.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Machine Specific Alerts */}
                                <div className="panel-card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Equipment Alerts</h3>
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>Active alarms and critical alerts.</p>
                                        </div>
                                        <AlertTriangle size={14} style={{ color: '#94a3b8' }} />
                                    </div>

                                    {machine.alerts.length === 0 ? (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '24px', 
                                            color: 'var(--status-running)', 
                                            background: 'var(--status-running-bg)', 
                                            borderRadius: '8px',
                                            border: '1px solid #a7f3d0' 
                                        }}>
                                            <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: 'var(--status-running)' }} />
                                            <p style={{ fontSize: '13px', fontWeight: '600' }}>No active alerts. Operational levels nominal.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {machine.alerts.map((alert) => {
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
                    ) : (
                        <div className="panel-card" style={{ padding: '48px', textAlign: 'center' }}>
                            <AlertTriangle size={36} style={{ margin: '0 auto 12px', color: '#ef4444' }} />
                            <h3 style={{ fontSize: '16px', color: '#334155', marginBottom: '6px' }}>Diagnostics Error</h3>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Unable to retrieve details for this machine node.</p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default MachineInsight;
