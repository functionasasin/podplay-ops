import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CaseDeadline } from '@/types';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { TimelineReport } from '../TimelineReport';
import { TimelineStageCard } from '../TimelineStageCard';
import { ClientTimeline } from '../ClientTimeline';
import {
  buildTimelineData,
  computeStageStatus,
  getStageDefinitions,
  EJS_STAGES,
  JUDICIAL_STAGES,
} from '@/lib/timeline';
import type { TimelineStage, StageStatus } from '@/lib/timeline';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createDeadline(overrides: Partial<CaseDeadline> = {}): CaseDeadline {
  return {
    id: 'dl-1',
    case_id: 'case-123',
    user_id: 'user-1',
    milestone_key: 'ejs-0',
    label: 'Secure PSA Death Certificate',
    description: 'Obtain certified true copy of PSA death certificate.',
    due_date: '2026-06-01',
    completed_date: null,
    legal_basis: '',
    is_auto: true,
    note: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Create a complete set of EJS deadlines with controllable completion */
function createEjsDeadlines(options: {
  completedThrough?: number; // milestone index: milestones 0..completedThrough are done
  overdueMilestone?: number; // make this milestone overdue (past due_date, not completed)
} = {}): CaseDeadline[] {
  const labels = [
    'Secure PSA Death Certificate',
    'Gather Required Documents',
    'Execute Deed of Extrajudicial Settlement',
    'Publish Settlement Notice',
    'File BIR Estate Tax Return',
    'Obtain eCAR',
    'Transfer Land Titles',
    'Update Tax Declarations',
    'Release Bank Accounts',
  ];

  return labels.map((label, i) => {
    const isCompleted =
      options.completedThrough !== undefined && i <= options.completedThrough;
    const isOverdue =
      options.overdueMilestone !== undefined && i === options.overdueMilestone;

    return createDeadline({
      id: `dl-${i}`,
      milestone_key: `ejs-${i}`,
      label,
      due_date: isOverdue ? pastDate(10) : futureDate(30 * (i + 1)),
      completed_date: isCompleted ? pastDate(30 * (labels.length - i)) : null,
    });
  });
}

/** Create a complete set of Judicial deadlines */
function createJudicialDeadlines(options: {
  completedThrough?: number;
} = {}): CaseDeadline[] {
  const labels = [
    'File Petition for Probate / Settlement',
    'Court Hearing and Publication',
    'File BIR Estate Tax Return',
    'Court Order of Distribution',
  ];

  return labels.map((label, i) => {
    const isCompleted =
      options.completedThrough !== undefined && i <= options.completedThrough;

    return createDeadline({
      id: `dl-jud-${i}`,
      milestone_key: `judicial-${i}`,
      label,
      due_date: futureDate(60 * (i + 1)),
      completed_date: isCompleted ? pastDate(30 * (labels.length - i)) : null,
    });
  });
}

// --------------------------------------------------------------------------
// Unit Tests — timeline utility functions
// --------------------------------------------------------------------------

describe('timeline > getStageDefinitions', () => {
  it('returns 7 stages for EJS track', () => {
    const stages = getStageDefinitions('ejs');
    expect(stages).toHaveLength(7);
  });

  it('returns 4 stages for Judicial track', () => {
    const stages = getStageDefinitions('judicial');
    expect(stages).toHaveLength(4);
  });

  it('EJS stages have the correct names from spec', () => {
    const stages = getStageDefinitions('ejs');
    expect(stages[0].name).toBe('Registration & Notification');
    expect(stages[1].name).toBe('Document Preparation');
    expect(stages[2].name).toBe('Deed Drafting & Signing');
    expect(stages[3].name).toBe('Publication');
    expect(stages[4].name).toBe('BIR Filing & Payment');
    expect(stages[5].name).toBe('eCAR & Transfer Tax');
    expect(stages[6].name).toBe('Title Transfer');
  });

  it('Judicial stages have the correct names', () => {
    const stages = getStageDefinitions('judicial');
    expect(stages[0].name).toBe('File Petition');
    expect(stages[1].name).toBe('Court Hearing & Publication');
    expect(stages[2].name).toBe('BIR Filing & Payment');
    expect(stages[3].name).toBe('Court Order of Distribution');
  });

  it('all stages have client descriptions', () => {
    const ejsStages = getStageDefinitions('ejs');
    const judicialStages = getStageDefinitions('judicial');
    [...ejsStages, ...judicialStages].forEach((stage) => {
      expect(stage.clientDescription).toBeTruthy();
      expect(stage.clientDescription.length).toBeGreaterThan(10);
    });
  });
});

describe('timeline > computeStageStatus', () => {
  it('returns "upcoming" for empty deadlines array', () => {
    expect(computeStageStatus([])).toBe('upcoming');
  });

  it('returns "complete" when all deadlines have completed_date', () => {
    const deadlines = [
      createDeadline({ completed_date: '2026-01-15' }),
      createDeadline({ id: 'dl-2', completed_date: '2026-01-20' }),
    ];
    expect(computeStageStatus(deadlines)).toBe('complete');
  });

  it('returns "in-progress" when some deadlines done and rest are future', () => {
    const deadlines = [
      createDeadline({ completed_date: '2026-01-15' }),
      createDeadline({
        id: 'dl-2',
        due_date: futureDate(60),
        completed_date: null,
      }),
    ];
    expect(computeStageStatus(deadlines)).toBe('in-progress');
  });

  it('returns "overdue" when any deadline is past due and not completed', () => {
    const deadlines = [
      createDeadline({
        due_date: pastDate(5),
        completed_date: null,
      }),
    ];
    expect(computeStageStatus(deadlines)).toBe('overdue');
  });

  it('returns "overdue" when mix of done and overdue deadlines', () => {
    const deadlines = [
      createDeadline({ completed_date: '2026-01-15' }),
      createDeadline({
        id: 'dl-2',
        due_date: pastDate(5),
        completed_date: null,
      }),
    ];
    expect(computeStageStatus(deadlines)).toBe('overdue');
  });

  it('returns "upcoming" when no deadlines are done and none are overdue', () => {
    const deadlines = [
      createDeadline({ due_date: futureDate(30), completed_date: null }),
      createDeadline({
        id: 'dl-2',
        due_date: futureDate(60),
        completed_date: null,
      }),
    ];
    expect(computeStageStatus(deadlines)).toBe('upcoming');
  });

  it('completed deadlines are never overdue even if past due', () => {
    const deadlines = [
      createDeadline({
        due_date: pastDate(30),
        completed_date: pastDate(5),
      }),
    ];
    expect(computeStageStatus(deadlines)).toBe('complete');
  });
});

describe('timeline > buildTimelineData', () => {
  it('builds 7 stages for EJS deadlines', () => {
    const deadlines = createEjsDeadlines();
    const data = buildTimelineData(deadlines, 'ejs');
    expect(data.stages).toHaveLength(7);
    expect(data.track).toBe('ejs');
  });

  it('builds 4 stages for Judicial deadlines', () => {
    const deadlines = createJudicialDeadlines();
    const data = buildTimelineData(deadlines, 'judicial');
    expect(data.stages).toHaveLength(4);
    expect(data.track).toBe('judicial');
  });

  it('calculates 0% progress when no deadlines completed', () => {
    const deadlines = createEjsDeadlines();
    const data = buildTimelineData(deadlines, 'ejs');
    expect(data.progressPercent).toBe(0);
  });

  it('calculates correct progress with some stages complete', () => {
    // Complete first milestone (stage 1 = Registration)
    const deadlines = createEjsDeadlines({ completedThrough: 0 });
    const data = buildTimelineData(deadlines, 'ejs');
    // 1 of 7 stages complete = ~14%
    expect(data.progressPercent).toBe(14);
  });

  it('calculates 100% progress when all stages complete', () => {
    // Complete all 9 milestones (maps to 7 stages, last stage has 3 milestones)
    const deadlines = createEjsDeadlines({ completedThrough: 8 });
    const data = buildTimelineData(deadlines, 'ejs');
    expect(data.progressPercent).toBe(100);
  });

  it('identifies current stage as first non-complete stage', () => {
    // Complete first 2 milestones (stages 1 and 2)
    const deadlines = createEjsDeadlines({ completedThrough: 1 });
    const data = buildTimelineData(deadlines, 'ejs');
    // Stages 1 and 2 are complete; stage 3 should be current
    expect(data.currentStageNumber).toBe(3);
  });

  it('current stage is 1 when nothing is completed', () => {
    const deadlines = createEjsDeadlines();
    const data = buildTimelineData(deadlines, 'ejs');
    expect(data.currentStageNumber).toBe(1);
  });

  it('sets estimatedCompletionDate to the latest due_date', () => {
    const deadlines = createEjsDeadlines();
    const data = buildTimelineData(deadlines, 'ejs');
    expect(data.estimatedCompletionDate).toBeTruthy();
    // Should be the latest due_date among all deadlines
    const maxDueDate = deadlines.reduce(
      (max, d) => (d.due_date > max ? d.due_date : max),
      deadlines[0].due_date,
    );
    expect(data.estimatedCompletionDate).toBe(maxDueDate);
  });

  it('marks overdue stage when milestone is past due', () => {
    const deadlines = createEjsDeadlines({ overdueMilestone: 0 });
    const data = buildTimelineData(deadlines, 'ejs');
    // Stage 1 (Registration) maps to ejs-0, which is overdue
    expect(data.stages[0].status).toBe('overdue');
    // Overdue stage becomes the current stage
    expect(data.currentStageNumber).toBe(1);
  });

  it('stage has completedDate when all its milestones are done', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 0 });
    const data = buildTimelineData(deadlines, 'ejs');
    // Stage 1 has 1 milestone (ejs-0) which is completed
    expect(data.stages[0].status).toBe('complete');
    expect(data.stages[0].completedDate).toBeTruthy();
  });

  it('stage has estimatedDate for non-complete stages', () => {
    const deadlines = createEjsDeadlines();
    const data = buildTimelineData(deadlines, 'ejs');
    // All stages are upcoming, so each should have estimatedDate
    data.stages.forEach((stage) => {
      if (stage.deadlines.length > 0) {
        expect(stage.estimatedDate).toBeTruthy();
      }
    });
  });

  it('handles empty deadlines array', () => {
    const data = buildTimelineData([], 'ejs');
    expect(data.stages).toHaveLength(7);
    expect(data.progressPercent).toBe(0);
    expect(data.currentStageNumber).toBe(1);
    expect(data.estimatedCompletionDate).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Component Tests — TimelineStageCard
// --------------------------------------------------------------------------

describe('timeline > TimelineStageCard', () => {
  function createStage(overrides: Partial<TimelineStage> = {}): TimelineStage {
    return {
      number: 1,
      name: 'Registration & Notification',
      clientDescription: 'Your attorney has opened the estate case.',
      status: 'upcoming' as StageStatus,
      completedDate: null,
      estimatedDate: '2026-06-01',
      milestoneKeys: ['ejs-0'],
      deadlines: [],
      ...overrides,
    };
  }

  it('renders stage number and name', () => {
    const stage = createStage();
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.getByTestId('stage-number-1')).toHaveTextContent('Stage 1');
    expect(screen.getByTestId('stage-name-1')).toHaveTextContent(
      'Registration & Notification',
    );
  });

  it('renders stage status', () => {
    const stage = createStage({ status: 'complete' });
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.getByTestId('stage-status-1')).toHaveTextContent('Complete');
  });

  it('shows "Current" indicator when isCurrent is true', () => {
    const stage = createStage({ status: 'in-progress' });
    render(<TimelineStageCard stage={stage} isCurrent={true} />);
    expect(screen.getByTestId('current-stage-indicator')).toHaveTextContent(
      'Current',
    );
  });

  it('hides "Currently Here" indicator when isCurrent is false', () => {
    const stage = createStage();
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.queryByTestId('current-stage-indicator')).toBeNull();
  });

  it('shows completed date for complete stages', () => {
    const stage = createStage({
      status: 'complete',
      completedDate: '2026-02-15',
    });
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.getByTestId('stage-completed-1')).toHaveTextContent(
      '2026-02-15',
    );
  });

  it('shows estimated date for non-complete stages', () => {
    const stage = createStage({
      status: 'upcoming',
      estimatedDate: '2026-08-01',
    });
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.getByTestId('stage-estimated-1')).toHaveTextContent(
      '2026-08-01',
    );
  });

  it('has data-status attribute reflecting stage status', () => {
    const stage = createStage({ status: 'overdue' });
    render(<TimelineStageCard stage={stage} isCurrent={false} />);
    expect(screen.getByTestId('timeline-stage-1')).toHaveAttribute(
      'data-status',
      'overdue',
    );
  });
});

