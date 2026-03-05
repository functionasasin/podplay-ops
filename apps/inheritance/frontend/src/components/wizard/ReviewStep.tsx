import { useState, useMemo } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { EngineInput, Person, Relationship, ScenarioCode } from '../../types';
import { formatPeso } from '../../types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

export interface ReviewStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  hasWill: boolean;
  persons: Person[];
  onSubmit?: () => void;
}

interface Warning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

const LC_GROUP: Relationship[] = ['LegitimateChild', 'LegitimatedChild', 'AdoptedChild'];
const ASCENDANT_GROUP: Relationship[] = ['LegitimateParent', 'LegitimateAscendant'];

function predictScenario(
  hasWill: boolean,
  familyTree: Person[],
): ScenarioCode {
  const alive = familyTree.filter((p) => p.is_alive_at_succession);
  const hasLC = alive.some((p) => LC_GROUP.includes(p.relationship_to_decedent));
  const hasIC = alive.some((p) => p.relationship_to_decedent === 'IllegitimateChild');
  const hasSS = alive.some((p) => p.relationship_to_decedent === 'SurvivingSpouse');
  const hasAscendant = alive.some((p) => ASCENDANT_GROUP.includes(p.relationship_to_decedent));
  const hasCollateral = alive.some((p) =>
    ['Sibling', 'NephewNiece', 'OtherCollateral'].includes(p.relationship_to_decedent),
  );

  const prefix = hasWill ? 'T' : 'I';

  if (alive.length === 0) return `${prefix}15` as ScenarioCode;

  if (hasLC && hasSS && hasIC) return `${prefix}4` as ScenarioCode;
  if (hasLC && hasSS) return `${prefix}1` as ScenarioCode;
  if (hasLC && hasIC) return `${prefix}3` as ScenarioCode;
  if (hasLC) return `${prefix}2` as ScenarioCode;
  if (hasIC && hasSS) return `${prefix}5a` as ScenarioCode;
  if (hasIC) return `${prefix}6` as ScenarioCode;
  if (hasSS && hasAscendant) return `${prefix}7` as ScenarioCode;
  if (hasSS) return `${prefix}8` as ScenarioCode;
  if (hasAscendant) return `${prefix}9` as ScenarioCode;
  if (hasCollateral) return `${prefix}10` as ScenarioCode;

  return `${prefix}15` as ScenarioCode;
}

function computeWarnings(
  formValues: EngineInput,
  hasWill: boolean,
): Warning[] {
  const warnings: Warning[] = [];
  const familyTree = formValues.family_tree || [];
  const decedent = formValues.decedent;
  const will = formValues.will;

  // 1. IC with filiation_proved=false
  for (const person of familyTree) {
    if (
      person.relationship_to_decedent === 'IllegitimateChild' &&
      !person.filiation_proved
    ) {
      warnings.push({
        id: `ic-filiation-${person.id}`,
        severity: 'warning',
        message: `Art. 887 ¶3: IC "${person.name}" will be excluded`,
      });
    }
  }

  // 2. Rescinded adoption
  for (const person of familyTree) {
    if (
      person.relationship_to_decedent === 'AdoptedChild' &&
      person.adoption &&
      (person.adoption as { is_rescinded?: boolean }).is_rescinded
    ) {
      warnings.push({
        id: `rescinded-adoption-${person.id}`,
        severity: 'warning',
        message: `RA 8552 Sec. 20: AC "${person.name}" excluded`,
      });
    }
  }

  // 3. Unworthy + not condoned
  for (const person of familyTree) {
    if (person.is_unworthy && !person.unworthiness_condoned) {
      warnings.push({
        id: `unworthy-${person.id}`,
        severity: 'warning',
        message: `Art. 1032: "${person.name}" excluded unless condoned`,
      });
    }
  }

  // 4. Spouse guilty in legal separation
  for (const person of familyTree) {
    if (
      person.relationship_to_decedent === 'SurvivingSpouse' &&
      person.is_guilty_party_in_legal_separation
    ) {
      warnings.push({
        id: `spouse-guilty-${person.id}`,
        severity: 'warning',
        message: 'Art. 1002: Spouse excluded',
      });
    }
  }

  // 8. LC-group present + ascendants
  const hasDescendants = familyTree.some((p) =>
    LC_GROUP.includes(p.relationship_to_decedent) && p.is_alive_at_succession,
  );
  const hasAscendants = familyTree.some((p) =>
    ASCENDANT_GROUP.includes(p.relationship_to_decedent),
  );
  if (hasDescendants && hasAscendants) {
    warnings.push({
      id: 'ascendants-excluded',
      severity: 'info',
      message: 'Ascendants excluded by descendants',
    });
  }

  // 10. Empty will (testate with no dispositions)
  if (
    hasWill &&
    will &&
    (will.institutions?.length || 0) === 0 &&
    (will.legacies?.length || 0) === 0 &&
    (will.devises?.length || 0) === 0 &&
    (will.disinheritances?.length || 0) === 0
  ) {
    warnings.push({
      id: 'empty-will',
      severity: 'info',
      message: 'Will has no dispositions',
    });
  }

  // 11. Spouse without married decedent
  const hasSpouse = familyTree.some(
    (p) => p.relationship_to_decedent === 'SurvivingSpouse',
  );
  if (hasSpouse && !decedent.is_married) {
    warnings.push({
      id: 'spouse-unmarried',
      severity: 'warning',
      message: 'Inconsistency: spouse in tree but decedent unmarried',
    });
  }

  // 12. Empty family tree (escheat)
  if (familyTree.length === 0) {
    warnings.push({
      id: 'escheat',
      severity: 'info',
      message: 'No heirs — estate will escheat to the State (I15)',
    });
  }

  // 13. All heirs marked deceased
  if (
    familyTree.length > 0 &&
    familyTree.every((p) => !p.is_alive_at_succession)
  ) {
    warnings.push({
      id: 'all-predeceased',
      severity: 'info',
      message: 'All heirs predeceased — pipeline restart likely',
    });
  }

  return warnings;
}

