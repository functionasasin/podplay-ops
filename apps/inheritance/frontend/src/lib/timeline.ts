/**
 * Timeline Report functions (§4.21)
 * Source: docs/plans/inheritance-premium-spec.md §4.21
 *
 * Maps case deadlines into 7 settlement stages (EJS) or 4 stages (Judicial),
 * computes stage status, overall progress, and estimated completion.
 */

import type { CaseDeadline } from '@/types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type StageStatus = 'complete' | 'in-progress' | 'upcoming' | 'overdue';

export interface TimelineStage {
  /** 1-based stage number */
  number: number;
  /** Display name */
  name: string;
  /** Plain-language description for client-facing view */
  clientDescription: string;
  /** Status derived from milestone completion */
  status: StageStatus;
  /** Completion date (ISO) if all milestones done; null otherwise */
  completedDate: string | null;
  /** Estimated due date (ISO) — latest due_date of milestones in this stage */
  estimatedDate: string | null;
  /** Milestone keys belonging to this stage */
  milestoneKeys: string[];
  /** Deadlines belonging to this stage */
  deadlines: CaseDeadline[];
}

export interface TimelineData {
  /** The settlement track */
  track: 'ejs' | 'judicial';
  /** All stages in order */
  stages: TimelineStage[];
  /** Overall completion percentage (0-100) */
  progressPercent: number;
  /** 1-based index of current stage (first in-progress or first upcoming) */
  currentStageNumber: number;
  /** Estimated completion date (ISO) — latest due_date across all stages */
  estimatedCompletionDate: string | null;
}

// --------------------------------------------------------------------------
// Stage definitions
// --------------------------------------------------------------------------

export interface StageDef {
  name: string;
  clientDescription: string;
  milestoneKeyPrefixes: string[];
}

export const EJS_STAGES: StageDef[] = [
  {
    name: 'Registration & Notification',
    clientDescription: 'Your attorney has opened the estate case and secured the death certificate.',
    milestoneKeyPrefixes: ['ejs-0'],
  },
  {
    name: 'Document Preparation',
    clientDescription: 'Required documents have been collected.',
    milestoneKeyPrefixes: ['ejs-1'],
  },
  {
    name: 'Deed Drafting & Signing',
    clientDescription: 'The Deed of Extrajudicial Settlement has been drafted and signed by all heirs.',
    milestoneKeyPrefixes: ['ejs-2'],
  },
  {
    name: 'Publication',
    clientDescription: 'The settlement notice has been published in a newspaper for 3 consecutive weeks.',
    milestoneKeyPrefixes: ['ejs-3'],
  },
  {
    name: 'BIR Filing & Payment',
    clientDescription: 'Estate tax return (BIR Form 1801) has been filed and estate tax paid.',
    milestoneKeyPrefixes: ['ejs-4'],
  },
  {
    name: 'eCAR & Transfer Tax',
    clientDescription: 'BIR clearance (eCAR) obtained and local transfer taxes paid.',
    milestoneKeyPrefixes: ['ejs-5'],
  },
  {
    name: 'Title Transfer',
    clientDescription: 'Property titles, tax declarations, and bank accounts have been transferred to the heirs.',
    milestoneKeyPrefixes: ['ejs-6', 'ejs-7', 'ejs-8'],
  },
];

export const JUDICIAL_STAGES: StageDef[] = [
  {
    name: 'File Petition',
    clientDescription: 'The petition for probate or judicial settlement has been filed in court.',
    milestoneKeyPrefixes: ['judicial-0'],
  },
  {
    name: 'Court Hearing & Publication',
    clientDescription: 'Court hearings are ongoing and notices have been published.',
    milestoneKeyPrefixes: ['judicial-1'],
  },
  {
    name: 'BIR Filing & Payment',
    clientDescription: 'Estate tax return has been filed and estate tax paid.',
    milestoneKeyPrefixes: ['judicial-2'],
  },
  {
    name: 'Court Order of Distribution',
    clientDescription: 'The court has approved the distribution of the estate to the heirs.',
    milestoneKeyPrefixes: ['judicial-3'],
  },
];

// --------------------------------------------------------------------------
// Core logic
// --------------------------------------------------------------------------

export function getStageDefinitions(track: 'ejs' | 'judicial'): StageDef[] {
  return track === 'ejs' ? EJS_STAGES : JUDICIAL_STAGES;
}

/**
 * Compute stage status from its deadlines.
 */
export function computeStageStatus(deadlines: CaseDeadline[]): StageStatus {
  if (deadlines.length === 0) return 'upcoming';

  const allDone = deadlines.every((d) => d.completed_date !== null);
  if (allDone) return 'complete';

  const anyDone = deadlines.some((d) => d.completed_date !== null);
  const anyOverdue = deadlines.some((d) => {
    if (d.completed_date !== null) return false;
    return new Date(d.due_date).getTime() < new Date().getTime();
  });

  if (anyOverdue) return 'overdue';
  if (anyDone) return 'in-progress';
  return 'upcoming';
}

/**
 * Build timeline data from deadlines and track.
 */
export function buildTimelineData(
  deadlines: CaseDeadline[],
  track: 'ejs' | 'judicial',
): TimelineData {
  const stageDefs = getStageDefinitions(track);

  const stages: TimelineStage[] = stageDefs.map((def, i) => {
    const stageDeadlines = deadlines.filter((d) =>
      def.milestoneKeyPrefixes.some((prefix) => d.milestone_key.startsWith(prefix)),
    );

    const status = computeStageStatus(stageDeadlines);

    const completedDate =
      status === 'complete' && stageDeadlines.length > 0
        ? stageDeadlines.reduce((latest, d) => {
            const cd = d.completed_date!;
            return cd > latest ? cd : latest;
          }, stageDeadlines[0]!.completed_date!)
        : null;

    const estimatedDate =
      stageDeadlines.length > 0
        ? stageDeadlines.reduce((latest, d) => {
            return d.due_date > latest ? d.due_date : latest;
          }, stageDeadlines[0]!.due_date)
        : null;

    return {
      number: i + 1,
      name: def.name,
      clientDescription: def.clientDescription,
      status,
      completedDate,
      estimatedDate,
      milestoneKeys: def.milestoneKeyPrefixes,
      deadlines: stageDeadlines,
    };
  });

  const completedStages = stages.filter((s) => s.status === 'complete').length;
  const progressPercent = Math.round((completedStages / stages.length) * 100);

  const currentStage =
    stages.find((s) => s.status === 'in-progress' || s.status === 'overdue') ??
    stages.find((s) => s.status === 'upcoming') ??
    stages[stages.length - 1];
  const currentStageNumber = currentStage?.number ?? 1;

  const allEstimatedDates = stages
    .map((s) => s.estimatedDate)
    .filter((d): d is string => d !== null);
  const estimatedCompletionDate =
    allEstimatedDates.length > 0
      ? allEstimatedDates.reduce((latest, d) => (d > latest ? d : latest))
      : null;

  return {
    track,
    stages,
    progressPercent,
    currentStageNumber,
    estimatedCompletionDate,
  };
}
