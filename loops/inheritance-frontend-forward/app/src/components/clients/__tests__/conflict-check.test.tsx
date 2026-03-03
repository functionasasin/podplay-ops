import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConflictCheckResult, ConflictMatch } from '@/lib/conflict-check';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { ConflictCheckScreen, type ConflictCheckScreenProps } from '../ConflictCheckScreen';
import { ConflictCheckDialog, type ConflictCheckDialogProps } from '../ConflictCheckDialog';
import { getSimilarityColor, runConflictCheck } from '@/lib/conflict-check';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

function makeClearResult(name: string): ConflictCheckResult {
  return {
    client_matches: [],
    heir_matches: [],
    tin_matches: [],
    total_matches: 0,
    outcome: 'clear',
    checked_name: name,
    checked_tin: null,
    checked_at: '2026-03-03T12:00:00Z',
  };
}

function makeFlaggedResult(
  name: string,
  clientMatches: ConflictMatch[] = [],
  heirMatches: ConflictMatch[] = [],
  tinMatches: ConflictMatch[] = [],
): ConflictCheckResult {
  const total = clientMatches.length + heirMatches.length + tinMatches.length;
  return {
    client_matches: clientMatches,
    heir_matches: heirMatches,
    tin_matches: tinMatches,
    total_matches: total,
    outcome: 'flagged',
    checked_name: name,
    checked_tin: null,
    checked_at: '2026-03-03T12:00:00Z',
  };
}

const highSimilarityClientMatch: ConflictMatch = {
  id: 'client-1',
  full_name: 'Juan dela Cruz Santos',
  tin: '123-456-789',
  status: 'active',
  conflict_cleared: true,
  similarity_score: 0.82,
  match_type: 'client',
};

const moderateSimilarityHeirMatch: ConflictMatch = {
  case_id: 'case-143',
  heir_name: 'Juan C. dela Cruz',
  case_title: 'Case #143',
  decedent_name: 'Maria Santos',
  similarity_score: 0.51,
  match_type: 'heir',
};

const exactTinMatch: ConflictMatch = {
  id: 'client-2',
  full_name: 'Maria Reyes',
  tin: '123-456-789',
  status: 'active',
  conflict_cleared: false,
  similarity_score: 1.0,
  match_type: 'tin_match',
};

const lowSimilarityMatch: ConflictMatch = {
  id: 'client-3',
  full_name: 'Juan Ramos',
  similarity_score: 0.38,
  match_type: 'client',
};

// --------------------------------------------------------------------------
// Screen component helpers
// --------------------------------------------------------------------------

const defaultScreenProps: ConflictCheckScreenProps = {
  onClear: vi.fn(),
  onClearedAfterReview: vi.fn(),
  onSkip: vi.fn(),
};

function renderScreen(overrides: Partial<ConflictCheckScreenProps> = {}) {
  return render(<ConflictCheckScreen {...defaultScreenProps} {...overrides} />);
}

// --------------------------------------------------------------------------
// Dialog component helpers
// --------------------------------------------------------------------------

const defaultDialogProps: ConflictCheckDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  clientName: 'Juan dela Cruz',
  clientTin: '123-456-789',
  onClear: vi.fn(),
  onClearedAfterReview: vi.fn(),
};

function renderDialog(overrides: Partial<ConflictCheckDialogProps> = {}) {
  return render(<ConflictCheckDialog {...defaultDialogProps} {...overrides} />);
}

// ==========================================================================
// TESTS — getSimilarityColor utility
// ==========================================================================

