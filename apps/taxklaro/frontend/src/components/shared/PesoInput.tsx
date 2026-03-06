import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PesoInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PesoInput({ value, onChange, placeholder = '0.00', disabled, className, id }: PesoInputProps) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-7 h-11"
      />
    </div>
  );
}

export default PesoInput;
