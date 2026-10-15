import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  Calendar,
  Plus,
  Play,
  RotateCcw,
  X,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Package,
  Layers,
  ArrowRight,
  Zap,
  Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const API = API_BASE_URL;

const PRIORITY_CONFIG = {
  Urgent: { color: 'var(--status-stopped)', bg: 'var(--status-stopped-bg)' },
  High:   { color: 'var(--status-idle)',    bg: 'var(--status-idle-bg)' },
  Normal: { color: 'var(--primary)',        bg: 'var(--primary-bg)' },
  Low:    { color: 'var(--text-muted)',     bg: 'var(--bg-subtle)' },
};

/**
 * Enterprise Job Scheduling & Dispatch Workspace
 * Built on real backend API endpoints:
 * - /kiosk/machines/{plant_id}
 * - /kiosk/schedule/{plant_id}
 * - /kiosk/jobs/{id}/run
 * - /kiosk/jobs/{id}/schedule
 * - /kiosk/jobs/{id}/unschedule
 * - /kiosk/jobs/{id}/cancel
 * - /kiosk/schedule/dispatch
 */
export default function JobScheduling() {
  const { selectedPlant } = useContext(AuthContext);
  const navigate = useNavigate();

  const [machines, setMachines] = useState([]);
  const [scheduleJobs, setScheduleJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Views & Filters
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'matrix'
  const [machineFilter, setMachineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to query schedule:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 3500);
    return () => clearInterval(interval);
  }, [selectedPlant?.id]);

  if (!selectedPlant) return null;

  const openCreateForMachine = (mId) => {
    const defaultTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16);
    setNewJob({
      machine_id: mId ? String(mId) : (machines[0]?.id ? String(machines[0].id) : ''),
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
      showToast('All highlighted fields are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        title: newJob.title.trim(),
        part_name: newJob.part_name.trim(),
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

      showToast(`Work Order '${newJob.title}' scheduled successfully!`, 'success');
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
      showToast('Select a scheduled start timestamp', 'error');
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
      showToast(`Work Order #${rescheduleJobModal.id} rescheduled!`, 'success');
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
      if (!res.ok) throw new Error(data.detail || 'Failed to unschedule');
      showToast('Work order returned to pending queue', 'info');
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
      if (!res.ok) throw new Error(data.detail || 'Target machine is busy or unavailable');
      showToast(data.message || 'Work order dispatched to machine PLC!', 'success');
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
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel');
      showToast('Work order cancelled', 'info');
      await fetchData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // KPIs derived strictly from backend scheduleJobs data
  const runningJobs = scheduleJobs.filter(j => j.status === 'Running');
  const scheduledJobs = scheduleJobs.filter(j => j.status === 'Scheduled');
  const pendingJobs = scheduleJobs.filter(j => j.status === 'Pending');
  const totalTargetUnits = scheduleJobs.reduce((sum, j) => sum + (j.target_qty || 0), 0);

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
    <AppShell
      pageTitle="Job Scheduling & Dispatch"
      breadcrumbs={['Operations']}
      lastUpdated={lastUpdated}
      telemetryStatus="online"
      onRefresh={fetchData}
    >
      {/* Toast Notification */}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px'
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
              Work Order Scheduling & Line Dispatch
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Schedule, prioritize, and dispatch production jobs to manufacturing stations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => openCreateForMachine('')}
              className="btn btn-primary"
              style={{ fontSize: '12px' }}
            >
              <Plus size={13} />
              Schedule New Job
            </button>
            <button
              onClick={() => navigate('/kiosk')}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              <Zap size={13} />
              Terminal Kiosk
            </button>
          </div>
        </div>

        {/* Operational Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <MetricCard
            title="Active Machining"
            value={runningJobs.length}
            subvalue="Jobs running right now"
            status={runningJobs.length > 0 ? 'positive' : 'neutral'}
            indicator="Live on PLC"
            loading={loading}
          />

          <MetricCard
            title="Scheduled Queue"
            value={scheduledJobs.length}
            subvalue="Queued for future run"
            status="positive"
            indicator="Timed Jobs"
            loading={loading}
          />

          <MetricCard
            title="Pending Backlog"
            value={pendingJobs.length}
            subvalue="Unassigned work orders"
            status={pendingJobs.length > 0 ? 'warning' : 'positive'}
            indicator="Needs Dispatch"
            loading={loading}
          />

          <MetricCard
            title="Planned Production Output"
            value={totalTargetUnits.toLocaleString()}
            subvalue="Total units in active schedule"
            status="neutral"
            indicator="Target Pieces"
            loading={loading}
          />
        </div>

        {/* Filters and View Controls */}
        <div className="mes-card" style={{ padding: '10px 14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 4, padding: 2, border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  Structured Table
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'matrix' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'matrix' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  Machine Workstations
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Filter by job, part, or machine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '28px', width: '220px', fontSize: '11px' }}
                />
                <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              {/* Station Filter */}
              <select
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                style={{ fontSize: '11px', padding: '5px 8px' }}
              >
                <option value="all">All Stations ({machines.length})</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: '11px', padding: '5px 8px' }}
              >
                <option value="all">All Statuses</option>
                <option value="Running">Running</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* VIEW 1: STRUCTURED TABLE */}
        {viewMode === 'list' && (
          <div className="mes-table-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="mes-table">
                <thead>
                  <tr>
                    <th>Work Order ID & Title</th>
                    <th>Part Name</th>
                    <th>Assigned Station</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Output / Target</th>
                    <th>Scheduled Start</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No work orders matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => {
                      const pConf = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.Normal;
                      return (
                        <tr key={job.id}>
                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{job.title}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WO #{job.id}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Package size={11} color="var(--text-muted)" />
                              <span>{job.part_name}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600' }}>{job.machine_name || `Machine #${job.machine_id}`}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: pConf.bg,
                              color: pConf.color,
                              textTransform: 'uppercase'
                            }}>
                              {job.priority}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={job.status} size="sm" />
                          </td>
                          <td className="metric">
                            <strong>{job.units_produced || 0}</strong> / {job.target_qty}
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {job.scheduled_start_at ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} />
                                <span>{new Date(job.scheduled_start_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span>Immediate / Queue</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {job.status !== 'Running' && job.status !== 'Completed' && job.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleDispatchNow(job.id)}
                                  disabled={actionLoading}
                                  className="btn btn-primary"
                                  style={{ padding: '3px 8px', fontSize: 10 }}
                                  title="Dispatch job now"
                                >
                                  <Play size={10} /> Dispatch
                                </button>
                              )}

                              {job.status === 'Scheduled' && (
                                <button
                                  onClick={() => handleUnschedule(job.id)}
                                  disabled={actionLoading}
                                  className="btn btn-secondary"
                                  style={{ padding: '3px 6px', fontSize: 10 }}
                                  title="Move to pending backlog"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              )}

                              {job.status !== 'Completed' && job.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleCancelJob(job.id)}
                                  disabled={actionLoading}
                                  className="btn btn-outline-danger"
                                  style={{ padding: '3px 6px', fontSize: 10 }}
                                  title="Cancel work order"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: MACHINE WORKSTATION CARDS */}
        {viewMode === 'matrix' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px'
          }}>
            {machines.map((machine) => {
              const machineJobs = scheduleJobs.filter(j => j.machine_id === machine.id);
              const runningJob = machineJobs.find(j => j.status === 'Running');
              const scheduledQueue = machineJobs.filter(j => j.status === 'Scheduled');
              const pendingQueue = machineJobs.filter(j => j.status === 'Pending');

              return (
                <div
                  key={machine.id}
                  className="mes-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                        {machine.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {machine.machine_type || 'Industrial Workstation'} • Station #{machine.id}
                      </div>
                    </div>
                    <StatusBadge status={machine.status} size="sm" />
                  </div>

                  {/* Active Job Block */}
                  {runningJob ? (
                    <div style={{
                      padding: '10px',
                      background: 'var(--status-running-bg)',
                      border: '1px solid var(--status-running-border)',
                      borderRadius: 4
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--status-running)', textTransform: 'uppercase' }}>
                          Active Machining
                        </span>
                        <span className="metric" style={{ fontSize: 11, fontWeight: 700 }}>
                          {runningJob.units_produced} / {runningJob.target_qty}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        {runningJob.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Part: {runningJob.part_name}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '14px 10px',
                      textAlign: 'center',
                      background: 'var(--bg-subtle)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 4,
                      color: 'var(--text-muted)',
                      fontSize: 12
                    }}>
                      Station idle — No job actively machining
                    </div>
                  )}

                  {/* Queue Stats & Action */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: 11,
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      <span>Scheduled: <strong>{scheduledQueue.length}</strong></span>
                      <span style={{ margin: '0 6px' }}>•</span>
                      <span>Pending: <strong>{pendingQueue.length}</strong></span>
                    </div>

                    <button
                      onClick={() => openCreateForMachine(machine.id)}
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                    >
                      <Plus size={11} /> Queue Job
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {showCreateModal && (
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
          <div className="mes-card" style={{ width: '100%', maxWidth: 440, padding: 24, boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Schedule Work Order</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  Target Machine Station *
                </label>
                <select
                  value={newJob.machine_id}
                  onChange={e => setNewJob(p => ({ ...p, machine_id: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="">Select Station...</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  Job Title *
                </label>
                <input
                  placeholder="e.g. CNC Spindle Boring Batch #10"
                  value={newJob.title}
                  onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  Workpiece / Part Name *
                </label>
                <input
                  placeholder="e.g. Spindle Pin 45mm"
                  value={newJob.part_name}
                  onChange={e => setNewJob(p => ({ ...p, part_name: e.target.value }))}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    Target Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={newJob.target_qty}
                    onChange={e => setNewJob(p => ({ ...p, target_qty: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    Priority *
                  </label>
                  <select
                    value={newJob.priority}
                    onChange={e => setNewJob(p => ({ ...p, priority: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  Scheduled Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newJob.scheduled_start_at}
                  onChange={e => setNewJob(p => ({ ...p, scheduled_start_at: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Scheduling...' : 'Save & Dispatch Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
