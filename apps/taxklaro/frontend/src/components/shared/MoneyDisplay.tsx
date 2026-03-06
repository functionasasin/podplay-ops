import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: string | number;
  className?: string;
  prefix?: string;
}

function formatPeso(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₱0.00';
  return num.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
}

export function MoneyDisplay({ amount, className, prefix }: MoneyDisplayProps) {
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formatPeso(amount)}
    </span>
  );
}

export default MoneyDisplay;
