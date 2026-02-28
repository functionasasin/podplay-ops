/**
 * ComputationLog — collapsible advanced section showing pipeline steps.
 */
import React from 'react';
import { Info } from 'lucide-react';
import type { ComputationLog as ComputationLogType } from '../../types';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';

export interface ComputationLogProps {
  log: ComputationLogType;
}

export function ComputationLog({ log }: ComputationLogProps) {
  return (
    <div data-testid="computation-log">
      <Accordion type="single" collapsible>
        <AccordionItem value="log" className="border-0">
          <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline py-2">
            Computation Log
          </AccordionTrigger>
          <AccordionContent>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Result:</span>
                  <Badge variant="outline" className="font-mono">{log.final_scenario}</Badge>
                </div>
                <span className="text-border">|</span>
                <span className="text-sm text-muted-foreground">
                  {log.total_restarts} restart{log.total_restarts !== 1 ? 's' : ''}
                </span>
              </div>

              {log.total_restarts > 0 && (
                <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
                  <Info className="size-4" />
                  <AlertDescription className="text-xs text-blue-700">
                    Pipeline restart: All heirs of one degree renounced inheritance. The engine
                    re-ran with the next degree of heirs (Art. 969).
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {log.steps.map((step) => (
                  <div key={step.step_number} className="flex gap-3">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0 pt-0.5">
                      [{step.step_number}]
                    </span>
                    <div>
                      <span className="text-sm font-medium text-foreground">{step.step_name}</span>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
