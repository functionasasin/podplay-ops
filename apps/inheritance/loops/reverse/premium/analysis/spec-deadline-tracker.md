# Spec: Deadline Tracker

**Aspect:** spec-deadline-tracker
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Depends:** spec-auth-persistence
**Discovered:** ph-practice-workflow (§7 Discovered Feature: Deadline Calculator)

---

## 1. Overview

Philippine estate settlement is a **time-critical compliance workflow**. Missing the BIR 1-year filing deadline triggers a 25% surcharge on estate tax due plus 12% per annum interest compounding monthly. Missing the newspaper publication window invalidates the Deed of Extrajudicial Settlement. Missing the eCAR follow-up window delays title transfer indefinitely.

Currently, PH estate lawyers track all these deadlines manually — calendar reminders in their phone, sticky notes, email threads. There is no legal software tool that:
1. Automatically computes every deadline from a single date (date of death)
2. Shows color-coded urgency (green / yellow / red)
3. Lets the lawyer mark milestones as done
4. Aggregates across all open cases on a single dashboard view

The Deadline Tracker solves this. Given a case's date of death and settlement track (extrajudicial or judicial), it derives every statutory and recommended deadline on a timeline, shows real-time countdown status, and lets attorneys check off completed milestones.

**Why PH estate lawyers would pay for this:** Deadline anxiety is the single most-cited stressor by PH estate lawyers in practice forums. The BIR 1-year clock starts the moment their client calls — and clients often wait 3–6 months before contacting a lawyer. This feature lets an attorney open the app and instantly see "BIR deadline: 47 days away" across all their open cases.

---

## 2. Data Model

### 2.1 Deadline Schema

All deadline data is **computed from `cases.date_of_death`** and stored as a per-case milestone record set. Milestones can be auto-generated (rule-driven) or manually added by the attorney.

```sql
-- ============================================================
-- Case Deadlines — per-case milestone tracking
-- ============================================================
CREATE TABLE case_deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Milestone identity
  milestone_key   TEXT NOT NULL,   -- e.g., 'bir_filing', 'pub_start', 'pub_complete', 'ecar_receipt'
  label           TEXT NOT NULL,   -- Human-readable: "BIR Estate Tax Filing Deadline"
  description     TEXT NOT NULL,   -- One-sentence explanation of the requirement

  -- Dates
  due_date        DATE NOT NULL,   -- Computed or manually set deadline
  completed_date  DATE,            -- NULL = not done; set when attorney marks done

  -- Source rule citation
  legal_basis     TEXT NOT NULL,   -- e.g., "Sec. 9, TRAIN Law (RA 10963); BIR RR 12-2018"

  -- Display
  sort_order      INTEGER NOT NULL DEFAULT 0,   -- Display order in timeline
  is_auto         BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = manually added by lawyer
  note            TEXT,            -- Optional attorney note on this milestone

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_case_deadlines_case_id  ON case_deadlines(case_id);
CREATE INDEX idx_case_deadlines_user_id  ON case_deadlines(user_id);
CREATE INDEX idx_case_deadlines_due_date ON case_deadlines(user_id, due_date ASC);

CREATE POLICY "deadlines_all_own" ON case_deadlines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER case_deadlines_updated_at
  BEFORE UPDATE ON case_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Unique: one row per milestone key per case (upsert-safe)
CREATE UNIQUE INDEX idx_case_deadlines_key ON case_deadlines(case_id, milestone_key);
```

### 2.2 Computed Deadline Rules

All dates are computed from `date_of_death` (DOD). These rules are applied by the `generateDeadlines()` function when a case's date_of_death is first set and whenever it changes.

