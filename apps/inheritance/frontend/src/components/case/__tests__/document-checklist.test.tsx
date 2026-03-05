import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CaseDocument } from '@/types';

// --------------------------------------------------------------------------
// Mock modules before importing
// --------------------------------------------------------------------------

const mockListDocuments = vi.fn();
const mockCheckOffDocument = vi.fn();
const mockMarkNotApplicable = vi.fn();
const mockComputeProgress = vi.fn();

vi.mock('@/lib/documents', () => ({
  listDocuments: (...args: unknown[]) => mockListDocuments(...args),
  checkOffDocument: (...args: unknown[]) => mockCheckOffDocument(...args),
  markNotApplicable: (...args: unknown[]) => mockMarkNotApplicable(...args),
  computeProgress: (...args: unknown[]) => mockComputeProgress(...args),
}));

import { DocumentChecklist } from '../DocumentChecklist';

// --------------------------------------------------------------------------
// Helper: build mock document data
// --------------------------------------------------------------------------

function makeDoc(overrides: Partial<CaseDocument> = {}): CaseDocument {
  return {
    id: 'doc-1',
    case_id: 'case-1',
    user_id: 'user-1',
    document_key: 'psa-death-cert',
    label: 'PSA Death Certificate',
    category: 'Identity',
    description: 'Authenticated PSA Death Certificate.',
    required_when: 'always',
    is_obtained: false,
    is_not_applicable: false,
    obtained_date: null,
    note: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Tests — DocumentChecklist component
// --------------------------------------------------------------------------

describe('document-checklist > DocumentChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 0, percentage: 0 });
  });

  it('renders loading state initially', () => {
    mockListDocuments.mockReturnValue(new Promise(() => {})); // never resolves
    render(<DocumentChecklist caseId="case-1" userId="user-1" />);
    expect(screen.getByTestId('document-checklist-loading')).toBeInTheDocument();
  });

  it('renders document checklist after loading', async () => {
    const docs = [
      makeDoc({ id: 'doc-1', document_key: 'psa-death-cert', label: 'PSA Death Certificate' }),
      makeDoc({ id: 'doc-2', document_key: 'psa-birth-certs', label: 'PSA Birth Certificates' }),
    ];
    mockListDocuments.mockResolvedValue(docs);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 2, percentage: 0 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.getByText('PSA Death Certificate')).toBeInTheDocument();
    expect(screen.getByText('PSA Birth Certificates')).toBeInTheDocument();
  });

  it('displays progress bar with correct percentage', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: false }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 1, total: 2, percentage: 50 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.getByText(/1 of 2 obtained/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('shows obtained badge for checked-off documents', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({
        id: '1',
        document_key: 'psa-death-cert',
        is_obtained: true,
        obtained_date: '2026-02-01',
      }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 1, total: 1, percentage: 100 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.getByTestId('obtained-badge')).toBeInTheDocument();
    expect(screen.getByText(/Obtained: 2026-02-01/)).toBeInTheDocument();
  });

  it('shows N/A badge for not-applicable documents', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({
        id: '1',
        document_key: 'spa-overseas',
        label: 'SPA (per overseas heir)',
        is_not_applicable: true,
      }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 0, percentage: 0 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.getByTestId('na-badge')).toBeInTheDocument();
  });

  it('shows pending badge for unobtained documents', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({ id: '1', is_obtained: false, is_not_applicable: false }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 1, percentage: 0 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-badge')).toBeInTheDocument();
  });

  it('calls checkOffDocument when Check Off button clicked', async () => {
    const user = userEvent.setup();
    mockListDocuments.mockResolvedValue([
      makeDoc({ id: 'doc-1', document_key: 'psa-death-cert', is_obtained: false }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 1, percentage: 0 });
    mockCheckOffDocument.mockResolvedValue(undefined);

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('check-off-psa-death-cert'));

    expect(mockCheckOffDocument).toHaveBeenCalledWith(
      'doc-1',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      undefined,
    );
  });

  it('calls markNotApplicable when N/A button clicked', async () => {
    const user = userEvent.setup();
    mockListDocuments.mockResolvedValue([
      makeDoc({ id: 'doc-1', document_key: 'psa-death-cert', is_obtained: false }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 1, percentage: 0 });
    mockMarkNotApplicable.mockResolvedValue(undefined);

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('mark-na-psa-death-cert'));

    expect(mockMarkNotApplicable).toHaveBeenCalledWith('doc-1');
  });

  it('hides Check Off and N/A buttons for already obtained documents', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({
        id: '1',
        document_key: 'psa-death-cert',
        is_obtained: true,
        obtained_date: '2026-02-01',
      }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 1, total: 1, percentage: 100 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('check-off-psa-death-cert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mark-na-psa-death-cert')).not.toBeInTheDocument();
  });

  it('hides Check Off and N/A buttons for N/A documents', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({
        id: '1',
        document_key: 'spa-overseas',
        is_not_applicable: true,
      }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 0, percentage: 0 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('check-off-spa-overseas')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mark-na-spa-overseas')).not.toBeInTheDocument();
  });

  it('refreshes list after check-off action', async () => {
    const user = userEvent.setup();
    const docsBefore = [
      makeDoc({ id: 'doc-1', document_key: 'psa-death-cert', is_obtained: false }),
    ];
    const docsAfter = [
      makeDoc({
        id: 'doc-1',
        document_key: 'psa-death-cert',
        is_obtained: true,
        obtained_date: '2026-03-03',
      }),
    ];

    mockListDocuments
      .mockResolvedValueOnce(docsBefore)
      .mockResolvedValueOnce(docsAfter);
    mockComputeProgress
      .mockReturnValueOnce({ obtained: 0, total: 1, percentage: 0 })
      .mockReturnValueOnce({ obtained: 1, total: 1, percentage: 100 });
    mockCheckOffDocument.mockResolvedValue(undefined);

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('check-off-psa-death-cert'));

    await waitFor(() => {
      expect(mockListDocuments).toHaveBeenCalledTimes(2);
    });
  });

  it('renders N/A documents with strikethrough styling', async () => {
    mockListDocuments.mockResolvedValue([
      makeDoc({
        id: '1',
        document_key: 'spa-overseas',
        label: 'SPA (per overseas heir)',
        is_not_applicable: true,
      }),
    ]);
    mockComputeProgress.mockReturnValue({ obtained: 0, total: 0, percentage: 0 });

    render(<DocumentChecklist caseId="case-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('document-checklist')).toBeInTheDocument();
    });

    const label = screen.getByText('SPA (per overseas heir)');
    expect(label.className).toContain('line-through');
  });
});
