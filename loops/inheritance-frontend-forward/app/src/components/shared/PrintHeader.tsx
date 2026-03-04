export interface PrintHeaderProps {
  firmName: string;
  caseTitle: string;
}

/**
 * Header component shown only in print media.
 * Displays firm name, case title, and page number.
 * Hidden on screen via the `print-header` CSS class (see print.css).
 */
export function PrintHeader({ firmName, caseTitle }: PrintHeaderProps) {
  return (
    <div className="print-header">
      {firmName && <div>{firmName}</div>}
      <div>{caseTitle}</div>
    </div>
  );
}
