import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';

/**
 * Enterprise Production Machine Diagnostics & Insight Screen
 * Includes:
 * - Machine identity, category, and operating state
 * - 7-day average efficiency, today's output vs target, and cumulative production
 * - Daily production logs table with met-target badges and efficiency rates
 * - Direct transition to operator terminal
 */
export default function MachineInsight() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const { selectedPlant } = useContext(AuthContext);

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchMachineDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/plants/machines/${machineId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Machine not found in plant registry.');
        }
        throw new Error('Failed to load machine telemetry data.');
      }
      const data = await res.json();
      setMachine(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while loading machine telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (machineId) {
      fetchMachineDetails();
    }
  }, [machineId]);

  if (!selectedPlant) {
    return null;
  }

  const handleBack = () => {
    navigate('/dashboard', { state: { activeTab: 'insights' } });
  };

  return (
    <AppShell
      pageTitle={machine ? `${machine.name} Diagnostics` : 'Machine Diagnostics'}
      breadcrumbs={['Machines', machine ? machine.name : `#${machineId}`]}
      lastUpdated={lastUpdated}
      telemetryStatus="online"
      onRefresh={fetchMachineDetails}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Back and Direct Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px'
        }}>
          <button
            onClick={handleBack}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <ArrowLeft size={13} />
            Back to Machine Fleet
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate('/kiosk')}
              className="btn btn-primary"
              style={{ fontSize: '12px' }}
            >
              <Zap size={13} />
              Open In Machine Terminal
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--status-stopped-bg)',
            border: '1px solid var(--status-stopped-border)',
            color: 'var(--status-stopped)',
            padding: '10px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 12px', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <div style={{ fontSize: '12px', fontWeight: '600' }}>Querying Station Diagnostics...</div>
          </div>
        ) : machine ? (
          <>
            {/* Top Identity Banner */}
            <div className="mes-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  EQUIPMENT IDENTIFIER: NODE-M{String(machine.id).padStart(3, '0')}
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: '2px 0 0 0', letterSpacing: '-0.2px' }}>
                  {machine.name}
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Classification: <strong>{machine.machine_type || 'Industrial Machining Workstation'}</strong> • Facility: <strong>{machine.plant_name}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={machine.status} />
              </div>
            </div>

            {/* KPI Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              <MetricCard
                title="7-Day Rolling Efficiency"
                value={`${machine.avg_efficiency_7d || 0}%`}
                subvalue={(machine.avg_efficiency_7d || 0) >= 85 ? 'Operating at optimal speed' : 'Below nominal line speed'}
                status={(machine.avg_efficiency_7d || 0) >= 85 ? 'positive' : 'warning'}
                indicator={(machine.avg_efficiency_7d || 0) >= 85 ? 'Optimal' : 'Needs Check'}
              />

              <MetricCard
                title="Current Shift Output"
                value={machine.latest_production ? `${machine.latest_production.produced || 0} / ${machine.latest_production.target || 0}` : '0 / 0'}
                subvalue={machine.latest_production ? `${machine.latest_production.efficiency || 0}% target efficiency` : 'No work order active today'}
                status="positive"
                indicator="Units Logged"
              />

              <MetricCard
                title="Cumulative 7-Day Output"
                value={machine.total_produced_7d !== undefined ? machine.total_produced_7d.toLocaleString() : '—'}
                subvalue="Verified parts produced"
                status="neutral"
                indicator="Total Quantity"
              />

              <MetricCard
                title="Controller State"
                value={machine.status ? machine.status.toUpperCase() : 'UNKNOWN'}
                subvalue={`SCADA Bus Node #${machine.id}`}
                status={machine.status === 'Running' ? 'positive' : (machine.status === 'Idle' ? 'warning' : 'negative')}
                indicator="PLC Polling Active"
              />
            </div>

            {/* Daily Production Journal Table */}
            <div className="mes-table-container">
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className="mes-card-title">Daily Shift Production Journal</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    (Historical output and efficiency metrics)
                  </span>
                </div>
              </div>

              {!machine.history || machine.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No historical shift records currently stored for this machine node.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="mes-table">
                    <thead>
                      <tr>
                        <th>Date & Shift</th>
                        <th>Actual Production</th>
                        <th>Scheduled Target</th>
                        <th>Efficiency</th>
                        <th>Target Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machine.history.map((day, idx) => {
                        const metTarget = day.produced >= day.target;
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                              {day.day_name}, {day.date}
                            </td>
                            <td className="metric">
                              <strong>{day.produced.toLocaleString()}</strong> units
                            </td>
                            <td className="metric" style={{ color: 'var(--text-muted)' }}>
                              {day.target.toLocaleString()} units
                            </td>
                            <td className="metric" style={{
                              fontWeight: '700',
                              color: day.efficiency >= 85 ? 'var(--status-running)' : 'var(--status-idle)'
                            }}>
                              {day.efficiency}%
                            </td>
                            <td>
                              <span className={`badge ${metTarget ? 'badge-running' : 'badge-idle'}`} style={{ fontSize: '10px' }}>
                                {metTarget ? 'TARGET MET' : 'BELOW TARGET'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
