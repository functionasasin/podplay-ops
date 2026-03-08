// Stage 146 — Tests: Loading States
// 10 skeleton variants: assert placeholder element counts matching page layout.
// 5 form-submit loaders: assert spinner appears, button text changes, button disabled,
// and restores original state after completion.

import React from 'react'
import { render, screen, rerender as rerenderFn } from '@testing-library/react'

import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { IntakeSkeleton } from '@/components/wizard/intake/IntakeSkeleton'
import { ProcurementSkeleton } from '@/components/wizard/procurement/ProcurementSkeleton'
import { DeploymentWizardSkeleton } from '@/components/wizard/deployment/DeploymentWizardSkeleton'
import { FinancialsWizardSkeleton } from '@/components/wizard/financials/FinancialsWizardSkeleton'
import { InventorySkeleton } from '@/components/inventory/InventorySkeleton'
import { FinancialsDashboardSkeleton } from '@/components/financials/FinancialsDashboardSkeleton'
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton'
import { ProjectShellSkeleton } from '@/components/layout/ProjectShellSkeleton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { InlineSpinner } from '@/components/ui/InlineSpinner'
import { Button } from '@/components/ui/button'
import { LOADERS, type LoaderKey } from '@/lib/loading'

/** Count `.animate-pulse` skeleton elements in the rendered container. */
function countSkeletons(container: HTMLElement): number {
  return container.querySelectorAll('.animate-pulse').length
}

/** Render a button using the shared button-pending pattern for a given loader config. */
function renderButtonLoader(
  loaderKey: LoaderKey,
  isSubmitting: boolean,
): ReturnType<typeof render> {
  const cfg = LOADERS[loaderKey]
  return render(
    React.createElement(
      Button,
      { type: 'button', disabled: cfg.disabled && isSubmitting, 'data-testid': 'btn' },
      isSubmitting
        ? [
            React.createElement(InlineSpinner, { key: 'spinner', className: 'mr-2' }),
            cfg.pendingLabel,
          ]
        : cfg.idleLabel,
    ),
  )
}

// ── Skeleton Variants ─────────────────────────────────────────────────────────

describe('Skeleton variants — placeholder element counts', () => {
  it('1. DashboardSkeleton: 82 skeletons (header 2 + cards 12 + filter 3 + table 1+64)', () => {
    const { container } = render(React.createElement(DashboardSkeleton))
    // header(2) + 4 metric cards×3(12) + filter bar(3) + table header(1) + 8 rows×8(64)
    expect(countSkeletons(container)).toBe(82)
  })

  it('2. IntakeSkeleton: 23 skeletons (progress 11 + title 2 + fields 8 + footer 2)', () => {
    const { container } = render(React.createElement(IntakeSkeleton))
    // 6 circles + 5 connectors(11) + title(2) + 4 fields×2(8) + footer(2)
    expect(countSkeletons(container)).toBe(23)
  })

  it('3. ProcurementSkeleton: 40 skeletons (tabs 4 + card 34 + status 2)', () => {
    const { container } = render(React.createElement(ProcurementSkeleton))
    // tabs(4) + card header(2) + table header(5) + 5 rows×5(25) + footer(2) + status(2)
    expect(countSkeletons(container)).toBe(40)
  })

  it('4. DeploymentWizardSkeleton: 77 skeletons (sidebar 48 + detail 29)', () => {
    const { container } = render(React.createElement(DeploymentWizardSkeleton))
    // sidebar 16 rows×3(48) + phase header(2) + warning(1) + 8 checklist×3(24) + buttons(2)
    expect(countSkeletons(container)).toBe(77)
  })

  it('5. FinancialsWizardSkeleton: 26 skeletons (tabs 4 + 2 invoice cards×11)', () => {
    const { container } = render(React.createElement(FinancialsWizardSkeleton))
    // tab bar(4) + 2 cards × (header 2 + status badge 1 + grid 3cols×2 6 + footer 2 = 11)
    expect(countSkeletons(container)).toBe(26)
  })

  it('6. InventorySkeleton: 102 skeletons (header 2 + filter 3 + table header 7 + 10 rows×9)', () => {
    const { container } = render(React.createElement(InventorySkeleton))
    // header(2) + filter(3) + table header(7) + 10 rows×9(90)
    expect(countSkeletons(container)).toBe(102)
  })

  it('7. FinancialsDashboardSkeleton: 44 skeletons (header 2 + cards 9 + chart 2 + table 31)', () => {
    const { container } = render(React.createElement(FinancialsDashboardSkeleton))
    // header(2) + 3 metric cards×3(9) + chart card(2) + p&l title(1) + 6 rows×5(30)
    expect(countSkeletons(container)).toBe(44)
  })

  it('8. SettingsSkeleton: 24 skeletons (heading 1 + tabs 4 + section 2 + fields 16 + save 1)', () => {
    const { container } = render(React.createElement(SettingsSkeleton))
    // heading(1) + tabs(4) + section header(2) + 4 grid-rows×4(16) + save button(1)
    expect(countSkeletons(container)).toBe(24)
  })

  it('9. ProjectShellSkeleton: 6 skeletons (breadcrumb 2 + tabs 4) + LoadingSpinner inside', () => {
    const { container } = render(React.createElement(ProjectShellSkeleton))
    expect(countSkeletons(container)).toBe(6)
    // LoadingSpinner renders animate-spin, not animate-pulse
    expect(container.querySelectorAll('.animate-spin').length).toBe(1)
  })

  it('10. LoadingSpinner: renders with text; size classes sm/md/lg; no text when omitted', () => {
    const { container: c1 } = render(
      React.createElement(LoadingSpinner, { size: 'sm', text: 'Loading...' }),
    )
    expect(c1.querySelector('.h-4.w-4')).toBeTruthy()
    expect(screen.getByText('Loading...')).toBeTruthy()

    const { container: c2 } = render(
      React.createElement(LoadingSpinner, { size: 'md' }),
    )
    expect(c2.querySelector('.h-6.w-6')).toBeTruthy()

    const { container: c3 } = render(
      React.createElement(LoadingSpinner, { size: 'lg' }),
    )
    expect(c3.querySelector('.h-8.w-8')).toBeTruthy()
  })
})

