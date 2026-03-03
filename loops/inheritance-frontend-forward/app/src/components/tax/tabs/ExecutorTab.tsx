/**
 * Tab 2 — Executor Details (§4.23)
 * Stub: will be fully implemented in a later iteration.
 */

import type { ExecutorDetails } from '@/types/estate-tax';

export interface ExecutorTabProps {
  data: ExecutorDetails;
  onChange: (data: ExecutorDetails) => void;
}

export function ExecutorTab({ data, onChange }: ExecutorTabProps) {
  const update = (partial: Partial<ExecutorDetails>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <div data-testid="executor-tab">
      <h2>Executor Details</h2>

      <div>
        <label htmlFor="executor-name">Executor Name</label>
        <input
          id="executor-name"
          data-testid="executor-name"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="executor-tin">TIN</label>
        <input
          id="executor-tin"
          data-testid="executor-tin"
          value={data.tin}
          onChange={(e) => update({ tin: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="executor-contact">Contact Number</label>
        <input
          id="executor-contact"
          data-testid="executor-contact"
          value={data.contact}
          onChange={(e) => update({ contact: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="executor-email">Email</label>
        <input
          id="executor-email"
          data-testid="executor-email"
          type="email"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
        />
      </div>
    </div>
  );
}
