import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft, Play, Pause, Square, AlertTriangle, CheckCircle2,
  Clock, Plus, X, Zap, Activity,
  Package, List, RefreshCw, Loader2, Moon, Sun, Gauge
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const API = API_BASE_URL;

const STATUS_CONFIG = {
  Running:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.4)',  label: 'RUNNING',  dot: '#22c55e' },
  Idle:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: 'IDLE',     dot: '#f59e0b' },
  Stopped:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  label: 'STOPPED',  dot: '#ef4444' },
  Down:     { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.4)',label: 'DOWN',     dot: '#6b7280' },
  Maintenance: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.4)', label: 'MAINT', dot: '#a78bfa' },
};

const PRIORITY_CONFIG = {
  Urgent: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  High:   { color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  Normal: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  Low:    { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const JOB_STATUS_COLOR = {
  Pending:   '#f59e0b',
  Running:   '#22c55e',
  Completed: '#3b82f6',
  Cancelled: '#6b7280',
};

// ─── Theme Palettes ────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    pageBg:        '#0a0b0f',
    headerBg:      'rgba(255,255,255,0.03)',
    headerBorder:  'rgba(255,255,255,0.07)',
    panelBorder:   'rgba(255,255,255,0.06)',
    cardBg:        'rgba(255,255,255,0.03)',
    cardBgHover:   'rgba(255,255,255,0.06)',
    panelHeaderBg: 'rgba(255,255,255,0.02)',
    inputBg:       'rgba(255,255,255,0.05)',
    inputBorder:   'rgba(255,255,255,0.1)',
    modalBg:       '#13151c',
    modalBorder:   'rgba(255,255,255,0.1)',
    logItemBorder: 'rgba(255,255,255,0.04)',
    text:          '#e5e7eb',
    textMuted:     '#9ca3af',
    textFaint:     '#4b5563',
    textStrong:    '#f1f5f9',
    textPanel:     '#d1d5db',
    btnBorder:     'rgba(255,255,255,0.1)',
    btnColor:      '#9ca3af',
    timerBg:       'rgba(0,0,0,0.2)',
    jobBoxBg:      'rgba(0,0,0,0.2)',
    progressBg:    'rgba(255,255,255,0.08)',
    addFormBg:     'rgba(99,102,241,0.06)',
    addFormBorder: 'rgba(99,102,241,0.2)',
    accent:        '#6366f1',
    accentText:    '#818cf8',
    accentBg:      'rgba(99,102,241,0.15)',
    accentBorder:  'rgba(99,102,241,0.3)',
    toggleIcon:    '#9ca3af',
  },
  light: {
    pageBg:        '#f1f5f9',
    headerBg:      'rgba(255,255,255,0.85)',
    headerBorder:  'rgba(0,0,0,0.08)',
    panelBorder:   'rgba(0,0,0,0.08)',
    cardBg:        '#ffffff',
    cardBgHover:   '#f8fafc',
    panelHeaderBg: 'rgba(255,255,255,0.9)',
    inputBg:       '#ffffff',
    inputBorder:   'rgba(0,0,0,0.15)',
    modalBg:       '#ffffff',
    modalBorder:   'rgba(0,0,0,0.12)',
    logItemBorder: 'rgba(0,0,0,0.06)',
    text:          '#1e293b',
    textMuted:     '#64748b',
    textFaint:     '#94a3b8',
    textStrong:    '#0f172a',
    textPanel:     '#334155',
    btnBorder:     'rgba(0,0,0,0.15)',
    btnColor:      '#64748b',
    timerBg:       'rgba(0,0,0,0.04)',
    jobBoxBg:      'rgba(0,0,0,0.03)',
    progressBg:    'rgba(0,0,0,0.08)',
    addFormBg:     'rgba(99,102,241,0.05)',
    addFormBorder: 'rgba(99,102,241,0.25)',
    accent:        '#6366f1',
    accentText:    '#4f46e5',
    accentBg:      'rgba(99,102,241,0.1)',
    accentBorder:  'rgba(99,102,241,0.35)',
    toggleIcon:    '#4f46e5',
  },
};

function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(ref.current);
      setElapsed(0);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function MachineKiosk() {
  const { selectedPlant } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── Theme ────────────────────────────────────────────────────────────────────
  const savedTheme = localStorage.getItem('kiosk-theme') || 'dark';
  const [isDark, setIsDark] = useState(savedTheme === 'dark');
  const T = isDark ? THEMES.dark : THEMES.light;
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('kiosk-theme', next ? 'dark' : 'light');
  };

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [unitsInput, setUnitsInput] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);

  const [newJob, setNewJob] = useState({
    title: '', part_name: '', target_qty: '', priority: 'Normal'
  });

  // ── Cycle Production Simulation State ──────────────────────────────────────
  const CYCLE_DURATION = 3.0; // 3.0 seconds per part cycle
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [cycleElapsed, setCycleElapsed] = useState(0);

  const isRunning = selectedMachine?.status === 'Running';
  const timer = useTimer(isRunning);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMachines = async () => {
    if (!selectedPlant) return;
    try {
      const res = await fetch(`${API}/kiosk/machines/${selectedPlant.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setMachines(data);
        // sync selected machine
        if (selectedMachine) {
          const updated = data.find(m => m.id === selectedMachine.id);
          if (updated) setSelectedMachine(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (machineId) => {
    setJobsLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${machineId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchLogs = async (machineId) => {
    try {
      const res = await fetch(`${API}/kiosk/machines/${machineId}/logs`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 8000);
    return () => clearInterval(interval);
  }, [selectedPlant]);

  useEffect(() => {
    if (selectedMachine) {
      fetchJobs(selectedMachine.id);
      fetchLogs(selectedMachine.id);
    }
  }, [selectedMachine?.id]);

  const selectMachine = (m) => {
    setSelectedMachine(m);
    setShowAddJob(false);
    setShowComplete(false);
    fetchJobs(m.id);
    fetchLogs(m.id);
  };

  const handleRunJob = async (jobId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs/${jobId}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast(data.message, 'success');
      setActiveJobId(jobId);
      await fetchMachines();
      await fetchJobs(selectedMachine.id);
      await fetchLogs(selectedMachine.id);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    const units = parseInt(unitsInput);
    if (isNaN(units) || units < 0) { showToast('Enter valid units produced', 'error'); return; }
    setActionLoading(true);
    try {
      const runningJob = jobs.find(j => j.status === 'Running');
      if (!runningJob) { showToast('No running job found', 'error'); return; }
      const res = await fetch(`${API}/kiosk/jobs/${runningJob.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units_produced: units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast(`Job completed! OEE: ${data.oee}%`, 'success');
      setShowComplete(false);
      setUnitsInput('');
      setActiveJobId(null);
      await fetchMachines();
      await fetchJobs(selectedMachine.id);
      await fetchLogs(selectedMachine.id);
    } catch (e) {
      showToast(e.message, 'error');
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
      showToast(data.message, 'success');
      setActiveJobId(null);
      await fetchMachines();
      await fetchJobs(selectedMachine.id);
      await fetchLogs(selectedMachine.id);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetStatus = async (status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/machines/${selectedMachine.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast(data.message, 'success');
      await fetchMachines();
      await fetchLogs(selectedMachine.id);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.part_name || !newJob.target_qty) {
      showToast('Fill in all fields', 'error'); return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/kiosk/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJob,
          target_qty: parseInt(newJob.target_qty),
          machine_id: selectedMachine.id,
          plant_id: selectedPlant.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      showToast('Job added to queue!', 'success');
      setNewJob({ title: '', part_name: '', target_qty: '', priority: 'Normal' });
      setShowAddJob(false);
      await fetchJobs(selectedMachine.id);
      await fetchMachines();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const runningJob = jobs.find(j => j.status === 'Running');
  const pendingJobs = jobs.filter(j => j.status === 'Pending');
  const historyJobs = jobs.filter(j => ['Completed', 'Cancelled'].includes(j.status));
  const progress = runningJob
    ? Math.min(100, Math.round((runningJob.units_produced / runningJob.target_qty) * 100))
    : 0;

  // ── Produce Unit Handler (Manual or Simulated Pulse) ──────────────────────
  const handleProduce = async (count = 1) => {
    if (!runningJob) return;
    const addCount = Math.max(1, count);
    const target = runningJob.target_qty;
    const nextUnits = Math.min(target, (runningJob.units_produced || 0) + addCount);

    // Optimistically update jobs state immediately
    setJobs(prevJobs => prevJobs.map(j => {
      if (j.id === runningJob.id) {
        return { ...j, units_produced: nextUnits };
      }
      return j;
    }));

    // Optimistically update machines list count
    setMachines(prevMachines => prevMachines.map(m => {
      if (m.id === selectedMachine?.id) {
        return { ...m, current_job_produced: nextUnits };
      }
      return m;
    }));

    try {
      const res = await fetch(`${API}/kiosk/jobs/${runningJob.id}/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: addCount })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.target_reached) {
          showToast(`🎯 Production target reached (${data.units_produced}/${data.target_qty} units)! Ready to complete.`, 'success');
        }
      }
    } catch (e) {
      console.error('Failed to increment unit:', e);
    }
  };

  // ── Auto Machining Cycle Simulation Effect ─────────────────────────────────
  useEffect(() => {
    if (!isRunning || !runningJob || !autoSimulate || (runningJob.units_produced >= runningJob.target_qty)) {
      setCycleElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setCycleElapsed(prev => {
        const next = Math.round((prev + 0.1) * 10) / 10;
        if (next >= CYCLE_DURATION) {
          handleProduce(1);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, runningJob?.id, autoSimulate, runningJob?.units_produced, runningJob?.target_qty]);

  const cfg = selectedMachine ? (STATUS_CONFIG[selectedMachine.status] || STATUS_CONFIG.Stopped) : null;

  const st = getStyles(T);

  return (
    <div style={st.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...st.toast, background: toast.type === 'error' ? '#ef4444' : '#22c55e' }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={st.header}>
        <button onClick={() => navigate('/dashboard')} style={st.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div style={st.headerTitle}>
          <Zap size={22} color="#6366f1" />
          <span>Machine Kiosk</span>
          <span style={st.plantBadge}>{selectedPlant?.name}</span>
        </div>
        <div style={st.headerRight}>
          <button onClick={toggleTheme} style={st.themeBtn} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={fetchMachines} style={st.refreshBtn} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={st.layout}>
        {/* LEFT — Machine Fleet */}
        <div style={st.leftPanel}>
          <div style={st.panelHeader}>
            <Activity size={16} color="#6366f1" />
            <span>Machine Fleet</span>
            <span style={st.countBadge}>{machines.length}</span>
          </div>
          {loading ? (
            <div style={st.centerLoad}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" /></div>
          ) : (
            <div style={st.machineGrid}>
              {machines.map(m => {
                const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.Stopped;
                const isSelected = selectedMachine?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => selectMachine(m)}
                    style={{
                      ...st.machineCard,
                      border: isSelected ? `2px solid ${sc.color}` : `2px solid ${T.panelBorder}`,
                      background: isSelected ? sc.bg : T.cardBg,
                      boxShadow: isSelected ? `0 0 20px ${sc.color}30` : 'none',
                    }}
                  >
                    <div style={st.machineCardTop}>
                      <span style={st.machineName}>{m.name}</span>
                      <span style={{ ...st.statusDot, background: sc.dot, boxShadow: `0 0 6px ${sc.dot}` }} />
                    </div>
                    <div style={st.machineType}>{m.machine_type || 'General'}</div>
                    <div style={{ ...st.statusLabel, color: sc.color }}>{sc.label}</div>
                    {m.current_job_title && (
                      <div style={st.currentJobTag}>
                        <Play size={10} />
                        {m.current_job_title}
                      </div>
                    )}
                    {m.pending_jobs > 0 && (
                      <div style={st.pendingTag}>{m.pending_jobs} pending</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CENTER — Active Machine */}
        <div style={st.centerPanel}>
          {!selectedMachine ? (
            <div style={st.noSelection}>
              <Activity size={48} color={T.textFaint} />
              <p style={{ color: T.textFaint, marginTop: 12, fontSize: 15 }}>Select a machine from the fleet</p>
            </div>
          ) : (
            <>
              {/* Machine Status Hero */}
              <div style={{ ...st.machineHero, border: `1px solid ${cfg.border}`, background: cfg.bg }}>
                <div style={st.heroTop}>
                  <div>
                    <div style={st.heroMachineName}>{selectedMachine.name}</div>
                    <div style={st.heroMachineType}>{selectedMachine.machine_type || 'General Machine'}</div>
                  </div>
                  <div style={{ ...st.heroBadge, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    <span style={{ ...st.pulsingDot, background: cfg.dot }} />
                    {cfg.label}
                  </div>
                </div>

                {/* Timer */}
                {isRunning && runningJob && (
                  <div style={st.timerRow}>
                    <Clock size={14} color={T.textMuted} />
                    <span style={st.timerLabel}>Runtime</span>
                    <span style={st.timerValue}>{timer}</span>
                  </div>
                )}

                {/* Current Job Progress & Production Simulation */}
                {runningJob && (
                  <div style={st.currentJobBox}>
                    <div style={st.jobInfoRow}>
                      <div>
                        <div style={st.jobTitle}>{runningJob.title}</div>
                        <div style={st.jobPart}><Package size={12} /> {runningJob.part_name}</div>
                      </div>
                      <div style={{ ...st.priorityBadge, color: PRIORITY_CONFIG[runningJob.priority]?.color, background: PRIORITY_CONFIG[runningJob.priority]?.bg }}>
                        {runningJob.priority}
                      </div>
                    </div>

                    {/* Target Met Banner */}
                    {runningJob.units_produced >= runningJob.target_qty && (
                      <div style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#22c55e',
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={16} /> Target Reached (100%) — Click Complete Job to log production
                      </div>
                    )}

                    {/* Progress Bar with Live Gradient and Striping */}
                    <div style={st.progressBar}>
                      <div style={{
                        ...st.progressFill,
                        width: `${progress}%`,
                        background: runningJob.units_produced >= runningJob.target_qty
                          ? '#22c55e'
                          : 'linear-gradient(90deg, #6366f1, #22c55e)',
                        backgroundImage: runningJob.units_produced < runningJob.target_qty && autoSimulate
                          ? 'linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.18) 75%, transparent 75%, transparent)'
                          : 'none',
                        backgroundSize: '30px 30px',
                        animation: runningJob.units_produced < runningJob.target_qty && autoSimulate
                          ? 'progressStripes 1.5s linear infinite'
                          : 'none',
                        boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)'
                      }} />
                    </div>

                    <div style={st.progressLabel}>
                      <span><strong>{runningJob.units_produced}</strong> / {runningJob.target_qty} units produced</span>
                      <span style={{ fontWeight: 700, color: progress === 100 ? '#22c55e' : T.text }}>{progress}%</span>
                    </div>

                    {/* Live Machining Cycle Simulation Toolbar */}
                    {runningJob.units_produced < runningJob.target_qty && (
                      <div style={{
                        marginTop: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: T.timerBg,
                        border: `1px solid ${T.panelBorder}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 6 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.text, fontWeight: 600 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: autoSimulate ? '#22c55e' : '#f59e0b',
                              animation: autoSimulate ? 'pulse 1s infinite' : 'none'
                            }} />
                            {autoSimulate ? `Machining Part #${(runningJob.units_produced || 0) + 1}...` : 'Simulation Paused'}
                          </span>
                          <span style={{ color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                            {cycleElapsed.toFixed(1)}s / {CYCLE_DURATION.toFixed(1)}s
                          </span>
                        </div>

                        {/* Cycle mini progress bar */}
                        <div style={{ height: 4, background: T.progressBg, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (cycleElapsed / CYCLE_DURATION) * 100)}%`,
                            background: '#22c55e',
                            transition: 'width 0.1s linear'
                          }} />
                        </div>

                        {/* Simulation Controls */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setAutoSimulate(v => !v)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 6,
                              border: `1px solid ${autoSimulate ? 'rgba(34,197,94,0.4)' : T.btnBorder}`,
                              background: autoSimulate ? 'rgba(34,197,94,0.15)' : 'none',
                              color: autoSimulate ? '#22c55e' : T.textMuted,
                              fontSize: 11, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {autoSimulate ? <Pause size={12} /> : <Play size={12} />}
                            {autoSimulate ? 'Auto-Produce: ON' : 'Auto-Produce: OFF'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleProduce(1)}
                            disabled={actionLoading || runningJob.units_produced >= runningJob.target_qty}
                            title="Simulate 1 Part Produced"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 3,
                              padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.btnBorder}`,
                              background: T.cardBg, color: T.text, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            +1 Part
                          </button>

                          <button
                            type="button"
                            onClick={() => handleProduce(10)}
                            disabled={actionLoading || runningJob.units_produced >= runningJob.target_qty}
                            title="Simulate 10 Parts Produced"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 3,
                              padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.btnBorder}`,
                              background: T.cardBg, color: T.text, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            +10 Parts
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Orphan Running State Mismatch Warning */}
                {isRunning && !runningJob && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                      <AlertTriangle size={15} /> State Mismatch
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>
                      This machine is marked as <strong>Running</strong> in the database but has no active job assigned. Please set it to <strong>Idle</strong> to run a job.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={st.actionRow}>
                  {isRunning && runningJob ? (
                    <>
                      <button
                        onClick={() => {
                          setUnitsInput(String(runningJob.units_produced || ''));
                          setShowComplete(true);
                        }}
                        disabled={actionLoading}
                        style={{ ...st.actionBtn, background: '#22c55e', color: '#fff' }}
                      >
                        <CheckCircle2 size={16} /> Complete Job
                      </button>
                      <button
                        onClick={() => handleCancelJob(runningJob.id)}
                        disabled={actionLoading}
                        style={{ ...st.actionBtn, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}
                      >
                        <X size={16} /> Cancel Job
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSetStatus('Idle')}
                        disabled={actionLoading || selectedMachine.status === 'Idle'}
                        style={{ ...st.actionBtn, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
                      >
                        <Clock size={15} /> Set Idle
                      </button>
                      <button
                        onClick={() => handleSetStatus('Stopped')}
                        disabled={actionLoading || selectedMachine.status === 'Stopped'}
                        style={{ ...st.actionBtn, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <Square size={15} /> Stop
                      </button>
                      <button
                        onClick={() => handleSetStatus('Down')}
                        disabled={actionLoading || selectedMachine.status === 'Down'}
                        style={{ ...st.actionBtn, background: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.3)' }}
                      >
                        <AlertTriangle size={15} /> Mark Down
                      </button>
                    </>
                  )}
                </div>

              </div>

              {/* Complete Job Modal */}
              {showComplete && (
                <div style={st.modal}>
                  <div style={st.modalBox}>
                    <div style={st.modalTitle}><CheckCircle2 size={18} color="#22c55e" /> Complete Job</div>
                    <p style={st.modalSub}>Enter the number of units produced for <strong>{runningJob?.title}</strong></p>
                    <input
                      type="number"
                      value={unitsInput}
                      onChange={e => setUnitsInput(e.target.value)}
                      placeholder={`Target: ${runningJob?.target_qty} units`}
                      style={st.modalInput}
                      min="0"
                      autoFocus
                    />
                    <div style={st.modalActions}>
                      <button onClick={() => setShowComplete(false)} style={st.cancelBtn}>Cancel</button>
                      <button onClick={handleCompleteJob} disabled={actionLoading} style={st.confirmBtn}>
                        {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                        Confirm Complete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Log Timeline */}
              <div style={st.logPanel}>
                <div style={st.panelHeader}>
                  <List size={15} color="#6366f1" />
                  <span>Status Log</span>
                  <span style={st.countBadge}>{logs.length}</span>
                </div>
                <div style={st.logList}>
                  {logs.length === 0 ? (
                    <div style={st.emptyLog}>No logs yet</div>
                  ) : logs.slice(0, 15).map((log) => {
                    const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.Stopped;
                    return (
                      <div key={log.id} style={st.logItem}>
                        <div style={{ ...st.logDot, background: sc.dot, boxShadow: `0 0 5px ${sc.dot}` }} />
                        <div style={st.logContent}>
                          <div style={{ ...st.logStatus, color: sc.color }}>{log.status}</div>
                          <div style={st.logNote}>{log.note || (log.job_title ? `Job: ${log.job_title}` : '—')}</div>
                          {log.units_produced > 0 && (
                            <div style={st.logUnits}><Package size={10} /> {log.units_produced} units</div>
                          )}
                        </div>
                        <div style={st.logTime}>
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Job Queue */}
        <div style={st.rightPanel}>
          <div style={{ ...st.panelHeader, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={15} color="#6366f1" />
              <span>Job Queue</span>
              {selectedMachine && <span style={st.countBadge}>{pendingJobs.length}</span>}
            </div>
            {selectedMachine && (
              <button onClick={() => setShowAddJob(v => !v)} style={st.addJobBtn}>
                {showAddJob ? <X size={14} /> : <Plus size={14} />}
                {showAddJob ? 'Cancel' : 'Add Job'}
              </button>
            )}
          </div>

          {!selectedMachine ? (
            <div style={st.noSelection}><p style={{ color: T.textFaint, fontSize: 14 }}>Select a machine first</p></div>
          ) : (
            <>
              {/* Add Job Form */}
              {showAddJob && (
                <form onSubmit={handleAddJob} style={st.addJobForm}>
                  <div style={st.formTitle}>New Job</div>
                  <input
                    placeholder="Job Title (e.g. Shaft Turning)"
                    value={newJob.title}
                    onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                    style={st.formInput}
                    required
                  />
                  <input
                    placeholder="Part Name (e.g. Gear Shaft)"
                    value={newJob.part_name}
                    onChange={e => setNewJob(p => ({ ...p, part_name: e.target.value }))}
                    style={st.formInput}
                    required
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder="Target Qty"
                      value={newJob.target_qty}
                      onChange={e => setNewJob(p => ({ ...p, target_qty: e.target.value }))}
                      style={{ ...st.formInput, flex: 1 }}
                      min="1"
                      required
                    />
                    <select
                      value={newJob.priority}
                      onChange={e => setNewJob(p => ({ ...p, priority: e.target.value }))}
                      style={{ ...st.formInput, flex: 1 }}
                    >
                      <option>Urgent</option>
                      <option>High</option>
                      <option>Normal</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <button type="submit" disabled={actionLoading} style={st.submitBtn}>
                    {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                    Add to Queue
                  </button>
                </form>
              )}

              {jobsLoading ? (
                <div style={st.centerLoad}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" /></div>
              ) : (
                <>
                  {runningJob && (
                    <div style={st.jobSection}>
                      <div style={st.sectionLabel}>RUNNING</div>
                      <JobCard job={runningJob} onRun={null} onCancel={handleCancelJob} isRunning disabled={actionLoading} T={T} />
                    </div>
                  )}
                  {pendingJobs.length > 0 && (
                    <div style={st.jobSection}>
                      <div style={st.sectionLabel}>PENDING ({pendingJobs.length})</div>
                      {pendingJobs.map(job => (
                        <JobCard
                          key={job.id} job={job}
                          onRun={isRunning ? null : handleRunJob}
                          onCancel={handleCancelJob}
                          disabled={actionLoading || isRunning}
                          machineRunning={isRunning}
                          T={T}
                        />
                      ))}
                    </div>
                  )}
                  {historyJobs.length > 0 && (
                    <div style={st.jobSection}>
                      <div style={st.sectionLabel}>HISTORY</div>
                      {historyJobs.slice(0, 8).map(job => (
                        <JobCard key={job.id} job={job} disabled T={T} />
                      ))}
                    </div>
                  )}
                  {jobs.length === 0 && !showAddJob && (
                    <div style={{ ...st.noSelection, marginTop: 20 }}>
                      <Package size={32} color={T.textFaint} />
                      <p style={{ color: T.textFaint, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                        No jobs yet.<br />Add a job to get started.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes progressStripes {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
      `}</style>
    </div>
  );
}

function JobCard({ job, onRun, onCancel, isRunning, disabled, machineRunning, T }) {
  const pc = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.Normal;

  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.panelBorder}`,
      borderLeft: `3px solid ${JOB_STATUS_COLOR[job.status] || '#6b7280'}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 6,
      opacity: job.status === 'Cancelled' ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPanel }}>{job.title}</div>
        <div style={{ borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 600, color: pc.color, background: pc.bg }}>
          {job.priority}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textMuted, marginBottom: 5 }}>
        <Package size={11} color={T.textMuted} /> {job.part_name}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.textMuted }}>
        <span>Target: <strong style={{ color: T.text }}>{job.target_qty}</strong></span>
        {job.units_produced > 0 && <span>Made: <strong style={{ color: '#22c55e' }}>{job.units_produced}</strong></span>}
        <span style={{ color: JOB_STATUS_COLOR[job.status], fontWeight: 600 }}>{job.status}</span>
      </div>

      {job.status === 'Pending' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {onRun && (
            <button
              onClick={() => onRun(job.id)}
              disabled={disabled}
              title={machineRunning ? 'Complete current job first' : 'Run this job'}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:'#6366f1', color:'#fff', opacity: disabled ? 0.5 : 1 }}
            >
              <Play size={12} /> Run
            </button>
          )}
          {machineRunning && (
            <span style={{ fontSize: 10, color: T.textFaint, alignSelf: 'center' }}>Machine busy</span>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(job.id)}
              disabled={disabled}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:'rgba(239,68,68,0.12)', color:'#ef4444' }}
            >
              <X size={12} /> Cancel
            </button>
          )}
        </div>
      )}

      {job.status === 'Running' && onCancel && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={() => onCancel(job.id)}
            disabled={disabled}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background:'rgba(239,68,68,0.12)', color:'#ef4444' }}
          >
            <X size={12} /> Cancel
          </button>
        </div>
      )}

      {job.completed_at && (
        <div style={{ fontSize: 10, color: T.textFaint, marginTop: 4 }}>
          Done: {new Date(job.completed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      )}
    </div>
  );
}