```typescript
// types/deadlines.ts
export interface DeadlineMilestone {
  milestone_key: string
  label: string
  description: string
  due_date: string           // ISO date 'YYYY-MM-DD'
  legal_basis: string
  sort_order: number
}

// Extrajudicial Settlement track deadlines
export function generateEJSDeadlines(dod: Date): DeadlineMilestone[] {
  const add = (d: Date, days: number): Date => {
    const r = new Date(d)
    r.setDate(r.getDate() + days)
    return r
  }
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  return [
    {
      milestone_key: 'estate_tin',
      label: 'Estate TIN Registration (BIR Form 1904)',
      description: 'File BIR Form 1904 to obtain the estate\'s Tax Identification Number. Required before any BIR transactions.',
      due_date: fmt(add(dod, 30)),          // BIR recommends within 30 days
      legal_basis: 'RMO 37-2019; BIR Form 1904 instructions',
      sort_order: 1
    },
    {
      milestone_key: 'notice_of_death',
      label: 'Notice of Death to BIR (Form 1949)',
      description: 'File BIR Form 1949 if gross estate exceeds ₱20,000 or if real property is included. Notify BIR within 2 months of death.',
      due_date: fmt(add(dod, 60)),          // 2 months
      legal_basis: 'Sec. 89, NIRC; RR 2-2003 Sec. 14',
      sort_order: 2
    },
    {
      milestone_key: 'deed_execution',
      label: 'Execute Deed of Extrajudicial Settlement',
      description: 'Have all heirs sign the notarized Deed of EJS. This triggers the publication clock.',
      due_date: fmt(add(dod, 90)),          // Recommended within 3 months to allow pub time
      legal_basis: 'Rule 74, Sec. 1, Rules of Court',
      sort_order: 3
    },
    {
      milestone_key: 'pub_first',
      label: 'First Newspaper Publication',
      description: 'Publish the Deed of EJS in a newspaper of general circulation. Must run once per week for 3 consecutive weeks.',
      due_date: fmt(add(dod, 90)),          // Same as deed execution (start immediately)
      legal_basis: 'Rule 74, Sec. 1, Rules of Court',
      sort_order: 4
    },
    {
      milestone_key: 'pub_complete',
      label: 'Third (Final) Newspaper Publication',
      description: 'Third and final weekly publication. Secure Affidavit of Publication from the newspaper after this date.',
      due_date: fmt(add(dod, 111)),         // Deed date + 21 days (3 weeks)
      legal_basis: 'Rule 74, Sec. 1, Rules of Court',
      sort_order: 5
    },
    {
      milestone_key: 'bir_filing',
      label: 'BIR Estate Tax Return Filing (Form 1801)',
      description: 'File BIR Form 1801 with all schedules. Late filing incurs 25% surcharge plus 12% annual interest. This is the hardest statutory deadline.',
      due_date: fmt(add(dod, 365)),         // 1 year from DOD
      legal_basis: 'Sec. 9, TRAIN Law (RA 10963); BIR RR 12-2018',
      sort_order: 6
    },
    {
      milestone_key: 'ecar_follow_up',
      label: 'BIR eCAR Follow-Up (per property)',
      description: 'Follow up with BIR for electronic Certificate Authorizing Registration. Expected 2–4 weeks after estate tax payment.',
      due_date: fmt(add(dod, 395)),         // BIR filing + 30 days (estimate)
      legal_basis: 'RMC 31-2024; BIR eCAR system',
      sort_order: 7
    },
    {
      milestone_key: 'lgu_transfer_tax',
      label: 'Local Transfer Tax Payment',
      description: 'Pay transfer tax to the LGU (city/municipality) for each real property. Rate: 0.5%–0.75% of FMV. Required before Register of Deeds processing.',
      due_date: fmt(add(dod, 420)),         // After eCAR (estimate)
      legal_basis: 'Sec. 135, Local Government Code (RA 7160)',
      sort_order: 8
    },
    {
      milestone_key: 'rd_registration',
      label: 'Register of Deeds — Title Transfer',
      description: 'File Deed of EJS + Affidavit of Publication + eCAR + LGU transfer tax receipt at the Register of Deeds to obtain new TCTs in heirs\' names.',
      due_date: fmt(add(dod, 450)),         // After all prior milestones (estimate)
      legal_basis: 'PD 1529 (Property Registration Decree), Sec. 58',
      sort_order: 9
    }
  ]
}

// Judicial (Probate) track — fewer auto-computed milestones since court controls timeline
export function generateProbateDeadlines(dod: Date): DeadlineMilestone[] {
  const add = (d: Date, days: number): Date => {
    const r = new Date(d)
    r.setDate(r.getDate() + days)
    return r
  }
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  return [
    {
      milestone_key: 'estate_tin',
      label: 'Estate TIN Registration (BIR Form 1904)',
      description: 'File BIR Form 1904 to obtain the estate\'s Tax Identification Number.',
      due_date: fmt(add(dod, 30)),
      legal_basis: 'RMO 37-2019; BIR Form 1904 instructions',
      sort_order: 1
    },
    {
      milestone_key: 'petition_filing',
      label: 'Petition for Probate — File with RTC',
      description: 'File petition for allowance of will (testate) or letters of administration (intestate) with the Regional Trial Court of decedent\'s domicile.',
      due_date: fmt(add(dod, 30)),
      legal_basis: 'Rule 76, Sec. 1, Rules of Court; Rule 79, Sec. 1',
      sort_order: 2
    },
    {
      milestone_key: 'inventory_appraisal',
      label: 'Executor\'s Inventory & Appraisal',
      description: 'Executor/administrator must file inventory of estate properties within 3 months of appointment.',
      due_date: fmt(add(dod, 150)),         // Appointment ~1 month + 3 months
      legal_basis: 'Rule 83, Sec. 1, Rules of Court',
      sort_order: 3
    },
    {
      milestone_key: 'bir_filing',
      label: 'BIR Estate Tax Return Filing (Form 1801)',
      description: 'File BIR Form 1801. Under judicial settlement, BIR may grant up to 5-year extension for payment. Filing deadline still 1 year.',
      due_date: fmt(add(dod, 365)),
      legal_basis: 'Sec. 9, TRAIN Law (RA 10963); Sec. 91(B), NIRC (judicial extension)',
      sort_order: 4
    }
  ]
}
```