// --------------------------------------------------------------------------
// Component Tests — TimelineReport
// --------------------------------------------------------------------------

describe('timeline > TimelineReport', () => {
  it('renders 7 stages for EJS track', () => {
    const deadlines = createEjsDeadlines();
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('timeline-report')).toBeInTheDocument();
    const stagesContainer = screen.getByTestId('timeline-stages');
    // 7 stage cards
    for (let i = 1; i <= 7; i++) {
      expect(
        within(stagesContainer).getByTestId(`timeline-stage-${i}`),
      ).toBeInTheDocument();
    }
  });

  it('renders 4 stages for Judicial track', () => {
    const deadlines = createJudicialDeadlines();
    render(<TimelineReport deadlines={deadlines} track="judicial" />);
    const stagesContainer = screen.getByTestId('timeline-stages');
    for (let i = 1; i <= 4; i++) {
      expect(
        within(stagesContainer).getByTestId(`timeline-stage-${i}`),
      ).toBeInTheDocument();
    }
    expect(
      within(stagesContainer).queryByTestId('timeline-stage-5'),
    ).toBeNull();
  });

  it('shows track name for EJS', () => {
    const deadlines = createEjsDeadlines();
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('timeline-track')).toHaveTextContent(
      'Extrajudicial',
    );
  });

  it('shows track name for Judicial', () => {
    const deadlines = createJudicialDeadlines();
    render(<TimelineReport deadlines={deadlines} track="judicial" />);
    expect(screen.getByTestId('timeline-track')).toHaveTextContent(
      'Judicial',
    );
  });

  it('shows progress percentage', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 0 });
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('timeline-progress-percent')).toHaveTextContent(
      '14%',
    );
  });

  it('shows 0% when no stages complete', () => {
    const deadlines = createEjsDeadlines();
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('timeline-progress-percent')).toHaveTextContent(
      '0%',
    );
  });

  it('shows 100% when all stages complete', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 8 });
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('timeline-progress-percent')).toHaveTextContent(
      '100%',
    );
  });

  it('shows estimated completion date', () => {
    const deadlines = createEjsDeadlines();
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('estimated-completion')).toBeInTheDocument();
  });

  it('marks first in-progress stage as current', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 1 });
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    // Stage 3 should have the current indicator (stages 1 and 2 complete)
    expect(screen.getByTestId('current-stage-indicator')).toBeInTheDocument();
    // The current stage indicator should be within stage 3
    const stage3 = screen.getByTestId('timeline-stage-3');
    expect(within(stage3).getByTestId('current-stage-indicator')).toBeInTheDocument();
  });

  it('completed stages show complete status', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 1 });
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.getByTestId('stage-status-1')).toHaveTextContent('Complete');
    expect(screen.getByTestId('stage-status-2')).toHaveTextContent('Complete');
  });

  it('progress bar fill width matches percentage', () => {
    const deadlines = createEjsDeadlines({ completedThrough: 0 });
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    const fill = screen.getByTestId('timeline-progress-fill');
    expect(fill).toHaveStyle({ width: '14%' });
  });

  it('renders client view content when clientView=true', () => {
    const deadlines = createEjsDeadlines();
    render(
      <TimelineReport
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        firmName="Reyes & Associates"
        clientView={true}
      />,
    );
    expect(screen.getByTestId('client-view-content')).toBeInTheDocument();
    expect(screen.getByTestId('client-firm-name')).toHaveTextContent(
      'Reyes & Associates',
    );
    expect(screen.getByTestId('client-decedent-name')).toHaveTextContent(
      'Estate of Juan dela Cruz',
    );
  });

  it('hides client view content when clientView=false (default)', () => {
    const deadlines = createEjsDeadlines();
    render(<TimelineReport deadlines={deadlines} track="ejs" />);
    expect(screen.queryByTestId('client-view-content')).toBeNull();
  });

  it('client view shows stage descriptions in plain language', () => {
    const deadlines = createEjsDeadlines();
    render(
      <TimelineReport
        deadlines={deadlines}
        track="ejs"
        clientView={true}
      />,
    );
    const clientStages = screen.getByTestId('client-stages');
    // Each stage should have a client description
    for (let i = 1; i <= 7; i++) {
      expect(
        within(clientStages).getByTestId(`client-stage-${i}`),
      ).toBeInTheDocument();
    }
  });

  it('client view shows "Currently Here" on current stage', () => {
    const deadlines = createEjsDeadlines();
    render(
      <TimelineReport
        deadlines={deadlines}
        track="ejs"
        clientView={true}
      />,
    );
    expect(screen.getByTestId('client-current-indicator')).toHaveTextContent(
      'Currently Here',
    );
  });
});

