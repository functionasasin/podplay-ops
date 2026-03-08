import { toast } from 'sonner'
import { TOAST_OPERATIONS } from './toast-messages'

/**
 * Show a toast by operation key. Looks up message, duration, and type
 * from the TOAST_OPERATIONS registry in toast-messages.ts.
 */
export function showToast(operation: string): void {
  const config = TOAST_OPERATIONS[operation]
  if (!config) {
    console.warn(`showToast: unknown operation key "${operation}"`)
    return
  }
  const options = { duration: config.duration }
  switch (config.type) {
    case 'success':
      toast.success(config.message, options)
      break
    case 'error':
      toast.error(config.message, options)
      break
    case 'warning':
      toast.warning(config.message, options)
      break
    case 'info':
      toast.info(config.message, options)
      break
  }
}

/** Convenience helper — fires a success toast for the given operation key. */
export function toastSuccess(operation: string): void {
  showToast(operation)
}

/** Convenience helper — fires an error toast for the given operation key. */
export function toastError(operation: string): void {
  showToast(operation)
}
