import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Calendar, CalendarClock, Clock, Plus, X, Play, CheckCircle2,
  AlertTriangle, RotateCcw, RefreshCw, Loader2, ArrowLeft,
  Factory, Package, Layers, Filter, Search, Moon, Sun,
  Zap, TrendingUp, ChevronRight, Gauge, Check
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const API = API_BASE_URL;

const STATUS_CONFIG = {
  Running:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  label: 'RUNNING' },
  Idle:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: 'IDLE' },
  Stopped:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  label: 'STOPPED' },
  Down:        { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.4)',label: 'DOWN' },
  Maintenance: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.4)', label: 'MAINT' },
};

const PRIORITY_CONFIG = {
  Urgent: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  High:   { color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  Normal: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  Low:    { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const JOB_STATUS_COLOR = {
  Running:   '#22c55e',
  Scheduled: '#8b5cf6',
  Pending:   '#f59e0b',
  Completed: '#3b82f6',
  Cancelled: '#6b7280',
};

const THEMES = {
  dark: {
    pageBg: '#090a0f',
    headerBg: 'rgba(15,17,26,0.85)',
    cardBg: '#121420',
    cardBorder: 'rgba(255,255,255,0.07)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.12)',
    inputBg: '#1a1d2d',
    inputBorder: 'rgba(255,255,255,0.12)',
    timelineBg: '#0f111d',
  },
  light: {
    pageBg: '#f8fafc',
    headerBg: 'rgba(255,255,255,0.9)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.08)',
    inputBg: '#f1f5f9',
    inputBorder: 'rgba(0,0,0,0.12)',
    timelineBg: '#f8fafc',
  }
};

export default function JobScheduling() {
  const { selectedPlant } = useContext(AuthContext);
  const navigate = useNavigate();

  const savedTheme = localStorage.getItem('kiosk-theme') || 'dark';
  const [isDark, setIsDark] = useState(savedTheme === 'dark');
  const T = isDark ? THEMES.dark : THEMES.light;

  const [machines, setMachines] = useState([]);
  const [scheduleJobs, setScheduleJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters & views
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'timeline'
  const [machineFilter, setMachineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedMachineId, setPreselectedMachineId] = useState('');
  const [newJob, setNewJob] = useState({
    machine_id: '',
    title: '',
    part_name: '',
    target_qty: '',
    priority: 'Normal',
    scheduled_start_at: '',
    estimated_duration_min: '60'
  });

  const [rescheduleJobModal, setRescheduleJobModal] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleDuration, setRescheduleDuration] = useState('60');

  const [lastAutoDispatch, setLastAutoDispatch] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async (silent = false) => {
    if (!selectedPlant) return;
    if (!silent) setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(`${API}/kiosk/machines/${selectedPlant.id}`),
        fetch(`${API}/kiosk/schedule/${selectedPlant.id}`)
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData)) setMachines(mData);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) setScheduleJobs(sData);
      }
    } catch (err) {
      console.error('Failed to fetch schedule data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
  }, [selectedPlant?.id]);

  // Open create modal with pre-selected machine
  const openCreateForMachine = (mId) => {
    const defaultTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16);
    setNewJob({
      machine_id: String(mId),
      title: '',
      part_name: '',
      target_qty: '',
      priority: 'Normal',
      scheduled_start_at: defaultTime,
      estimated_duration_min: '60'
    });
    setShowCreateModal(true);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.part_name || !newJob.target_qty || !newJob.machine_id) {
      showToast('Fill in all required fields', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        title: newJob.title,
        part_name: newJob.part_name,
        target_qty: parseInt(newJob.target_qty),
        priority: newJob.priority,
        machine_id: parseInt(newJob.machine_id),
        plant_id: selectedPlant.id,
      };

      if (newJob.scheduled_start_at) {
        payload.scheduled_start_at = new Date(newJob.scheduled_start_at).toISOString();
        payload.estimated_duration_min = parseInt(newJob.estimated_duration_min) || 60;
      }

      const res = await fetch(`${API}/kiosk/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to schedule job');

      showToast(`Job '${newJob.title}' scheduled successfully!`, 'success');
      setShowCreateModal(false);
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleJobModal || !rescheduleTime) {
      showToast('Please select a scheduled start time', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${rescheduleJobModal.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_start_at: new Date(rescheduleTime).toISOString(),
          estimated_duration_min: parseInt(rescheduleDuration) || 60
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reschedule');
      showToast(`Job '${rescheduleJobModal.title}' rescheduled!`, 'success');
      setRescheduleJobModal(null);
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnschedule = async (jobId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${jobId}/unschedule`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast('Job returned to Pending queue', 'info');
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchNow = async (jobId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${jobId}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Machine busy or unable to run');
      showToast(data.message || 'Job started on machine!', 'success');
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${jobId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast('Job cancelled', 'info');
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerAutoDispatch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/schedule/dispatch?plant_id=${selectedPlant?.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      const count = data.dispatched ? data.dispatched.length : 0;
      setLastAutoDispatch(new Date());
      if (count > 0) {
        showToast(`Auto-dispatched ${count} scheduled job(s)!`, 'success');
      } else {
        showToast('Auto-dispatch verified: No due jobs awaiting available machines.', 'info');
      }
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // KPIs
  const runningJobs = scheduleJobs.filter(j => j.status === 'Running');
  const scheduledJobs = scheduleJobs.filter(j => j.status === 'Scheduled');
  const pendingJobs = scheduleJobs.filter(j => j.status === 'Pending');
  const totalTargetUnits = scheduleJobs.reduce((sum, j) => sum + (j.target_qty || 0), 0);

  const nextJob = scheduledJobs
    .filter(j => j.scheduled_start_at)
    .sort((a, b) => new Date(a.scheduled_start_at) - new Date(b.scheduled_start_at))[0];

  // Filtering
  const filteredJobs = scheduleJobs.filter(job => {
    if (machineFilter !== 'all' && String(job.machine_id) !== String(machineFilter)) return false;
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (job.title || '').toLowerCase().includes(q);
      const matchPart = (job.part_name || '').toLowerCase().includes(q);
      const matchMach = (job.machine_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchPart && !matchMach) return false;
    }
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: T.pageBg,
      color: T.textPrimary,
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? '#ef4444' : (toast.type === 'info' ? '#3b82f6' : '#22c55e'),
          color: '#fff', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 0.2s ease-out'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Top Header */}
      <header style={{
        padding: '14px 28px',
        background: T.headerBg,
        borderBottom: `1px solid ${T.cardBorder}`,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: `1px solid ${T.cardBorder}`,
              borderRadius: 8, padding: '7px 12px',
              color: T.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}
          >
            <ArrowLeft size={15} /> Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(139,92,246,0.3)'
            }}>
              <CalendarClock size={19} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>Live Job Scheduling</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#8b5cf6',
                  background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: 20
                }}>
                  MES DISPATCH
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Factory size={12} /> {selectedPlant?.name || 'Manufacturing Plant'}
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Simulator Status Pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            fontSize: 12, color: '#22c55e', fontWeight: 600
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 8px #22c55e',
              animation: 'pulse 1.2s infinite'
            }} />
            Live Auto-Scheduler (5s)
          </div>

          <button
            onClick={handleTriggerAutoDispatch}
            disabled={actionLoading}
            title="Check and dispatch due scheduled jobs immediately"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 8, padding: '7px 14px',
              color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Zap size={14} /> Auto-Dispatch Check
          </button>

          <button
            onClick={() => navigate('/kiosk')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.cardBorder}`,
              borderRadius: 8, padding: '7px 14px',
              color: T.textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer'
            }}
          >
            <Gauge size={14} /> Machine Kiosk
          </button>

          <button
            onClick={() => openCreateForMachine(machines[0]?.id || '')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#8b5cf6', border: 'none',
              borderRadius: 8, padding: '8px 16px',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139,92,246,0.3)'
            }}
          >
            <Plus size={15} /> Schedule Job
          </button>

          <button
            onClick={() => setIsDark(d => !d)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'none', border: `1px solid ${T.cardBorder}`,
              color: T.textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16
        }}>
          {/* Active Running */}
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>Active Machining</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>{runningJobs.length}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Currently running jobs</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={20} color="#22c55e" />
            </div>
          </div>

          {/* Scheduled Jobs */}
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>Scheduled Jobs</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>{scheduledJobs.length}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Planned for future dispatch</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#8b5cf6" />
            </div>
          </div>

          {/* Pending Queue */}
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>Pending in Queue</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{pendingJobs.length}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Unscheduled order backlog</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </div>

          {/* Total Target Parts */}
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>Planned Output</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, marginTop: 4 }}>{totalTargetUnits}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Total parts in schedule</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#6366f1" />
            </div>
          </div>

          {/* Next Dispatch */}
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>Next Dispatch</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {nextJob ? nextJob.title : 'No upcoming jobs'}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                {nextJob ? new Date(nextJob.scheduled_start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'All cleared'}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarClock size={20} color="#a78bfa" />
            </div>
          </div>
        </div>

        {/* Toolbar: Views & Filters */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.cardBorder}`,
          borderRadius: 14, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14
        }}>
          {/* Left: View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, textTransform: 'uppercase' }}>View Mode:</span>
            <div style={{ display: 'flex', background: T.inputBg, borderRadius: 8, padding: 3, border: `1px solid ${T.cardBorder}` }}>
              <button
                onClick={() => setViewMode('matrix')}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: viewMode === 'matrix' ? '#8b5cf6' : 'transparent',
                  color: viewMode === 'matrix' ? '#fff' : T.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Fleet Board Matrix
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: viewMode === 'timeline' ? '#8b5cf6' : 'transparent',
                  color: viewMode === 'timeline' ? '#fff' : T.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Unified Timeline
              </button>
            </div>
          </div>

          {/* Right: Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.inputBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 8, padding: '6px 12px'
            }}>
              <Search size={14} color={T.textMuted} />
              <input
                placeholder="Search job or part..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: T.textPrimary, fontSize: 12, width: 150
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Machine Filter Dropdown */}
            <select
              value={machineFilter}
              onChange={e => setMachineFilter(e.target.value)}
              style={{
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 8, padding: '7px 12px',
                color: T.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Machines ({machines.length})</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
              ))}
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 8, padding: '7px 12px',
                color: T.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Running">Running</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
            </select>

            <button
              onClick={() => fetchData(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: `1px solid ${T.cardBorder}`,
                borderRadius: 8, padding: '7px 12px',
                color: T.textSecondary, fontSize: 12, cursor: 'pointer'
              }}
              title="Refresh Schedule"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: T.textMuted }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#8b5cf6" />
            <span>Loading shop floor schedule...</span>
          </div>
        ) : (
          <>
            {/* VIEW 1: FLEET BOARD MATRIX */}
            {viewMode === 'matrix' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 20
              }}>
                {machines
                  .filter(m => machineFilter === 'all' || String(m.id) === String(machineFilter))
                  .map(machine => {
                    const sc = STATUS_CONFIG[machine.status] || STATUS_CONFIG.Stopped;
                    const machineJobs = scheduleJobs.filter(j => j.machine_id === machine.id);
                    const machineRunning = machineJobs.find(j => j.status === 'Running') || 
                      (machine.current_job_title ? {
                        id: machine.current_job_id,
                        title: machine.current_job_title,
                        part_name: machine.current_job_part || 'Workpiece',
                        target_qty: machine.current_job_target || 100,
                        units_produced: machine.current_job_produced || 0,
                        priority: 'Normal',
                        status: 'Running'
                      } : null);

                    const machineScheduled = machineJobs.filter(j => j.status === 'Scheduled');
                    const machinePending = machineJobs.filter(j => j.status === 'Pending');

                    return (
                      <div
                        key={machine.id}
                        style={{
                          background: T.cardBg,
                          border: `1px solid ${machine.status === 'Running' ? 'rgba(34,197,94,0.3)' : T.cardBorder}`,
                          borderRadius: 16,
                          padding: 18,
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: machine.status === 'Running' ? '0 4px 20px rgba(34,197,94,0.08)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Machine Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{machine.name}</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>{machine.machine_type || 'Standard Station'}</div>
                          </div>
                          <div style={{
                            padding: '4px 10px', borderRadius: 20,
                            background: sc.bg, border: `1px solid ${sc.border}`,
                            color: sc.color, fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                            {sc.label}
                          </div>
                        </div>

                        {/* Currently Machining Section */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Play size={11} color="#22c55e" /> Active Job
                          </div>

                          {machineRunning ? (
                            <div style={{
                              background: 'rgba(34,197,94,0.06)',
                              border: '1px solid rgba(34,197,94,0.25)',
                              borderRadius: 12, padding: 12
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{machineRunning.title}</div>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                  color: PRIORITY_CONFIG[machineRunning.priority]?.color,
                                  background: PRIORITY_CONFIG[machineRunning.priority]?.bg
                                }}>
                                  {machineRunning.priority}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Package size={12} /> {machineRunning.part_name}
                              </div>

                              {/* Live Progress Bar */}
                              {(() => {
                                const prod = machineRunning.units_produced || 0;
                                const targ = machineRunning.target_qty || 1;
                                const pct = Math.min(100, Math.round((prod / targ) * 100));
                                return (
                                  <div>
                                    <div style={{ height: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                                      <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: pct >= 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #22c55e)',
                                        transition: 'width 0.3s ease-out'
                                      }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
                                      <span style={{ color: T.textSecondary }}><strong>{prod}</strong> / {targ} units</span>
                                      <span style={{ fontWeight: 700, color: pct >= 100 ? '#22c55e' : T.textPrimary }}>{pct}%</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div style={{
                              padding: '12px', borderRadius: 10,
                              background: T.timelineBg, border: `1px dashed ${T.cardBorder}`,
                              textAlign: 'center', color: T.textMuted, fontSize: 12
                            }}>
                              Station currently idle (Ready for dispatch)
                            </div>
                          )}
                        </div>

                        {/* Scheduled Queue */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CalendarClock size={12} /> Scheduled Queue ({machineScheduled.length})
                            </div>
                            <button
                              onClick={() => openCreateForMachine(machine.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                background: 'none', border: 'none',
                                color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>

                          {machineScheduled.length === 0 ? (
                            <div style={{
                              padding: '10px', borderRadius: 8,
                              background: T.timelineBg, border: `1px dashed ${T.cardBorder}`,
                              textAlign: 'center', color: T.textMuted, fontSize: 11, marginBottom: 12
                            }}>
                              No future jobs scheduled
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                              {machineScheduled.map((job, idx) => (
                                <div
                                  key={job.id}
                                  style={{
                                    background: 'rgba(139,92,246,0.06)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    borderRadius: 10, padding: 10
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}>
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{job.title}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{job.part_name} · {job.target_qty} pcs</div>
                                      </div>
                                    </div>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                      color: PRIORITY_CONFIG[job.priority]?.color, background: PRIORITY_CONFIG[job.priority]?.bg
                                    }}>
                                      {job.priority}
                                    </span>
                                  </div>

                                  <div style={{
                                    marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    fontSize: 11, color: '#a78bfa', background: 'rgba(139,92,246,0.08)',
                                    padding: '4px 8px', borderRadius: 6
                                  }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Clock size={11} />
                                      {new Date(job.scheduled_start_at).toLocaleString('en-IN', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                      })}
                                    </span>
                                    <span>~{job.estimated_duration_min || 60}m</span>
                                  </div>

                                  {/* Quick Actions */}
                                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button
                                      onClick={() => handleDispatchNow(job.id)}
                                      disabled={actionLoading || machine.status === 'Running'}
                                      title={machine.status === 'Running' ? 'Station busy' : 'Dispatch job immediately'}
                                      style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        padding: '4px 8px', borderRadius: 6, border: 'none',
                                        background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 600,
                                        cursor: machine.status === 'Running' ? 'not-allowed' : 'pointer',
                                        opacity: machine.status === 'Running' ? 0.5 : 1
                                      }}
                                    >
                                      <Play size={11} /> Run Now
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRescheduleJobModal(job);
                                        setRescheduleTime(new Date(job.scheduled_start_at || Date.now()).toISOString().slice(0, 16));
                                        setRescheduleDuration(String(job.estimated_duration_min || 60));
                                      }}
                                      disabled={actionLoading}
                                      style={{
                                        padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.inputBorder}`,
                                        background: T.inputBg, color: T.textSecondary, fontSize: 11, cursor: 'pointer'
                                      }}
                                      title="Reschedule Time"
                                    >
                                      <Calendar size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleUnschedule(job.id)}
                                      disabled={actionLoading}
                                      style={{
                                        padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.inputBorder}`,
                                        background: T.inputBg, color: T.textSecondary, fontSize: 11, cursor: 'pointer'
                                      }}
                                      title="Unschedule (Move to Pending)"
                                    >
                                      <RotateCcw size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleCancelJob(job.id)}
                                      disabled={actionLoading}
                                      style={{
                                        padding: '4px 8px', borderRadius: 6, border: 'none',
                                        background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 11, cursor: 'pointer'
                                      }}
                                      title="Cancel Job"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Machine Pending Backlog */}
                          {machinePending.length > 0 && (
                            <div style={{ marginTop: 'auto', borderTop: `1px solid ${T.cardBorder}`, paddingTop: 10 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
                                Pending Queue ({machinePending.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {machinePending.slice(0, 3).map(pj => (
                                  <div key={pj.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    fontSize: 11, padding: '4px 8px', borderRadius: 6, background: T.timelineBg
                                  }}>
                                    <span style={{ color: T.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                      {pj.title}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setRescheduleJobModal(pj);
                                        setRescheduleTime(new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16));
                                        setRescheduleDuration('60');
                                      }}
                                      style={{
                                        background: 'none', border: 'none', color: '#8b5cf6',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                      }}
                                    >
                                      + Schedule
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* VIEW 2: UNIFIED TIMELINE */}
            {viewMode === 'timeline' && (
              <div style={{
                background: T.cardBg, border: `1px solid ${T.cardBorder}`,
                borderRadius: 16, padding: 24
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#8b5cf6" /> Chronological Plant Schedule ({filteredJobs.length} jobs)
                </div>

                {filteredJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
                    No jobs match the current filters.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredJobs.map((job, idx) => {
                      const isRunning = job.status === 'Running';
                      const isSched = job.status === 'Scheduled';
                      return (
                        <div
                          key={job.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 18px', borderRadius: 12,
                            background: isRunning ? 'rgba(34,197,94,0.06)' : (isSched ? 'rgba(139,92,246,0.05)' : T.timelineBg),
                            border: `1px solid ${isRunning ? 'rgba(34,197,94,0.3)' : (isSched ? 'rgba(139,92,246,0.2)' : T.cardBorder)}`,
                            flexWrap: 'wrap', gap: 12
                          }}
                        >
                          {/* Machine & Status Pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: JOB_STATUS_COLOR[job.status] || '#6b7280',
                              color: '#fff', fontSize: 12, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {idx + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{job.title}</div>
                              <div style={{ fontSize: 12, color: T.textMuted }}>
                                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{job.machine_name}</span> · {job.part_name}
                              </div>
                            </div>
                          </div>

                          {/* Time & Duration */}
                          <div style={{ minWidth: 160 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: isSched ? '#a78bfa' : (isRunning ? '#22c55e' : T.textSecondary) }}>
                              {job.scheduled_start_at
                                ? new Date(job.scheduled_start_at).toLocaleString('en-IN', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })
                                : (isRunning ? 'Running Live' : 'Unscheduled')}
                            </div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>
                              {job.estimated_duration_min ? `Estimated ~${job.estimated_duration_min} mins` : 'Standard cycle'}
                            </div>
                          </div>

                          {/* Target & Progress */}
                          <div style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 12, color: T.textSecondary }}>Target: <strong>{job.target_qty}</strong> units</div>
                            <div style={{ fontSize: 11, color: isRunning ? '#22c55e' : T.textMuted }}>
                              Made: <strong>{job.units_produced || 0}</strong>
                            </div>
                          </div>

                          {/* Priority Pill */}
                          <div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                              color: PRIORITY_CONFIG[job.priority]?.color, background: PRIORITY_CONFIG[job.priority]?.bg
                            }}>
                              {job.priority}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                              color: JOB_STATUS_COLOR[job.status],
                              background: `${JOB_STATUS_COLOR[job.status]}15`,
                              border: `1px solid ${JOB_STATUS_COLOR[job.status]}40`
                            }}>
                              {job.status}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            {job.status !== 'Running' && (
                              <button
                                onClick={() => handleDispatchNow(job.id)}
                                disabled={actionLoading}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '5px 10px', borderRadius: 6, border: 'none',
                                  background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                }}
                              >
                                <Play size={11} /> Run Now
                              </button>
                            )}
                            {job.status === 'Scheduled' && (
                              <button
                                onClick={() => handleUnschedule(job.id)}
                                disabled={actionLoading}
                                style={{
                                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.inputBorder}`,
                                  background: T.inputBg, color: T.textSecondary, fontSize: 11, cursor: 'pointer'
                                }}
                              >
                                <RotateCcw size={11} /> Unschedule
                              </button>
                            )}
                            {job.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  setRescheduleJobModal(job);
                                  setRescheduleTime(new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16));
                                  setRescheduleDuration('60');
                                }}
                                disabled={actionLoading}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.inputBorder}`,
                                  background: T.inputBg, color: '#8b5cf6', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                }}
                              >
                                <Calendar size={11} /> Schedule
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelJob(job.id)}
                              disabled={actionLoading}
                              style={{
                                padding: '5px 10px', borderRadius: 6, border: 'none',
                                background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 11, cursor: 'pointer'
                              }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE & SCHEDULE JOB MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 18, width: '100%', maxWidth: 480, padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Schedule New Production Job</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              {/* Target Machine */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                  Assigned Machine Station *
                </label>
                <select
                  value={newJob.machine_id}
                  onChange={e => setNewJob(p => ({ ...p, machine_id: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary, fontSize: 13, outline: 'none'
                  }}
                >
                  <option value="">Select Station...</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.machine_type || 'General'} - {m.status})</option>
                  ))}
                </select>
              </div>

              {/* Job Title */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                  Job Title *
                </label>
                <input
                  placeholder="e.g. CNC Spindle Boring Batch #10"
                  value={newJob.title}
                  onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Part Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                  Part / Workpiece Name *
                </label>
                <input
                  placeholder="e.g. Spindle Pin 45mm"
                  value={newJob.part_name}
                  onChange={e => setNewJob(p => ({ ...p, part_name: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Target Qty & Priority */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                    Target Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 150"
                    value={newJob.target_qty}
                    onChange={e => setNewJob(p => ({ ...p, target_qty: e.target.value }))}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={newJob.priority}
                    onChange={e => setNewJob(p => ({ ...p, priority: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary, fontSize: 13, outline: 'none'
                    }}
                  >
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Normal</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Start & Duration */}
              <div style={{
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 10, padding: 12, marginBottom: 18
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} /> Target Dispatch Schedule
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>Scheduled Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newJob.scheduled_start_at}
                    onChange={e => setNewJob(p => ({ ...p, scheduled_start_at: e.target.value }))}
                    required
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 6,
                      background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary, fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>Estimated Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={newJob.estimated_duration_min}
                    onChange={e => setNewJob(p => ({ ...p, estimated_duration_min: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 6,
                      background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                      color: T.textPrimary, fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.inputBorder}`,
                    background: 'none', color: T.textSecondary, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {actionLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={15} />}
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleJobModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: T.cardBg, border: `1px solid ${T.cardBorder}`,
            borderRadius: 18, width: '100%', maxWidth: 440, padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={20} color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Reschedule Job</h3>
              </div>
              <button onClick={() => setRescheduleJobModal(null)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 0, marginBottom: 16 }}>
              Rescheduling <strong>{rescheduleJobModal.title}</strong> on station <strong>{rescheduleJobModal.machine_name}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>New Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: T.textSecondary, display: 'block', marginBottom: 4 }}>Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  value={rescheduleDuration}
                  onChange={e => setRescheduleDuration(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                    color: T.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRescheduleJobModal(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.inputBorder}`,
                    background: 'none', color: T.textSecondary, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