### 2.3 Status Computation

Deadline status is computed in real-time from `due_date`, `completed_date`, and the current date — it is **not stored** in the database (avoiding stale data).

```typescript
// types/deadlines.ts (continued)
export type DeadlineStatus = 'done' | 'overdue' | 'urgent' | 'upcoming' | 'future'

export function computeDeadlineStatus(
  dueDate: string,          // ISO date 'YYYY-MM-DD'
  completedDate: string | null,
  today: Date = new Date()
): DeadlineStatus {
  if (completedDate !== null) return 'done'

  const due = new Date(dueDate)
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dueNorm = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const daysUntil = Math.floor((dueNorm.getTime() - todayNorm.getTime()) / 86_400_000)

  if (daysUntil < 0)   return 'overdue'   // past due, not done
  if (daysUntil <= 14) return 'urgent'    // ≤ 14 days: red
  if (daysUntil <= 30) return 'upcoming'  // 15–30 days: yellow
  return 'future'                          // > 30 days: green
}

export const DEADLINE_STATUS_COLORS: Record<DeadlineStatus, string> = {
  done:     'text-gray-400 bg-gray-50 border-gray-200',
  overdue:  'text-red-700 bg-red-50 border-red-300',
  urgent:   'text-orange-700 bg-orange-50 border-orange-300',
  upcoming: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  future:   'text-green-700 bg-green-50 border-green-200'
}

export const DEADLINE_STATUS_LABELS: Record<DeadlineStatus, string> = {
  done:     'Done',
  overdue:  'Overdue',
  urgent:   'Urgent',
  upcoming: 'Due Soon',
  future:   'Upcoming'
}
```

### 2.4 TypeScript Types

```typescript
// types/deadlines.ts (continued)
export interface CaseDeadlineRow {
  id: string
  case_id: string
  user_id: string
  milestone_key: string
  label: string
  description: string
  due_date: string           // ISO date 'YYYY-MM-DD'
  completed_date: string | null
  legal_basis: string
  sort_order: number
  is_auto: boolean
  note: string | null
  created_at: string
  updated_at: string
}

// Enriched with computed status for display
export interface CaseDeadlineDisplay extends CaseDeadlineRow {
  status: DeadlineStatus
  days_until: number         // negative = overdue
}
```

---

## 3. UI Design

### 3.1 Case-Level Timeline Panel

The deadline tracker appears as a collapsible panel in the Case Editor, below the ActionsBar. It renders as a vertical timeline with one row per milestone.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Estate Settlement Deadlines                                [+ Add]  [▲] │
│  Date of Death: January 15, 2025 · Track: Extrajudicial Settlement      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ●  [DONE]      Estate TIN Registration (BIR Form 1904)                  │
│  │              Feb 14, 2025 · Completed Jan 30, 2025                    │
│  │              RMO 37-2019                                              │
│  │                                                                       │
│  ●  [DONE]      Notice of Death to BIR (Form 1949)                       │
│  │              Mar 16, 2025 · Completed Feb 12, 2025                    │
│  │                                                                       │
│  ●  [DONE]      Execute Deed of Extrajudicial Settlement                  │
│  │              Apr 15, 2025 · Completed Mar 28, 2025                    │
│  │                                                                       │
│  ●  [DONE]      First Newspaper Publication                               │
│  │              Apr 15, 2025 · Completed Mar 28, 2025                    │
│  │                                                                       │
│  ●  [DONE]      Third (Final) Newspaper Publication                       │
│  │              May 6, 2025 · Completed Apr 18, 2025                     │
│  │                                                                       │
│  ●  [URGENT]    BIR Estate Tax Return Filing (Form 1801)       47 days   │
│  │              Due: Jan 15, 2026                                        │
│  │  Rule 74, Sec. 1, Rules of Court                         [Mark Done]  │
│  │                                                                       │
│  ●  [UPCOMING]  BIR eCAR Follow-Up (per property)             77 days   │
│  │              Due: Feb 14, 2026                                        │
│  │                                                                       │
│  ●  [FUTURE]    Local Transfer Tax Payment                    102 days   │
│  │              Due: Mar 11, 2026                                        │
│  │                                                                       │
│  ●  [FUTURE]    Register of Deeds — Title Transfer            132 days   │
│              Due: Apr 10, 2026                                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  [+ Add Custom Deadline]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Color key:**
- **DONE** — gray row, checkbox filled, strikethrough label
- **OVERDUE** — red row, red dot, "X days overdue" badge
- **URGENT** — orange row (≤ 14 days remaining)
- **UPCOMING** — yellow row (15–30 days remaining)
- **FUTURE** — green dot, no urgency indicator (> 30 days)

