'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import CheckItem, { CheckStatus } from '@/components/CheckItem';
import { calculateCategoryScore, calculateOverallScore, getScoreRating } from '@/lib/scoring';
import {
  AUTHORITY_CHECKS,
  ON_PAGE_CHECKS,
  TECHNICAL_CHECKS,
  EEAT_CHECKS,
  SOCIAL_SEARCH_CHECKS,
  AI_SEARCH_CHECKS,
  PERFORMANCE_CHECKS,
  ECOMMERCE_COLLECTION_CHECKS,
  ECOMMERCE_PRODUCT_CHECKS,
  LOCAL_GBP_CHECKS,
  LOCAL_LANDING_CHECKS,
  INTERNATIONAL_CHECKS,
  BrandType,
} from '@/types/audit';

const categoryIcons: Record<string, string> = {
  'authority': '🏆',
  'on-page': '📄',
  'technical': '⚙️',
  'eeat': '✓',
  'ai-search': '🤖',
  'social-search': '📱',
  'performance': '⚡',
  'ecommerce-collection': '🛍️',
  'ecommerce-product': '📦',
  'local-gbp': '📍',
  'local-landing': '🏪',
  'international': '🌍',
};

// Base categories for all brand types
const BASE_CATEGORIES = [
  { id: 'authority', name: 'Authority', description: 'Backlink profile, domain strength, brand mentions, and trust signals', weight: 20, checks: AUTHORITY_CHECKS },
  { id: 'on-page', name: 'On-Page', description: 'Title tags, meta descriptions, headings, keyword optimisation, and content structure', weight: 15, checks: ON_PAGE_CHECKS },
  { id: 'technical', name: 'Technical', description: 'Crawlability, indexability, site architecture, and technical health', weight: 15, checks: TECHNICAL_CHECKS },
  { id: 'eeat', name: 'EEAT', description: 'Experience, Expertise, Authoritativeness, and Trustworthiness signals', weight: 15, checks: EEAT_CHECKS },
  { id: 'social-search', name: 'Social Search', description: 'Discoverability on TikTok, YouTube, Instagram, and social platforms', weight: 15, checks: SOCIAL_SEARCH_CHECKS },
  { id: 'ai-search', name: 'AI Search', description: 'Optimisation for AI Overviews, SGE, ChatGPT, Perplexity, and LLM visibility', weight: 10, checks: AI_SEARCH_CHECKS },
  { id: 'performance', name: 'Performance', description: 'Page speed, Core Web Vitals (LCP, INP, CLS), and loading optimisation', weight: 10, checks: PERFORMANCE_CHECKS },
];

// Brand-type specific additional categories
const ECOMMERCE_CATEGORIES = [
  { id: 'ecommerce-collection', name: 'Collection Pages', description: 'Product carousels, filters, FAQs, and collection page optimisation', weight: 10, checks: ECOMMERCE_COLLECTION_CHECKS },
  { id: 'ecommerce-product', name: 'Product Pages', description: 'Pricing, stock, schema, reviews, and product page optimisation', weight: 10, checks: ECOMMERCE_PRODUCT_CHECKS },
];

const LOCAL_CATEGORIES = [
  { id: 'local-gbp', name: 'Google Business Profile', description: 'GBP verification, NAP details, categories, photos, and reviews', weight: 10, checks: LOCAL_GBP_CHECKS },
  { id: 'local-landing', name: 'Landing Pages', description: 'Local SEO, NAP integration, maps, and location page optimisation', weight: 10, checks: LOCAL_LANDING_CHECKS },
];

const INTERNATIONAL_CATEGORIES = [
  { id: 'international', name: 'International', description: 'Hreflang implementation, content differentiation, and multi-region setup', weight: 10, checks: INTERNATIONAL_CHECKS },
];

// Function to get categories based on brand type
// Brand-specific categories come first, then base categories
function getCategoriesForBrandType(brandType: BrandType) {
  switch (brandType) {
    case 'ecommerce':
      return [...ECOMMERCE_CATEGORIES, ...BASE_CATEGORIES];
    case 'local':
      return [...LOCAL_CATEGORIES, ...BASE_CATEGORIES];
    case 'international':
      return [...INTERNATIONAL_CATEGORIES, ...BASE_CATEGORIES];
    case 'general':
    default:
      return BASE_CATEGORIES;
  }
}

export default function AuditPage() {
  return (
    <Suspense fallback={<AuditLoadingFallback />}>
      <AuditContent />
    </Suspense>
  );
}

function AuditLoadingFallback() {
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p style={{ color: 'var(--muted)' }}>Loading audit...</p>
    </main>
  );
}

function AuditContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const brandType = (searchParams.get('type') as BrandType) || 'general';
  const [currentStep, setCurrentStep] = useState(0);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});

  // Get categories based on brand type
  const CATEGORIES = useMemo(() => getCategoriesForBrandType(brandType), [brandType]);

  const isResultsScreen = currentStep >= CATEGORIES.length;
  const currentCategory = !isResultsScreen ? CATEGORIES[currentStep] : null;

  const getChecksByPriority = () => {
    const priorities = {
      critical: [] as { category: string; name: string; description: string; status: string }[],
      high: [] as { category: string; name: string; description: string; status: string }[],
      medium: [] as { category: string; name: string; description: string; status: string }[],
      low: [] as { category: string; name: string; description: string; status: string }[],
    };

    for (const category of CATEGORIES) {
      for (const check of category.checks) {
        const status = checkStatuses[check.id];
        const statusText = status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Not Answered';
        priorities[check.importance].push({
          category: category.name,
          name: check.name,
          description: check.description,
          status: statusText,
        });
      }
    }

    return priorities;
  };

  const exportToExcel = () => {
    const priorities = getChecksByPriority();
    const workbook = XLSX.utils.book_new();
    const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';

    // Create a sheet for each priority level
    const priorityOrder: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorityOrder) {
      const data = priorities[priority];
      if (data.length > 0) {
        const sheetData = [
          ['Category', 'Check Name', 'Description', 'Status'],
          ...data.map(row => [row.category, row.name, row.description, row.status]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        worksheet['!cols'] = [
          { wch: 25 }, // Category
          { wch: 30 }, // Check Name
          { wch: 60 }, // Description
          { wch: 15 }, // Status
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, priority.charAt(0).toUpperCase() + priority.slice(1));
      }
    }

    // Download the file
    XLSX.writeFile(workbook, `seo-audit-${urlName}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';

    // Create a flat CSV with all checks
    const rows: string[][] = [['Priority', 'Category', 'Check Name', 'Description', 'Status']];

    for (const category of CATEGORIES) {
      for (const check of category.checks) {
        const status = checkStatuses[check.id];
        const statusText = status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Not Answered';
        rows.push([
          check.importance.charAt(0).toUpperCase() + check.importance.slice(1),
          category.name,
          check.name,
          check.description,
          statusText,
        ]);
      }
    }

    const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seo-audit-${urlName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleCheckStatusChange = (checkId: string, status: CheckStatus) => {
    setCheckStatuses((prev) => ({ ...prev, [checkId]: status }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const categoryScores = useMemo(() => {
    const scores: Record<string, number | null> = {};
    for (const category of CATEGORIES) {
      scores[category.id] = calculateCategoryScore(category.checks, checkStatuses);
    }
    return scores;
  }, [CATEGORIES, checkStatuses]);

  const overallScore = useMemo(() => {
    return calculateOverallScore(CATEGORIES, checkStatuses);
  }, [CATEGORIES, checkStatuses]);

  if (!url) {
    return (
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No URL Provided</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Please enter a website URL to start the audit.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
          }}
        >
          Go to Homepage
        </a>
      </main>
    );
  }

  // Results screen
  if (isResultsScreen) {
    const rating = overallScore !== null ? getScoreRating(overallScore) : null;
    const passedChecks = Object.values(checkStatuses).filter((s) => s === 'pass').length;
    const failedChecks = Object.values(checkStatuses).filter((s) => s === 'fail').length;
    const totalAnswered = passedChecks + failedChecks;

    // Calculate failed checks by priority
    const failedByPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const category of CATEGORIES) {
      for (const check of category.checks) {
        if (checkStatuses[check.id] === 'fail') {
          failedByPriority[check.importance]++;
        }
      }
    }
    const totalFailed = failedByPriority.critical + failedByPriority.high + failedByPriority.medium + failedByPriority.low;

    // Pie chart data
    const priorityConfig = [
      { key: 'critical', label: 'Critical', color: 'var(--error)', count: failedByPriority.critical },
      { key: 'high', label: 'High', color: 'var(--warning)', count: failedByPriority.high },
      { key: 'medium', label: 'Medium', color: 'var(--primary)', count: failedByPriority.medium },
      { key: 'low', label: 'Low', color: 'var(--success)', count: failedByPriority.low },
    ];

    // Calculate pie chart segments
    const pieSegments: { color: string; startAngle: number; endAngle: number; percentage: number }[] = [];
    let currentAngle = -90; // Start from top
    for (const priority of priorityConfig) {
      if (priority.count > 0 && totalFailed > 0) {
        const percentage = (priority.count / totalFailed) * 100;
        const angle = (percentage / 100) * 360;
        pieSegments.push({
          color: priority.color,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
          percentage,
        });
        currentAngle += angle;
      }
    }

    // Helper function to create pie chart path
    const createPieSlice = (startAngle: number, endAngle: number, radius: number, cx: number, cy: number) => {
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: '100px',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '1rem',
            }}
          >
            <span>✓</span>
            <span>Audit Complete</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Your Results
          </h1>
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--primary)',
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {url}
          </a>
        </div>

        {/* Score Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--card-bg) 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {overallScore !== null && rating ? (
            <>
              {/* Circular Score Display */}
              <div
                style={{
                  position: 'relative',
                  width: '160px',
                  height: '160px',
                  margin: '0 auto 1.5rem',
                }}
              >
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={rating.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallScore / 100) * 440} 440`}
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: rating.color }}>
                    {overallScore}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>out of 100</div>
                </div>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: rating.bgColor,
                  color: rating.color,
                  borderRadius: '100px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {rating.label}
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              No score available - complete some checks to see your score
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { label: 'Checks Passed', value: passedChecks, color: 'var(--success)' },
            { label: 'Checks Failed', value: failedChecks, color: 'var(--error)' },
            { label: 'Total Answered', value: totalAnswered, color: 'var(--primary)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Category Breakdown
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {CATEGORIES.map((category) => {
            const score = categoryScores[category.id];
            const scoreRating = score !== null ? getScoreRating(score) : null;

            return (
              <div
                key={category.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--background-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  {categoryIcons[category.id]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>{category.name}</div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'var(--border)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: score !== null ? `${score}%` : '0%',
                        backgroundColor: scoreRating?.color || 'var(--border)',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease-out',
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '50px' }}>
                  {score !== null ? (
                    <span style={{ fontWeight: 700, color: scoreRating?.color }}>{score}%</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Issue Distribution by Priority */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Issue Distribution by Priority
        </h2>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '2rem',
          }}
        >
          {totalFailed > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Pie Chart */}
              <div style={{ flexShrink: 0 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {pieSegments.length === 1 ? (
                    <circle cx="80" cy="80" r="70" fill={pieSegments[0].color} />
                  ) : (
                    pieSegments.map((segment, index) => (
                      <path
                        key={index}
                        d={createPieSlice(segment.startAngle, segment.endAngle, 70, 80, 80)}
                        fill={segment.color}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    ))
                  )}
                  {/* Center circle for donut effect */}
                  <circle cx="80" cy="80" r="40" fill="var(--card-bg)" />
                  <text
                    x="80"
                    y="75"
                    textAnchor="middle"
                    style={{ fontSize: '1.5rem', fontWeight: 700, fill: 'var(--foreground)' }}
                  >
                    {totalFailed}
                  </text>
                  <text
                    x="80"
                    y="95"
                    textAnchor="middle"
                    style={{ fontSize: '0.7rem', fill: 'var(--muted)' }}
                  >
                    issues
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                {priorityConfig.map((priority) => {
                  const percentage = totalFailed > 0 ? ((priority.count / totalFailed) * 100).toFixed(0) : 0;
                  return (
                    <div
                      key={priority.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: priority.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                        {priority.label}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                        {priority.count} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ margin: 0 }}>No issues found! All checks passed.</p>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Export Results
        </h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={exportToExcel}
            style={{
              flex: 1,
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Export for Excel / Google Sheets</span>
          </button>
          <button
            onClick={exportToCSV}
            style={{
              flex: 1,
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Export as CSV</span>
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--card-bg)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            ← Review Answers
          </button>
          <a
            href="/"
            style={{
              flex: 1,
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
            }}
          >
            Start New Audit
          </a>
        </div>
      </main>
    );
  }

  // Category audit screen
  const completedInCategory = currentCategory!.checks.filter(
    (check) => checkStatuses[check.id] !== null && checkStatuses[check.id] !== undefined
  ).length;
  const totalChecksInCategory = currentCategory!.checks.length;
  const allChecksCompleted = completedInCategory === totalChecksInCategory;
  const progressPercentage = (completedInCategory / totalChecksInCategory) * 100;

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Progress Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--background)',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          zIndex: 10,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <a
            href="/"
            style={{
              color: 'var(--muted)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ← Exit
          </a>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Step {currentStep + 1} of {CATEGORIES.length}
          </span>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {CATEGORIES.map((cat, index) => (
            <div
              key={cat.id}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor:
                  index < currentStep
                    ? 'var(--success)'
                    : index === currentStep
                    ? 'var(--primary)'
                    : 'var(--border)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Category Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
            }}
          >
            {categoryIcons[currentCategory!.id]}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              {currentCategory!.name}
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
              {currentCategory!.description}
            </p>
          </div>
        </div>

        {/* Category progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: '8px',
                backgroundColor: 'var(--border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  backgroundColor: progressPercentage === 100 ? 'var(--success)' : 'var(--primary)',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
            {completedInCategory}/{currentCategory!.checks.length}
          </span>
        </div>
      </div>

      {/* Checks List */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {currentCategory!.checks.map((check) => (
          <CheckItem
            key={check.id}
            id={check.id}
            name={check.name}
            description={check.description}
            importance={check.importance}
            status={checkStatuses[check.id] || null}
            onStatusChange={handleCheckStatusChange}
          />
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            style={{
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: 'var(--card-bg)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            ← Back
          </button>
        ) : null}
        <button
          onClick={allChecksCompleted ? handleNext : undefined}
          disabled={!allChecksCompleted}
          style={{
            flex: 1,
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: allChecksCompleted ? 'var(--primary)' : 'var(--border)',
            color: allChecksCompleted ? 'white' : 'var(--muted)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: allChecksCompleted ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (allChecksCompleted) {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (allChecksCompleted) {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {!allChecksCompleted
            ? `Complete all checks (${completedInCategory}/${totalChecksInCategory})`
            : currentStep === CATEGORIES.length - 1
            ? 'Get Score →'
            : `Next: ${CATEGORIES[currentStep + 1].name} →`}
        </button>
      </div>
    </main>
  );
}
