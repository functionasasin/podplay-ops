# Frontend State Management — TaxKlaro

**Wave:** 3 (Frontend Data Model)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** typescript-types, zod-schemas, wasm-export-signature, initialization-patterns

---

## Summary

This document specifies the complete state management design for TaxKlaro: wizard state, computation state, auto-save, Supabase CRUD operations, and all custom React hooks. It follows the inheritance app patterns exactly (lifted state + callbacks, no Redux/MobX), adapted for TaxKlaro's 14-step conditional wizard and single-engine computation flow.

---

## 1. State Architecture Overview

TaxKlaro uses **lifted state with callbacks** — no Redux, no MobX, no Zustand. State lives as close to the leaf as possible, promoted upward only when shared.

```
main.tsx
  ├── RouterProvider (TanStack Router)
  │   └── __root.tsx  — auth + org context in router context
  │       └── AppLayout
  │           ├── /computations/new  — WizardPage
  │           │   ├── WizardState (local to WizardPage)
  │           │   ├── useAutoSave(computationId, input)
  │           │   └── useCompute()
  │           ├── /computations/$compId — ComputationPage
  │           │   ├── computationData (loaded from Supabase)
  │           │   ├── useAutoSave(compId, input)
  │           │   └── ResultsView (read from output_json)
  │           ├── /clients — ClientsPage
  │           ├── /deadlines — DeadlinesPage
  │           └── /settings — SettingsPage
```

**Router context** (defined in `main.tsx`, passed to TanStack Router):
```typescript
export interface RouterContext {
  auth: {
    user: User | null;
    loading: boolean;
  };
}
```

**Auth state** is initialized once in `main.tsx` via `supabase.auth.onAuthStateChange`, placed in router context, and consumed in `beforeLoad` guards and child routes.

---

## 2. Wizard State

### 2.1 WizardFormData Type

The wizard accumulates fields across 14 steps. This is the **in-progress** form state — distinct from `TaxpayerInput` (the finalized engine input).

```typescript
// src/types/wizard.ts

export type WizardMode = 'ANNUAL' | 'QUARTERLY' | 'PENALTY';

export type WizardStep =
  | 'WS-00'  // Mode Selection
  | 'WS-01'  // Taxpayer Profile
  | 'WS-02'  // Business Type
  | 'WS-03'  // Tax Year and Filing Period
  | 'WS-04'  // Gross Receipts
  | 'WS-05'  // Compensation Income (mixed income only)
  | 'WS-06'  // Expense Method Selection
  | 'WS-07A' // Itemized: General Business Costs
  | 'WS-07B' // Itemized: Financial and Special Items
  | 'WS-07C' // Itemized: Depreciation Assets
  | 'WS-07D' // Itemized: NOLCO Carry-Over
  | 'WS-08'  // Creditable Withholding Tax
  | 'WS-09'  // Prior Quarterly Payments
  | 'WS-10'  // Registration and VAT Status
  | 'WS-11'  // Regime Election
  | 'WS-12'  // Filing Details and Return Type
  | 'WS-13'  // Prior Year Carry-Over Credits
  | 'REVIEW'; // Final review before compute

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ComputeStatus = 'idle' | 'computing' | 'ready' | 'error';

/** UI-only fields that don't map 1:1 to engine input */
export interface WizardUiState {
  mode: WizardMode;
  currentStep: WizardStep;
  /** Ordered list of steps that will appear for this user's path */
  visibleSteps: WizardStep[];
  /** Per-step validation errors (fieldName -> errorMessage) */
  stepErrors: Record<string, string>;
  /** Whether COMPENSATION_ONLY modal is open */
  compensationOnlyModalOpen: boolean;
}

/** Complete wizard form data — superset of TaxpayerInput with UI fields */
export interface WizardFormData {
  // WS-01
  taxpayerType: TaxpayerType | null;
  // WS-02
  businessCategory: 'SERVICE' | 'TRADING' | 'PROFESSIONAL' | 'GPP' | null;
  isGppPartner: boolean;
  // WS-03 fields are part of TaxpayerInput directly
  taxYear: TaxYear | null;
  filingPeriod: FilingPeriod | null;
  // WS-04
  grossReceiptsProfessional: string; // Peso string
  grossReceiptsTrading: string;      // Peso string
  costOfGoodsSold: string;           // Peso string
  // WS-05 (mixed income only)
  compensationIncome: string;        // Peso string
  // WS-06
  expenseMethod: DeductionMethod | null;
  // WS-07A
  rentLease: string;
  salariesWages: string;
  utilities: string;
  officeSupplies: string;
  transportation: string;
  communications: string;
  professionalFees: string;
  otherGeneralExpenses: string;
  // WS-07B
  interestExpense: string;
  charitableContributions: string;
  researchDevelopment: string;
  // WS-07C — array of DepreciationAsset
  depreciationAssets: DepreciationAssetInput[];
  // WS-07D — NOLCO
  nolcoCarryOver: string;
  // WS-08 — array of CwtEntry
  cwtEntries: CwtEntryInput[];
  // WS-09 — quarterly payments
  q1Payment: string;
  q2Payment: string;
  q3Payment: string;
  // WS-10
  isVatRegistered: boolean;
  isRegisteredWithBir: boolean;
  // WS-11
  regimeElection: TaxRegime | null;
  // WS-12
  returnType: ReturnType | null;
  amendedReason: string;
  // WS-13
  priorYearOverpayment: string;
  priorYearSpecialCredit: string;
}

export interface DepreciationAssetInput {
  id: string; // client-side UUID for list management
  description: string;
  acquisitionDate: string;  // ISO date
  acquisitionCost: string;  // Peso string
  usefulLifeYears: number | null;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | null;
  accumulatedDepreciation: string; // Peso string
}

export interface CwtEntryInput {
  id: string; // client-side UUID for list management
  payorName: string;
  atcCode: string;
  tinOfPayor: string;
  amountOfIncome: string;   // Peso string
  taxWithheld: string;      // Peso string
  classification: CwtClassification | null; // auto-derived from ATC code
}
```

