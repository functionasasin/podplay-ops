import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CaseDeadline } from '@/types';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { DeadlineCard } from '../DeadlineCard';
import type { DeadlineCardProps } from '../DeadlineCard';
import { DeadlineTimeline } from '../DeadlineTimeline';
import type { DeadlineTimelineProps } from '../DeadlineTimeline';

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

// --------------------------------------------------------------------------
// Tests — DeadlineCard
// --------------------------------------------------------------------------

describe('deadline > DeadlineCard', () => {
  const defaultCardProps: DeadlineCardProps = {
    deadline: createDeadline({ due_date: futureDate(60) }),
    onMarkDone: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the deadline label', () => {
    render(<DeadlineCard {...defaultCardProps} />);
    expect(screen.getByText('Secure PSA Death Certificate')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<DeadlineCard {...defaultCardProps} />);
    expect(
      screen.getByText('Obtain certified true copy of PSA death certificate.'),
    ).toBeInTheDocument();
  });

  it('shows "Mark Done" button for non-completed deadlines', () => {
    render(<DeadlineCard {...defaultCardProps} />);
    expect(screen.getByTestId('deadline-mark-done-dl-1')).toBeInTheDocument();
  });

  it('hides "Mark Done" button for completed deadlines', () => {
    const completed = createDeadline({
      due_date: futureDate(60),
      completed_date: '2026-02-15',
    });
    render(<DeadlineCard deadline={completed} onMarkDone={vi.fn()} />);
    expect(screen.queryByTestId('deadline-mark-done-dl-1')).not.toBeInTheDocument();
  });

  it('shows "Done" status for completed deadlines', () => {
    const completed = createDeadline({
      due_date: futureDate(60),
      completed_date: '2026-02-15',
    });
    render(<DeadlineCard deadline={completed} onMarkDone={vi.fn()} />);
    expect(screen.getByTestId('deadline-status-dl-1')).toHaveTextContent('Done');
  });

  it('shows overdue status with data-status="overdue" for past due dates', () => {
    const overdue = createDeadline({
      id: 'dl-overdue',
      due_date: pastDate(5),
    });
    const { container } = render(
      <DeadlineCard deadline={overdue} onMarkDone={vi.fn()} />,
    );
    const card = container.querySelector('[data-status="overdue"]');
    expect(card).toBeInTheDocument();
  });

  it('shows urgent status for deadlines within 14 days', () => {
    const urgent = createDeadline({
      id: 'dl-urgent',
      due_date: futureDate(7),
    });
    const { container } = render(
      <DeadlineCard deadline={urgent} onMarkDone={vi.fn()} />,
    );
    const card = container.querySelector('[data-status="urgent"]');
    expect(card).toBeInTheDocument();
  });

  it('shows upcoming status for deadlines 15-30 days out', () => {
    const upcoming = createDeadline({
      id: 'dl-upcoming',
      due_date: futureDate(20),
    });
    const { container } = render(
      <DeadlineCard deadline={upcoming} onMarkDone={vi.fn()} />,
    );
    const card = container.querySelector('[data-status="upcoming"]');
    expect(card).toBeInTheDocument();
  });

  it('shows future status for deadlines >30 days out', () => {
    const future = createDeadline({
      id: 'dl-future',
      due_date: futureDate(90),
    });
    const { container } = render(
      <DeadlineCard deadline={future} onMarkDone={vi.fn()} />,
    );
    const card = container.querySelector('[data-status="future"]');
    expect(card).toBeInTheDocument();
  });

  it('calls onMarkDone when "Mark Done" is clicked', async () => {
    const user = userEvent.setup();
    const onMarkDone = vi.fn();
    render(
      <DeadlineCard
        deadline={createDeadline({ due_date: futureDate(60) })}
        onMarkDone={onMarkDone}
      />,
    );

    await user.click(screen.getByTestId('deadline-mark-done-dl-1'));
    expect(onMarkDone).toHaveBeenCalledWith('dl-1');
  });

  it('shows legal basis when present', () => {
    const dl = createDeadline({
      due_date: futureDate(60),
      legal_basis: 'Sec. 90, NIRC',
    });
    render(<DeadlineCard deadline={dl} onMarkDone={vi.fn()} />);
    expect(screen.getByText('Sec. 90, NIRC')).toBeInTheDocument();
  });
});

// --------------------------------------------------------------------------
// Tests — DeadlineTimeline
// --------------------------------------------------------------------------

