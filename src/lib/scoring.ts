import { CheckStatus } from '@/components/CheckItem';

interface Check {
  id: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

// Importance multipliers for weighted scoring
const importanceMultipliers = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Status scores
const statusScores = {
  pass: 1,
  fail: 0,
};

/**
 * Calculate score for a single category
 * Returns a score from 0-100, or null if no checks have been completed
 */
export function calculateCategoryScore(
  checks: Check[],
  checkStatuses: Record<string, CheckStatus>
): number | null {
  let totalWeight = 0;
  let earnedWeight = 0;
  let hasCompletedChecks = false;

  for (const check of checks) {
    const status = checkStatuses[check.id];

    // Skip if not answered
    if (status === null || status === undefined) {
      continue;
    }

    hasCompletedChecks = true;
    const weight = importanceMultipliers[check.importance];
    const score = statusScores[status];

    totalWeight += weight;
    earnedWeight += weight * score;
  }

  if (!hasCompletedChecks || totalWeight === 0) {
    return null;
  }

  return Math.round((earnedWeight / totalWeight) * 100);
}

/**
 * Calculate overall score across all categories
 * Uses category weights to determine final score
 */
export function calculateOverallScore(
  categories: Array<{
    id: string;
    weight: number;
    checks: Check[];
  }>,
  checkStatuses: Record<string, CheckStatus>
): number | null {
  let totalWeight = 0;
  let weightedScore = 0;
  let hasScores = false;

  for (const category of categories) {
    const categoryScore = calculateCategoryScore(category.checks, checkStatuses);

    if (categoryScore !== null) {
      hasScores = true;
      totalWeight += category.weight;
      weightedScore += (categoryScore / 100) * category.weight;
    }
  }

  if (!hasScores || totalWeight === 0) {
    return null;
  }

  // Normalise to account for categories that haven't been scored yet
  return Math.round((weightedScore / totalWeight) * 100);
}

/**
 * Get a rating label based on score
 * Returns CSS variable names for colours that adapt to light/dark mode
 */
export function getScoreRating(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 80) {
    return { label: 'Excellent', color: 'var(--success)', bgColor: 'var(--success-light)' };
  } else if (score >= 60) {
    return { label: 'Good', color: 'var(--success)', bgColor: 'var(--success-light)' };
  } else if (score >= 40) {
    return { label: 'Needs Improvement', color: 'var(--warning)', bgColor: 'var(--warning-light)' };
  } else {
    return { label: 'Poor', color: 'var(--error)', bgColor: 'var(--error-light)' };
  }
}