### 2.2 Step Routing Logic

```typescript
// src/lib/wizard-routing.ts

import type { WizardFormData, WizardStep } from '@/types/wizard';

/**
 * Compute the ordered list of steps visible to this user based on their
 * current form data. Called after every field change that can affect routing.
 */
export function computeVisibleSteps(data: Partial<WizardFormData>): WizardStep[] {
  const steps: WizardStep[] = ['WS-00', 'WS-01', 'WS-02', 'WS-03', 'WS-04'];

  // WS-05 only for mixed income
  if (data.taxpayerType === 'MIXED_INCOME') {
    steps.push('WS-05');
  }

  steps.push('WS-06');

  // WS-07 sub-steps only if ITEMIZED deductions selected
  if (data.expenseMethod === 'ITEMIZED') {
    steps.push('WS-07A', 'WS-07B', 'WS-07C', 'WS-07D');
  }

  steps.push('WS-08', 'WS-09', 'WS-10', 'WS-11', 'WS-12', 'WS-13', 'REVIEW');

  return steps;
}

/**
 * Get the next visible step from currentStep.
 * Returns null if currentStep is the last step (REVIEW).
 */
export function getNextStep(
  currentStep: WizardStep,
  visibleSteps: WizardStep[],
): WizardStep | null {
  const idx = visibleSteps.indexOf(currentStep);
  if (idx === -1 || idx === visibleSteps.length - 1) return null;
  return visibleSteps[idx + 1] ?? null;
}

/**
 * Get the previous visible step from currentStep.
 * Returns null if currentStep is the first step (WS-00).
 */
export function getPrevStep(
  currentStep: WizardStep,
  visibleSteps: WizardStep[],
): WizardStep | null {
  const idx = visibleSteps.indexOf(currentStep);
  if (idx <= 0) return null;
  return visibleSteps[idx - 1] ?? null;
}
```

### 2.3 Wizard Form Data to Engine Input Conversion

