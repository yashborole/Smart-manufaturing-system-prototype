import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    LogOut, Factory, Activity, AlertTriangle, Settings, Bell, 
    CheckCircle2, Clock, AlertCircle, Sliders, Layers, User, Menu, X, Zap, Calendar,
    Cpu, Radio, BarChart3, ArrowUpRight, Gauge, Wrench, RefreshCw
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
                fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/kpis`),
                fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/activity?limit=7`),
                fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/alerts`)
            ]);

            if (!kpisRes.ok || !activitiesRes.ok || !alertsRes.ok) {
                throw new Error('Telemetry sync error with plant server');
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
            setError('Telemetry link degraded. Retrying in background...');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError('');
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, [selectedPlant]);

    // Fetch machines when switching to insights tab
    useEffect(() => {
        const fetchMachineInsights = async () => {
            if (!selectedPlant || activeTab !== 'insights') return;
            setMachinesLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/plants/${selectedPlant.id}/machines`);
                if (!res.ok) throw new Error('Failed to fetch machine diagnostics');
                const data = await res.json();
                setMachines(data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch machine analytics data');
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

    return (
        <div className="app-layout">
            
            {/* Mobile Sidebar Overlay */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
                onClick={() => setSidebarOpen(false)} 
            />

            {/* Industrial SCADA Left Sidebar */}
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

                    {/* Plant Workspace Card */}
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

                    {/* Navigation Menu */}
                    <nav className="sidebar-nav">
                        <button
                            onClick={() => {
                                setActiveTab('overview');
                                setSidebarOpen(false);
                            }}
                            className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        >
                            <Activity size={15} />
                            Plant Telemetry
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('insights');
                                setSidebarOpen(false);
                            }}
                            className={`sidebar-nav-item ${activeTab === 'insights' ? 'active' : ''}`}
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

            {/* Right Industrial Workspace Area */}
            <div className="workspace-wrapper">
                
                {/* Header (Breadcrumb context & Telemetry Status) */}
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
                            <span className="active">
                                {activeTab === 'overview' ? 'TELEMETRY OVERVIEW' : 'EQUIPMENT ANALYTICS'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            SYNC: {formatTime(lastUpdated)}
                        </div>
                        <div className="workspace-status-badge">
                            <span className="workspace-status-dot" />
                            <span className="workspace-status-text">SCADA FEED ACTIVE</span>
                        </div>
                    </div>
                </header>

                {/* Workspace Main */}
                <main className="workspace-content">
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
                            <AlertCircle size={15} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* --- PLANT OVERVIEW --- */}
                    {activeTab === 'overview' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f9fafb', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                                        Production Overview
                                    </h2>
                                    <p style={{ color: '#9ca3af', fontSize: '12.5px', margin: 0 }}>
                                        Live process metrics, machine states, and line performance for <strong style={{ color: '#e5e7eb' }}>{selectedPlant.name}</strong>.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={fetchDashboardData}
                                        className="btn-secondary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <RefreshCw size={12} />
                                        Sync Feed
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '14px' }}>
                                    <div className="spinner" />
                                    <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        STREAMING SCADA METRICS...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Grid of Industrial KPIs */}
                                    <div className="kpis-grid">
                                        {[
                                            { 
                                                title: 'Overall Plant OEE', 
                                                value: `${kpis?.efficiency ?? 0}%`, 
                                                status: kpis?.efficiency >= 85 ? 'OPTIMAL (≥85%)' : 'DEGRADED (<85%)', 
                                                statusColor: kpis?.efficiency >= 85 ? '#34d399' : '#fbbf24',
                                                icon: <Gauge size={16} />, 
                                                color: '#06b6d4',
                                                accentClass: 'accent-blue'
                                            },
                                            { 
                                                title: 'Machinery Fleet Status', 
                                                value: `${kpis?.active_machines ?? 0} / ${kpis?.total_machines ?? 0}`, 
                                                status: `${kpis?.downtime_machines ?? 0} DOWN / IN SERVICE`, 
                                                statusColor: kpis?.downtime_machines > 0 ? '#fbbf24' : '#34d399',
                                                icon: <Factory size={16} />, 
                                                color: '#10b981',
                                                accentClass: 'accent-green'
                                            },
                                            { 
                                                title: 'Logged 7D Throughput', 
                                                value: kpis?.total_production?.toLocaleString() ?? '0', 
                                                status: 'VERIFIED PARTS PRODUCED', 
                                                statusColor: '#9ca3af',
                                                icon: <BarChart3 size={16} />, 
                                                color: '#818cf8',
                                                accentClass: 'accent-blue'
                                            },
                                            { 
                                                title: 'Active SCADA Alarms', 
                                                value: kpis?.active_alerts ?? '0', 
                                                status: kpis?.active_alerts > 0 ? 'ATTENTION REQUIRED' : 'ZERO ALARMS ACTIVE', 
                                                statusColor: kpis?.active_alerts > 0 ? '#f87171' : '#34d399',
                                                icon: <Bell size={16} />, 
                                                color: kpis?.active_alerts > 0 ? '#ef4444' : '#6b7280',
                                                accentClass: kpis?.active_alerts > 0 ? 'accent-red' : 'accent-blue'
                                            }
                                        ].map((kpi, index) => (
                                            <div key={index} className={`panel-card ${kpi.accentClass}`} style={{ padding: '18px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
                                                        {kpi.title}
                                                    </span>
                                                    <div style={{ 
                                                        color: kpi.color, 
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        padding: '5px', 
                                                        borderRadius: '5px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                                    }}>
                                                        {kpi.icon}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '26px', fontWeight: '800', color: '#f3f4f6', marginBottom: '4px', letterSpacing: '-0.02em', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {kpi.value}
                                                </div>
                                                <div style={{ fontSize: '9.5px', color: kpi.statusColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {kpi.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Two Column details */}
                                    <div className="details-grid">
                                        
                                        {/* SCADA Activity Event Log */}
                                        <div className="panel-card" style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6', margin: 0 }}>
                                                        Chronological Activity Feed
                                                    </h3>
                                                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>Line transitions and shift occurrences.</p>
                                                </div>
                                                <Activity size={14} style={{ color: '#06b6d4' }} />
                                            </div>

                                            {activities.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '36px 0', color: '#6b7280', fontSize: '12px' }}>
                                                    No activity logged for this cycle.
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
                                                                padding: '8px 12px',
                                                                background: '#0d121c',
                                                                borderRadius: '6px',
                                                                border: '1px solid var(--border-subtle)'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ 
                                                                        width: '6px', 
                                                                        height: '6px', 
                                                                        borderRadius: '50%', 
                                                                        background: statusStyle.color,
                                                                        boxShadow: `0 0 6px ${statusStyle.color}`
                                                                    }} />
                                                                    <div>
                                                                        <div style={{ fontSize: '12.5px', fontWeight: '500', color: '#e5e7eb' }}>{act.event}</div>
                                                                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                                                                            {formatTime(act.timestamp)}
                                                                        </div>
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
                                                                    border: `1px solid ${statusStyle.border}`,
                                                                    fontFamily: 'JetBrains Mono, monospace'
                                                                }}>
                                                                    {act.status}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* SCADA Alarms / Faults */}
                                        <div className="panel-card" style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6', margin: 0 }}>
                                                        Active Telemetry Faults & Alarms
                                                    </h3>
                                                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>Real-time sensor threshold triggers.</p>
                                                </div>
                                                <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                                            </div>

                                            {alerts.length === 0 ? (
                                                <div style={{ 
                                                    textAlign: 'center', 
                                                    padding: '28px', 
                                                    color: '#34d399', 
                                                    background: 'rgba(16, 185, 129, 0.08)', 
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(16, 185, 129, 0.25)' 
                                                }}>
                                                    <CheckCircle2 size={22} style={{ margin: '0 auto 6px', color: '#10b981' }} />
                                                    <p style={{ fontSize: '12px', fontWeight: '600', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                                                        ALL SCADA SENSORS NOMINAL • ZERO FAULTS
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {alerts.map((alert) => {
                                                        const sevStyle = getSeverityStyle(alert.severity);
                                                        return (
                                                            <div key={alert.id} style={{
                                                                display: 'flex',
                                                                gap: '10px',
                                                                padding: '10px 12px',
                                                                borderRadius: '6px',
                                                                background: sevStyle.bg,
                                                                border: sevStyle.border
                                                            }}>
                                                                <div style={{ color: sevStyle.iconColor, marginTop: '2px' }}>
                                                                    <AlertTriangle size={15} />
                                                                </div>
                                                                <div style={{ flexGrow: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                                                                        <span style={{ 
                                                                            fontSize: '9px', 
                                                                            fontWeight: '700', 
                                                                            textTransform: 'uppercase', 
                                                                            color: sevStyle.color,
                                                                            fontFamily: 'JetBrains Mono, monospace'
                                                                        }}>
                                                                            {alert.severity} FAULT
                                                                        </span>
                                                                        <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace' }}>
                                                                            {formatTime(alert.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <p style={{ fontSize: '12px', color: '#f3f4f6', lineHeight: '1.4', margin: 0 }}>
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

                    {/* --- EQUIPMENT DIAGNOSTICS --- */}
                    {activeTab === 'insights' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f9fafb', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                                        Machinery Fleet Diagnostics
                                    </h2>
                                    <p style={{ color: '#9ca3af', fontSize: '12.5px', margin: 0 }}>
                                        Live OEE telemetry and cycle output per registered line equipment.
                                    </p>
                                </div>
                            </div>

                            {machinesLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '14px' }}>
                                    <div className="spinner" />
                                    <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        SCANNING MACHINERY TELEMETRY...
                                    </p>
                                </div>
                            ) : machines.length === 0 ? (
                                <div className="panel-card" style={{ padding: '48px', textAlign: 'center' }}>
                                    <Settings size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#6b7280' }} />
                                    <h3 style={{ fontSize: '16px', color: '#e5e7eb', marginBottom: '4px' }}>No Machine Nodes Online</h3>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No active equipment bound to this plant facility.</p>
                                </div>
                            ) : (
                                <div className="machines-grid">
                                    {machines.map((m) => {
                                        let accentClass = 'accent-blue';
                                        let effColor = '#10b981';
                                        
                                        if (m.status?.toLowerCase() === 'maintenance') {
                                            accentClass = 'accent-amber';
                                        } else if (m.status?.toLowerCase() === 'stopped') {
                                            accentClass = 'accent-red';
                                        } else {
                                            accentClass = 'accent-green';
                                        }

                                        if (m.efficiency < 60) {
                                            effColor = '#ef4444';
                                        } else if (m.efficiency < 85) {
                                            effColor = '#f59e0b';
                                        }

                                        return (
                                            <div 
                                                key={m.id}
                                                className={`panel-card ${accentClass}`}
                                                onClick={() => navigate(`/machine-insight/${m.id}`)}
                                                style={{
                                                    padding: '18px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '14px',
                                                    height: '210px',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    background: '#111827',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.borderColor = '#06b6d4';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6', margin: 0 }}>{m.name}</h3>
                                                            <ArrowUpRight size={12} style={{ color: '#6b7280' }} />
                                                        </div>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            marginTop: '4px', 
                                                            fontSize: '9.5px', 
                                                            color: '#9ca3af', 
                                                            background: '#0d121c', 
                                                            border: '1px solid var(--border-subtle)',
                                                            padding: '2px 5px', 
                                                            borderRadius: '3px',
                                                            fontFamily: 'JetBrains Mono, monospace',
                                                            fontWeight: '600'
                                                        }}>
                                                            {m.machine_type || 'GENERAL'}
                                                        </span>
                                                    </div>
                                                    <span className={`status-pill ${m.status?.toLowerCase()}`}>
                                                        {m.status?.toLowerCase() === 'running' && (
                                                            <span style={{
                                                                width: '5px',
                                                                height: '5px',
                                                                borderRadius: '50%',
                                                                background: '#10b981',
                                                                boxShadow: '0 0 6px #10b981',
                                                                display: 'inline-block'
                                                            }} />
                                                        )}
                                                        {m.status}
                                                    </span>
                                                </div>

                                                {/* Efficiency Progress Bar */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                                                        <span style={{ color: '#9ca3af' }}>EFFICIENCY</span>
                                                        <span style={{ color: effColor }}>{m.efficiency}%</span>
                                                    </div>
                                                    <div style={{ height: '5px', background: '#0b0f17', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                                        <div style={{ width: `${m.efficiency}%`, height: '100%', background: effColor, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                                                    </div>
                                                </div>

                                                {/* Output Telemetry */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    padding: '8px 10px', 
                                                    background: '#0d121c', 
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    border: '1px solid var(--border-subtle)',
                                                    marginTop: 'auto',
                                                    fontFamily: 'JetBrains Mono, monospace'
                                                }}>
                                                    <div>
                                                        <div style={{ color: '#6b7280', fontSize: '8.5px', textTransform: 'uppercase', fontWeight: '700' }}>OUTPUT</div>
                                                        <div style={{ color: '#f3f4f6', fontWeight: '700', marginTop: '2px' }}>{m.total_produced.toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: '#6b7280', fontSize: '8.5px', textTransform: 'uppercase', fontWeight: '700' }}>TARGET</div>
                                                        <div style={{ color: '#9ca3af', fontWeight: '700', marginTop: '2px' }}>{m.target_units.toLocaleString()}</div>
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
