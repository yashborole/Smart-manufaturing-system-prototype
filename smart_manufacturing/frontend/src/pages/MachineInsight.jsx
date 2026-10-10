import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    ArrowLeft, Activity, Settings, AlertTriangle, Factory, 
    Layers, Sliders, User, LogOut, Menu, X, CheckCircle2, Clock,
    Cpu, Gauge, BarChart3, Radio, RefreshCw, Zap, Calendar
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

    const fetchMachineDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/plants/machines/${machineId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Machine node not found in registry');
                }
                throw new Error('Telemetry request failed');
            }
            const data = await res.json();
            setMachine(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error occurred while querying machinery diagnostics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (machineId) {
            fetchMachineDetails();
        }
    }, [machineId]);

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '';
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'running':
                return { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
            case 'maintenance':
                return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
            default:
                return { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        }
    };

    const getSeverityStyle = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return { border: '1px solid rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', iconColor: '#ef4444' };
            case 'warning':
                return { border: '1px solid rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.12)', color: '#fde68a', iconColor: '#f59e0b' };
            default:
                return { border: '1px solid rgba(56, 189, 248, 0.4)', bg: 'rgba(56, 189, 248, 0.12)', color: '#bae6fd', iconColor: '#38bdf8' };
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

            {/* SCADA Left Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Brand Identifier */}
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <Cpu size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#f3f4f6', letterSpacing: '0.04em' }}>
                                FACTORY OS
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
                                SCADA CONTROL ROOM
                            </div>
                        </div>
                        <button 
                            className="mobile-menu-toggle" 
                            style={{ marginLeft: 'auto', color: '#9ca3af' }}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Plant Workspace Details */}
                    <div className="sidebar-node-card">
                        <div>
                            <div className="sidebar-node-title">ACTIVE PRODUCTION NODE</div>
                            <div className="sidebar-node-name">{selectedPlant.name}</div>
                            <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                                ID: #{selectedPlant.id} • {selectedPlant.location || 'SITE-A'}
                            </div>
                        </div>
                        <button onClick={handleChangePlant} className="sidebar-node-btn">
                            <Layers size={12} />
                            Switch Facility
                        </button>
                    </div>

                    {/* Navigation Options */}
                    <nav className="sidebar-nav">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="sidebar-nav-item"
                        >
                            <Activity size={15} />
                            Plant Telemetry
                        </button>
                        <button
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'insights' } })}
                            className="sidebar-nav-item active"
                        >
                            <Sliders size={15} />
                            Equipment Diagnostics
                        </button>
                        <button
                            onClick={() => navigate('/scheduling')}
                            className="sidebar-nav-item"
                            style={{ borderTop: '1px solid #1f2937', marginTop: '6px', paddingTop: '10px' }}
                        >
                            <Calendar size={15} color="#818cf8" />
                            Job Scheduling & Dispatch
                        </button>
                        <button
                            onClick={() => navigate('/kiosk')}
                            className="sidebar-nav-item"
                        >
                            <Zap size={15} color="#38bdf8" />
                            Floor Operator Kiosk
                        </button>
                    </nav>
                </div>

                {/* Operator Session */}
                <div className="sidebar-profile">
                    <div className="sidebar-profile-details">
                        <div className="sidebar-profile-avatar">
                            <User size={15} />
                        </div>
                        <div>
                            <div className="sidebar-profile-name">{user?.name}</div>
                            <div className="sidebar-profile-role">CERTIFIED OPERATOR</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-logout-btn">
                        <LogOut size={12} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Right Workspace Area */}
            <div className="workspace-wrapper">
                
                {/* Header */}
                <header className="workspace-header">
                    <div className="workspace-header-left">
                        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={18} />
                        </button>
                        <div className="workspace-breadcrumbs">
                            <span>ROOT</span>
                            <span>/</span>
                            <span>{selectedPlant.name?.toUpperCase()}</span>
                            <span>/</span>
                            <span>DIAGNOSTICS</span>
                            <span>/</span>
                            <span className="active">{machine ? machine.name?.toUpperCase() : `NODE-${machineId}`}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className="workspace-status-badge">
                            <span className="workspace-status-dot" />
                            <span className="workspace-status-text">NODE TELEMETRY LINKED</span>
                        </div>
                    </div>
                </header>

                {/* Workspace Main */}
                <main className="workspace-content">
                    
                    {/* Header bar with Back button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <button 
                                onClick={handleBack}
                                className="btn-secondary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <ArrowLeft size={14} />
                                Back to Fleet
                            </button>
                            {machine && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f9fafb', margin: 0 }}>
                                            {machine.name} Diagnostics
                                        </h2>
                                        <span className={`status-pill ${machine.status.toLowerCase()}`}>
                                            {machine.status}
                                        </span>
                                    </div>
                                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                                        TYPE: {machine.machine_type || 'GENERAL'} • NODE: #{machine.id} • FACILITY: {machine.plant_name}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={fetchMachineDetails}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={12} />
                            Refresh Node
                        </button>
                    </div>

                    {error && (
                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171', 
                            padding: '10px 14px', 
                            borderRadius: '6px', 
                            marginBottom: '20px', 
                            display: 'flex', 
                            gap: '8px', 
                            alignItems: 'center',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            <AlertCircle size={15} style={{ color: '#ef4444' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '14px' }}>
                            <div className="spinner" />
                            <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                                QUERYING DEVICE SENSORS...
                            </p>
                        </div>
                    ) : machine ? (
                        <>
                            {/* KPIs grid */}
                            <div className="kpis-grid">
                                
                                {/* Status card */}
                                <div className="panel-card accent-blue" style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                            OPERATIONAL STATUS
                                        </span>
                                        <div style={{ color: '#06b6d4', background: 'rgba(255,255,255,0.04)', padding: '5px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <Settings size={15} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#f3f4f6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {machine.status}
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                        PLC LINK: ACTIVE • ID #{machine.id}
                                    </div>
                                </div>

                                {/* Efficiency 7d */}
                                <div className="panel-card accent-green" style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                            EFFICIENCY (7D ROLLING)
                                        </span>
                                        <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '5px', borderRadius: '5px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                            <Activity size={15} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#f3f4f6', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {machine.avg_efficiency_7d}%
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: machine.avg_efficiency_7d >= 85 ? '#34d399' : '#fbbf24', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {machine.avg_efficiency_7d >= 85 ? 'OEE IN SPECIFICATION' : 'CALIBRATION RECOMMENDED'}
                                    </div>
                                </div>

                                {/* Current Output vs Target */}
                                <div className="panel-card accent-blue" style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                            CURRENT SHIFT THROUGHPUT
                                        </span>
                                        <div style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '5px', borderRadius: '5px', border: '1px solid rgba(129, 140, 248, 0.25)' }}>
                                            <CheckCircle2 size={15} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#f3f4f6', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {machine.latest_production.produced} / {machine.latest_production.target}
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                        PARTS LOGGED ({machine.latest_production.efficiency}% EFF)
                                    </div>
                                </div>

                                {/* Total 7d Output */}
                                <div className="panel-card accent-blue" style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                            TOTAL 7D PRODUCTION
                                        </span>
                                        <div style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '5px', borderRadius: '5px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                                            <Factory size={15} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#f3f4f6', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {machine.total_produced_7d.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                                        VERIFIED CYCLES COMPLETED
                                    </div>
                                </div>

                            </div>

                            {/* Chart & History */}
                            <div className="details-grid" style={{ marginBottom: '24px' }}>
                                
                                {/* Production Performance Chart */}
                                <div className="panel-card" style={{ padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6', marginBottom: '4px' }}>
                                        7-Day Production Histogram
                                    </h3>
                                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 16px 0' }}>
                                        Actual units produced vs planned cycle target per 24h interval.
                                    </p>

                                    {machine.history.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '12px' }}>
                                            No cycle production telemetry recorded yet.
                                        </div>
                                    ) : (
                                        <div className="chart-container">
                                            <div className="chart-bars-wrapper">
                                                {machine.history.map((day, idx) => {
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
                                                                        background: day.produced >= day.target ? '#10b981' : '#0284c7'
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
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '14px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '2px' }} />
                                            <span style={{ color: '#9ca3af' }}>PRODUCED</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }} />
                                            <span style={{ color: '#9ca3af' }}>TARGET MET</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '10px', height: '2px', background: '#f87171' }} />
                                            <span style={{ color: '#9ca3af' }}>TARGET LIMIT</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Output Audit Log */}
                                <div className="panel-card" style={{ padding: '20px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6', marginBottom: '4px' }}>
                                        Daily Telemetry Log
                                    </h3>
                                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 16px 0' }}>
                                        Detailed breakdown of hourly batch completions.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {machine.history.map((day, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                background: '#0d121c',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-subtle)',
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '11px'
                                            }}>
                                                <div>
                                                    <span style={{ color: '#f3f4f6', fontWeight: '700' }}>{day.date}</span>
                                                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>({day.day_name})</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ color: '#6b7280', fontSize: '9px' }}>ACTUAL: </span>
                                                        <strong style={{ color: day.produced >= day.target ? '#34d399' : '#f3f4f6' }}>{day.produced}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#6b7280', fontSize: '9px' }}>TARGET: </span>
                                                        <span style={{ color: '#9ca3af' }}>{day.target}</span>
                                                    </div>
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        fontSize: '9px',
                                                        fontWeight: '700',
                                                        background: day.efficiency >= 85 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: day.efficiency >= 85 ? '#34d399' : '#fbbf24',
                                                        border: `1px solid ${day.efficiency >= 85 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                                    }}>
                                                        {day.efficiency}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default MachineInsight;