```typescript
// src/lib/wizard-to-input.ts

import type { WizardFormData } from '@/types/wizard';
import type { TaxpayerInput } from '@/types/engine-input';
import { Decimal } from 'decimal.js'; // for validation only; engine uses string

/**
 * Convert completed wizard form data to TaxpayerInput for the engine.
 * Called on the REVIEW step before compute.
 * Returns null if required fields are missing (shouldn't happen if step
 * validation worked correctly).
 */
export function wizardToEngineInput(data: WizardFormData): TaxpayerInput | null {
  if (!data.taxpayerType || !data.taxYear || !data.filingPeriod) return null;

  const grossReceipts: GrossReceipts = {
    professional: data.grossReceiptsProfessional || '0',
    trading: data.grossReceiptsTrading || '0',
    costOfGoodsSold: data.costOfGoodsSold || '0',
  };

  const deductions: DeductionInput = {
    method: data.expenseMethod ?? 'OSD',
    itemized: data.expenseMethod === 'ITEMIZED' ? buildItemizedDeductions(data) : null,
  };

  const cwtCredits: CwtEntry[] = data.cwtEntries.map((e) => ({
    payorName: e.payorName,
    atcCode: e.atcCode,
    tinOfPayor: e.tinOfPayor,
    amountOfIncome: e.amountOfIncome || '0',
    taxWithheld: e.taxWithheld || '0',
    classification: e.classification ?? 'INCOME_TAX_CWT',
  }));

  return {
    taxpayerType: data.taxpayerType,
    taxYear: data.taxYear,
    filingPeriod: data.filingPeriod,
    grossReceipts,
    compensationIncome: data.taxpayerType === 'MIXED_INCOME'
      ? (data.compensationIncome || '0')
      : null,
    deductions,
    cwtCredits,
    priorQuarterlyPayments: {
      q1: data.q1Payment || '0',
      q2: data.q2Payment || '0',
      q3: data.q3Payment || '0',
    },
    isVatRegistered: data.isVatRegistered,
    regimeElection: data.regimeElection,
    returnType: data.returnType ?? 'ORIGINAL',
    priorYearOverpayment: data.priorYearOverpayment || '0',
    priorYearSpecialCredit: data.priorYearSpecialCredit || '0',
    isGppPartner: data.isGppPartner,
  };
}

function buildItemizedDeductions(data: WizardFormData): ItemizedDeductions {
  return {
    rentLease: data.rentLease || '0',
    salariesWages: data.salariesWages || '0',
    utilities: data.utilities || '0',
    officeSupplies: data.officeSupplies || '0',
    transportation: data.transportation || '0',
    communications: data.communications || '0',
    professionalFees: data.professionalFees || '0',
    otherGeneralExpenses: data.otherGeneralExpenses || '0',
    interestExpense: data.interestExpense || '0',
    charitableContributions: data.charitableContributions || '0',
    researchDevelopment: data.researchDevelopment || '0',
    depreciationAssets: data.depreciationAssets.map((a) => ({
      description: a.description,
      acquisitionDate: a.acquisitionDate,
      acquisitionCost: a.acquisitionCost || '0',
      usefulLifeYears: a.usefulLifeYears ?? 0,
      depreciationMethod: a.depreciationMethod ?? 'STRAIGHT_LINE',
      accumulatedDepreciation: a.accumulatedDepreciation || '0',
    })),
    nolcoCarryOver: data.nolcoCarryOver || '0',
  };
}
```

### 2.4 ATC Code Auto-Classification

```typescript
// src/lib/atc-classification.ts
import type { CwtClassification } from '@/types/common';

const ATC_INCOME_TAX: readonly string[] = [
  'WI010', 'WI011', 'WI157', 'WI160', 'WI760',
  'WC010', 'WC760',
];

const ATC_PERCENTAGE_TAX: readonly string[] = ['PT010'];

export function classifyAtcCode(atcCode: string): CwtClassification | null {
  const normalized = atcCode.trim().toUpperCase();
  if (ATC_INCOME_TAX.includes(normalized)) return 'INCOME_TAX_CWT';
  if (ATC_PERCENTAGE_TAX.includes(normalized)) return 'PERCENTAGE_TAX_CWT';
  return null; // Unknown — manual review required
}

export function isUnknownAtcCode(atcCode: string): boolean {
  return classifyAtcCode(atcCode) === null && atcCode.trim().length > 0;
}
```

---

## 3. Computation State

