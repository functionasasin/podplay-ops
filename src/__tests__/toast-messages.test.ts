import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  TOAST_OPERATIONS,
  TOAST_SIGN_OUT_SUCCESS,
  TOAST_INTAKE_COMPLETE_SUCCESS,
  TOAST_BOM_ADD_ITEM_SUCCESS,
  TOAST_BOM_REMOVE_ITEM_SUCCESS,
  TOAST_CHECKLIST_TOGGLE_ERROR,
  TOAST_DEPLOYMENT_COMPLETE_SUCCESS,
  TOAST_FINAL_PAID_SUCCESS,
  TOAST_GUARD_DEPLOYMENT,
  TOAST_GUARD_FINANCIALS,
  TOAST_PROJECT_COMPLETE_SUCCESS,
} from '../lib/toast-messages'
import { showToast } from '../lib/toast'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

import { toast } from 'sonner'

const VALID_TYPES = ['success', 'error', 'info', 'warning'] as const

describe('TOAST_OPERATIONS registry — all operations', () => {
  it('all operations have a non-empty message string', () => {
    for (const [key, config] of Object.entries(TOAST_OPERATIONS)) {
      expect(typeof config.message, `${key}.message`).toBe('string')
      expect(config.message.length, `${key}.message is empty`).toBeGreaterThan(0)
    }
  })

  it('all operations have a positive duration number', () => {
    for (const [key, config] of Object.entries(TOAST_OPERATIONS)) {
      expect(typeof config.duration, `${key}.duration`).toBe('number')
      expect(config.duration, `${key}.duration is not positive`).toBeGreaterThan(0)
    }
  })

  it('all operations have a valid type', () => {
    for (const [key, config] of Object.entries(TOAST_OPERATIONS)) {
      expect(VALID_TYPES, `${key}.type invalid`).toContain(config.type)
    }
  })
})

describe('Toast message spot-checks — exact spec text', () => {
  it('1.1 sign-out success: "Signed out"', () => {
    expect(TOAST_SIGN_OUT_SUCCESS.message).toBe('Signed out')
    expect(TOAST_SIGN_OUT_SUCCESS.type).toBe('success')
    expect(TOAST_SIGN_OUT_SUCCESS.duration).toBe(3000)
  })

  it('3.1 intake complete success: "Project intake complete. BOM generated."', () => {
    expect(TOAST_INTAKE_COMPLETE_SUCCESS.message).toBe('Project intake complete. BOM generated.')
    expect(TOAST_INTAKE_COMPLETE_SUCCESS.type).toBe('success')
  })

  it('4.1.2 BOM add item success: "Item added to BOM"', () => {
    expect(TOAST_BOM_ADD_ITEM_SUCCESS.message).toBe('Item added to BOM')
    expect(TOAST_BOM_ADD_ITEM_SUCCESS.type).toBe('success')
  })

  it('4.1.4 BOM remove item success: "Item removed from BOM"', () => {
    expect(TOAST_BOM_REMOVE_ITEM_SUCCESS.message).toBe('Item removed from BOM')
    expect(TOAST_BOM_REMOVE_ITEM_SUCCESS.type).toBe('success')
  })

  it('5.1.1 checklist toggle error: "Failed to save step — change reverted"', () => {
    expect(TOAST_CHECKLIST_TOGGLE_ERROR.message).toBe('Failed to save step — change reverted')
    expect(TOAST_CHECKLIST_TOGGLE_ERROR.type).toBe('error')
    expect(TOAST_CHECKLIST_TOGGLE_ERROR.duration).toBe(5000)
  })

  it('5.4.5 deployment complete success: "Deployment complete! Stage 4 (Financials) is now unlocked."', () => {
    expect(TOAST_DEPLOYMENT_COMPLETE_SUCCESS.message).toBe(
      'Deployment complete! Stage 4 (Financials) is now unlocked.',
    )
    expect(TOAST_DEPLOYMENT_COMPLETE_SUCCESS.type).toBe('success')
  })

  it('6.1.5 final paid success: "Project completed! Final payment recorded."', () => {
    expect(TOAST_FINAL_PAID_SUCCESS.message).toBe('Project completed! Final payment recorded.')
    expect(TOAST_FINAL_PAID_SUCCESS.type).toBe('success')
  })

  it('9.2 guard deployment warning: "Complete procurement before accessing deployment."', () => {
    expect(TOAST_GUARD_DEPLOYMENT.message).toBe(
      'Complete procurement before accessing deployment.',
    )
    expect(TOAST_GUARD_DEPLOYMENT.type).toBe('warning')
    expect(TOAST_GUARD_DEPLOYMENT.duration).toBe(4000)
  })

  it('9.3 guard financials warning: "Complete deployment before accessing financials."', () => {
    expect(TOAST_GUARD_FINANCIALS.message).toBe(
      'Complete deployment before accessing financials.',
    )
    expect(TOAST_GUARD_FINANCIALS.type).toBe('warning')
    expect(TOAST_GUARD_FINANCIALS.duration).toBe(4000)
  })

  it('6.3.3 project complete success: "Project marked as completed!"', () => {
    expect(TOAST_PROJECT_COMPLETE_SUCCESS.message).toBe('Project marked as completed!')
    expect(TOAST_PROJECT_COMPLETE_SUCCESS.type).toBe('success')
  })
})

describe('showToast wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls toast.success with correct message and duration for success operation', () => {
    showToast('SIGN_OUT_SUCCESS')
    expect(toast.success).toHaveBeenCalledWith('Signed out', { duration: 3000 })
  })

  it('calls toast.error with correct message and duration for error operation', () => {
    showToast('CREATE_PROJECT_ERROR')
    expect(toast.error).toHaveBeenCalledWith('Failed to create project', { duration: 5000 })
  })

  it('calls toast.warning with correct message and duration for warning operation', () => {
    showToast('GUARD_DEPLOYMENT')
    expect(toast.warning).toHaveBeenCalledWith(
      'Complete procurement before accessing deployment.',
      { duration: 4000 },
    )
  })

  it('logs a warning and does not throw for an unknown operation key', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    showToast('NONEXISTENT_KEY')
    expect(warnSpy).toHaveBeenCalledWith('showToast: unknown operation key "NONEXISTENT_KEY"')
    warnSpy.mockRestore()
  })
})
