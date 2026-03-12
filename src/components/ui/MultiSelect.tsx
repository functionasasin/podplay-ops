import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MultiSelectProps {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect({ options, values, onChange, placeholder = 'Select...', disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? options.filter((o) => !values.includes(o.value) && o.label.toLowerCase().includes(query.toLowerCase()))
    : options.filter((o) => !values.includes(o.value));

  function openDropdown() {
    if (disabled) return;
    setQuery('');
    setActiveIndex(-1);
    setOpen(true);
  }

  function selectOption(opt: { value: string; label: string }) {
    onChange([...values, opt.value]);
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function removeValue(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setActiveIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        selectOption(filtered[activeIndex]);
      }
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedLabels = values.map((v) => ({
    value: v,
    label: options.find((o) => o.value === v)?.label ?? v,
  }));

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={values.length === 0 ? placeholder : 'Add another…'}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            if (!open) setOpen(true);
          }}
          onFocus={openDropdown}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </div>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground"
            >
              {item.label}
              <button
                type="button"
                onClick={() => removeValue(item.value)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Remove ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background py-1 text-sm shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">No options found</li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(opt);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'cursor-pointer px-3 py-2 transition-colors',
                  i === activeIndex && 'bg-accent text-accent-foreground',
                )}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export { MultiSelect };
