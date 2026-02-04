'use client';

import CheckItem, { CheckStatus } from './CheckItem';

interface Check {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface CategorySectionProps {
  id: string;
  name: string;
  description: string;
  weight: number;
  checks: Check[];
  checkStatuses: Record<string, CheckStatus>;
  onCheckStatusChange: (checkId: string, status: CheckStatus) => void;
  isExpanded: boolean;
  onToggle: () => void;
  score: number | null;
}

export default function CategorySection({
  id,
  name,
  description,
  weight,
  checks,
  checkStatuses,
  onCheckStatusChange,
  isExpanded,
  onToggle,
  score,
}: CategorySectionProps) {
  const completedChecks = checks.filter((check) => checkStatuses[check.id] !== null && checkStatuses[check.id] !== undefined).length;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '12px',
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isExpanded ? '#f9fafb' : 'white',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{name}</h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
              }}
            >
              {weight}% weight
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {completedChecks}/{checks.length} checks
            </div>
            {score !== null && (
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626',
                }}
              >
                {score}%
              </div>
            )}
          </div>
          <span style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div>
          {checks.map((check) => (
            <CheckItem
              key={check.id}
              id={check.id}
              name={check.name}
              description={check.description}
              importance={check.importance}
              status={checkStatuses[check.id] || null}
              onStatusChange={onCheckStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
