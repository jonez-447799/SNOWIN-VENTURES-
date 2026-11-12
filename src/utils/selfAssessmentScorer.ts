/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SelfAssessmentAnswerValue = 'yes' | 'partially' | 'no' | 'unsure';

export type SelfAssessmentRiskBand =
  | 'CRITICAL_BLIND_SPOTS'
  | 'PARTIAL_VISIBILITY'
  | 'STRUCTURED_BASELINE';

export interface SelfAssessmentQuestionSpec {
  id: number;
  question: string;
  context: string;
  gapIfMissing: string;
  partialGapNote: string;
}

export const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestionSpec[] = [
  {
    id: 1,
    question: 'Does the team classify inventory by the last movement date?',
    context: 'Checks whether items are segregated by time elapsed since last consumption or dispatch.',
    gapIfMissing: 'No automated >180d last-movement classification',
    partialGapNote: 'Ad-hoc >180d movement tracking across select store racks',
  },
  {
    id: 2,
    question: 'Do purchasing and warehouse teams work from the same inventory view?',
    context: 'Evaluates alignment between replenishment orders and physical bin stock.',
    gapIfMissing: 'Disconnected purchasing and warehouse bin replenishment views',
    partialGapNote: 'Manual reconciliation needed between procurement POs and store bins',
  },
  {
    id: 3,
    question: 'Is non-moving stock reviewed at individual SKU level?',
    context: 'Checks whether reviews examine specific line items rather than broad aggregate book values.',
    gapIfMissing: 'Aggregate book-value review masking individual SKU dormancy',
    partialGapNote: 'SKU-level non-moving review limited to periodic year-end counts',
  },
  {
    id: 4,
    question: 'Can management identify high-value inactive stock quickly?',
    context: 'Measures how easily leadership spots top rupee exposure among stagnant items.',
    gapIfMissing: 'Missing Pareto 80/20 capital concentration ranking',
    partialGapNote: 'Manual spreadsheet sorting required to isolate top Rupee exposure',
  },
  {
    id: 5,
    question: 'Are ageing definitions applied consistently?',
    context: 'Verifies whether stores, operations, and finance use identical 90/180/365-day thresholds.',
    gapIfMissing: 'Inconsistent 90/180/365-day ageing definitions across stores and finance',
    partialGapNote: 'Ageing bucket thresholds vary between plant stores and accounting reports',
  },
];

export const SELF_ASSESSMENT_POINTS: Record<SelfAssessmentAnswerValue, number> = {
  yes: 20,
  partially: 10,
  unsure: 5,
  no: 0,
};

export interface SelfAssessmentEvaluation {
  readinessScore: number; // 0 to 100
  legacyScoreOutOf15: number; // 0 to 15 for backward compatibility
  riskBand: SelfAssessmentRiskBand;
  outcomeTitle: string;
  outcomeDescription: string;
  identifiedGaps: string[];
  summaryText: string;
  recommendedChallengeText: string;
}

/**
 * Deterministically evaluates the 5-question inventory visibility self-assessment.
 * Scoring per question: Yes = 20 pts, Partially = 10 pts, Unsure = 5 pts, No = 0 pts.
 * Total readinessScore ranges from 0 to 100.
 */
export function evaluateSelfAssessment(
  answers: Record<number, SelfAssessmentAnswerValue>
): SelfAssessmentEvaluation {
  let readinessScore = 0;
  let legacyScoreOutOf15 = 0;
  const identifiedGaps: string[] = [];

  for (const q of SELF_ASSESSMENT_QUESTIONS) {
    const rawAns = answers[q.id];
    const ans: SelfAssessmentAnswerValue =
      rawAns === 'yes' || rawAns === 'partially' || rawAns === 'no' || rawAns === 'unsure'
        ? rawAns
        : 'no';

    readinessScore += SELF_ASSESSMENT_POINTS[ans];
    legacyScoreOutOf15 += ans === 'yes' ? 3 : ans === 'partially' ? 2 : ans === 'unsure' ? 1 : 0;

    if (ans === 'no' || ans === 'unsure') {
      identifiedGaps.push(q.gapIfMissing);
    } else if (ans === 'partially') {
      identifiedGaps.push(q.partialGapNote);
    }
  }

  let riskBand: SelfAssessmentRiskBand = 'CRITICAL_BLIND_SPOTS';
  let outcomeTitle = 'Review Recommended — Critical Blind Spots';
  let outcomeDescription =
    'Several core visibility indicators suggest that dormant inventory value may be accumulating without systematic SKU-level movement tracking.';

  if (readinessScore >= 75) {
    riskBand = 'STRUCTURED_BASELINE';
    outcomeTitle = 'Strong Visibility Foundation';
    outcomeDescription =
      'Your plant has established baseline tracking for movement dates and cross-functional alignment; a diagnostic audit can validate Pareto cash-release priorities.';
  } else if (readinessScore >= 40) {
    riskBand = 'PARTIAL_VISIBILITY';
    outcomeTitle = 'Partial Visibility — Key Dormancy Gaps';
    outcomeDescription =
      'Basic tracking mechanisms are present, but certain categories or departments lack consistent SKU-level dormancy and Pareto concentration reviews.';
  }

  const gapSummaryList =
    identifiedGaps.length > 0
      ? identifiedGaps.join('; ')
      : 'All 5 baseline inventory visibility controls reported active; seeking independent Pareto verification.';

  const summaryText = `Diagnostic Score: ${readinessScore}/100 (${riskBand}). Gaps: ${gapSummaryList}`.slice(
    0,
    600
  );

  const recommendedChallengeText =
    identifiedGaps.length > 0
      ? `[Self-Assessment ${readinessScore}/100 • ${riskBand}] Key operational blind spots identified: ${identifiedGaps
          .slice(0, 4)
          .join('; ')}. Seeking SKU-level ageing and Pareto working-capital priority review.`
      : `[Self-Assessment ${readinessScore}/100 • ${riskBand}] Baseline tracking in place; seeking independent 5-column audit to verify >180d non-moving stock and Pareto cash-release priorities.`;

  return {
    readinessScore,
    legacyScoreOutOf15,
    riskBand,
    outcomeTitle,
    outcomeDescription,
    identifiedGaps,
    summaryText,
    recommendedChallengeText: recommendedChallengeText.slice(0, 950),
  };
}
