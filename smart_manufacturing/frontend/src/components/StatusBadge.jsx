import React from 'react';

/**
 * StatusBadge Component
 * Standardized DIN EN ISO / ISA-88 compliant machine and operational state indicator.
 * Displays clear text labels alongside high-contrast semantic dots.
 */
export const STATUS_MAP = {
  Running:     { label: 'RUNNING',     cls: 'badge-running',   dot: 'var(--status-running)' },
  Idle:        { label: 'IDLE',        cls: 'badge-idle',      dot: 'var(--status-idle)' },
  Stopped:     { label: 'STOPPED',     cls: 'badge-stopped',   dot: 'var(--status-stopped)' },
  Down:        { label: 'DOWN',        cls: 'badge-stopped',   dot: 'var(--status-stopped)' },
  Maintenance: { label: 'MAINTENANCE', cls: 'badge-idle',      dot: 'var(--status-idle)' },
  Offline:     { label: 'OFFLINE',     cls: 'badge-offline',   dot: 'var(--status-offline)' },
  Scheduled:   { label: 'SCHEDULED',   cls: 'badge-scheduled', dot: 'var(--status-scheduled)' },
  Pending:     { label: 'PENDING',     cls: 'badge-idle',      dot: 'var(--status-idle)' },
  Completed:   { label: 'COMPLETED',   cls: 'badge-running',   dot: 'var(--status-running)' },
  Cancelled:   { label: 'CANCELLED',   cls: 'badge-offline',   dot: 'var(--status-offline)' },
};

export default function StatusBadge({ status, customLabel, size = 'default' }) {
  const norm = (status || 'Offline').trim();
  const config = STATUS_MAP[norm] || STATUS_MAP.Offline;
  const label = customLabel || config.label;

  const style = size === 'sm' ? { fontSize: 10, padding: '1px 5px' } : {};

  return (
    <span className={`badge ${config.cls}`} style={style} title={`Status: ${label}`}>
      <span className="badge-dot" />
      <span>{label}</span>
    </span>
  );
}
