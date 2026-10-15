import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Package,
  CalendarClock,
  RotateCcw,
  Activity,
  Layers,
  ChevronRight,
  Cpu,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const API = API_BASE_URL;

const PRIORITY_CONFIG = {
  Urgent: { color: 'var(--status-stopped)', bg: 'var(--status-stopped-bg)' },
  High:   { color: 'var(--status-idle)',    bg: 'var(--status-idle-bg)' },
  Normal: { color: 'var(--primary)',        bg: 'var(--primary-bg)' },
  Low:    { color: 'var(--text-muted)',     bg: 'var(--bg-subtle)' },
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

/**
 * Enterprise Production Machine Terminal & Industrial Kiosk
 * Designed for practical operator workstations on factory floors.
 * 3-Column Industrial Layout:
 * - Left: Fleet Station Directory & Status Filter
 * - Center: Selected Workstation Console, PLC Controller Controls, Part Counter, Simulation Banner & Event Journal
 * - Right: Station Work Order Queue (Active, Scheduled, Pending, & Add Work Order)
 */
export default function MachineKiosk() {
  const { selectedPlant } = useContext(AuthContext);
  const navigate = useNavigate();

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modal & form states
  const [showAddJob, setShowAddJob] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [unitsInput, setUnitsInput] = useState('');
  const [newJob, setNewJob] = useState({
    title: '', part_name: '', target_qty: '', priority: 'Normal',
    is_scheduled: false, scheduled_start_at: '', estimated_duration_min: '60'
  });

  const [scheduleModalJob, setScheduleModalJob] = useState(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('60');

  // Simulation controls
  const [autoSimulate, setAutoSimulate] = useState(true);

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
      if (Array.isArray(data) && data.length > 0) {
        setMachines(data);
        setSelectedMachine(prev => {
          if (!prev) {
            return data.find(m => m.status === 'Running') || data[0];
          }
          const updated = data.find(m => m.id === prev.id);
          return updated || prev;
        });
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error querying machines:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (machineId, silent = false) => {
    try {
      const res = await fetch(`${API}/kiosk/jobs/${machineId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (e) {
      console.error('Error querying jobs:', e);
    }
  };

  const fetchLogs = async (machineId) => {
    try {
      const res = await fetch(`${API}/kiosk/machines/${machineId}/logs`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (e) {
      console.error('Error querying machine logs:', e);
    }
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 3000);
    return () => clearInterval(interval);
  }, [selectedPlant]);

  useEffect(() => {
    if (!selectedMachine?.id) return;
    fetchJobs(selectedMachine.id);
    fetchLogs(selectedMachine.id);
    const interval = setInterval(() => {
      fetchJobs(selectedMachine.id, true);
      if (selectedMachine.status === 'Running') {
        fetchLogs(selectedMachine.id);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedMachine?.id, selectedMachine?.status]);

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
      if (!res.ok) throw new Error(data.detail || 'Target machine unavailable');
      showToast(data.message || 'Work order started on machine controller', 'success');
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
    if (isNaN(units) || units < 0) {
      showToast('Enter valid completed pieces', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const runningJob = jobs.find(j => j.status === 'Running');
      if (!runningJob) {
        showToast('No active job found on station', 'error');
        return;
      }
      const res = await fetch(`${API}/kiosk/jobs/${runningJob.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units_produced: units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to complete job');
      showToast(`Work order completed. Logged OEE: ${data.oee}%`, 'success');
      setShowComplete(false);
      setUnitsInput('');
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
      if (!res.ok) throw new Error(data.detail || 'Failed to update machine state');
      showToast(data.message || `Station state switched to ${status}`, 'success');
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
      showToast('Fill in required fields', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        title: newJob.title.trim(),
        part_name: newJob.part_name.trim(),
        target_qty: parseInt(newJob.target_qty),
        priority: newJob.priority,
        machine_id: selectedMachine.id,
        plant_id: selectedPlant.id,
      };

      if (newJob.is_scheduled && newJob.scheduled_start_at) {
        payload.scheduled_start_at = new Date(newJob.scheduled_start_at).toISOString();
        payload.estimated_duration_min = parseInt(newJob.estimated_duration_min) || 60;
      }

      const res = await fetch(`${API}/kiosk/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add work order');
      showToast('Work order added to station queue!', 'success');
      setNewJob({
        title: '', part_name: '', target_qty: '', priority: 'Normal',
        is_scheduled: false, scheduled_start_at: '', estimated_duration_min: '60'
      });
      setShowAddJob(false);
      await fetchJobs(selectedMachine.id);
      await fetchMachines();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const runningJob = jobs.find(j => j.status === 'Running')
    || (selectedMachine?.current_job_id ? jobs.find(j => j.id === selectedMachine.current_job_id) : null)
    || (selectedMachine?.current_job_title ? {
        id: selectedMachine.current_job_id || 0,
        title: selectedMachine.current_job_title,
        part_name: selectedMachine.current_job_part || 'Workpiece',
        target_qty: selectedMachine.current_job_target || 100,
        units_produced: selectedMachine.current_job_produced || 0,
        priority: 'Normal',
        status: 'Running'
      } : null);

  const scheduledJobs = jobs.filter(j => j.status === 'Scheduled');
  const pendingJobs = jobs.filter(j => j.status === 'Pending');

  const currentProduced = runningJob ? (runningJob.units_produced || 0) : 0;
  const currentTarget = runningJob ? (runningJob.target_qty || 1) : 1;
  const progressPct = runningJob ? Math.min(100, Math.round((currentProduced / currentTarget) * 100)) : 0;

  // Ref tracking for automated pulse simulation
  const runningJobRef = useRef(runningJob);
  useEffect(() => { runningJobRef.current = runningJob; }, [runningJob]);

  const selectedMachineRef = useRef(selectedMachine);
  useEffect(() => { selectedMachineRef.current = selectedMachine; }, [selectedMachine]);

  const isProducingRef = useRef(false);

  const handleProduceUnit = async (count = 1) => {
    const job = runningJobRef.current;
    if (!job || isProducingRef.current) return;
    isProducingRef.current = true;

    const addCount = Math.max(1, count);
    const target = job.target_qty;
    const nextUnits = Math.min(target, (job.units_produced || 0) + addCount);

    // Optimistic UI state update
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, units_produced: nextUnits } : j));
    setMachines(prev => prev.map(m => m.id === selectedMachineRef.current?.id ? { ...m, current_job_produced: nextUnits } : m));

    try {
      if (job.id) {
        await fetch(`${API}/kiosk/jobs/${job.id}/produce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: addCount }),
        });
      }
    } catch (e) {
      console.error('Pulse produce error:', e);
    } finally {
      isProducingRef.current = false;
    }
  };

  // Automated part simulation pulse when running
  useEffect(() => {
    if (!isRunning || !runningJob?.id || !autoSimulate || currentProduced >= currentTarget) return;

    const timer = setInterval(() => {
      handleProduceUnit(1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isRunning, runningJob?.id, autoSimulate, currentProduced, currentTarget]);

  if (!selectedPlant) return null;

  return (
    <AppShell
      pageTitle="Machine Operations Terminal"
      breadcrumbs={['Terminal', selectedMachine ? selectedMachine.name : 'Console']}
      lastUpdated={lastUpdated}
      telemetryStatus="online"
      onRefresh={fetchMachines}
    >
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          padding: '10px 16px',
          borderRadius: 4,
          background: toast.type === 'error' ? 'var(--status-stopped)' : (toast.type === 'info' ? 'var(--primary)' : 'var(--status-running)'),
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 3-COLUMN INDUSTRIAL WORKSTATION LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 300px',
        gap: '14px',
        minHeight: 'calc(100vh - 110px)'
      }}>
        {/* COLUMN 1: FLEET STATION DIRECTORY */}
        <div className="mes-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
          <div className="mes-card-header" style={{ marginBottom: 8, paddingBottom: 6 }}>
            <span className="mes-card-title">Plant Fleet ({machines.length})</span>
            <button
              onClick={fetchMachines}
              className="btn btn-secondary"
              style={{ padding: '2px 6px', fontSize: 10 }}
              title="Refresh Fleet Telemetry"
            >
              <RefreshCw size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
            {machines.map((m) => {
              const isSelected = selectedMachine?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => selectMachine(m)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--primary-bg)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: 12 }}>
                      {m.name}
                    </span>
                    <StatusBadge status={m.status} size="sm" />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {m.machine_type || 'Industrial Station'} • #{m.id}
                  </div>
                  {m.current_job_title && (
                    <div style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      ▶ {m.current_job_title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: ACTIVE STATION CONSOLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedMachine ? (
            <>
              {/* Selected Machine Identity & Hardware Status Banner */}
              <div className="mes-card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      CONTROL PANEL • NODE #{selectedMachine.id}
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0', letterSpacing: '-0.2px' }}>
                      {selectedMachine.name}
                    </h2>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Type: <strong>{selectedMachine.machine_type || 'Standard Station'}</strong> • Location: <strong>{selectedPlant.name}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Active Elapsed
                      </div>
                      <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: isRunning ? 'var(--status-running)' : 'var(--text-muted)' }}>
                        {isRunning ? timer : '00:00:00'}
                      </div>
                    </div>
                    <StatusBadge status={selectedMachine.status} />
                  </div>
                </div>

                {/* Primary Station Control Buttons (Start / Pause / Stop / Maintenance) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  {selectedMachine.status !== 'Running' ? (
                    <button
                      onClick={() => handleSetStatus('Running')}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ background: 'var(--status-running)', borderColor: 'var(--status-running)' }}
                    >
                      <Play size={13} /> Set Station Running
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSetStatus('Idle')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ color: 'var(--status-idle)' }}
                    >
                      <Pause size={13} /> Pause Station (Idle)
                    </button>
                  )}

                  {selectedMachine.status !== 'Stopped' && (
                    <button
                      onClick={() => handleSetStatus('Stopped')}
                      disabled={actionLoading}
                      className="btn btn-outline-danger"
                    >
                      <Square size={13} /> Stop Station
                    </button>
                  )}

                  {selectedMachine.status !== 'Maintenance' && (
                    <button
                      onClick={() => handleSetStatus('Maintenance')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                    >
                      Mark Maintenance
                    </button>
                  )}
                </div>
              </div>

              {/* Active Work Order Telemetry & Real-Time Output */}
              <div className="mes-card">
                <div className="mes-card-header">
                  <span className="mes-card-title">Active Work Order Machining</span>
                  {runningJob && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      WO #{runningJob.id}
                    </span>
                  )}
                </div>

                {runningJob ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          {runningJob.title}
                        </h3>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Part: <strong style={{ color: 'var(--text-main)' }}>{runningJob.part_name}</strong> • Priority: <strong>{runningJob.priority}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
                          {currentProduced} / {currentTarget}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Target Units
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{
                        height: 10,
                        background: 'var(--bg-subtle)',
                        borderRadius: 3,
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: progressPct >= 100 ? 'var(--status-running)' : 'var(--primary)',
                          transition: 'width 0.25s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>Progress: <strong style={{ color: 'var(--text-main)' }}>{progressPct}%</strong></span>
                        <span>Remaining: <strong style={{ color: 'var(--text-main)' }}>{Math.max(0, currentTarget - currentProduced)}</strong> units</span>
                      </div>
                    </div>

                    {/* Operator Counter Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Manual Part Pulse:
                        </span>
                        <button
                          onClick={() => handleProduceUnit(1)}
                          disabled={actionLoading || currentProduced >= currentTarget}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          +1 Part
                        </button>
                        <button
                          onClick={() => handleProduceUnit(5)}
                          disabled={actionLoading || currentProduced >= currentTarget}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          +5 Parts
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setUnitsInput(String(currentProduced));
                          setShowComplete(true);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        <Check size={12} /> Log Job Completion
                      </button>
                    </div>

                    {/* Simulation Environment Notice */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 3,
                      fontSize: 10,
                      color: 'var(--text-muted)'
                    }}>
                      <span>Notice: Running in Industry 4.0 Telemetry Simulation mode (3.5s pulse cycle).</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={autoSimulate}
                          onChange={(e) => setAutoSimulate(e.target.checked)}
                        />
                        <span>Auto-Pulse</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                      No Work Order Currently Active on Station
                    </div>
                    <p style={{ fontSize: 12, marginBottom: 12 }}>
                      Select a work order from the queue on the right to start machining.
                    </p>
                    <button
                      onClick={() => setShowAddJob(true)}
                      className="btn btn-primary"
                      style={{ fontSize: 11 }}
                    >
                      <Plus size={11} /> Create Work Order
                    </button>
                  </div>
                )}
              </div>

              {/* Station Event Journal */}
              <div className="mes-table-container">
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                  <span className="mes-card-title">Station Event & Sensor Log</span>
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  <table className="mes-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Note / Event</th>
                        <th>Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                            No controller logs recorded yet for this station.
                          </td>
                        </tr>
                      ) : (
                        logs.slice(0, 15).map((log, idx) => (
                          <tr key={idx}>
                            <td className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td>
                              <StatusBadge status={log.status} size="sm" />
                            </td>
                            <td style={{ fontSize: 11 }}>{log.note || 'Normal operation cycle'}</td>
                            <td className="metric" style={{ fontSize: 11 }}>
                              {log.units_produced ? `${log.units_produced} pcs` : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="mes-card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              Select a machine from the left directory to open its terminal console.
            </div>
          )}
        </div>

        {/* COLUMN 3: STATION QUEUE & DISPATCH */}
        <div className="mes-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
          <div className="mes-card-header" style={{ marginBottom: 8, paddingBottom: 6 }}>
            <span className="mes-card-title">Work Order Queue</span>
            <button
              onClick={() => setShowAddJob(v => !v)}
              className="btn btn-primary"
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              {showAddJob ? <X size={11} /> : <Plus size={11} />}
              {showAddJob ? 'Cancel' : 'Add Job'}
            </button>
          </div>

          {/* Quick Add Job Form */}
          {showAddJob && (
            <form onSubmit={handleAddJob} style={{
              padding: 10,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              marginBottom: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                New Station Work Order
              </div>

              <input
                placeholder="Job Title (e.g. Shaft Turning)"
                value={newJob.title}
                onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                required
                style={{ fontSize: 11 }}
              />

              <input
                placeholder="Part Name (e.g. Gear Pin)"
                value={newJob.part_name}
                onChange={e => setNewJob(p => ({ ...p, part_name: e.target.value }))}
                required
                style={{ fontSize: 11 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input
                  type="number"
                  placeholder="Target Qty"
                  min="1"
                  value={newJob.target_qty}
                  onChange={e => setNewJob(p => ({ ...p, target_qty: e.target.value }))}
                  required
                  style={{ fontSize: 11 }}
                />
                <select
                  value={newJob.priority}
                  onChange={e => setNewJob(p => ({ ...p, priority: e.target.value }))}
                  style={{ fontSize: 11 }}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 11, padding: 6 }}
              >
                {actionLoading ? 'Saving...' : 'Add To Queue'}
              </button>
            </form>
          )}

          {/* Queue Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 11 }}>
                No work orders queued for this station.
              </div>
            ) : (
              jobs.map((job) => {
                const isJobRunning = job.status === 'Running';
                const pConf = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.Normal;

                return (
                  <div
                    key={job.id}
                    style={{
                      padding: 10,
                      borderRadius: 4,
                      background: 'var(--bg-surface)',
                      border: `1px solid ${isJobRunning ? 'var(--status-running-border)' : 'var(--border-subtle)'}`,
                      borderLeft: `3px solid ${isJobRunning ? 'var(--status-running)' : 'var(--primary)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-main)' }}>
                        {job.title}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 2,
                        background: pConf.bg,
                        color: pConf.color,
                        textTransform: 'uppercase'
                      }}>
                        {job.priority}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {job.part_name} • <strong>{job.target_qty}</strong> pcs
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={job.status} size="sm" />

                      {job.status !== 'Running' && job.status !== 'Completed' && (
                        <button
                          onClick={() => handleRunJob(job.id)}
                          disabled={actionLoading || isRunning}
                          className="btn btn-primary"
                          style={{ padding: '2px 8px', fontSize: 10 }}
                          title={isRunning ? 'Machine currently running another job' : 'Start Machining'}
                        >
                          <Play size={10} /> Start
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LOG COMPLETION MODAL */}
      {showComplete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'var(--bg-modal-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div className="mes-card" style={{ width: '100%', maxWidth: 380, padding: 20, boxShadow: 'var(--shadow-modal)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 800 }}>Complete Work Order</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Verify total good parts produced to calculate final shift OEE and update inventory.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                Total Verified Good Units Produced *
              </label>
              <input
                type="number"
                min="0"
                value={unitsInput}
                onChange={e => setUnitsInput(e.target.value)}
                autoFocus
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowComplete(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteJob}
                disabled={actionLoading}
                className="btn btn-primary"
              >
                {actionLoading ? 'Logging...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
