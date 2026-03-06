/**
 * Stage 18 — Component Wiring Test
 *
 * Verifies spec §14 rules:
 * §14.1 — All component files exist
 * §14.2 — Orphan prevention rules
 * §14.3 — Action trigger map (key components have handlers)
 * §14.4 — Visibility rules (spot checks)
 * §14.5 — ResultsView readOnly contract
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');
const COMPONENTS = path.join(SRC, 'components');

function componentExists(relPath: string): boolean {
  return fs.existsSync(path.join(COMPONENTS, relPath));
}

function routeExists(relPath: string): boolean {
  return fs.existsSync(path.join(SRC, 'routes', relPath));
}

function readComponent(relPath: string): string {
  return fs.readFileSync(path.join(COMPONENTS, relPath), 'utf-8');
}

function readRoute(relPath: string): string {
  return fs.readFileSync(path.join(SRC, 'routes', relPath), 'utf-8');
}

// ─── §14.1 Directory Structure ────────────────────────────────────────────────

describe('§14.1 component files exist', () => {
  const required = [
    // layout
    'layout/AppLayout.tsx',
    'layout/SidebarContent.tsx',
    // root
    'TaxKlaroLogo.tsx',
    // pages
    'pages/LandingPage.tsx',
    'pages/DashboardPage.tsx',
    'pages/SetupPage.tsx',
    // computation
    'computation/ComputationCard.tsx',
    'computation/ComputationCardSkeleton.tsx',
    'computation/ComputationPageHeader.tsx',
    'computation/ActionsBar.tsx',
    'computation/WizardPage.tsx',
    'computation/WizardForm.tsx',
    'computation/ResultsView.tsx',
    'computation/AutoSaveIndicator.tsx',
    'computation/ShareToggle.tsx',
    'computation/DeleteComputationDialog.tsx',
    'computation/NotesList.tsx',
    'computation/AddNoteForm.tsx',
    'computation/DeadlinesList.tsx',
    'computation/QuarterlyBreakdownView.tsx',
    // wizard steps (17)
    'wizard/steps/WizardStep00.tsx',
    'wizard/steps/WizardStep01.tsx',
    'wizard/steps/WizardStep02.tsx',
    'wizard/steps/WizardStep03.tsx',
    'wizard/steps/WizardStep04.tsx',
    'wizard/steps/WizardStep05.tsx',
    'wizard/steps/WizardStep06.tsx',
    'wizard/steps/WizardStep07A.tsx',
    'wizard/steps/WizardStep07B.tsx',
    'wizard/steps/WizardStep07C.tsx',
    'wizard/steps/WizardStep07D.tsx',
    'wizard/steps/WizardStep08.tsx',
    'wizard/steps/WizardStep09.tsx',
    'wizard/steps/WizardStep10.tsx',
    'wizard/steps/WizardStep11.tsx',
    'wizard/steps/WizardStep12.tsx',
    'wizard/steps/WizardStep13.tsx',
    // wizard shared
    'wizard/WizardProgressBar.tsx',
    'wizard/WizardNavControls.tsx',
    // results (11)
    'results/WarningsBanner.tsx',
    'results/RegimeComparisonTable.tsx',
    'results/RecommendationBanner.tsx',
    'results/TaxBreakdownPanel.tsx',
    'results/BalancePayableSection.tsx',
    'results/InstallmentSection.tsx',
    'results/PercentageTaxSummary.tsx',
    'results/BirFormRecommendation.tsx',
    'results/PenaltySummary.tsx',
    'results/ManualReviewFlags.tsx',
    'results/PathDetailAccordion.tsx',
    // clients
    'clients/ClientsTable.tsx',
    'clients/ClientRowSkeleton.tsx',
    'clients/ClientInfoCard.tsx',
    // deadlines
    'deadlines/DeadlineCard.tsx',
    // settings
    'settings/PersonalInfoSection.tsx',
    'settings/FirmBrandingSection.tsx',
    'settings/BirInfoSection.tsx',
    'settings/DangerZoneSection.tsx',
    'settings/MembersTable.tsx',
    'settings/PendingInvitationsTable.tsx',
    'settings/InviteMemberForm.tsx',
    // shared-computation
    'shared-computation/SharedComputationView.tsx',
    'shared-computation/SharedComputationNotFound.tsx',
    // shared
    'shared/EmptyState.tsx',
    'shared/PageHeader.tsx',
    'shared/FilterBar.tsx',
    'shared/PesoInput.tsx',
    'shared/MoneyDisplay.tsx',
    // pdf
    'pdf/TaxComputationDocument.tsx',
    // onboarding
    'onboarding/OnboardingForm.tsx',
    // root
    'ErrorBoundary.tsx',
  ];

  for (const relPath of required) {
    it(`exists: ${relPath}`, () => {
      expect(componentExists(relPath), `Missing: components/${relPath}`).toBe(true);
    });
  }
});

// ─── §14.2 Orphan Prevention Rules ────────────────────────────────────────────

describe('§14.2 orphan prevention', () => {
  it('rule 2: WizardPage imports all 17 wizard step files', () => {
    const content = readComponent('computation/WizardPage.tsx');
    const steps = [
      'WizardStep00', 'WizardStep01', 'WizardStep02', 'WizardStep03',
      'WizardStep04', 'WizardStep05', 'WizardStep06', 'WizardStep07A',
      'WizardStep07B', 'WizardStep07C', 'WizardStep07D', 'WizardStep08',
      'WizardStep09', 'WizardStep10', 'WizardStep11', 'WizardStep12',
      'WizardStep13',
    ];
    for (const step of steps) {
      expect(content, `WizardPage.tsx missing import for ${step}`).toContain(step);
    }
  });

  it('rule 3: ResultsView imports all 11 results sub-components', () => {
    const content = readComponent('computation/ResultsView.tsx');
    const subs = [
      'WarningsBanner', 'RegimeComparisonTable', 'RecommendationBanner',
      'TaxBreakdownPanel', 'BalancePayableSection', 'InstallmentSection',
      'PercentageTaxSummary', 'BirFormRecommendation', 'PenaltySummary',
      'ManualReviewFlags', 'PathDetailAccordion',
    ];
    for (const sub of subs) {
      expect(content, `ResultsView.tsx missing import for ${sub}`).toContain(sub);
    }
  });

  it('rule 4: ActionsBar has lazy PDF import marker comment', () => {
    const content = readComponent('computation/ActionsBar.tsx');
    expect(content).toContain('TaxComputationDocument');
  });

  it('rule 5: EmptyState is in shared/ — no per-page variants', () => {
    expect(componentExists('shared/EmptyState.tsx')).toBe(true);
    // Ensure there are no other EmptyState files outside shared/
    const pagesDir = path.join(COMPONENTS, 'pages');
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir);
      expect(pageFiles.filter((f) => f.toLowerCase().includes('emptystate'))).toHaveLength(0);
    }
  });
});

// ─── §14.3 Action Trigger Map ─────────────────────────────────────────────────

describe('§14.3 action trigger map', () => {
  it('ActionsBar has handleCompute / Compute button', () => {
    const content = readComponent('computation/ActionsBar.tsx');
    expect(content).toContain('onCompute');
    expect(content).toMatch(/Compute|compute/);
  });

  it('ActionsBar has Finalize action', () => {
    const content = readComponent('computation/ActionsBar.tsx');
    expect(content).toContain('onFinalize');
    expect(content).toContain('Finalize');
  });

  it('ActionsBar has Share button', () => {
    const content = readComponent('computation/ActionsBar.tsx');
    expect(content).toContain('onShare');
    expect(content).toContain('Share');
  });

  it('ShareToggle has Copy and Rotate link actions', () => {
    const content = readComponent('computation/ShareToggle.tsx');
    expect(content).toContain('clipboard');
    expect(content).toContain('onRotate');
  });

  it('InviteMemberForm has onInvite handler', () => {
    const content = readComponent('settings/InviteMemberForm.tsx');
    expect(content).toContain('onInvite');
    expect(content).toContain('Send Invitation');
  });

  it('AddNoteForm has onAdd handler', () => {
    const content = readComponent('computation/AddNoteForm.tsx');
    expect(content).toContain('onAdd');
    expect(content).toContain('Add Note');
  });
});

// ─── §14.4 Component Visibility Rules ────────────────────────────────────────

describe('§14.4 component visibility rules', () => {
  it('DangerZoneSection doc references admin role', () => {
    const content = readComponent('settings/DangerZoneSection.tsx');
    expect(content.toLowerCase()).toMatch(/admin/);
  });

  it('ActionsBar returns null when readOnly=true', () => {
    const content = readComponent('computation/ActionsBar.tsx');
    // ActionsBar should return null/hide when readOnly
    expect(content).toMatch(/readOnly/);
    expect(content).toMatch(/null|hidden/i);
  });
});

// ─── §14.5 ResultsView ReadOnly Contract ─────────────────────────────────────

describe('§14.5 ResultsView readOnly contract', () => {
  it('ResultsView accepts readOnly prop', () => {
    const content = readComponent('computation/ResultsView.tsx');
    expect(content).toContain('readOnly');
  });

  it('share/$token route passes readOnly={true} to ResultsView', () => {
    const content = readRoute('share/$token.tsx');
    expect(content).toContain('readOnly={true}');
    expect(content).toContain('ResultsView');
  });

  it('18 route files exist', () => {
    const routeFiles = [
      '__root.tsx',
      'index.tsx',
      'auth.tsx',
      'auth/callback.tsx',
      'auth/reset.tsx',
      'auth/reset-confirm.tsx',
      'computations/index.tsx',
      'computations/new.tsx',
      'computations/$compId.tsx',
      'computations/$compId.quarterly.tsx',
      'clients/index.tsx',
      'clients/new.tsx',
      'clients/$clientId.tsx',
      'deadlines.tsx',
      'settings/index.tsx',
      'settings/team.tsx',
      'onboarding.tsx',
      'share/$token.tsx',
      'invite/$token.tsx',
    ];
    for (const r of routeFiles) {
      expect(routeExists(r), `Missing route: ${r}`).toBe(true);
    }
  });
});