describe('deadline > DeadlineTimeline', () => {
  const deadlines: CaseDeadline[] = [
    createDeadline({
      id: 'dl-1',
      milestone_key: 'ejs-0',
      label: 'Secure PSA Death Certificate',
      due_date: futureDate(60),
      completed_date: '2026-02-01',
    }),
    createDeadline({
      id: 'dl-2',
      milestone_key: 'ejs-1',
      label: 'Gather Required Documents',
      due_date: futureDate(90),
    }),
    createDeadline({
      id: 'dl-3',
      milestone_key: 'ejs-2',
      label: 'Execute Deed of EJS',
      due_date: futureDate(120),
    }),
  ];

  const defaultTimelineProps: DeadlineTimelineProps = {
    deadlines,
    onMarkDone: vi.fn(),
    onAddCustom: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the timeline container', () => {
    render(<DeadlineTimeline {...defaultTimelineProps} />);
    expect(screen.getByTestId('deadline-timeline')).toBeInTheDocument();
  });

  it('renders all deadline cards', () => {
    render(<DeadlineTimeline {...defaultTimelineProps} />);
    expect(screen.getByText('Secure PSA Death Certificate')).toBeInTheDocument();
    expect(screen.getByText('Gather Required Documents')).toBeInTheDocument();
    expect(screen.getByText('Execute Deed of EJS')).toBeInTheDocument();
  });

  it('shows progress count (completed / total)', () => {
    render(<DeadlineTimeline {...defaultTimelineProps} />);
    expect(screen.getByTestId('deadline-progress')).toHaveTextContent(
      '1 of 3 milestones complete',
    );
  });

  it('shows 0 of N when none completed', () => {
    const allPending = deadlines.map((d) => ({ ...d, completed_date: null }));
    render(
      <DeadlineTimeline
        {...defaultTimelineProps}
        deadlines={allPending}
      />,
    );
    expect(screen.getByTestId('deadline-progress')).toHaveTextContent(
      '0 of 3 milestones complete',
    );
  });

  it('shows N of N when all completed', () => {
    const allDone = deadlines.map((d) => ({
      ...d,
      completed_date: '2026-02-15',
    }));
    render(
      <DeadlineTimeline
        {...defaultTimelineProps}
        deadlines={allDone}
      />,
    );
    expect(screen.getByTestId('deadline-progress')).toHaveTextContent(
      '3 of 3 milestones complete',
    );
  });

  it('shows "Add Custom Deadline" button', () => {
    render(<DeadlineTimeline {...defaultTimelineProps} />);
    expect(screen.getByTestId('add-custom-deadline-btn')).toBeInTheDocument();
  });

  it('opens custom deadline form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeadlineTimeline {...defaultTimelineProps} />);

    await user.click(screen.getByTestId('add-custom-deadline-btn'));
    expect(screen.getByTestId('custom-deadline-form')).toBeInTheDocument();
    expect(screen.getByTestId('custom-deadline-label')).toBeInTheDocument();
    expect(screen.getByTestId('custom-deadline-date')).toBeInTheDocument();
    expect(screen.getByTestId('custom-deadline-description')).toBeInTheDocument();
    expect(screen.getByTestId('custom-deadline-legal-basis')).toBeInTheDocument();
  });

  it('submits custom deadline form with entered data', async () => {
    const user = userEvent.setup();
    const onAddCustom = vi.fn();
    render(
      <DeadlineTimeline {...defaultTimelineProps} onAddCustom={onAddCustom} />,
    );

    await user.click(screen.getByTestId('add-custom-deadline-btn'));
    await user.type(screen.getByTestId('custom-deadline-label'), 'Custom milestone');
    await user.type(screen.getByTestId('custom-deadline-date'), '2026-06-15');
    await user.type(screen.getByTestId('custom-deadline-description'), 'A custom one');
    await user.click(screen.getByTestId('custom-deadline-submit'));

    expect(onAddCustom).toHaveBeenCalledWith({
      label: 'Custom milestone',
      due_date: '2026-06-15',
      description: 'A custom one',
      legal_basis: undefined,
    });
  });

  it('cancels custom deadline form', async () => {
    const user = userEvent.setup();
    render(<DeadlineTimeline {...defaultTimelineProps} />);

    await user.click(screen.getByTestId('add-custom-deadline-btn'));
    expect(screen.getByTestId('custom-deadline-form')).toBeInTheDocument();

    await user.click(screen.getByTestId('custom-deadline-cancel'));
    expect(screen.queryByTestId('custom-deadline-form')).not.toBeInTheDocument();
  });

  it('calls onMarkDone when a card mark done is triggered', async () => {
    const user = userEvent.setup();
    const onMarkDone = vi.fn();
    render(
      <DeadlineTimeline {...defaultTimelineProps} onMarkDone={onMarkDone} />,
    );

    // dl-2 is not completed, should have a Mark Done button
    await user.click(screen.getByTestId('deadline-mark-done-dl-2'));
    expect(onMarkDone).toHaveBeenCalledWith('dl-2', expect.any(String));
  });

  it('renders empty state gracefully when no deadlines', () => {
    render(
      <DeadlineTimeline
        deadlines={[]}
        onMarkDone={vi.fn()}
        onAddCustom={vi.fn()}
      />,
    );
    expect(screen.getByTestId('deadline-progress')).toHaveTextContent(
      '0 of 0 milestones complete',
    );
  });
});