describe('conflict > getSimilarityColor', () => {
  it('returns red "Exact" for score >= 1.00', () => {
    const result = getSimilarityColor(1.0);
    expect(result.color).toBe('red');
    expect(result.label).toBe('Exact');
    expect(result.className).toContain('red');
  });

  it('returns amber "High" for score >= 0.70', () => {
    const result = getSimilarityColor(0.82);
    expect(result.color).toBe('amber');
    expect(result.label).toBe('High');
    expect(result.className).toContain('amber');
  });

  it('returns amber "High" for score exactly 0.70', () => {
    const result = getSimilarityColor(0.7);
    expect(result.color).toBe('amber');
    expect(result.label).toBe('High');
  });

  it('returns yellow "Moderate" for score >= 0.50', () => {
    const result = getSimilarityColor(0.51);
    expect(result.color).toBe('yellow');
    expect(result.label).toBe('Moderate');
    expect(result.className).toContain('yellow');
  });

  it('returns yellow "Moderate" for score exactly 0.50', () => {
    const result = getSimilarityColor(0.5);
    expect(result.color).toBe('yellow');
    expect(result.label).toBe('Moderate');
  });

  it('returns gray "Low" for score < 0.50', () => {
    const result = getSimilarityColor(0.38);
    expect(result.color).toBe('gray');
    expect(result.label).toBe('Low');
    expect(result.className).toContain('gray');
  });

  it('returns gray "Low" for score 0', () => {
    const result = getSimilarityColor(0);
    expect(result.color).toBe('gray');
    expect(result.label).toBe('Low');
  });
});

// ==========================================================================
// TESTS — runConflictCheck lib function
// ==========================================================================

describe('conflict > runConflictCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.rpc with correct function name and params', async () => {
    const clearResult = makeClearResult('Test Name');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    await runConflictCheck('Test Name', '123-456-789');

    expect(mockRpc).toHaveBeenCalledWith('run_conflict_check', {
      p_name: 'Test Name',
      p_tin: '123-456-789',
    });
  });

  it('omits p_tin when tin not provided', async () => {
    const clearResult = makeClearResult('Test Name');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    await runConflictCheck('Test Name');

    expect(mockRpc).toHaveBeenCalledWith('run_conflict_check', {
      p_name: 'Test Name',
    });
  });

  it('returns ConflictCheckResult on success', async () => {
    const expected = makeClearResult('Maria Santos');
    mockRpc.mockResolvedValue({ data: expected, error: null });

    const result = await runConflictCheck('Maria Santos');
    expect(result.outcome).toBe('clear');
    expect(result.total_matches).toBe(0);
    expect(result.checked_name).toBe('Maria Santos');
  });

  it('throws on supabase error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failed', code: '42000' },
    });

    await expect(runConflictCheck('Test')).rejects.toEqual({
      message: 'RPC failed',
      code: '42000',
    });
  });
});

// ==========================================================================
// TESTS — ConflictCheckScreen component
// ==========================================================================

