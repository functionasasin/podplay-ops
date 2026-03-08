import type { LucideIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  description: string
  cta?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon: Icon, heading, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">{heading}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {cta && (
        cta.href
          ? (
            <a href={cta.href} className={cn(buttonVariants({ variant: 'outline' }))}>
              {cta.label}
            </a>
          )
          : (
            <button
              type="button"
              onClick={cta.onClick}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              {cta.label}
            </button>
          )
      )}
    </div>
  )
}
