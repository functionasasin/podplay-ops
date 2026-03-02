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
  // stub — will be implemented
  void letterheadColor;
  void secondaryColor;
  void onLetterheadChange;
  void onSecondaryChange;
  return <div data-testid="color-pickers">Stub</div>;
}
