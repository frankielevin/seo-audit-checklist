'use client';

export type CheckStatus = 'pass' | 'fail' | null;

interface CheckItemProps {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: CheckStatus;
  onStatusChange: (id: string, status: CheckStatus) => void;
}

const importanceConfig = {
  critical: { label: 'Critical', bg: 'var(--error)', bgLight: 'var(--error-light)' },
  high: { label: 'High', bg: 'var(--warning)', bgLight: 'var(--warning-light)' },
  medium: { label: 'Medium', bg: 'var(--primary)', bgLight: 'var(--primary-light)' },
  low: { label: 'Low', bg: 'var(--success)', bgLight: 'var(--success-light)' },
};

export default function CheckItem({
  id,
  name,
  description,
  importance,
  status,
  onStatusChange,
}: CheckItemProps) {
  const config = importanceConfig[importance];

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: status ? 'var(--background-secondary)' : 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        {/* Left side - Check info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.375rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--foreground)',
              }}
            >
              {name}
            </span>

            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '100px',
                backgroundColor: config.bgLight,
                color: config.bg,
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
              }}
            >
              {config.label}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>

        {/* Right side - Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={() => onStatusChange(id, status === 'pass' ? null : 'pass')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '2px solid',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: status === 'pass' ? 'var(--success)' : 'var(--card-bg)',
              color: status === 'pass' ? 'white' : 'var(--success)',
              borderColor: 'var(--success)',
            }}
            onMouseEnter={(e) => {
              if (status !== 'pass') {
                e.currentTarget.style.backgroundColor = 'var(--success-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (status !== 'pass') {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }
            }}
          >
            Pass
          </button>
          <button
            onClick={() => onStatusChange(id, status === 'fail' ? null : 'fail')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '2px solid',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: status === 'fail' ? 'var(--error)' : 'var(--card-bg)',
              color: status === 'fail' ? 'white' : 'var(--error)',
              borderColor: 'var(--error)',
            }}
            onMouseEnter={(e) => {
              if (status !== 'fail') {
                e.currentTarget.style.backgroundColor = 'var(--error-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (status !== 'fail') {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
              }
            }}
          >
            Fail
          </button>
        </div>
      </div>
    </div>
  );
}