const getStyles = (T) => ({
  page: {
    minHeight: '100vh',
    background: T.pageBg,
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: T.text,
    display: 'flex',
    flexDirection: 'column',
    transition: 'background 0.3s, color 0.3s',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px',
    background: T.headerBg,
    borderBottom: `1px solid ${T.headerBorder}`,
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: `1px solid ${T.btnBorder}`,
    color: T.btnColor, padding: '7px 14px', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
  },
  headerTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 17, fontWeight: 700, color: T.textStrong,
  },
  plantBadge: {
    background: T.accentBg, color: T.accentText,
    border: `1px solid ${T.accentBorder}`,
    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
  },
  headerRight: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  refreshBtn: {
    background: 'none', border: `1px solid ${T.btnBorder}`,
    color: T.btnColor, padding: 8, borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', transition: 'all 0.2s',
  },
  themeBtn: {
    background: T.accentBg, border: `1px solid ${T.accentBorder}`,
    color: T.toggleIcon, padding: 8, borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', transition: 'all 0.3s',
  },
  layout: {
    display: 'grid', gridTemplateColumns: '280px 1fr 320px',
    gap: 0, flex: 1, minHeight: 0,
  },
  leftPanel: {
    borderRight: `1px solid ${T.panelBorder}`,
    overflowY: 'auto', maxHeight: 'calc(100vh - 60px)',
  },
  centerPanel: {
    overflowY: 'auto', maxHeight: 'calc(100vh - 60px)',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
  },
  rightPanel: {
    borderLeft: `1px solid ${T.panelBorder}`,
    overflowY: 'auto', maxHeight: 'calc(100vh - 60px)',
    display: 'flex', flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '14px 16px',
    borderBottom: `1px solid ${T.panelBorder}`,
    fontSize: 13, fontWeight: 600, color: T.textPanel,
    background: T.panelHeaderBg,
    position: 'sticky', top: 0, zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  countBadge: {
    background: T.accentBg, color: T.accentText,
    border: `1px solid ${T.accentBorder}`,
    borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
    marginLeft: 'auto',
  },
  machineGrid: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  machineCard: { borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' },
  machineCardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  machineName: { fontSize: 13, fontWeight: 600, color: T.text },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  machineType: { fontSize: 11, color: T.textMuted, marginBottom: 4 },
  statusLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' },
  currentJobTag: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(34,197,94,0.1)', color: '#22c55e',
    borderRadius: 4, padding: '2px 7px', fontSize: 10, marginTop: 6, width: 'fit-content',
  },
  pendingTag: {
    background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
    borderRadius: 4, padding: '2px 7px', fontSize: 10, marginTop: 4, width: 'fit-content',
  },
  centerLoad: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 },
  noSelection: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  machineHero: { borderRadius: 16, padding: '20px 22px', animation: 'slideUp 0.3s ease' },
  heroTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  heroMachineName: { fontSize: 22, fontWeight: 700, color: T.textStrong },
  heroMachineType: { fontSize: 13, color: T.textMuted, marginTop: 2 },
  heroBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    borderRadius: 20, padding: '6px 14px',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
  },
  pulsingDot: { width: 8, height: 8, borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' },
  timerRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: T.timerBg, borderRadius: 8, padding: '8px 14px', marginBottom: 12,
  },
  timerLabel: { fontSize: 12, color: T.textMuted, flex: 1 },
  timerValue: { fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#22c55e', letterSpacing: '0.05em' },
  currentJobBox: { background: T.jobBoxBg, borderRadius: 10, padding: '14px 16px', marginBottom: 14 },
  jobInfoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: 600, color: T.text },
  jobPart: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted, marginTop: 3 },
  priorityBadge: { borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600 },
  progressBar: { height: 8, background: T.progressBg, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s ease', boxShadow: '0 0 8px currentColor' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 9, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    backdropFilter: 'blur(4px)',
  },
  modalBox: {
    background: T.modalBg, border: `1px solid ${T.modalBorder}`,
    borderRadius: 16, padding: '28px 32px', width: 360,
    animation: 'slideUp 0.25s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  modalTitle: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 17, fontWeight: 700, color: T.textStrong, marginBottom: 10,
  },
  modalSub: { fontSize: 13, color: T.textMuted, marginBottom: 16, lineHeight: 1.5 },
  modalInput: {
    width: '100%', background: T.inputBg,
    border: `1px solid ${T.inputBorder}`, borderRadius: 8,
    color: T.text, padding: '10px 14px', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 8, border: `1px solid ${T.btnBorder}`,
    background: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13,
  },
  confirmBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 20px', borderRadius: 8, border: 'none',
    background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  logPanel: {
    background: T.panelHeaderBg, borderRadius: 14,
    border: `1px solid ${T.panelBorder}`, flex: 1,
  },
  logList: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  emptyLog: { color: T.textFaint, fontSize: 12, textAlign: 'center', padding: '20px 0' },
  logItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '8px 6px', borderBottom: `1px solid ${T.logItemBorder}`,
  },
  logDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  logContent: { flex: 1, minWidth: 0 },
  logStatus: { fontSize: 11, fontWeight: 700, letterSpacing: '0.07em' },
  logNote: { fontSize: 12, color: T.textMuted, marginTop: 2, lineHeight: 1.4 },
  logUnits: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22c55e', marginTop: 2 },
  logTime: { fontSize: 10, color: T.textFaint, flexShrink: 0, marginTop: 2 },
  addJobBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: T.accentBg, color: T.accentText,
    border: `1px solid ${T.accentBorder}`,
    borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  addJobForm: {
    margin: '0 12px 12px',
    background: T.addFormBg, border: `1px solid ${T.addFormBorder}`,
    borderRadius: 12, padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 8,
    animation: 'fadeIn 0.2s ease',
  },
  formTitle: { fontSize: 13, fontWeight: 700, color: T.accentText, marginBottom: 2 },
  formInput: {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 7, color: T.text, padding: '9px 12px',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: T.accent, color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  jobSection: { padding: '8px 12px' },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.textFaint,
    marginBottom: 6, paddingLeft: 2,
  },
  toast: {
    position: 'fixed', top: 70, right: 20, zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 18px', borderRadius: 10, color: '#fff',
    fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.3s ease',
  },
});