### 3.1 ComputeStatus and Results

```typescript
// In src/types/wizard.ts (additions)

export type ComputeStatus = 'idle' | 'computing' | 'ready' | 'error';

export interface ComputeState {
  status: ComputeStatus;
  result: TaxComputationResult | null;
  validationErrors: ValidationError[] | null; // from WasmResult error path
  computeError: string | null; // engine crash (should never happen)
}
```

### 3.2 `useCompute` Hook

TaxKlaro has a single-engine computation (unlike inheritance which bridges two engines). The hook is simpler.

```typescript
// src/hooks/useCompute.ts

import { useState, useCallback } from 'react';
import type { TaxpayerInput } from '@/types/engine-input';
import type { TaxComputationResult } from '@/types/engine-output';
import type { ValidationError } from '@/types/common';
import type { ComputeStatus } from '@/types/wizard';

export interface UseComputeReturn {
  status: ComputeStatus;
  result: TaxComputationResult | null;
  validationErrors: ValidationError[] | null;
  computeError: string | null;
  compute: (input: TaxpayerInput) => Promise<void>;
  reset: () => void;
}

export function useCompute(): UseComputeReturn {
  const [status, setStatus] = useState<ComputeStatus>('idle');
  const [result, setResult] = useState<TaxComputationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null);
  const [computeError, setComputeError] = useState<string | null>(null);

  const compute = useCallback(async (input: TaxpayerInput) => {
    setStatus('computing');
    setResult(null);
    setValidationErrors(null);
    setComputeError(null);

    try {
      // Lazy-load bridge to avoid blocking initial page render
      const { compute: bridgeCompute } = await import('@/wasm/bridge');
      const wasmResult = await bridgeCompute(input);

      if (wasmResult.type === 'ok') {
        setResult(wasmResult.data);
        setStatus('ready');
      } else if (wasmResult.type === 'validation_error') {
        setValidationErrors(wasmResult.errors);
        setStatus('error');
      } else {
        // engine_error — should never happen with valid input
        setComputeError(wasmResult.message);
        setStatus('error');
        // Send to Sentry
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(new Error(
            `Engine error [${wasmResult.code}]: ${wasmResult.message}`
          ));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setComputeError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setValidationErrors(null);
    setComputeError(null);
  }, []);

  return { status, result, validationErrors, computeError, compute, reset };
}
```

**Important**: `compute` lazy-loads `@/wasm/bridge` on first call. This means WASM initialization happens on "Compute" button click, not on page load. This keeps the initial bundle lean and avoids blocking the wizard render.

---

## 4. `useAuth` Hook

Matches inheritance app pattern exactly.

```typescript
// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import * as authLib from '@/lib/auth';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; session: Session | null } | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session first (fires synchronously for cached sessions)
    const { data } = authLib.onAuthStateChange((u) => {
      setUser(u as User | null);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authLib.signIn(email, password);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    return await authLib.signUp(email, password, fullName);
  };

  const signOut = async () => {
    await authLib.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}
```

**lib/auth.ts** (support module):

```typescript
// src/lib/auth.ts

import { supabase } from './supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function onAuthStateChange(
  callback: (user: User | null) => void,
) {
  return supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
    callback(session?.user ?? null);
  });
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ user: User | null; session: Session | null } | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName ?? '' } },
  });
  if (error) throw error;
  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
```

---

## 5. `useAutoSave` Hook

Matches inheritance app pattern exactly, adapted for `computations` table.

```typescript
// src/hooks/useAutoSave.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaxpayerInput } from '@/types/engine-input';
import type { AutoSaveStatus } from '@/types/wizard';
import { updateComputationInput } from '@/lib/computations';

const DEBOUNCE_MS = 1500;

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  save: () => void;
}

export function useAutoSave(
  computationId: string | null,
  input: TaxpayerInput | null,
): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInputRef = useRef(input);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const doSave = useCallback(async () => {
    if (!computationId || !input) return;
    setStatus('saving');
    try {
      await updateComputationInput(computationId, input);
      if (mountedRef.current) setStatus('saved');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }, [computationId, input]);

  useEffect(() => {
    if (!computationId || !input) return;
    if (prevInputRef.current === input) return;
    prevInputRef.current = input;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [computationId, input, doSave]);

  return { status, save: doSave };
}
```