### 3.2 Mark Done Interaction

```
Row (hovered or active):
┌──────────────────────────────────────────────────────────────────────┐
│  ●  [URGENT]    BIR Estate Tax Return Filing (Form 1801)   47 days  │
│  │              Due: Jan 15, 2026                                    │
│  │              Sec. 9, TRAIN Law (RA 10963); BIR RR 12-2018        │
│  │                                       [Edit Note]  [Mark Done ✓] │
└──────────────────────────────────────────────────────────────────────┘

After clicking [Mark Done ✓]:
┌──────────────────────────────────────────────────────────────────────┐
│     Mark BIR Estate Tax Return Filing as complete?                   │
│     Completed date: [Mar 01, 2026  ▾]  (defaults to today)          │
│                                                                      │
│     Optional note: [____________________________]                   │
│                    e.g., "Filed at RDO 40, OR #1234567"              │
│                                                                      │
│     [Cancel]                              [Confirm — Mark Done]      │
└──────────────────────────────────────────────────────────────────────┘
```

After confirmation, the row animates to the DONE state and moves to the top of its completed sub-group.

### 3.3 Add Custom Deadline

```
┌──────────────────────────────────────────────────────────────────────┐
│  Add Custom Deadline                                                 │
│                                                                      │
│  Label            [________________________________]                 │
│                   e.g., "File SPA for overseas heir"                 │
│                                                                      │
│  Due Date         [MM / DD / YYYY]                                   │
│                                                                      │
│  Description      [________________________________]                 │
│                   One sentence explaining the requirement            │
│                                                                      │
│  Legal Basis      [________________________________]  (optional)     │
│                                                                      │
│  [Cancel]                                    [Add Deadline]          │
└──────────────────────────────────────────────────────────────────────┘
```

Custom deadlines show an "Added manually" indicator and can be deleted (auto-generated milestones cannot be deleted, only completed or noted).

### 3.4 Edit Milestone Note

```
┌──────────────────────────────────────────────────────────────────────┐
│  Note — BIR Estate Tax Return Filing                                 │
│                                                                      │
│  [____________________________________________________________]      │
│  [____________________________________________________________]      │
│  e.g., "Filed at RDO 40, OR #7823451. eCAR to follow in 2 wks."    │
│                                                                      │
│  [Cancel]                                          [Save Note]       │
└──────────────────────────────────────────────────────────────────────┘
```

Notes are displayed as a gray italic line below the milestone description in the timeline.

### 3.5 Dashboard Deadline Summary (Case List)

The case list card in the Dashboard shows an inline deadline summary for cases with urgent/overdue items:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Estate of Juan dela Cruz                                     computed    │
│  Date of Death: 15 Jan 2025 · Estate: ₱12,500,000                       │
│  ⚠ BIR filing due in 47 days   ●●● 5 of 9 milestones complete           │
│  Last updated: 2 hours ago                                  [Open] [···] │
└──────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- If any milestone is `overdue`: show red "⚠ [Label] overdue by X days"
- If any milestone is `urgent` (no overdue): show orange "⚠ [Label] due in X days"
- If any milestone is `upcoming` (no urgent/overdue): show yellow "● [Label] due in X days"
- If all done or all future: show no deadline indicator

### 3.6 Deadlines Across All Cases View

Route: `/deadlines` — attorney sees every open deadline across all cases in one view, sorted by urgency.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  All Upcoming Deadlines                  [Filter: Active cases ▾]        │
│                                                                          │
│  OVERDUE                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ● BIR Estate Tax Return Filing       3 days overdue             │   │
│  │    Estate of Carmen Villanueva · DOD Jun 14, 2024               │   │
│  │                                                    [Open Case]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  DUE THIS WEEK (≤ 7 days)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ● Affidavit of Publication (3rd pub)   5 days                   │   │
│  │    Estate of Roberto Tan · DOD Sep 30, 2025                     │   │
│  │                                                    [Open Case]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  URGENT (≤ 14 days)                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ● BIR Estate Tax Return Filing        12 days                   │   │
│  │    Estate of Pedro Magno · DOD Mar 5, 2025                      │   │
│  │                                                    [Open Case]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  DUE SOON (≤ 30 days)                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ● LGU Transfer Tax Payment            22 days                   │   │
│  │    Estate of Juan dela Cruz · DOD Jan 15, 2025                  │   │
│  │                                                    [Open Case]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  UPCOMING (> 30 days)      [Show all ▾]                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API / Data Layer

### 4.1 Generate Deadlines on Case Creation

Deadlines are auto-generated immediately when `date_of_death` is first set on a case (or when it changes). This happens client-side, then a bulk upsert writes all milestones to `case_deadlines`.

