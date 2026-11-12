/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  FileSpreadsheet,
  ClipboardCheck,
} from 'lucide-react';
import { trackEvent, trackServerFunnelEvent } from '../utils/analytics';
import {
  SELF_ASSESSMENT_QUESTIONS,
  evaluateSelfAssessment,
  type SelfAssessmentAnswerValue,
  type SelfAssessmentEvaluation,
} from '../utils/selfAssessmentScorer';

interface SelfAssessmentWidgetProps {
  onRequestAudit: (diagnostic?: SelfAssessmentEvaluation) => void;
  onViewSampleReport: () => void;
  className?: string;
  defaultCollapsed?: boolean;
}

const OPTIONS: { label: string; value: SelfAssessmentAnswerValue; points: number }[] = [
  { label: 'Yes', value: 'yes', points: 20 },
  { label: 'Partially', value: 'partially', points: 10 },
  { label: 'No', value: 'no', points: 0 },
  { label: 'Unsure', value: 'unsure', points: 5 },
];

export const SelfAssessmentWidget: React.FC<SelfAssessmentWidgetProps> = ({
  onRequestAudit,
  onViewSampleReport,
  className = '',
  defaultCollapsed = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!defaultCollapsed);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, SelfAssessmentAnswerValue>>({});

  const totalQuestions = SELF_ASSESSMENT_QUESTIONS.length;
  const isCompleted = currentStep >= totalQuestions;

  const handleSelectOption = (qId: number, value: SelfAssessmentAnswerValue) => {
    if (currentStep === 0) {
      trackEvent('self_assessment_started');
    }
    const updated = { ...answers, [qId]: value };
    setAnswers(updated);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    if (nextStep >= totalQuestions) {
      const evaluation = evaluateSelfAssessment(updated);
      trackEvent('self_assessment_completed', {
        answers: updated,
        readinessScore: evaluation.readinessScore,
        riskBand: evaluation.riskBand,
      });
      trackServerFunnelEvent('SELF_ASSESSMENT_COMPLETED', {
        sourceSection: 'self_assessment',
      });
    }
  };

  const reset = () => {
    setAnswers({});
    setCurrentStep(0);
  };

  const evaluation = evaluateSelfAssessment(answers);

  let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  if (evaluation.riskBand === 'STRUCTURED_BASELINE') {
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (evaluation.riskBand === 'PARTIAL_VISIBILITY') {
    badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  }

  const currentQ = SELF_ASSESSMENT_QUESTIONS[currentStep];

  return (
    <div
      data-testid="self-assessment-widget"
      className={`rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-7 md:p-8 space-y-6 shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              SELF-ASSESSMENT · ZERO OBLIGATION
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">
              {isCompleted
                ? 'Completed'
                : isExpanded
                ? `Question ${currentStep + 1} of ${totalQuestions}`
                : 'Optional 60-Second Diagnostic'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            How Clear Is Your Current Inventory View?
          </h3>
          <p className="text-xs text-slate-400">
            A quick five-question check on your plant&apos;s operational inventory visibility (scored 0–100).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCompleted && (
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Check</span>
            </button>
          )}
          <button
            type="button"
            data-testid="toggle-self-assessment-drawer"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isExpanded
                ? 'Collapse 5-Question Visibility Check'
                : 'Take the 60-Second Inventory Visibility Check (5 Questions · Scored 0–100)'}
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.round(
                  ((isCompleted ? totalQuestions : currentStep) / totalQuestions) * 100
                )}%`,
              }}
            />
          </div>

      {/* Active Question View */}
      {!isCompleted && currentQ && (
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
              Question 0{currentQ.id}:
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {currentQ.question}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">{currentQ.context}</p>
          </div>

          {/* 4 Choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleSelectOption(currentQ.id, opt.value)}
                data-testid={`self-assessment-option-${opt.value}`}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 text-slate-200 hover:text-white text-xs font-mono font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center group"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 font-mono text-center pt-1">
            No contact details or login required to complete this assessment.
          </p>
        </div>
      )}

      {/* Completed Results View */}
      {isCompleted && (
        <div className="space-y-5 animate-in fade-in duration-300" data-testid="self-assessment-result">
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${badgeColor}`}>
                Observation: {evaluation.outcomeTitle} ({evaluation.riskBand.replace(/_/g, ' ')})
              </span>
              <span
                data-testid="self-assessment-score-display"
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-emerald-300"
              >
                Readiness Score: {evaluation.readinessScore} / 100
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {evaluation.outcomeDescription}
            </p>

            {evaluation.identifiedGaps.length > 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Identified Operational Visibility Gaps ({evaluation.identifiedGaps.length}):</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {evaluation.identifiedGaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All 5 baseline SKU ageing and cross-department controls reported active.</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono border-t border-slate-850 pt-2.5">
              Note: This assessment provides general operational reflection based on self-reported answers. You can attach this diagnostic directly to a Pilot Audit request below.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              data-testid="request-audit-with-diagnostic-btn"
              onClick={() => onRequestAudit(evaluation)}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Request a Pilot Audit With This Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onViewSampleReport}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>View an Illustrative Audit</span>
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