**AutoSave Status UI** (in WizardPage and ComputationPage toolbar):
- `idle`: nothing shown
- `saving`: "Saving..." with Loader2 icon (spin animation)
- `saved`: "Saved" with Check icon (fades out after 3 seconds)
- `error`: "Error saving" with AlertCircle icon (red, stays until next save)

---

## 6. `useOrganization` Hook

Matches inheritance app pattern exactly, adapted for TaxKlaro roles.

```typescript
// src/hooks/useOrganization.ts

import { useState, useEffect, useCallback } from 'react';
import type { Organization, OrganizationMember, OrgRole } from '@/types/org';
import { ROLE_PERMISSIONS } from '@/types/org';
import * as orgLib from '@/lib/organizations';

export interface UseOrganizationReturn {
  organization: Organization | null;
  members: OrganizationMember[];
  currentRole: OrgRole | null;
  loading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
  inviteMember: (email: string, role: OrgRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: OrgRole) => Promise<void>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  canPerform: (action: keyof typeof ROLE_PERMISSIONS['admin']) => boolean;
}

export function useOrganization(userId: string | null): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = useCallback(async () => {
    if (!organization) return;
    try {
      const m = await orgLib.listMembers(organization.id);
      setMembers(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  }, [organization]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const org = await orgLib.getUserOrganization(userId);
        if (cancelled) return;
        setOrganization(org);

        if (org) {
          const m = await orgLib.listMembers(org.id);
          if (cancelled) return;
          setMembers(m);
          const myMembership = m.find((mem) => mem.userId === userId);
          setCurrentRole(myMembership?.role ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const inviteMember = async (email: string, role: OrgRole) => {
    if (!organization || !userId) throw new Error('No organization');
    await orgLib.inviteMember(organization.id, email, role, userId);
    await refreshMembers();
  };

  const removeMember = async (memberId: string) => {
    await orgLib.removeMember(memberId);
    await refreshMembers();
  };

  const updateMemberRole = async (memberId: string, role: OrgRole) => {
    await orgLib.updateMemberRole(memberId, role);
    await refreshMembers();
  };

  const revokeInvitation = async (invitationId: string) => {
    await orgLib.revokeInvitation(invitationId);
    await refreshMembers();
  };

  const canPerform = (action: keyof typeof ROLE_PERMISSIONS['admin']): boolean => {
    if (!currentRole) return false;
    return ROLE_PERMISSIONS[currentRole]?.[action] ?? false;
  };

  return {
    organization, members, currentRole, loading, error,
    refreshMembers, inviteMember, removeMember,
    updateMemberRole, revokeInvitation, canPerform,
  };
}
```

---

## 7. Organization Types

```typescript
// src/types/org.ts

export type OrgRole = 'admin' | 'accountant' | 'staff' | 'readonly';

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;           // UUID
  name: string;
  slug: string;
  plan: OrgPlan;
  seatLimit: number;
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}

export interface OrganizationMember {
  id: string;           // UUID
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;     // ISO datetime
  // Joined from auth.users for display:
  email: string;
  fullName: string | null;
}

export interface OrganizationInvitation {
  id: string;           // UUID
  orgId: string;
  email: string;
  role: OrgRole;
  token: string;        // UUID
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;    // userId
  expiresAt: string;    // ISO datetime (7 days from creation)
  acceptedAt: string | null;
}

export const ROLE_PERMISSIONS = {
  admin: {
    canInviteMembers: true,
    canRemoveMembers: true,
    canUpdateRoles: true,
    canDeleteComputations: true,
    canFinalizeComputations: true,
    canManageBilling: true,
    canViewAllComputations: true,
  },
  accountant: {
    canInviteMembers: false,
    canRemoveMembers: false,
    canUpdateRoles: false,
    canDeleteComputations: false,
    canFinalizeComputations: true,
    canManageBilling: false,
    canViewAllComputations: true,
  },
  staff: {
    canInviteMembers: false,
    canRemoveMembers: false,
    canUpdateRoles: false,
    canDeleteComputations: false,
    canFinalizeComputations: false,
    canManageBilling: false,
    canViewAllComputations: true,
  },
  readonly: {
    canInviteMembers: false,
    canRemoveMembers: false,
    canUpdateRoles: false,
    canDeleteComputations: false,
    canFinalizeComputations: false,
    canManageBilling: false,
    canViewAllComputations: true,
  },
} as const satisfies Record<OrgRole, Record<string, boolean>>;
```

