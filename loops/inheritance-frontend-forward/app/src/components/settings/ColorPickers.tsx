import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface ColorPickersProps {
  letterheadColor: string;
  secondaryColor: string;
  onLetterheadChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
}

export function ColorPickers({
  letterheadColor,
  secondaryColor,
  onLetterheadChange,
  onSecondaryChange,
}: ColorPickersProps) {
  return (
    <div data-testid="color-pickers" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="letterheadColor">Letterhead Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={letterheadColor}
            onChange={(e) => onLetterheadChange(e.target.value.toUpperCase())}
            className="h-10 w-14 cursor-pointer rounded border"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Input
            id="letterheadColor"
            value={letterheadColor}
            onChange={(e) => onLetterheadChange(e.target.value)}
            className="w-28 font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondaryColor">Secondary Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => onSecondaryChange(e.target.value.toUpperCase())}
            className="h-10 w-14 cursor-pointer rounded border"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Input
            id="secondaryColor"
            value={secondaryColor}
            onChange={(e) => onSecondaryChange(e.target.value)}
            className="w-28 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