```typescript
// lib/deadlines.ts
import { supabase } from './supabase'
import { generateEJSDeadlines, generateProbateDeadlines } from '@/types/deadlines'
import type { CaseDeadlineRow, DeadlineMilestone } from '@/types/deadlines'

// Called when case.date_of_death is set or changed
export async function generateAndSaveDeadlines(
  caseId: string,
  userId: string,
  dateOfDeath: string,        // ISO date 'YYYY-MM-DD'
  track: 'ejs' | 'probate'
): Promise<void> {
  const dod = new Date(dateOfDeath)
  const milestones: DeadlineMilestone[] = track === 'ejs'
    ? generateEJSDeadlines(dod)
    : generateProbateDeadlines(dod)

  const rows = milestones.map(m => ({
    case_id: caseId,
    user_id: userId,
    milestone_key: m.milestone_key,
    label: m.label,
    description: m.description,
    due_date: m.due_date,
    legal_basis: m.legal_basis,
    sort_order: m.sort_order,
    is_auto: true,
    completed_date: null,
    note: null
  }))

  // Upsert: on conflict (case_id, milestone_key), update due_date only
  // completed_date and notes are preserved (don't overwrite user data)
  const { error } = await supabase
    .from('case_deadlines')
    .upsert(rows, {
      onConflict: 'case_id,milestone_key',
      ignoreDuplicates: false
    })

  if (error) throw error
}

// Load all deadlines for a case, enriched with computed status
export async function loadCaseDeadlines(
  caseId: string
): Promise<CaseDeadlineDisplay[]> {
  const { data, error } = await supabase
    .from('case_deadlines')
    .select('*')
    .eq('case_id', caseId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const today = new Date()
  return (data ?? []).map(row => {
    const daysUntil = Math.floor(
      (new Date(row.due_date).getTime() - today.getTime()) / 86_400_000
    )
    return {
      ...row,
      status: computeDeadlineStatus(row.due_date, row.completed_date, today),
      days_until: daysUntil
    }
  })
}

// Mark a milestone done
export async function markDeadlineDone(
  deadlineId: string,
  completedDate: string,   // ISO date 'YYYY-MM-DD'
  note: string | null
): Promise<void> {
  const { error } = await supabase
    .from('case_deadlines')
    .update({ completed_date: completedDate, note })
    .eq('id', deadlineId)

  if (error) throw error
}

// Mark a milestone not done (undo)
export async function markDeadlineNotDone(deadlineId: string): Promise<void> {
  const { error } = await supabase
    .from('case_deadlines')
    .update({ completed_date: null })
    .eq('id', deadlineId)

  if (error) throw error
}

// Add custom (non-auto) deadline
export async function addCustomDeadline(
  caseId: string,
  userId: string,
  label: string,
  dueDate: string,
  description: string,
  legalBasis: string | null
): Promise<void> {
  // Find current max sort_order and add after it
  const { data: existing } = await supabase
    .from('case_deadlines')
    .select('sort_order')
    .eq('case_id', caseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxSort = existing?.[0]?.sort_order ?? 0

  const milestoneKey = `custom_${Date.now()}`

  const { error } = await supabase
    .from('case_deadlines')
    .insert({
      case_id: caseId,
      user_id: userId,
      milestone_key: milestoneKey,
      label,
      description,
      due_date: dueDate,
      legal_basis: legalBasis ?? 'Manually added',
      sort_order: maxSort + 1,
      is_auto: false,
      completed_date: null,
      note: null
    })

  if (error) throw error
}

// Delete custom deadline (only non-auto milestones)
export async function deleteCustomDeadline(deadlineId: string): Promise<void> {
  const { error } = await supabase
    .from('case_deadlines')
    .delete()
    .eq('id', deadlineId)
    .eq('is_auto', false)     // Guard: cannot delete auto-generated milestones

  if (error) throw error
}

// Update milestone note
export async function updateDeadlineNote(
  deadlineId: string,
  note: string
): Promise<void> {
  const { error } = await supabase
    .from('case_deadlines')
    .update({ note: note.trim() || null })
    .eq('id', deadlineId)

  if (error) throw error
}
```

### 4.2 Dashboard Deadline Summary Query

For the case list cards, a Supabase RPC function returns a summary per case:

