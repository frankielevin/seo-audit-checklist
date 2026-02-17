'use client';

import { useState } from 'react';

export type CheckStatus = 'pass' | 'fail' | null;

interface CheckItemProps {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: CheckStatus;
  note: string;
  link: string;
  onStatusChange: (id: string, status: CheckStatus) => void;
  onNoteChange: (id: string, note: string) => void;
  onLinkChange: (id: string, link: string) => void;
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
  note,
  link,
  onStatusChange,
  onNoteChange,
  onLinkChange,
}: CheckItemProps) {
  const config = importanceConfig[importance];
  const [expanded, setExpanded] = useState(false);
  const hasAnnotations = note.length > 0 || link.length > 0;
  const showFields = status !== null && (expanded || hasAnnotations);

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
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
          {/* Add notes/link toggle */}
          {status !== null && (
            <button
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Hide notes & links' : 'Add notes & links'}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                border: `1.5px solid ${hasAnnotations ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: hasAnnotations ? 'var(--primary-light)' : 'var(--card-bg)',
                color: hasAnnotations ? 'var(--primary)' : 'var(--muted)',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (!hasAnnotations) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!hasAnnotations) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--muted)';
                }
              }}
            >
              {hasAnnotations ? '📝' : '＋'}
            </button>
          )}
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

      {/* Expandable notes & links section */}
      {showFields && (
        <div
          style={{
            marginTop: '0.875rem',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {/* Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.3rem',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(id, e.target.value)}
              placeholder="Add any notes or observations..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--foreground)',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Links/Docs */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.3rem',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Links / Docs
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="url"
                value={link}
                onChange={(e) => onLinkChange(id, e.target.value)}
                placeholder="https://docs.google.com/... or any URL"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              {link && (
                <a
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                >
                  ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
