import React from 'react';

/**
 * MetricCard Component
 * Compact, high-information-density KPI panel for control room dashboards.
 */
export default function MetricCard({
  title,
  value,
  subvalue,
  status = 'neutral', // 'positive' | 'warning' | 'negative' | 'neutral'
  indicator,
  loading = false,
  onClick
}) {
  const statusColorMap = {
    positive: 'var(--status-running)',
    warning:  'var(--status-idle)',
    negative: 'var(--status-stopped)',
    neutral:  'var(--text-muted)'
  };

  const statusColor = statusColorMap[status] || statusColorMap.neutral;

  return (
    <div
      className="mes-card"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        padding: '12px 14px',
        borderLeft: `3px solid ${statusColor}`
      }}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        marginBottom: '6px'
      }}>
        {title}
      </div>

      <div style={{
        fontSize: '22px',
        fontWeight: '800',
        color: 'var(--text-main)',
        lineHeight: 1.15
      }} className="font-mono">
        {loading ? <span style={{ color: 'var(--text-light)', fontSize: '18px' }}>•••</span> : value}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '6px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span>{subvalue || '—'}</span>
        {indicator && (
          <span style={{ fontWeight: '600', color: statusColor }}>
            {indicator}
          </span>
        )}
      </div>
    </div>
  );
}