// --------------------------------------------------------------------------
// Component Tests — ClientTimeline
// --------------------------------------------------------------------------

describe('timeline > ClientTimeline', () => {
  it('renders the client timeline container', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    expect(screen.getByTestId('client-timeline')).toBeInTheDocument();
  });

  it('renders firm name and address when provided', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
        firmName="Reyes & Associates Law Office"
        firmAddress="Quezon City, Metro Manila"
      />,
    );
    expect(screen.getByTestId('client-timeline-firm')).toHaveTextContent(
      'Reyes & Associates Law Office',
    );
    expect(screen.getByTestId('client-timeline-firm')).toHaveTextContent(
      'Quezon City, Metro Manila',
    );
  });

  it('renders estate title and death date', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan Roberto dela Cruz"
        dateOfDeath="15 January 2025"
      />,
    );
    const header = screen.getByTestId('client-timeline-header');
    expect(header).toHaveTextContent('Estate of Juan Roberto dela Cruz');
    expect(header).toHaveTextContent('15 January 2025');
  });

  it('shows settlement track type', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    expect(screen.getByTestId('client-timeline-header')).toHaveTextContent(
      'Extrajudicial',
    );
  });

  it('shows Judicial for judicial track', () => {
    const deadlines = createJudicialDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="judicial"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    expect(screen.getByTestId('client-timeline-header')).toHaveTextContent(
      'Judicial',
    );
  });

  it('renders without auth (no auth-dependent props)', () => {
    const deadlines = createEjsDeadlines();
    // ClientTimeline should render without any auth context
    const { container } = render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('uses plain language in stage descriptions (no legal jargon)', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    // Client view should be in plain language. Verify one known client description.
    const clientStages = screen.getByTestId('client-stages');
    const stage1 = within(clientStages).getByTestId('client-stage-1');
    // Should contain plain language description, not legal terms
    expect(stage1).toHaveTextContent('attorney');
  });

  it('hides firm section when firmName not provided', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    expect(screen.queryByTestId('client-timeline-firm')).toBeNull();
  });

  it('renders the embedded timeline report in client mode', () => {
    const deadlines = createEjsDeadlines();
    render(
      <ClientTimeline
        deadlines={deadlines}
        track="ejs"
        decedentName="Juan dela Cruz"
        dateOfDeath="15 Jan 2025"
      />,
    );
    // Should contain the timeline-report component in client mode
    expect(screen.getByTestId('timeline-report')).toBeInTheDocument();
    expect(screen.getByTestId('client-view-content')).toBeInTheDocument();
  });
});