```sql
-- Supabase RPC: get_case_deadline_summaries
-- Returns urgency level and progress for multiple cases at once
CREATE OR REPLACE FUNCTION get_case_deadline_summaries(
  p_case_ids UUID[],
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  case_id        UUID,
  total_count    INTEGER,
  done_count     INTEGER,
  overdue_label  TEXT,     -- label of most urgent overdue item (or NULL)
  overdue_days   INTEGER,  -- days overdue (or NULL)
  urgent_label   TEXT,     -- label of most urgent upcoming item (or NULL)
  urgent_days    INTEGER   -- days until most urgent (or NULL)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      cd.case_id,
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE cd.completed_date IS NOT NULL) AS done_count,
      -- Most overdue item
      (SELECT label FROM case_deadlines
       WHERE case_id = cd.case_id
         AND completed_date IS NULL
         AND due_date < p_today
       ORDER BY due_date ASC LIMIT 1) AS overdue_label,
      (SELECT (p_today - due_date)::INTEGER FROM case_deadlines
       WHERE case_id = cd.case_id
         AND completed_date IS NULL
         AND due_date < p_today
       ORDER BY due_date ASC LIMIT 1) AS overdue_days,
      -- Most urgent upcoming item
      (SELECT label FROM case_deadlines
       WHERE case_id = cd.case_id
         AND completed_date IS NULL
         AND due_date >= p_today
       ORDER BY due_date ASC LIMIT 1) AS urgent_label,
      (SELECT (due_date - p_today)::INTEGER FROM case_deadlines
       WHERE case_id = cd.case_id
         AND completed_date IS NULL
         AND due_date >= p_today
       ORDER BY due_date ASC LIMIT 1) AS urgent_days
    FROM case_deadlines cd
    WHERE cd.case_id = ANY(p_case_ids)
    GROUP BY cd.case_id
  )
  SELECT
    stats.case_id,
    stats.total_count::INTEGER,
    stats.done_count::INTEGER,
    stats.overdue_label,
    stats.overdue_days,
    stats.urgent_label,
    stats.urgent_days
  FROM stats;
END; $$;
```

TypeScript call:

```typescript
// lib/deadlines.ts (continued)
export interface CaseDeadlineSummary {
  case_id: string
  total_count: number
  done_count: number
  overdue_label: string | null
  overdue_days: number | null
  urgent_label: string | null
  urgent_days: number | null
}

export async function getCaseDeadlineSummaries(
  caseIds: string[]
): Promise<Map<string, CaseDeadlineSummary>> {
  if (caseIds.length === 0) return new Map()

  const { data, error } = await supabase
    .rpc('get_case_deadline_summaries', { p_case_ids: caseIds })

  if (error) throw error

  return new Map((data ?? []).map((row: CaseDeadlineSummary) => [row.case_id, row]))
}
```

### 4.3 All-Cases Deadlines Query

For the `/deadlines` view — all pending deadlines across all active cases, sorted by urgency:

```typescript
// lib/deadlines.ts (continued)
export interface AllCasesDeadlineItem extends CaseDeadlineRow {
  status: DeadlineStatus
  days_until: number
  case_title: string
  decedent_name: string | null
  date_of_death: string | null
}

export async function getAllPendingDeadlines(
  userId: string
): Promise<AllCasesDeadlineItem[]> {
  // Join case_deadlines with cases to get case context
  // Only active cases (draft, computed, finalized) — not archived
  const { data, error } = await supabase
    .from('case_deadlines')
    .select(`
      *,
      cases!inner (
        id,
        title,
        decedent_name,
        date_of_death,
        status
      )
    `)
    .eq('user_id', userId)
    .is('completed_date', null)
    .not('cases.status', 'eq', 'archived')
    .order('due_date', { ascending: true })
    .limit(200)

  if (error) throw error

  const today = new Date()
  return (data ?? []).map((row: any) => ({
    ...row,
    case_title: row.cases.title,
    decedent_name: row.cases.decedent_name,
    date_of_death: row.cases.date_of_death,
    status: computeDeadlineStatus(row.due_date, null, today),
    days_until: Math.floor(
      (new Date(row.due_date).getTime() - today.getTime()) / 86_400_000
    )
  }))
}
```

---

## 5. Integration Points

### 5.1 With spec-auth-persistence (cases table)

- `case_deadlines` has FK to `cases(id)` — deadlines are owned by and cascade-deleted with cases
- `generateAndSaveDeadlines()` is called inside `createCase()` when `date_of_death` is present in `input_json`
- If `date_of_death` is edited in the wizard, call `generateAndSaveDeadlines()` again (upsert preserves completed_date)

```typescript
// lib/cases.ts — modified createCase()
export async function createCase(
  userId: string,
  input: EngineInput,
  output: EngineOutput
): Promise<{ id: string; error: Error | null }> {
  // ... existing insert code ...
  const { id, error } = await insertCase(...)

  // Auto-generate deadlines if date_of_death is present
  if (!error && input.decedent?.date_of_death) {
    const track = input.will ? 'probate' : 'ejs'
    await generateAndSaveDeadlines(id, userId, input.decedent.date_of_death, track)
  }

  return { id, error }
}
```

### 5.2 With spec-pdf-export

The deadline tracker has an optional **PDF section** that prints a "Settlement Deadline Summary" table at the end of the case PDF report. The table shows all milestones with their due dates, status, and completion dates.