describe('conflict > ConflictCheckScreen', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conflict check screen with inputs', () => {
    renderScreen();

    expect(screen.getByTestId('conflict-check-screen')).toBeInTheDocument();
    expect(screen.getByTestId('conflict-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('conflict-tin-input')).toBeInTheDocument();
    expect(screen.getByTestId('run-conflict-check-btn')).toBeInTheDocument();
  });

  it('disables Run button when name < 2 characters', () => {
    renderScreen();

    const runBtn = screen.getByTestId('run-conflict-check-btn');
    expect(runBtn).toBeDisabled();
  });

  it('enables Run button when name >= 2 characters', async () => {
    renderScreen();

    const nameInput = screen.getByTestId('conflict-name-input');
    await user.type(nameInput, 'AB');

    const runBtn = screen.getByTestId('run-conflict-check-btn');
    expect(runBtn).not.toBeDisabled();
  });

  it('shows clear result with green status after successful check', async () => {
    const clearResult = makeClearResult('Maria Santos Reyes');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Maria Santos Reyes');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-clear-result')).toBeInTheDocument();
    });

    expect(screen.getByText(/CLEAR/)).toBeInTheDocument();
    expect(screen.getByTestId('continue-to-details-btn')).toBeInTheDocument();
  });

  it('calls onClear when "Continue to Client Details" clicked on clear result', async () => {
    const onClear = vi.fn();
    const clearResult = makeClearResult('Maria Santos');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderScreen({ onClear });

    await user.type(screen.getByTestId('conflict-name-input'), 'Maria Santos');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('continue-to-details-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-to-details-btn'));
    expect(onClear).toHaveBeenCalledWith('Maria Santos', undefined);
  });

  it('shows flagged result with matches when conflicts found', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
      [moderateSimilarityHeirMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Juan dela Cruz');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-flagged-result')).toBeInTheDocument();
    });

    expect(screen.getByText(/FLAGGED/)).toBeInTheDocument();
    expect(screen.getByTestId('conflict-match-0')).toBeInTheDocument();
    expect(screen.getByTestId('conflict-match-1')).toBeInTheDocument();
  });

  it('shows similarity scores with correct color coding', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch, lowSimilarityMatch],
      [moderateSimilarityHeirMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Juan dela Cruz');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('similarity-badge-0')).toBeInTheDocument();
    });

    // High similarity = amber
    const badge0 = screen.getByTestId('similarity-badge-0');
    expect(badge0.textContent).toContain('0.82');
    expect(badge0.textContent).toContain('High');
    expect(badge0.className).toContain('amber');

    // Low similarity = gray
    const badge1 = screen.getByTestId('similarity-badge-1');
    expect(badge1.textContent).toContain('0.38');
    expect(badge1.textContent).toContain('Low');
    expect(badge1.className).toContain('gray');

    // Moderate similarity = yellow
    const badge2 = screen.getByTestId('similarity-badge-2');
    expect(badge2.textContent).toContain('0.51');
    expect(badge2.textContent).toContain('Moderate');
    expect(badge2.className).toContain('yellow');
  });

  it('shows TIN exact match highlighted regardless of name similarity', async () => {
    const flaggedResult = makeFlaggedResult(
      'Different Name',
      [],
      [],
      [exactTinMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Different Name');
    await user.type(screen.getByTestId('conflict-tin-input'), '123-456-789');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-flagged-result')).toBeInTheDocument();
    });

    const badge0 = screen.getByTestId('similarity-badge-0');
    expect(badge0.textContent).toContain('1.00');
    expect(badge0.textContent).toContain('Exact');
    expect(badge0.className).toContain('red');
  });

  it('requires notes >= 5 chars before proceeding on flagged result', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Juan dela Cruz');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('proceed-after-review-btn')).toBeInTheDocument();
    });

    // Initially disabled
    expect(screen.getByTestId('proceed-after-review-btn')).toBeDisabled();

    // Type 4 chars (still disabled)
    await user.type(screen.getByTestId('conflict-notes-textarea'), 'abcd');
    expect(screen.getByTestId('proceed-after-review-btn')).toBeDisabled();

    // Type 1 more char (5 total) — still disabled because checkbox not checked
    await user.type(screen.getByTestId('conflict-notes-textarea'), 'e');
    expect(screen.getByTestId('proceed-after-review-btn')).toBeDisabled();
  });

  it('requires checkbox checked before proceeding on flagged result', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Juan dela Cruz');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('proceed-after-review-btn')).toBeInTheDocument();
    });

    // Enter notes >= 5 chars
    await user.type(screen.getByTestId('conflict-notes-textarea'), 'No conflict - different person');

    // Still disabled (no checkbox)
    expect(screen.getByTestId('proceed-after-review-btn')).toBeDisabled();

    // Check checkbox — now enabled
    await user.click(screen.getByTestId('conflict-confirm-checkbox'));
    expect(screen.getByTestId('proceed-after-review-btn')).not.toBeDisabled();
  });

  it('calls onClearedAfterReview with notes when proceeding after review', async () => {
    const onClearedAfterReview = vi.fn();
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderScreen({ onClearedAfterReview });

    await user.type(screen.getByTestId('conflict-name-input'), 'Juan dela Cruz');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('proceed-after-review-btn')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('conflict-notes-textarea'), 'Different person, verified');
    await user.click(screen.getByTestId('conflict-confirm-checkbox'));
    await user.click(screen.getByTestId('proceed-after-review-btn'));

    expect(onClearedAfterReview).toHaveBeenCalledWith(
      'Juan dela Cruz',
      'Different person, verified',
      undefined,
    );
  });

  it('skip marks conflict_cleared = false by calling onSkip', async () => {
    const onSkip = vi.fn();
    renderScreen({ onSkip });

    await user.click(screen.getByTestId('skip-conflict-check-btn'));
    expect(onSkip).toHaveBeenCalledWith('', undefined);
  });

  it('shows skip description text', () => {
    renderScreen();

    expect(
      screen.getByText(/Skipping marks this client as conflict not cleared/),
    ).toBeInTheDocument();
  });

  it('shows error message when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    renderScreen();

    await user.type(screen.getByTestId('conflict-name-input'), 'Test Name');
    await user.click(screen.getByTestId('run-conflict-check-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-error')).toBeInTheDocument();
    });
  });

  it('shows Canon III §14 CPRA reference', () => {
    renderScreen();

    expect(screen.getByText(/Canon III §14/)).toBeInTheDocument();
    expect(screen.getByText(/2023 CPRA/)).toBeInTheDocument();
  });
});

