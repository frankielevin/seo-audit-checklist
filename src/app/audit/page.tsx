'use client';

import { useState, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

// Function to get categories based on brand types (supports multiple)
// Brand-specific categories come first, then base categories
function getCategoriesForBrandTypes(brandTypes: BrandType[]) {
  const brandSpecific = [];
  if (brandTypes.includes('ecommerce')) {
    brandSpecific.push(...ECOMMERCE_CATEGORIES);
  }
  if (brandTypes.includes('local')) {
    brandSpecific.push(...LOCAL_CATEGORIES);
  }
  if (brandTypes.includes('international')) {
    brandSpecific.push(...INTERNATIONAL_CATEGORIES);
  }
  return [...brandSpecific, ...BASE_CATEGORIES];
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
  const brandTypes = (searchParams.get('type') || 'general').split(',') as BrandType[];
  const [currentStep, setCurrentStep] = useState(0);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const [checkNotes, setCheckNotes] = useState<Record<string, string>>({});
  const [checkLinks, setCheckLinks] = useState<Record<string, string>>({});
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [detailedGroupBy, setDetailedGroupBy] = useState<'category' | 'priority'>('category');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fail'>('fail');
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportSummaryRef = useRef<HTMLDivElement>(null);
  const reportDetailedRef = useRef<HTMLDivElement>(null);

  // Get categories based on brand type
  const CATEGORIES = useMemo(() => getCategoriesForBrandTypes(brandTypes), [brandTypes.join(',')]);

  const isResultsScreen = currentStep >= CATEGORIES.length;
  const currentCategory = !isResultsScreen ? CATEGORIES[currentStep] : null;

  const getChecksByPriority = () => {
    const priorities = {
      critical: [] as { category: string; priority: string; name: string; description: string; status: string; notes: string; link: string }[],
      high: [] as { category: string; priority: string; name: string; description: string; status: string; notes: string; link: string }[],
      medium: [] as { category: string; priority: string; name: string; description: string; status: string; notes: string; link: string }[],
      low: [] as { category: string; priority: string; name: string; description: string; status: string; notes: string; link: string }[],
    };

    for (const category of CATEGORIES) {
      for (const check of category.checks) {
        const status = checkStatuses[check.id];
        const statusText = status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Not Answered';
        priorities[check.importance].push({
          category: category.name,
          priority: check.importance.charAt(0).toUpperCase() + check.importance.slice(1),
          name: check.name,
          description: check.description,
          status: statusText,
          notes: checkNotes[check.id] || '',
          link: checkLinks[check.id] || '',
        });
      }
    }

    return priorities;
  };

  // Helper to make Links/Docs cells clickable hyperlinks in a worksheet
  const addHyperlinks = (worksheet: XLSX.WorkSheet, dataLength: number, linkColIndex: number) => {
    const colLetter = String.fromCharCode(65 + linkColIndex); // e.g. 'G' for index 6
    for (let r = 1; r <= dataLength; r++) {
      const cellRef = `${colLetter}${r + 1}`; // +1 for header row
      const cell = worksheet[cellRef];
      if (cell && cell.v && typeof cell.v === 'string' && cell.v.trim()) {
        const linkUrl = cell.v.startsWith('http') ? cell.v : `https://${cell.v}`;
        cell.l = { Target: linkUrl, Tooltip: cell.v };
      }
    }
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
          ['Category', 'Priority', 'Check Name', 'Description', 'Status', 'Notes', 'Links/Docs'],
          ...data.map(row => [row.category, row.priority, row.name, row.description, row.status, row.notes, row.link]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        worksheet['!cols'] = [
          { wch: 25 }, // Category
          { wch: 12 }, // Priority
          { wch: 30 }, // Check Name
          { wch: 60 }, // Description
          { wch: 15 }, // Status
          { wch: 30 }, // Notes
          { wch: 30 }, // Links/Docs
        ];

        // Make Links/Docs clickable
        addHyperlinks(worksheet, data.length, 6);

        XLSX.utils.book_append_sheet(workbook, worksheet, priority.charAt(0).toUpperCase() + priority.slice(1));
      }
    }

    // Download the file
    XLSX.writeFile(workbook, `seo-audit-${urlName}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';

    // Create a flat CSV with all checks
    const rows: string[][] = [['Category', 'Priority', 'Check Name', 'Description', 'Status', 'Notes', 'Links/Docs']];

    for (const category of CATEGORIES) {
      for (const check of category.checks) {
        const status = checkStatuses[check.id];
        const statusText = status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Not Answered';
        rows.push([
          category.name,
          check.importance.charAt(0).toUpperCase() + check.importance.slice(1),
          check.name,
          check.description,
          statusText,
          checkNotes[check.id] || '',
          checkLinks[check.id] || '',
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

  const handleNoteChange = (checkId: string, note: string) => {
    setCheckNotes((prev) => ({ ...prev, [checkId]: note }));
  };

  const handleLinkChange = (checkId: string, link: string) => {
    setCheckLinks((prev) => ({ ...prev, [checkId]: link }));
  };

  const downloadReport = async () => {
    if (!reportSummaryRef.current || !reportDetailedRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const gap = 4; // mm gap between blocks

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SEO Audit Report', margin, 20);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(url, margin, 28);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 34);
      pdf.setTextColor(0);

      let currentY = 42;

      // Helper: capture a single element and add it to the PDF as a whole block
      // If it won't fit on the current page, start a new page first
      const addBlockToPdf = async (element: HTMLElement) => {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const aspect = canvas.height / canvas.width;
        const imgHeight = contentWidth * aspect;

        const availableHeight = pageHeight - currentY - margin;

        // If block doesn't fit and we're not at the top of a page, start a new page
        if (imgHeight > availableHeight && currentY > margin + 10) {
          pdf.addPage();
          currentY = margin;
        }

        // If the block is taller than an entire page, we must scale it down to fit
        const maxPageHeight = pageHeight - margin * 2;
        if (imgHeight > maxPageHeight) {
          const scaleFactor = maxPageHeight / imgHeight;
          const scaledWidth = contentWidth * scaleFactor;
          const scaledHeight = maxPageHeight;
          const xOffset = margin + (contentWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'PNG', xOffset, currentY, scaledWidth, scaledHeight);
          currentY += scaledHeight + gap;
        } else {
          pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
          currentY += imgHeight + gap;
        }
      };

      // Capture each direct child of the summary section as a separate block
      const summaryChildren = Array.from(reportSummaryRef.current.children) as HTMLElement[];
      for (const child of summaryChildren) {
        await addBlockToPdf(child);
      }

      // Add detailed section header
      const headerAvailable = pageHeight - currentY - margin;
      if (headerAvailable < 20) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detailed Results — Failed Checks', margin, currentY + 5);
      currentY += 12;

      // Capture each direct child of the detailed section as a separate block
      const detailedChildren = Array.from(reportDetailedRef.current.children) as HTMLElement[];
      for (const child of detailedChildren) {
        await addBlockToPdf(child);
      }

      pdf.save(`seo-audit-report-${urlName}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
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

    // Detailed results view - grouped data
    const importanceBadgeConfig = {
      critical: { label: 'Critical', color: 'var(--error)', bg: 'var(--error-light)' },
      high: { label: 'High', color: 'var(--warning)', bg: 'var(--warning-light)' },
      medium: { label: 'Medium', color: 'var(--primary)', bg: 'var(--primary-light)' },
      low: { label: 'Low', color: 'var(--success)', bg: 'var(--success-light)' },
    };

    const priorityIcons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🔵',
      low: '🟢',
    };

    type DetailedCheck = {
      id: string;
      name: string;
      description: string;
      importance: 'critical' | 'high' | 'medium' | 'low';
      status: CheckStatus;
      categoryName: string;
      note: string;
      link: string;
    };

    type DetailedGroup = {
      key: string;
      label: string;
      icon?: string;
      color?: string;
      score?: number | null;
      checks: DetailedCheck[];
      passCount: number;
      failCount: number;
      totalCount: number;
    };

    const detailedGroups: DetailedGroup[] = (() => {
      if (detailedGroupBy === 'category') {
        return CATEGORIES.map(category => {
          const allChecks = category.checks.map(check => ({
            ...check,
            status: checkStatuses[check.id] ?? null,
            categoryName: category.name,
            note: checkNotes[check.id] || '',
            link: checkLinks[check.id] || '',
          }));
          const filtered = statusFilter === 'fail'
            ? allChecks.filter(c => c.status === 'fail')
            : allChecks;
          return {
            key: category.id,
            label: category.name,
            icon: categoryIcons[category.id],
            score: categoryScores[category.id],
            checks: filtered,
            passCount: allChecks.filter(c => c.status === 'pass').length,
            failCount: allChecks.filter(c => c.status === 'fail').length,
            totalCount: allChecks.length,
          };
        }).filter(group => group.checks.length > 0);
      } else {
        const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;
        const priorityLabels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
        const priorityColors = {
          critical: 'var(--error)',
          high: 'var(--warning)',
          medium: 'var(--primary)',
          low: 'var(--success)',
        };
        return PRIORITY_ORDER.map(priority => {
          const allChecks = CATEGORIES.flatMap(category =>
            category.checks
              .filter(check => check.importance === priority)
              .map(check => ({
                ...check,
                status: checkStatuses[check.id] ?? null,
                categoryName: category.name,
                note: checkNotes[check.id] || '',
                link: checkLinks[check.id] || '',
              }))
          );
          const filtered = statusFilter === 'fail'
            ? allChecks.filter(c => c.status === 'fail')
            : allChecks;
          return {
            key: priority,
            label: priorityLabels[priority],
            icon: priorityIcons[priority],
            color: priorityColors[priority],
            checks: filtered,
            passCount: allChecks.filter(c => c.status === 'pass').length,
            failCount: allChecks.filter(c => c.status === 'fail').length,
            totalCount: allChecks.length,
          };
        }).filter(group => group.checks.length > 0);
      }
    })();

    const renderCheckRow = (check: DetailedCheck, showCategory: boolean) => {
      const badge = importanceBadgeConfig[check.importance];
      const isFail = check.status === 'fail';
      const isPass = check.status === 'pass';

      return (
        <div
          key={check.id}
          style={{
            padding: '0.875rem 1.25rem 0.875rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: isFail ? 'var(--error-light)' : 'var(--card-bg)',
            borderLeft: `3px solid ${isFail ? 'var(--error)' : isPass ? 'var(--success)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: isFail ? 'var(--error)' : isPass ? 'var(--success)' : 'var(--border)',
              color: (isFail || isPass) ? 'white' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.75rem',
              marginTop: '0.125rem',
            }}
          >
            {isFail ? '✗' : isPass ? '✓' : '—'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{check.name}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.4rem',
                  borderRadius: '100px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                }}
              >
                {badge.label}
              </span>
              {showCategory && (
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                  {check.categoryName}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              {check.description}
            </p>
            {(check.note || check.link) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {check.note && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0, marginTop: '0.1rem' }}>Note:</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: 1.4 }}>{check.note}</span>
                  </div>
                )}
                {check.link && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', flexShrink: 0 }}>Link:</span>
                    <a
                      href={check.link.startsWith('http') ? check.link : `https://${check.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {check.link}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            style={{
              flexShrink: 0,
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '100px',
              backgroundColor: isFail ? 'var(--error)' : isPass ? 'var(--success)' : 'var(--border)',
              color: (isFail || isPass) ? 'white' : 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}
          >
            {isFail ? 'Fail' : isPass ? 'Pass' : 'N/A'}
          </div>
        </div>
      );
    };

    const toggleGroup = (key: string) => {
      setClosedGroups(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    };

    const handleGroupByChange = (mode: 'category' | 'priority') => {
      setDetailedGroupBy(mode);
      setClosedGroups(new Set());
    };

    const exportFailedToExcel = () => {
      const workbook = XLSX.utils.book_new();
      const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';
      const priorityOrder: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];

      for (const priority of priorityOrder) {
        const data: string[][] = [];
        for (const category of CATEGORIES) {
          for (const check of category.checks) {
            if (check.importance === priority && checkStatuses[check.id] === 'fail') {
              data.push([category.name, priority.charAt(0).toUpperCase() + priority.slice(1), check.name, check.description, 'Fail', checkNotes[check.id] || '', checkLinks[check.id] || '']);
            }
          }
        }
        if (data.length > 0) {
          const sheetData = [['Category', 'Priority', 'Check Name', 'Description', 'Status', 'Notes', 'Links/Docs'], ...data];
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
          worksheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 60 }, { wch: 15 }, { wch: 30 }, { wch: 30 }];
          addHyperlinks(worksheet, data.length, 6);
          XLSX.utils.book_append_sheet(workbook, worksheet, priority.charAt(0).toUpperCase() + priority.slice(1));
        }
      }
      XLSX.writeFile(workbook, `seo-audit-failed-${urlName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportFailedToCSV = () => {
      const urlName = url ? url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-') : 'audit';
      const rows: string[][] = [['Category', 'Priority', 'Check Name', 'Description', 'Status', 'Notes', 'Links/Docs']];
      for (const category of CATEGORIES) {
        for (const check of category.checks) {
          if (checkStatuses[check.id] === 'fail') {
            rows.push([
              category.name,
              check.importance.charAt(0).toUpperCase() + check.importance.slice(1),
              check.name,
              check.description,
              'Fail',
              checkNotes[check.id] || '',
              checkLinks[check.id] || '',
            ]);
          }
        }
      }
      const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `seo-audit-failed-${urlName}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    // Detailed results view
    if (showDetailedResults) {
      return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          {/* Sticky Header */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--background)',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
              zIndex: 10,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setShowDetailedResults(false)}
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
              >
                ← Back to Results
              </button>
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                {url}
              </a>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Detailed Results</h1>
          </div>

          {/* Summary Strip */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Passed', value: passedChecks, color: 'var(--success)', bg: 'var(--success-light)' },
              { label: 'Failed', value: failedChecks, color: 'var(--error)', bg: 'var(--error-light)' },
              { label: 'Total Answered', value: totalAnswered, color: 'var(--foreground)', bg: 'var(--background-secondary)' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: stat.bg,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: '0.8rem', color: stat.color, fontWeight: 500 }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Group By toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(['category', 'priority'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleGroupByChange(mode)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: detailedGroupBy === mode ? 'var(--primary)' : 'var(--card-bg)',
                    color: detailedGroupBy === mode ? 'white' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  By {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Status filter toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {([
                { key: 'all' as const, label: 'All Checks' },
                { key: 'fail' as const, label: 'Failed Only' },
              ]).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: statusFilter === filter.key
                      ? (filter.key === 'fail' ? 'var(--error)' : 'var(--primary)')
                      : 'var(--card-bg)',
                    color: statusFilter === filter.key ? 'white' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Check Groups */}
          {detailedGroups.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                {statusFilter === 'fail' ? '🎉' : '📋'}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {statusFilter === 'fail' ? 'No failed checks!' : 'No checks to display'}
              </h3>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
                {statusFilter === 'fail'
                  ? 'All your answered checks passed. Great work!'
                  : 'Try adjusting the filters above.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {detailedGroups.map((group) => {
                const isOpen = !closedGroups.has(group.key);
                const scoreRating = group.score != null ? getScoreRating(group.score) : null;

                return (
                  <div
                    key={group.key}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Group Header */}
                    <div
                      onClick={() => toggleGroup(group.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        backgroundColor: 'var(--background-secondary)',
                        borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                        transition: 'background-color 0.15s ease',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--background-secondary)'; }}
                    >
                      {/* Icon */}
                      {group.icon && (
                        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                          {group.icon}
                        </span>
                      )}

                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{group.label}</span>
                          {group.failCount > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.45rem',
                                borderRadius: '100px',
                                backgroundColor: 'var(--error)',
                                color: 'white',
                              }}
                            >
                              {group.failCount} failed
                            </span>
                          )}
                          {scoreRating && group.score != null && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.45rem',
                                borderRadius: '100px',
                                backgroundColor: scoreRating.bgColor,
                                color: scoreRating.color,
                              }}
                            >
                              {group.score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Counts */}
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', flexShrink: 0 }}>
                        {group.passCount}/{group.totalCount} passed
                      </span>

                      {/* Chevron */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted)',
                          flexShrink: 0,
                          transition: 'transform 0.2s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▼
                      </span>
                    </div>

                    {/* Group Body */}
                    {isOpen && (
                      <div>
                        {group.checks.map((check) =>
                          renderCheckRow(check, detailedGroupBy === 'priority')
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Export Failed Checks */}
          {failedChecks > 0 && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>
                Export Failed Checks
              </h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                  onClick={exportFailedToExcel}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Export for Excel / Google Sheets
                </button>
                <button
                  onClick={exportFailedToCSV}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Export as CSV
                </button>
              </div>
            </>
          )}

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: failedChecks > 0 ? '0' : '2rem' }}>
            <button
              onClick={() => setShowDetailedResults(false)}
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
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              ← Back to Results
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
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
            >
              Start New Audit
            </a>
          </div>
        </main>
      );
    }

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

        {/* Report Summary - captured for PDF */}
        <div ref={reportSummaryRef} style={{ backgroundColor: 'var(--background)' }}>
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
        <div>
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
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                  {categoryIcons[category.id]}
                </span>
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

        </div>{/* End Category Breakdown wrapper */}

        {/* Issue Distribution by Priority */}
        <div>
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
        </div>{/* End Issue Distribution wrapper */}

        </div>{/* End reportSummaryRef */}

        {/* Download Report Button */}
        <button
          onClick={downloadReport}
          disabled={isGeneratingPdf}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: isGeneratingPdf ? 'var(--border)' : 'var(--foreground)',
            color: isGeneratingPdf ? 'var(--muted)' : 'var(--background)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            marginBottom: '2rem',
          }}
          onMouseEnter={(e) => {
            if (!isGeneratingPdf) {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGeneratingPdf) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {isGeneratingPdf ? 'Generating PDF...' : 'Download Report (PDF)'}
        </button>

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

        {/* View Detailed Results Button */}
        <button
          onClick={() => {
            setShowDetailedResults(true);
            setClosedGroups(new Set());
            setStatusFilter('fail');
            setDetailedGroupBy('category');
          }}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: 'var(--card-bg)',
            color: 'var(--primary)',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            marginBottom: '2rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>View Detailed Results</span>
        </button>

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

        {/* Hidden container for PDF detailed checks capture */}
        <div
          ref={reportDetailedRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '760px',
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '1rem',
          }}
        >
          {CATEGORIES.map(category => {
            const failedChecks = category.checks.filter(c => checkStatuses[c.id] === 'fail');
            if (failedChecks.length === 0) return null;
            return (
              <div key={category.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{categoryIcons[category.id]}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{category.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.45rem',
                    borderRadius: '100px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                  }}>
                    {failedChecks.length} failed
                  </span>
                </div>
                {failedChecks.map(check => {
                  const impConfig: Record<string, { label: string; color: string; bg: string }> = {
                    critical: { label: 'Critical', color: '#dc2626', bg: '#fee2e2' },
                    high: { label: 'High', color: '#d97706', bg: '#fef3c7' },
                    medium: { label: 'Medium', color: '#2563eb', bg: '#dbeafe' },
                    low: { label: 'Low', color: '#16a34a', bg: '#dcfce7' },
                  };
                  const imp = impConfig[check.importance];
                  return (
                    <div key={check.id} style={{
                      padding: '0.625rem 1rem 0.625rem 1.25rem',
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: '#fef2f2',
                      borderLeft: '3px solid #dc2626',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}>
                      <div style={{
                        width: '18px', height: '18px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', backgroundColor: '#dc2626',
                        color: 'white', fontWeight: 700, fontSize: '0.65rem', marginTop: '0.1rem',
                      }}>✗</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{check.name}</span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.35rem',
                            borderRadius: '100px', backgroundColor: imp.bg, color: imp.color,
                            textTransform: 'uppercase', letterSpacing: '0.025em',
                          }}>{imp.label}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                          {check.description}
                        </p>
                        {(checkNotes[check.id] || checkLinks[check.id]) && (
                          <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {checkNotes[check.id] && (
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>Note:</span>
                                <span style={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.3 }}>{checkNotes[check.id]}</span>
                              </div>
                            )}
                            {checkLinks[check.id] && (
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>Link:</span>
                                <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>{checkLinks[check.id]}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{
                        flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                        borderRadius: '100px', backgroundColor: '#dc2626', color: 'white',
                        textTransform: 'uppercase', letterSpacing: '0.025em',
                      }}>Fail</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
          <span style={{ fontSize: '2rem' }}>
            {categoryIcons[currentCategory!.id]}
          </span>
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
            note={checkNotes[check.id] || ''}
            link={checkLinks[check.id] || ''}
            onStatusChange={handleCheckStatusChange}
            onNoteChange={handleNoteChange}
            onLinkChange={handleLinkChange}
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
