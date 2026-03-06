import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { PathAResult, PathBResult, PathCResult } from '@/types/engine-output';

interface PathDetailAccordionProps {
  pathADetails: PathAResult | null;
  pathBDetails: PathBResult | null;
  pathCDetails: PathCResult | null;
}

function formatPeso(value: string): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatPeso(value)}</span>
    </div>
  );
}

export function PathDetailAccordion({ pathADetails, pathBDetails, pathCDetails }: PathDetailAccordionProps) {
  const hasAny = pathADetails || pathBDetails || pathCDetails;
  if (!hasAny) return null;

  return (
    <Accordion type="multiple" className="space-y-1">
      {pathADetails && (
        <AccordionItem value="path-a" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <span>{pathADetails.pathLabel}</span>
              {!pathADetails.eligible && <Badge variant="outline" className="text-xs">Ineligible</Badge>}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-1 pt-1 pb-3">
            <Row label="Total Deductions" value={pathADetails.totalDeductions} />
            <Row label="Business NTI" value={pathADetails.bizNti} />
            <Row label="Total NTI" value={pathADetails.totalNti} />
            <Row label="Income Tax Due" value={pathADetails.incomeTaxDue} />
            {parseFloat(pathADetails.earCapApplied) > 0 && (
              <Row label="EAR Cap Applied" value={pathADetails.earCapApplied} />
            )}
            {parseFloat(pathADetails.deductionBreakdown.nolco) > 0 && (
              <Row label="NOLCO Applied" value={pathADetails.deductionBreakdown.nolco} />
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {pathBDetails && (
        <AccordionItem value="path-b" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span>{pathBDetails.pathLabel}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-1 pt-1 pb-3">
            <Row label="OSD Base" value={pathBDetails.osdBase} />
            <Row label="OSD Amount (40%)" value={pathBDetails.osdAmount} />
            <Row label="Business NTI" value={pathBDetails.bizNti} />
            <Row label="Total NTI" value={pathBDetails.totalNti} />
            <Row label="Income Tax Due" value={pathBDetails.incomeTaxDue} />
          </AccordionContent>
        </AccordionItem>
      )}

      {pathCDetails && (
        <AccordionItem value="path-c" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <span>{pathCDetails.pathLabel}</span>
              {!pathCDetails.eligible && <Badge variant="outline" className="text-xs">Ineligible</Badge>}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-1 pt-1 pb-3">
            {parseFloat(pathCDetails.exemptAmount) > 0 && (
              <Row label="Exempt Amount (₱250K)" value={pathCDetails.exemptAmount} />
            )}
            <Row label="Taxable Base" value={pathCDetails.taxableBase} />
            <Row label="Income Tax Due (8%)" value={pathCDetails.incomeTaxDue} />
            {parseFloat(pathCDetails.compensationIt) > 0 && (
              <Row label="Compensation Income Tax" value={pathCDetails.compensationIt} />
            )}
            <Row label="Total Income Tax" value={pathCDetails.totalIncomeTax} />
            {pathCDetails.ptWaived && (
              <p className="text-xs text-muted-foreground pt-1">
                Percentage tax waived (8% flat rate election)
              </p>
            )}
            {!pathCDetails.eligible && pathCDetails.ineligibleReasons.length > 0 && (
              <div className="pt-1 space-y-0.5">
                <p className="text-xs font-medium text-destructive">Ineligibility reasons:</p>
                {pathCDetails.ineligibleReasons.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{r}</p>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

export default PathDetailAccordion;