---

## 8. Computation Management — `lib/computations.ts`

```typescript
// src/lib/computations.ts

import { supabase } from './supabase';
import type { TaxpayerInput } from '@/types/engine-input';
import type { TaxComputationResult } from '@/types/engine-output';

export type ComputationStatus = 'draft' | 'computed' | 'finalized' | 'archived';

export interface ComputationRow {
  id: string;
  orgId: string;
  userId: string;
  clientId: string | null;
  title: string;
  status: ComputationStatus;
  inputJson: TaxpayerInput | null;
  outputJson: TaxComputationResult | null;
  taxYear: number | null;
  regimeSelected: string | null;    // e.g. 'PATH_A_OSD_GRADUATED'
  shareToken: string | null;        // UUID
  shareEnabled: boolean;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComputationListItem {
  id: string;
  title: string;
  status: ComputationStatus;
  taxYear: number | null;
  regimeSelected: string | null;
  clientId: string | null;
  clientName: string | null;        // joined from clients table
  shareEnabled: boolean;
  notesCount: number;
  updatedAt: string;
}

export const VALID_STATUS_TRANSITIONS: Record<ComputationStatus, ComputationStatus[]> = {
  draft: ['computed', 'archived'],
  computed: ['finalized', 'draft', 'archived'],
  finalized: ['archived'],
  archived: [],
};

export async function createComputation(
  userId: string,
  orgId: string,
  title: string,
  input: TaxpayerInput | null = null,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('computations')
    .insert({
      user_id: userId,
      org_id: orgId,
      title,
      status: 'draft',
      input_json: input,
      tax_year: input?.taxYear ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id };
}

export async function loadComputation(computationId: string): Promise<ComputationRow> {
  const { data, error } = await supabase
    .from('computations')
    .select('*')
    .eq('id', computationId)
    .single();

  if (error) throw error;
  // Map snake_case DB columns to camelCase
  return mapRowToComputation(data);
}

export async function updateComputationInput(
  computationId: string,
  input: TaxpayerInput,
): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({
      input_json: input,
      tax_year: input.taxYear,
      updated_at: new Date().toISOString(),
    })
    .eq('id', computationId);

  if (error) throw error;
}

export async function saveComputationOutput(
  computationId: string,
  output: TaxComputationResult,
  regimeSelected: string,
): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({
      output_json: output,
      status: 'computed',
      regime_selected: regimeSelected,
      updated_at: new Date().toISOString(),
    })
    .eq('id', computationId);

  if (error) throw error;
}

export async function updateComputationStatus(
  computationId: string,
  newStatus: ComputationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', computationId);

  if (error) throw error;
}

export async function listComputations(
  orgId: string,
  options?: {
    statusFilter?: ComputationStatus;
    clientId?: string;
    taxYear?: number;
    limit?: number;
  },
): Promise<ComputationListItem[]> {
  let query = supabase
    .from('computations')
    .select(`
      id, title, status, tax_year, regime_selected,
      client_id, share_enabled, notes_count, updated_at,
      clients(full_name)
    `)
    .eq('org_id', orgId);

  if (options?.statusFilter) {
    query = query.eq('status', options.statusFilter);
  }
  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }
  if (options?.taxYear) {
    query = query.eq('tax_year', options.taxYear);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(options?.limit ?? 50);

  if (error) throw error;
  return (data ?? []).map(mapListItemRow);
}

export async function deleteComputation(computationId: string): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .delete()
    .eq('id', computationId);

  if (error) throw error;
}

// Helper to generate computation title from input
export function generateComputationTitle(input: TaxpayerInput): string {
  const year = input.taxYear ?? new Date().getFullYear() - 1;
  const period = input.filingPeriod === 'ANNUAL' ? 'Annual' : `Q${input.filingPeriod?.slice(-1)}`;
  return `Tax Computation ${period} ${year}`;
}

function mapRowToComputation(row: Record<string, unknown>): ComputationRow {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    userId: row.user_id as string,
    clientId: row.client_id as string | null,
    title: row.title as string,
    status: row.status as ComputationStatus,
    inputJson: row.input_json as TaxpayerInput | null,
    outputJson: row.output_json as TaxComputationResult | null,
    taxYear: row.tax_year as number | null,
    regimeSelected: row.regime_selected as string | null,
    shareToken: row.share_token as string | null,
    shareEnabled: row.share_enabled as boolean,
    notesCount: row.notes_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapListItemRow(row: Record<string, unknown>): ComputationListItem {
  const client = row.clients as { full_name: string } | null;
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as ComputationStatus,
    taxYear: row.tax_year as number | null,
    regimeSelected: row.regime_selected as string | null,
    clientId: row.client_id as string | null,
    clientName: client?.full_name ?? null,
    shareEnabled: row.share_enabled as boolean,
    notesCount: row.notes_count as number,
    updatedAt: row.updated_at as string,
  };
}
```