const SEVERITY_STYLES = {
  error: 'bg-destructive/5 border-destructive/20 text-destructive',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]',
} as const;

const SEVERITY_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export function ReviewStep({
  control,
  watch,
  hasWill,
  onSubmit,
}: ReviewStepProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const formValues = watch();
  const familyTree = formValues.family_tree || [];
  const donations = formValues.donations || [];
  const decedent = formValues.decedent;
  const will = formValues.will;
  const estate = formValues.net_distributable_estate;

  const scenario = useMemo(
    () => predictScenario(hasWill, familyTree),
    [hasWill, familyTree],
  );

  const warnings = useMemo(
    () => computeWarnings(formValues, hasWill),
    [formValues, hasWill],
  );

  const visibleWarnings = warnings.filter((w) => !dismissedWarnings.has(w.id));

  const maxPipelineRestarts = useController({
    name: 'config.max_pipeline_restarts',
    control,
  });

  const retroactiveRa = useController({
    name: 'config.retroactive_ra_11642',
    control,
  });

  return (
    <div data-testid="review-step" className="space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))] font-serif">Review & Run</h2>

      {/* Summary sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Estate summary — all content in one text node to avoid /Estate/i matching both child and parent */}
        <Card className="py-4">
          <CardContent className="text-sm">
            {'Estate: '}
            {estate?.centavos != null ? formatPeso(estate.centavos) : '—'}
            {' | '}
            {hasWill ? 'Testate' : 'Intestate'}
          </CardContent>
        </Card>

        {/* Decedent summary */}
        <Card className="py-4">
          <CardContent className="text-sm">
            <span className="font-medium">Decedent: </span>
            <span>{decedent?.name || '—'}</span>
            <span className="mx-2 text-muted-foreground">|</span>
            <span>Died {decedent?.date_of_death || '—'}</span>
            <span className="mx-2 text-muted-foreground">|</span>
            <span>{decedent?.is_married ? 'Married' : 'Single'}</span>
          </CardContent>
        </Card>

        {/* Family tree summary */}
        <Card className="py-4">
          <CardContent className="text-sm">
            <span className="font-medium">Family Tree: </span>
            <span>{familyTree.length} persons</span>
          </CardContent>
        </Card>

        {/* Will summary (only when hasWill) */}
        {hasWill && will && (
          <Card className="py-4">
            <CardContent className="text-sm">
              <span className="font-medium">Will: </span>
              <span>
                {will.institutions?.length || 0} institution{(will.institutions?.length || 0) !== 1 ? 's' : ''}
                , {will.legacies?.length || 0} legac{(will.legacies?.length || 0) !== 1 ? 'ies' : 'y'}
                , {will.devises?.length || 0} devise{(will.devises?.length || 0) !== 1 ? 's' : ''}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Donations summary */}
        <Card className="py-4">
          <CardContent className="text-sm">
            <span className="font-medium">Donations: </span>
            <span>{donations.length} donation{donations.length !== 1 ? 's' : ''}</span>
          </CardContent>
        </Card>
      </div>

      {/* Predicted scenario badge */}
      <div className="flex items-center justify-center py-4 px-6 bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 rounded-lg">
        <span className="font-medium text-sm mr-3">Predicted: </span>
        <Badge className="bg-[hsl(var(--accent))] text-white text-base px-4 py-1 font-mono">
          {scenario}
        </Badge>
      </div>

      {/* Pre-submission warnings */}
      {visibleWarnings.length > 0 && (
        <div className="space-y-2">
          {visibleWarnings.map((warning) => {
            const Icon = SEVERITY_ICONS[warning.severity];
            return (
              <div
                key={warning.id}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg border text-sm",
                  SEVERITY_STYLES[warning.severity],
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{warning.message}</span>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() =>
                    setDismissedWarnings((prev) => new Set([...prev, warning.id]))
                  }
                  className="ml-3 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      {/* Advanced Settings */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-none">
          <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline">
            Advanced Settings
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <label htmlFor="max-pipeline-restarts" className="text-sm font-medium whitespace-nowrap">
                  Max Pipeline Restarts
                </label>
                <Input
                  id="max-pipeline-restarts"
                  type="number"
                  min={1}
                  max={100}
                  value={maxPipelineRestarts.field.value ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      maxPipelineRestarts.field.onChange('' as unknown as number);
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!isNaN(val)) {
                      maxPipelineRestarts.field.onChange(val);
                    }
                  }}
                  onBlur={() => {
                    maxPipelineRestarts.field.onBlur();
                    const val = Number(maxPipelineRestarts.field.value);
                    if (isNaN(val) || val < 1) {
                      maxPipelineRestarts.field.onChange(10);
                    }
                  }}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="review-retroactive-ra"
                  checked={!!retroactiveRa.field.value}
                  onCheckedChange={(checked) => retroactiveRa.field.onChange(checked === true)}
                />
                <label htmlFor="review-retroactive-ra" className="text-sm font-medium cursor-pointer">Retroactive RA 11642</label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Compute button */}
      <Button
        type="button"
        onClick={onSubmit}
        size="lg"
        className="w-full py-6 text-base font-semibold bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white"
      >
        Compute Distribution
      </Button>
    </div>
  );
}