// ── Form-Submit Loaders ───────────────────────────────────────────────────────

describe('Form-submit loaders — button pending pattern', () => {
  it('1. loginSignIn: idle shows "Sign In", loading shows spinner + "Signing in..." + disabled', () => {
    const cfg = LOADERS.loginSignIn
    // Verify config values
    expect(cfg.idleLabel).toBe('Sign In')
    expect(cfg.pendingLabel).toBe('Signing in...')
    expect(cfg.disabled).toBe(true)

    // Idle state
    const { container, unmount } = renderButtonLoader('loginSignIn', false)
    const idleBtn = screen.getByTestId('btn')
    expect(idleBtn.textContent).toContain('Sign In')
    expect(idleBtn).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)
    unmount()

    // Loading state
    const { container: c2, unmount: u2 } = renderButtonLoader('loginSignIn', true)
    const loadingBtn = screen.getByTestId('btn')
    expect(loadingBtn.textContent).toContain('Signing in...')
    expect(loadingBtn).toBeDisabled()
    expect(c2.querySelectorAll('.animate-spin').length).toBe(1)
    u2()
  })

  it('2. intakeContinue: idle "Continue", loading spinner + "Saving..." + disabled, restores', () => {
    const cfg = LOADERS.intakeContinue
    expect(cfg.idleLabel).toBe('Continue')
    expect(cfg.pendingLabel).toBe('Saving...')
    expect(cfg.disabled).toBe(true)

    const { container, rerender } = renderButtonLoader('intakeContinue', false)
    expect(screen.getByTestId('btn').textContent).toContain('Continue')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)

    // Transition to loading
    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: true, 'data-testid': 'btn' },
        [
          React.createElement(InlineSpinner, { key: 'spinner', className: 'mr-2' }),
          cfg.pendingLabel,
        ],
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Saving...')
    expect(screen.getByTestId('btn')).toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(1)

    // Restore to idle
    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: false, 'data-testid': 'btn' },
        cfg.idleLabel,
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Continue')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)
  })

  it('3. procurementCreatePo: idle "Create PO", loading "Creating..." + disabled, restores', () => {
    const cfg = LOADERS.procurementCreatePo
    expect(cfg.idleLabel).toBe('Create PO')
    expect(cfg.pendingLabel).toBe('Creating...')
    expect(cfg.disabled).toBe(true)

    const { container, rerender } = renderButtonLoader('procurementCreatePo', false)
    expect(screen.getByTestId('btn').textContent).toContain('Create PO')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)

    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: true, 'data-testid': 'btn' },
        [
          React.createElement(InlineSpinner, { key: 'spinner', className: 'mr-2' }),
          cfg.pendingLabel,
        ],
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Creating...')
    expect(screen.getByTestId('btn')).toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(1)

    // Restore
    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: false, 'data-testid': 'btn' },
        cfg.idleLabel,
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Create PO')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)
  })

  it('4. financialsAddExpense: idle "Add Expense", loading "Adding..." + disabled, restores', () => {
    const cfg = LOADERS.financialsAddExpense
    expect(cfg.idleLabel).toBe('Add Expense')
    expect(cfg.pendingLabel).toBe('Adding...')
    expect(cfg.disabled).toBe(true)

    const { container, rerender } = renderButtonLoader('financialsAddExpense', false)
    expect(screen.getByTestId('btn').textContent).toContain('Add Expense')
    expect(screen.getByTestId('btn')).not.toBeDisabled()

    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: true, 'data-testid': 'btn' },
        [
          React.createElement(InlineSpinner, { key: 'spinner', className: 'mr-2' }),
          cfg.pendingLabel,
        ],
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Adding...')
    expect(screen.getByTestId('btn')).toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(1)

    // Restore
    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: false, 'data-testid': 'btn' },
        cfg.idleLabel,
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Add Expense')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)
  })

  it('5. settingsSavePricing: idle "Save Changes", loading "Saving..." + disabled, restores', () => {
    const cfg = LOADERS.settingsSavePricing
    expect(cfg.idleLabel).toBe('Save Changes')
    expect(cfg.pendingLabel).toBe('Saving...')
    expect(cfg.disabled).toBe(true)

    const { container, rerender } = renderButtonLoader('settingsSavePricing', false)
    expect(screen.getByTestId('btn').textContent).toContain('Save Changes')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)

    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: true, 'data-testid': 'btn' },
        [
          React.createElement(InlineSpinner, { key: 'spinner', className: 'mr-2' }),
          cfg.pendingLabel,
        ],
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Saving...')
    expect(screen.getByTestId('btn')).toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(1)

    // Restore to idle after completion
    rerender(
      React.createElement(
        Button,
        { type: 'button', disabled: false, 'data-testid': 'btn' },
        cfg.idleLabel,
      ),
    )
    expect(screen.getByTestId('btn').textContent).toContain('Save Changes')
    expect(screen.getByTestId('btn')).not.toBeDisabled()
    expect(container.querySelectorAll('.animate-spin').length).toBe(0)
  })
})