PDF section structure:
```
Settlement Deadline Summary
─────────────────────────────────────────────────────
Milestone                      Due Date       Status
─────────────────────────────────────────────────────
Estate TIN Registration        Feb 14, 2025   Done (Jan 30)
Notice of Death to BIR         Mar 16, 2025   Done (Feb 12)
Execute Deed of EJS            Apr 15, 2025   Done (Mar 28)
First Newspaper Publication    Apr 15, 2025   Done (Mar 28)
Third Newspaper Publication    May 6, 2025    Done (Apr 18)
BIR Estate Tax Filing          Jan 15, 2026   Pending (47 days)
BIR eCAR Follow-Up             Feb 14, 2026   Pending
LGU Transfer Tax Payment       Mar 11, 2026   Pending
Register of Deeds Filing       Apr 10, 2026   Pending
─────────────────────────────────────────────────────
Generated: March 1, 2026
```

This section is included in the PDF export by default but can be toggled off in the PDF export options modal.

### 5.3 With spec-case-notes

Milestone completion notes (from the "Mark Done" modal) are stored in `case_deadlines.note`. These are distinct from `case_notes` (free-form per-case notes) and are surfaced in the deadline timeline UI, not the notes panel.

### 5.4 With spec-timeline-report

`spec-timeline-report` will generate a visual timeline (Gantt or milestone list) for sharing with clients. The deadline tracker's `case_deadlines` table is the primary data source for that feature. The deadline tracker stores the raw milestone data; the timeline report generates the visual representation.

---

## 6. Edge Cases

### 6.1 Date of Death Changes

| Scenario | Handling |
|----------|----------|
| User changes `date_of_death` after deadlines generated | `generateAndSaveDeadlines()` is called again; upsert updates `due_date` for all auto milestones; `completed_date` and `note` are preserved (not overwritten) because the upsert targets only `due_date` update |
| `date_of_death` is removed from input | No deadline regeneration; existing deadlines remain but show "date of death not set" warning at top of timeline |
| `date_of_death` is in the future | Deadlines are generated with future dates; all show `future` status; no validation error (future-dated deaths are valid for estate planning simulations) |
| Case is archived while deadlines are overdue | Deadlines are hidden from the `/deadlines` all-cases view (archived filter); they remain in the case if case is un-archived |

### 6.2 Track Changes (EJS → Probate)

| Scenario | Handling |
|----------|----------|
| User changes from EJS to probate track | Re-call `generateAndSaveDeadlines()` with `track = 'probate'`; EJS-only milestones (e.g., `pub_first`, `pub_complete`, `deed_execution`) are updated to have `is_auto = false` and a note "Milestone not applicable for probate track"; BIR filing milestone is preserved and updated |
| User has completed EJS milestones then switches to probate | Completed milestones with `completed_date` set are never overwritten; only uncompleted auto milestones have their `due_date` updated |

### 6.3 Missing Data

| Scenario | Handling |
|----------|----------|
| Case has no `date_of_death` | Timeline shows empty state: "Enter the date of death in the case wizard to generate settlement deadlines." with [Edit Case] button |
| `case_deadlines` table empty for a case with DOD | Show regenerate button: "Deadlines not generated — [Generate Deadlines]" triggers `generateAndSaveDeadlines()` |
| Custom deadline key collision (two custom deadlines added at same millisecond) | `milestone_key` uses `custom_{timestamp}` — near-zero collision risk; if collision, second insert fails silently; UI shows toast "Deadline added" only on success |

### 6.4 Mark Done Edge Cases

| Scenario | Handling |
|----------|----------|
| Mark done with future date | Allowed — attorney may want to pre-mark anticipated completion |
| Mark done with date before `date_of_death` | Client-side validation: show error "Completion date cannot be before the date of death" |
| Undo "Mark Done" | Click the done row; show "Mark as not done?" confirmation; sets `completed_date = NULL` |
| Mark done on overdue milestone | Allowed — no restriction; status immediately transitions from `overdue` to `done` |

### 6.5 Validation Rules

| Field | Rule |
|-------|------|
| `due_date` | Valid ISO date; cannot be before `date_of_death` |
| `completed_date` | Valid ISO date; cannot be before `date_of_death`; client-side validation only |
| `label` | 1–200 characters; cannot be empty |
| `description` | 1–500 characters |
| `legal_basis` | 1–300 characters; optional for custom milestones |
| `milestone_key` | Lowercase alphanumeric + underscores; unique per case |
| Custom deadlines | `is_auto = false`; can be deleted; auto milestones cannot be deleted |

### 6.6 Permissions

| Action | Permission |
|--------|------------|
| View deadlines | Requires auth + case ownership |
| Mark milestone done | Requires auth + case ownership |
| Add custom deadline | Requires auth + case ownership + case status ≠ 'archived' |
| Delete custom deadline | Requires auth + case ownership + `is_auto = false` |
| View shared case deadlines | Read-only deadline table visible on shared case (share_enabled = TRUE); no mark done on shared view |

---

## 7. Dependencies

| Dependency | Reason |
|------------|--------|
| `spec-auth-persistence` | `case_deadlines` references `cases(id)` and `auth.users(id)`. Cases must exist before deadlines can be created. |
| `update_updated_at()` trigger | Defined in `spec-auth-persistence` DDL. Reused here. |