---

## 9. Sharing — `lib/share.ts`

```typescript
// src/lib/share.ts

import { supabase } from './supabase';
import type { TaxComputationResult } from '@/types/engine-output';
import type { TaxpayerInput } from '@/types/engine-input';

export interface SharedComputation {
  id: string;
  title: string;
  inputJson: TaxpayerInput;
  outputJson: TaxComputationResult;
  taxYear: number | null;
  regimeSelected: string | null;
  createdAt: string;
}

export async function enableSharing(computationId: string): Promise<string> {
  const { data, error } = await supabase
    .from('computations')
    .update({ share_enabled: true })
    .eq('id', computationId)
    .select('share_token')
    .single();

  if (error) throw error;
  return data.share_token as string;
}

export async function disableSharing(computationId: string): Promise<void> {
  const { error } = await supabase
    .from('computations')
    .update({ share_enabled: false })
    .eq('id', computationId);

  if (error) throw error;
}

/**
 * Fetch a shared computation via the public RPC.
 * Uses SECURITY DEFINER RPC — does NOT require authentication.
 * The token param MUST be UUID type (not TEXT) to match share_token column.
 */
export async function getSharedComputation(
  token: string,
): Promise<SharedComputation | null> {
  const { data, error } = await supabase.rpc('get_shared_computation', {
    p_token: token,
  });

  if (error) throw error;
  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    id: row.id,
    title: row.title,
    inputJson: row.input_json as TaxpayerInput,
    outputJson: row.output_json as TaxComputationResult,
    taxYear: row.tax_year,
    regimeSelected: row.regime_selected,
    createdAt: row.created_at,
  };
}

export function buildShareUrl(token: string): string {
  return `${import.meta.env.VITE_APP_URL}/share/${token}`;
}
```

---

## 10. WizardPage State Flow (Full Component Lifecycle)

```
WizardPage (routes/computations/new.tsx)
  state:
    - wizardUiState: WizardUiState (currentStep, visibleSteps, stepErrors, modal flags)
    - formData: WizardFormData (all field values)
    - computationId: string | null (null until first auto-save)

  on mount:
    - Initialize formData with defaults (all empty strings, booleans false)
    - Compute visibleSteps = computeVisibleSteps({}) = minimal path
    - Set currentStep = 'WS-00'
    - If user is authenticated + Pro: create draft computation immediately,
      set computationId for auto-save

  on field change:
    - Update formData[field] = newValue
    - Recompute visibleSteps if the changed field affects routing
      (taxpayerType, expenseMethod)
    - Clear stepErrors[field] if previously errored

  on "Continue" click:
    - Validate current step fields using per-step Zod schemas
    - If validation fails: setStepErrors, focus first errored field, do NOT advance
    - If validation passes: advance to getNextStep(currentStep, visibleSteps)
    - If currentStep is REVIEW: call engineInput = wizardToEngineInput(formData)
      then compute(engineInput)

  on computation complete (status === 'ready'):
    - If computationId exists: call saveComputationOutput(computationId, result, regime)
    - Navigate to /computations/$computationId (or display inline results)

  auto-save (for Pro users with computationId):
    - useAutoSave(computationId, wizardToEngineInput(formData))
    - Status indicator in wizard header

  hooks used:
    - useCompute()        — for the actual WASM computation
    - useAutoSave()       — 1.5s debounce save of input
    - useOrganization()   — for plan gating (auto-save is Pro feature)
```

