import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Activity,
  Sliders,
  Calendar,
  Zap,
  Layers,
  LogOut,
  User,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  ChevronRight,
  Menu,
  X,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

/**
 * AppShell Component
 * Enterprise master shell wrapping all authenticated MES pages.
 * Features:
 * - Persistent left industrial navigation drawer (with plant switcher & operator info)
 * - Persistent top navigation bar (with breadcrumbs, facility title, SCADA telemetry status, dark mode & user profile)
 * - Information-dense content canvas with zero marketing images or distracting gradients
 */
export default function AppShell({
  children,
  pageTitle,
  breadcrumbs = [],
  lastUpdated,
  telemetryStatus = 'online', // 'online' | 'offline' | 'stale'
  onRefresh
}) {
  const { user, selectedPlant, logout, selectPlant, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = theme === 'dark';

  const navItems = [
    { id: 'overview',   label: 'Facility Overview',  path: '/dashboard',   icon: Activity, tab: 'overview' },
    { id: 'machines',   label: 'Machine Fleet',      path: '/dashboard',   icon: Sliders,  tab: 'insights' },
    { id: 'scheduling', label: 'Job Scheduling',     path: '/scheduling',  icon: Calendar },
    { id: 'kiosk',      label: 'Machine Terminal',   path: '/kiosk',       icon: Zap },
  ];

  const handleNavClick = (item) => {
    setSidebarOpen(false);
    if (item.tab) {
      navigate(item.path, { state: { activeTab: item.tab } });
    } else {
      navigate(item.path);
    }
  };

  const handleSwitchPlant = () => {
    selectPlant(null);
    navigate('/select-plant');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTelemetryTime = (date) => {
    if (!date) return 'No sync';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Sync error';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-modal-overlay)',
            zIndex: 998
          }}
        />
      )}

      {/* Industrial Navigation Drawer */}
      <aside
        style={{
          width: '240px',
          background: 'var(--bg-sidebar)',
          color: 'var(--text-on-dark)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 999,
          padding: '16px 12px',
          justifyContent: 'space-between',
          flexShrink: 0,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div>
          {/* Header Brand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingBottom: '14px',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img
              src="/factory-logo.svg"
              alt="PlantOps MES Logo"
              style={{ width: '32px', height: '32px', borderRadius: '4px', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '-0.2px', color: '#ffffff' }}>
                PlantOps MES
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                Operations System
              </div>
            </div>
          </div>

          {/* Active Facility Card */}
          {selectedPlant && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '8px 10px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8', fontWeight: '700' }}>
                Active Facility
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px'
              }} title={selectedPlant.name}>
                {selectedPlant.name}
              </div>
              <button
                onClick={handleSwitchPlant}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={12} />
                Switch Plant
              </button>
            </div>
          )}

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isMatchPath = location.pathname === item.path;
              const isMatchTab = item.tab ? location.state?.activeTab === item.tab : true;
              const isActive = isMatchPath && isMatchTab;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <User size={14} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.name || 'Authorized Operator'}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '600' }}>
                Level 1 Operator
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '5px 8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Primary Workstation Canvas */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        minWidth: 0
      }}>
        {/* Top Control Bar */}
        <header style={{
          height: '48px',
          padding: '0 20px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 900
        }}>
          {/* Breadcrumb & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main)',
                padding: '4px',
                display: 'none'
              }}
              className="mobile-drawer-btn"
              title="Toggle Menu"
            >
              <Menu size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{selectedPlant?.name || 'Plant'}</span>
              <ChevronRight size={12} />
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  <span>{b}</span>
                  <ChevronRight size={12} />
                </React.Fragment>
              ))}
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Telemetry Status & System Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* SCADA Telemetry Live Sync Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              background: telemetryStatus === 'online' ? 'var(--status-running-bg)' : (telemetryStatus === 'stale' ? 'var(--status-idle-bg)' : 'var(--status-stopped-bg)'),
              border: `1px solid ${telemetryStatus === 'online' ? 'var(--status-running-border)' : (telemetryStatus === 'stale' ? 'var(--status-idle-border)' : 'var(--status-stopped-border)')}`,
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: '700',
              color: telemetryStatus === 'online' ? 'var(--status-running)' : (telemetryStatus === 'stale' ? 'var(--status-idle)' : 'var(--status-stopped)'),
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }} title={`SCADA Connection: ${telemetryStatus.toUpperCase()}`}>
              {telemetryStatus === 'online' ? <Wifi size={12} /> : (telemetryStatus === 'stale' ? <Clock size={12} /> : <WifiOff size={12} />)}
              <span>{telemetryStatus === 'online' ? 'SCADA ONLINE' : (telemetryStatus === 'stale' ? 'POLLING DELAY' : 'SCADA OFFLINE')}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span className="font-mono" style={{ fontSize: '10px' }}>{formatTelemetryTime(lastUpdated)}</span>
            </div>

            {/* Dark / Light Mode */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Operational Canvas */}
        <main style={{ padding: '20px', maxWidth: '1440px', width: '100%', margin: '0 auto', flexGrow: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