**Must be built before:**
- `spec-timeline-report` — uses `case_deadlines` as data source
- `spec-document-checklist` — parallel feature; deadline tracker and document checklist use the same case context

---

## 8. Acceptance Criteria

### Deadline Generation
- [ ] When a case's `date_of_death` is set, 9 EJS milestones are auto-generated in `case_deadlines`
- [ ] When `date_of_death` changes, `due_date` on all auto milestones is recalculated; `completed_date` and `note` are preserved
- [ ] Switching to probate track replaces EJS-only milestones with probate-appropriate ones; BIR filing deadline preserved
- [ ] BIR filing deadline is exactly 365 days after `date_of_death`
- [ ] Publication first/complete deadlines match deed_execution date and deed_execution + 21 days respectively

### Timeline UI
- [ ] Timeline panel appears in Case Editor with all milestones in sort_order
- [ ] DONE milestones show gray strikethrough with completion date
- [ ] OVERDUE milestones show red with "X days overdue" badge
- [ ] URGENT milestones (≤ 14 days) show orange with day countdown
- [ ] UPCOMING milestones (≤ 30 days) show yellow with day countdown
- [ ] FUTURE milestones show green with day countdown
- [ ] Legal basis citation is visible on each row (at minimum on hover/expand)
- [ ] [Mark Done ✓] button opens confirmation modal with date picker defaulting to today
- [ ] After marking done, row transitions to DONE state and updates in DB
- [ ] "Mark as not done" undo is available on DONE rows

### Custom Deadlines
- [ ] [+ Add Custom Deadline] opens form with label, date, description, legal basis fields
- [ ] Custom deadline appears in timeline after auto-generated milestones
- [ ] Custom deadlines have a "Added manually" indicator
- [ ] Delete button visible on custom deadline rows
- [ ] Auto-generated milestones cannot be deleted

### Dashboard Summary
- [ ] Case list card shows overdue deadline label and days if any milestone is overdue
- [ ] Case list card shows urgent deadline label and days if any milestone is urgent (no overdue)
- [ ] Progress shown as "X of Y milestones complete"
- [ ] No deadline summary shown if all milestones are future (> 30 days) or all done

### All-Cases View
- [ ] `/deadlines` route shows all pending deadlines across all active cases
- [ ] Sections: OVERDUE, DUE THIS WEEK, URGENT, DUE SOON, UPCOMING
- [ ] Each item shows milestone label, case title, decedent name, days until/overdue
- [ ] [Open Case] link navigates to the specific case editor
- [ ] Archived cases do not appear in this view

### PDF Export
- [ ] Settlement Deadline Summary table included in PDF by default
- [ ] Table shows all milestones with due date, completion date (or "Pending"), status
- [ ] Toggle in PDF export options to include/exclude deadline table

### Security
- [ ] `case_deadlines` RLS policy prevents any user from reading another user's deadlines
- [ ] Shared case view (share_enabled) renders deadline table in read-only mode
- [ ] `deleteCustomDeadline()` guard prevents deletion of `is_auto = true` milestones

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `supabase/migrations/011_case_deadlines.sql` | NEW — `case_deadlines` DDL, indexes, RLS, `get_case_deadline_summaries` RPC |
| `src/types/deadlines.ts` | NEW — `DeadlineMilestone`, `CaseDeadlineRow`, `CaseDeadlineDisplay`, `DeadlineStatus`, `computeDeadlineStatus`, `generateEJSDeadlines`, `generateProbateDeadlines`, color/label maps |
| `src/lib/deadlines.ts` | NEW — `generateAndSaveDeadlines`, `loadCaseDeadlines`, `markDeadlineDone`, `markDeadlineNotDone`, `addCustomDeadline`, `deleteCustomDeadline`, `updateDeadlineNote`, `getCaseDeadlineSummaries`, `getAllPendingDeadlines` |
| `src/components/DeadlineTimeline.tsx` | NEW — vertical timeline panel for Case Editor |
| `src/components/MarkDoneModal.tsx` | NEW — confirmation dialog with date picker |
| `src/components/AddDeadlineModal.tsx` | NEW — custom deadline creation form |
| `src/pages/AllDeadlines.tsx` | NEW — `/deadlines` cross-case view |
| `src/pages/Dashboard.tsx` | MODIFY — call `getCaseDeadlineSummaries()` after loading case list; inject summary badges into case cards |
| `src/pages/CaseEditor.tsx` | MODIFY — add `<DeadlineTimeline caseId={caseId} />` below ActionsBar |
| `src/lib/cases.ts` | MODIFY — `createCase()` calls `generateAndSaveDeadlines()` after case insert |
| `src/components/pdf/SettlementDeadlineTable.tsx` | NEW — react-pdf component for deadline summary table |
| `src/App.tsx` | MODIFY — add `/deadlines` route |