// --------------------------------------------------------------------------
// Edge Cases
// --------------------------------------------------------------------------

describe('timeline > edge cases', () => {
  it('handles deadlines with custom (non-stage) milestone keys', () => {
    const deadlines = [
      createDeadline({ milestone_key: 'ejs-0', completed_date: '2026-01-15' }),
      createDeadline({
        id: 'dl-custom',
        milestone_key: 'custom-12345',
        label: 'Custom deadline',
        due_date: futureDate(30),
      }),
    ];
    const data = buildTimelineData(deadlines, 'ejs');
    // Custom milestone should not match any stage
    expect(data.stages[0].status).toBe('complete');
    // Overall: 1 of 7 stages complete
    expect(data.progressPercent).toBe(14);
  });

  it('handles stage with multiple milestones (Title Transfer stage)', () => {
    // EJS stage 7 maps to ejs-6, ejs-7, ejs-8
    const deadlines = [
      createDeadline({
        id: 'dl-6',
        milestone_key: 'ejs-6',
        completed_date: '2026-01-15',
      }),
      createDeadline({
        id: 'dl-7',
        milestone_key: 'ejs-7',
        completed_date: null,
        due_date: futureDate(30),
      }),
      createDeadline({
        id: 'dl-8',
        milestone_key: 'ejs-8',
        completed_date: null,
        due_date: futureDate(30),
      }),
    ];
    const data = buildTimelineData(deadlines, 'ejs');
    // Stage 7 (index 6) should be in-progress (1 done, 2 pending)
    expect(data.stages[6].status).toBe('in-progress');
  });

  it('stage with all multiple milestones complete is complete', () => {
    const deadlines = [
      createDeadline({
        id: 'dl-6',
        milestone_key: 'ejs-6',
        completed_date: '2026-01-15',
      }),
      createDeadline({
        id: 'dl-7',
        milestone_key: 'ejs-7',
        completed_date: '2026-01-16',
      }),
      createDeadline({
        id: 'dl-8',
        milestone_key: 'ejs-8',
        completed_date: '2026-01-17',
      }),
    ];
    const data = buildTimelineData(deadlines, 'ejs');
    // Only stage 7 has milestones, so only stage 7 is complete
    expect(data.stages[6].status).toBe('complete');
    expect(data.stages[6].completedDate).toBe('2026-01-17');
  });
});