---

## 11. ComputationPage State Flow (Existing Computation)

```
ComputationPage (routes/computations/$compId.tsx)
  state:
    - loading: boolean
    - computation: ComputationRow | null
    - editingInput: TaxpayerInput | null  (copy of inputJson for editing)

  on mount:
    - loadComputation(compId) → set computation
    - editingInput = deep copy of computation.inputJson

  on field edit (re-run mode):
    - Update editingInput field
    - Debounce auto-save via useAutoSave(compId, editingInput)

  on "Recompute" click:
    - compute(editingInput)
    - On success: saveComputationOutput(compId, result, regime)
    - Update local computation state

  hooks used:
    - useCompute()
    - useAutoSave(compId, editingInput)
```

---

## 12. File Organization Summary

```
src/
  types/
    common.ts           — shared primitives, enums, CwtClassification
    engine-input.ts     — TaxpayerInput and sub-types
    engine-output.ts    — TaxComputationResult and sub-types
    wizard.ts           — WizardFormData, WizardStep, AutoSaveStatus, ComputeStatus
    org.ts              — Organization, OrganizationMember, OrgRole, ROLE_PERMISSIONS
    index.ts            — re-exports all types

  hooks/
    useAuth.ts          — User | null + loading + signIn/signUp/signOut
    useAutoSave.ts      — 1.5s debounce save, AutoSaveStatus indicator
    useOrganization.ts  — org + members + canPerform(action)
    useCompute.ts       — WASM compute, ComputeStatus, result + errors

  lib/
    supabase.ts         — supabase client singleton + supabaseConfigured check
    auth.ts             — signIn/signUp/signOut/resetPassword wrappers
    computations.ts     — CRUD: createComputation, loadComputation, etc.
    share.ts            — enableSharing, disableSharing, getSharedComputation
    organizations.ts    — getUserOrganization, listMembers, inviteMember, etc.
    clients.ts          — createClient, loadClient, listClients, updateClient
    computation-notes.ts — addNote, listNotes
    atc-classification.ts — classifyAtcCode, isUnknownAtcCode
    wizard-routing.ts   — computeVisibleSteps, getNextStep, getPrevStep
    wizard-to-input.ts  — wizardToEngineInput, buildItemizedDeductions

  wasm/
    bridge.ts           — compute(), validate(), ensureWasmInitialized()
    pkg/                — generated by wasm-pack
```

---

## 13. State Management Do/Don't Rules

**DO:**
- Use `useState` + callbacks for all form state (no global store)
- Pass `computationId` from the route's `$compId` param, never from global context
- Initialize `loading = true` in all async hooks until first data arrives
- Use `useCallback` for all async functions to avoid re-render loops
- Use `useRef` for `mountedRef` in all hooks that do async work (prevents set-state-after-unmount)
- Use `cancelled` flag pattern for `useEffect` async operations (not `AbortController`)

**DON'T:**
- Global Redux/Zustand store for computation state
- Initialize WASM on app load — lazy-load on first compute
- Use `useEffect` to sync derived state — compute it inline
- Fetch organization in `__root.tsx` — only load in routes that need it
- Store `visibleSteps` in Supabase — it's purely derived from formData

---

## 14. Premium Feature Gating

Auto-save and "Save and continue later" are Pro features. The gating is:

```typescript
// In WizardPage
const { organization } = useOrganization(user?.id ?? null);
const isPro = organization?.plan === 'pro' || organization?.plan === 'enterprise';

// Show save-and-continue link only if isPro
// Only create computationId and call useAutoSave if isPro
```

Free users: wizard is stateless — no auto-save, no resume. Must complete in one session.
Pro users: wizard creates a draft computation on mount, auto-saves every 1.5s.