// ==========================================================================
// TESTS — ConflictCheckDialog component
// ==========================================================================

describe('conflict > ConflictCheckDialog', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog when open', async () => {
    const clearResult = makeClearResult('Juan dela Cruz');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('conflict-check-dialog')).toBeInTheDocument();
    });
  });

  it('auto-runs conflict check on open', async () => {
    const clearResult = makeClearResult('Juan dela Cruz');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderDialog();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('run_conflict_check', {
        p_name: 'Juan dela Cruz',
        p_tin: '123-456-789',
      });
    });
  });

  it('shows clear result and calls onClear when confirmed', async () => {
    const onClear = vi.fn();
    const clearResult = makeClearResult('Juan dela Cruz');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderDialog({ onClear });

    await waitFor(() => {
      expect(screen.getByTestId('conflict-dialog-clear')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('conflict-dialog-clear-btn'));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows flagged result with matches', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('conflict-dialog-flagged')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dialog-match-0')).toBeInTheDocument();
  });

  it('disables proceed until notes >= 5 chars AND checkbox checked', async () => {
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('dialog-proceed-btn')).toBeInTheDocument();
    });

    // Initially disabled
    expect(screen.getByTestId('dialog-proceed-btn')).toBeDisabled();

    // Add sufficient notes
    await user.type(screen.getByTestId('dialog-conflict-notes'), 'Verified no conflict');

    // Still disabled (no checkbox)
    expect(screen.getByTestId('dialog-proceed-btn')).toBeDisabled();

    // Check checkbox
    await user.click(screen.getByTestId('dialog-confirm-checkbox'));

    // Now enabled
    expect(screen.getByTestId('dialog-proceed-btn')).not.toBeDisabled();
  });

  it('calls onClearedAfterReview with notes when proceeding', async () => {
    const onClearedAfterReview = vi.fn();
    const flaggedResult = makeFlaggedResult(
      'Juan dela Cruz',
      [highSimilarityClientMatch],
    );
    mockRpc.mockResolvedValue({ data: flaggedResult, error: null });

    renderDialog({ onClearedAfterReview });

    await waitFor(() => {
      expect(screen.getByTestId('dialog-proceed-btn')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('dialog-conflict-notes'), 'Different person entirely');
    await user.click(screen.getByTestId('dialog-confirm-checkbox'));
    await user.click(screen.getByTestId('dialog-proceed-btn'));

    expect(onClearedAfterReview).toHaveBeenCalledWith('Different person entirely');
  });

  it('shows loading state while checking', async () => {
    // Use a promise that we control to keep loading state visible
    let resolveRpc!: (value: unknown) => void;
    mockRpc.mockReturnValue(new Promise((resolve) => { resolveRpc = resolve; }));

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('conflict-dialog-loading')).toBeInTheDocument();
    });

    // Resolve to clean up
    resolveRpc({ data: makeClearResult('Juan dela Cruz'), error: null });
  });

  it('shows error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId('conflict-dialog-error')).toBeInTheDocument();
    });
  });

  it('displays client name and TIN in dialog', async () => {
    const clearResult = makeClearResult('Juan dela Cruz');
    mockRpc.mockResolvedValue({ data: clearResult, error: null });

    renderDialog({ clientName: 'Juan dela Cruz', clientTin: '123-456-789' });

    await waitFor(() => {
      expect(screen.getByText(/Juan dela Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/123-456-789/)).toBeInTheDocument();
    });
  });
});
