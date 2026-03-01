# Spec: Timeline Report

**Aspect:** spec-timeline-report
**Wave:** 2 — Per-Feature Specification
**Date:** 2026-03-01
**Depends:** spec-auth-persistence
**Reads:** spec-deadline-tracker (primary data source), ph-practice-workflow, competitive-landscape
**Discovered:** competitive-landscape (§7 Discovered Features — LEAP's LawToolBox integration and ph-practice-workflow pattern)

---

## 1. Overview

The Deadline Tracker (`spec-deadline-tracker`) is an internal attorney compliance tool — it shows individual milestones with urgency colors and lets the attorney check off items. The **Timeline Report** is its client-facing complement: a visual, stage-based settlement progress tracker that a PH estate lawyer can share with heirs and clients to answer the single most common question they receive:

> "Attorney, where are we in the process? When will this be done?"

Currently, lawyers answer this question by explaining verbally or writing a custom status email for each case. The Timeline Report generates this visual progress update automatically from case data — derived from `case_deadlines` milestone completion state — and presents it in clear, client-accessible language free of legal jargon.

**What the Timeline Report adds beyond the Deadline Tracker:**

| Dimension | Deadline Tracker | Timeline Report |
|-----------|-----------------|-----------------|
| Audience | Attorney (internal) | Client / heirs (external) |
| Language | Legal citation references | Plain language descriptions |
| Grouping | Individual milestones | Settlement stages (7 stages) |
| Layout | Vertical list, urgency-sorted | Visual horizontal progress bar |
| Interaction | Mark done, add notes, edit | Read-only |
| Sharing | Not shareable | Shareable via token URL or PDF |
| Focus | What's due next | Where we are overall |
| Export | PDF table section | Standalone shareable PDF report |

**Why PH estate lawyers would pay for this:** Families of the deceased are anxious and non-technical. They do not understand "BIR Form 1801" or "Affidavit of Publication." A visual timeline that says "Stage 4: BIR Filing — In Progress" with an estimated completion date dramatically reduces attorney-client friction and unsolicited status inquiries.

**Competitive context:** LEAP's LawToolBox integration provides deadline tracking but no client-facing visual timeline. No competitor provides stage-based visual settlement progress for estate cases in any jurisdiction.

---

## 2. Data Model

### 2.1 Stage Definitions (Static)

The 7 settlement stages are **statically defined** in TypeScript — they are not stored in the database. Each stage maps to one or more `milestone_key` values from the `case_deadlines` table. Stage completion is computed from milestone completion state.

```typescript
// types/timeline.ts

export interface TimelineStage {
  stage_number: number          // 1–7
  key: string                   // stable identifier
  label: string                 // attorney label (UI)
  client_label: string          // client-facing label (shared view)
  description: string           // attorney tooltip
  client_description: string    // client-facing paragraph
  milestone_keys: string[]      // case_deadline.milestone_key values that belong to this stage
                                // empty = manual stage (no milestone link)
  track: 'ejs' | 'probate' | 'both'  // which settlement track this stage applies to
}

export const EJS_STAGES: TimelineStage[] = [
  {
    stage_number: 1,
    key: 'consultation',
    label: 'Client Consultation',
    client_label: 'Case Opened',
    description: 'Initial client meeting. Identify heirs, properties, and succession type. Determine EJS vs. judicial track.',
    client_description: 'Your attorney has opened the estate case and gathered initial information about the decedent, heirs, and properties.',
    milestone_keys: [],           // No milestone — stage is complete when case is created
    track: 'ejs'
  },
  {
    stage_number: 2,
    key: 'document_gathering',
    label: 'Document Gathering',
    client_label: 'Gathering Documents',
    description: 'Collect PSA certificates, TCT/OCT/CCT copies, bank balances, tax declarations. File Estate TIN (BIR Form 1904) and Notice of Death (BIR Form 1949).',
    client_description: 'Your attorney is collecting required documents: death certificate, property titles, bank statements, and government filings to establish the estate.',
    milestone_keys: ['estate_tin', 'notice_of_death'],
    track: 'ejs'
  },
  {
    stage_number: 3,
    key: 'inheritance_computation',
    label: 'Inheritance Computation',
    client_label: 'Computing Shares',
    description: 'Run NCC succession computation. Determine each heir\'s legal share based on the Civil Code. Verify legitime satisfaction. Draft distribution plan.',
    client_description: 'Your attorney is computing the legal inheritance share of each heir using the Philippine Civil Code, ensuring all legal rights are protected.',
    milestone_keys: [],           // Stage is complete when case.status = 'computed' or 'finalized'
    track: 'ejs'
  },
  {
    stage_number: 4,
    key: 'estate_tax_filing',
    label: 'Estate Tax Filing (BIR)',
    client_label: 'BIR Tax Filing',
    description: 'Compute estate tax. Complete BIR Form 1801 with all schedules. File with Authorized Agent Bank (AAB) of applicable Revenue District Office. Pay estate tax. Deadline: 1 year from date of death.',
    client_description: 'Your attorney is filing the estate tax return with the Bureau of Internal Revenue. This must be done within one year of the date of death.',
    milestone_keys: ['bir_filing'],
    track: 'ejs'
  },
  {
    stage_number: 5,
    key: 'deed_and_publication',
    label: 'Deed of EJS & Publication',
    client_label: 'Legal Notice Published',
    description: 'Draft and notarize Deed of Extrajudicial Settlement. Publish in newspaper of general circulation once per week for 3 consecutive weeks. Secure Affidavit of Publication.',
    client_description: 'Your attorney is publishing the estate settlement notice in a newspaper, as required by Philippine law. This process takes three weeks.',
    milestone_keys: ['deed_execution', 'pub_first', 'pub_complete'],
    track: 'ejs'
  },
  {
    stage_number: 6,
    key: 'ecar_and_transfer_tax',
    label: 'eCAR & Transfer Taxes',
    client_label: 'Transfer Clearances',
    description: 'Secure BIR eCAR (electronic Certificate Authorizing Registration) for each real property. Pay local government unit transfer tax (0.5%–0.75% per LGU).',
    client_description: 'Your attorney is securing tax clearance certificates from the BIR and paying local transfer taxes required before properties can be transferred to heirs.',
    milestone_keys: ['ecar_follow_up', 'lgu_transfer_tax'],
    track: 'ejs'
  },
  {
    stage_number: 7,
    key: 'title_transfer',
    label: 'Register of Deeds — Title Transfer',
    client_label: 'Titles Transferred',
    description: 'File Deed of EJS, Affidavit of Publication, eCAR, and LGU transfer tax receipt at the Register of Deeds. RD issues new TCTs in heirs\' names.',
    client_description: 'Your attorney is registering the estate settlement with the Register of Deeds. Once complete, property titles will be issued in each heir\'s name.',
    milestone_keys: ['rd_registration'],
    track: 'ejs'
  }
]

export const PROBATE_STAGES: TimelineStage[] = [
  {
    stage_number: 1,
    key: 'consultation',
    label: 'Client Consultation',
    client_label: 'Case Opened',
    description: 'Initial client meeting. Assess whether will is contestable. Determine if probate is required.',
    client_description: 'Your attorney has opened the estate case and assessed the need for court proceedings.',
    milestone_keys: [],
    track: 'probate'
  },
  {
    stage_number: 2,
    key: 'document_gathering',
    label: 'Document Gathering',
    client_label: 'Gathering Documents',
    description: 'Collect original will, PSA certificates, TCT/OCT/CCT copies, financial documents. File Estate TIN.',
    client_description: 'Your attorney is collecting required documents including the original will, property titles, and government certificates.',
    milestone_keys: ['estate_tin'],
    track: 'probate'
  },
  {
    stage_number: 3,
    key: 'petition_and_hearing',
    label: 'Court Petition & Hearing',
    client_label: 'Court Proceedings',
    description: 'File petition with RTC. Publish notice to heirs and creditors. Court hearing for will allowance or appointment of administrator.',
    client_description: 'Your attorney has filed a petition with the Regional Trial Court. Court hearings will be scheduled to allow the will and appoint an estate administrator.',
    milestone_keys: ['petition_filing'],
    track: 'probate'
  },
  {
    stage_number: 4,
    key: 'inventory_appraisal',
    label: 'Inventory & Appraisal',
    client_label: 'Estate Inventory',
    description: 'Court-appointed executor files inventory of all estate assets within 3 months of appointment. Properties appraised at fair market value.',
    client_description: 'The estate administrator is creating a complete inventory of all properties and assets, appraised at their current market value.',
    milestone_keys: ['inventory_appraisal'],
    track: 'probate'
  },
  {
    stage_number: 5,
    key: 'estate_tax_filing',
    label: 'Estate Tax Filing (BIR)',
    client_label: 'BIR Tax Filing',
    description: 'File BIR Form 1801. Under judicial settlement, BIR may grant up to 5-year payment extension. Filing deadline still 1 year.',
    client_description: 'Your attorney is filing the estate tax return with the Bureau of Internal Revenue within the required one-year deadline.',
    milestone_keys: ['bir_filing'],
    track: 'probate'
  },
  {
    stage_number: 6,
    key: 'project_of_partition',
    label: 'Project of Partition',
    client_label: 'Distribution Plan Approved',
    description: 'Executor files Project of Partition with the court. Court reviews and approves distribution plan for all heirs. Court Order of Distribution issued.',
    client_description: 'Your attorney has submitted the proposed distribution plan to the court. Once approved, the court will issue an Order of Distribution.',
    milestone_keys: [],           // Court-controlled; no auto milestone
    track: 'probate'
  },
  {
    stage_number: 7,
    key: 'title_transfer',
    label: 'Register of Deeds — Title Transfer',
    client_label: 'Titles Transferred',
    description: 'File Court Order of Distribution + eCAR + transfer tax receipt at Register of Deeds. RD issues new TCTs in heirs\' names.',
    client_description: 'Following court approval, your attorney is registering the estate settlement with the Register of Deeds. Property titles will be issued to each heir.',
    milestone_keys: ['rd_registration'],
    track: 'probate'
  }
]
```

### 2.2 Case Timeline Settings Table (New)

One new table stores per-case timeline configuration options:

```sql
-- ============================================================
-- Case Timeline Settings — per-case customization for client sharing
-- ============================================================
CREATE TABLE case_timeline_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                   UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client sharing options
  show_on_shared_link       BOOLEAN NOT NULL DEFAULT TRUE,  -- Show timeline on shareable link view
  client_message            TEXT,    -- Personal message from attorney to client (max 500 chars)

  -- Settlement track (determines which stage set to use)
  track                     TEXT NOT NULL DEFAULT 'ejs'
                            CHECK (track IN ('ejs', 'probate')),

  -- Attorney's estimated completion date (optional override)
  estimated_completion_date DATE,    -- NULL = auto-computed from BIR filing deadline + buffer

  -- Stage label overrides (JSON: { stage_key: custom_label })
  -- e.g., { "consultation": "Initial Meeting Completed" }
  stage_label_overrides     JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_timeline_settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_case_timeline_settings_case_id  ON case_timeline_settings(case_id);
CREATE INDEX idx_case_timeline_settings_user_id  ON case_timeline_settings(user_id);

CREATE POLICY "timeline_settings_all_own" ON case_timeline_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read when case is shared (inherits from cases.share_enabled via JOIN — no direct RLS needed)
-- Access checked at application level: if cases.share_enabled AND cases.share_token matches, allow read

CREATE TRIGGER case_timeline_settings_updated_at
  BEFORE UPDATE ON case_timeline_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.3 Stage Completion Computation (TypeScript)

Stage completion state is computed **client-side** from `case_deadlines` rows and the case status — it is never stored:

```typescript
// types/timeline.ts (continued)

export type StageStatus = 'completed' | 'in_progress' | 'upcoming' | 'pending'

export interface TimelineStageDisplay {
  stage: TimelineStage
  status: StageStatus
  completed_milestone_count: number   // milestones for this stage that are done
  total_milestone_count: number       // total milestones for this stage
  earliest_due_date: string | null    // ISO date — earliest uncompleted milestone due date
  latest_completed_date: string | null // ISO date — latest completed_date in this stage
}

export interface TimelineReport {
  stages: TimelineStageDisplay[]
  current_stage_number: number         // stage_number of the IN_PROGRESS stage (or last completed if all done)
  overall_completion_percent: number   // 0–100
  estimated_completion_date: string | null  // ISO date
  track: 'ejs' | 'probate'
}

export function computeTimelineReport(
  stages: TimelineStage[],
  deadlines: CaseDeadlineRow[],      // from case_deadlines table
  caseStatus: 'draft' | 'computed' | 'finalized' | 'archived',
  estimatedCompletionOverride: string | null  // from case_timeline_settings
): TimelineReport {
  const deadlineMap = new Map(deadlines.map(d => [d.milestone_key, d]))

  const stageDisplays: TimelineStageDisplay[] = stages.map(stage => {
    // Stages with no milestone_keys use case status for completion
    if (stage.milestone_keys.length === 0) {
      let status: StageStatus
      if (stage.key === 'consultation') {
        // Always completed once case exists
        status = 'completed'
      } else if (stage.key === 'inheritance_computation') {
        // Complete when case has been computed
        status = (caseStatus === 'computed' || caseStatus === 'finalized')
          ? 'completed'
          : 'upcoming'
      } else {
        // Probate stages with no milestones (project_of_partition) — always 'upcoming' until manually marked
        status = 'pending'
      }
      return {
        stage,
        status,
        completed_milestone_count: 0,
        total_milestone_count: 0,
        earliest_due_date: null,
        latest_completed_date: null
      }
    }

    // Stages with milestone_keys
    const stageMilestones = stage.milestone_keys
      .map(key => deadlineMap.get(key))
      .filter((d): d is CaseDeadlineRow => d !== undefined)

    const completedMilestones = stageMilestones.filter(d => d.completed_date !== null)
    const pendingMilestones = stageMilestones.filter(d => d.completed_date === null)

    let status: StageStatus
    if (stageMilestones.length === 0) {
      status = 'pending'   // milestones not yet generated (no date_of_death)
    } else if (completedMilestones.length === stageMilestones.length) {
      status = 'completed'
    } else if (completedMilestones.length > 0) {
      status = 'in_progress'
    } else {
      status = 'upcoming'  // will be overridden to 'pending' if prior stage not done
    }

    const pendingDueDates = pendingMilestones
      .map(d => d.due_date)
      .sort()

    const completedDates = completedMilestones
      .map(d => d.completed_date as string)
      .sort()

    return {
      stage,
      status,
      completed_milestone_count: completedMilestones.length,
      total_milestone_count: stageMilestones.length,
      earliest_due_date: pendingDueDates[0] ?? null,
      latest_completed_date: completedDates[completedDates.length - 1] ?? null
    }
  })

  // Forward-pass: set stages to 'pending' if any prior required stage is not completed
  // (consultation → doc_gathering → ... must be sequential)
  let lastCompletedIdx = -1
  for (let i = 0; i < stageDisplays.length; i++) {
    if (stageDisplays[i].status === 'completed') {
      lastCompletedIdx = i
    } else if (stageDisplays[i].status === 'upcoming' && i > lastCompletedIdx + 1) {
      stageDisplays[i].status = 'pending'
    }
  }

  const currentStage = stageDisplays.find(s => s.status === 'in_progress')
    ?? stageDisplays[lastCompletedIdx + 1]
    ?? stageDisplays[stageDisplays.length - 1]

  const completedStages = stageDisplays.filter(s => s.status === 'completed').length
  const overallPercent = Math.round((completedStages / stageDisplays.length) * 100)

  // Estimated completion: override if set, else BIR filing deadline + 90 days (typical RD processing)
  let estimatedDate: string | null = estimatedCompletionOverride
  if (!estimatedDate) {
    const birDeadline = deadlineMap.get('bir_filing')
    if (birDeadline) {
      const d = new Date(birDeadline.due_date)
      d.setDate(d.getDate() + 90)
      estimatedDate = d.toISOString().split('T')[0]
    }
  }

  return {
    stages: stageDisplays,
    current_stage_number: currentStage.stage.stage_number,
    overall_completion_percent: overallPercent,
    estimated_completion_date: estimatedDate,
    track: stages[0]?.track === 'probate' ? 'probate' : 'ejs'
  }
}
```

### 2.4 TypeScript Row Types

```typescript
// types/timeline.ts (continued)

export interface CaseTimelineSettingsRow {
  id: string
  case_id: string
  user_id: string
  show_on_shared_link: boolean
  client_message: string | null
  track: 'ejs' | 'probate'
  estimated_completion_date: string | null   // ISO date
  stage_label_overrides: Record<string, string>
  created_at: string
  updated_at: string
}
```

---

## 3. UI Design

### 3.1 Attorney Timeline Panel (Case Editor)

The timeline report appears as a collapsible panel in the Case Editor, below the DeadlineTimeline panel. It shows the 7-stage horizontal progress bar:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settlement Timeline                               [Client View] [▲]     │
│  Track: Extrajudicial Settlement                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Overall Progress: ████████████░░░░░░░░░░░░  43% — Stage 3 of 7        │
│                                                                          │
│  ①       ②          ③            ④           ⑤          ⑥        ⑦    │
│  [DONE] [DONE]  [IN PROGRESS]  [UPCOMING]  [UPCOMING] [UPCOMING] [UPCOMING] │
│                                                                          │
│   Client   Document  Inheritance   BIR Tax    Deed &    eCAR &   Title  │
│  Consult   Gathering Computation   Filing    Publication Tax    Transfer │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                          │
│  Current Stage: Inheritance Computation                                  │
│  Case status: computed · Distribution computed Mar 1, 2026               │
│                                                                          │
│  Next: BIR Estate Tax Filing — Due Jan 15, 2026 (319 days)              │
│                                                                          │
│  Estimated Settlement Completion: Apr 10, 2026                          │
│  [Edit estimated date ✎]                                                 │
│                                                                          │
│  Client Message (optional):                                              │
│  [____________________________________________________________]         │
│  [____________________________________________________________]         │
│  "We have computed the inheritance shares. Next, we will prepare        │
│   the BIR estate tax return. We expect to complete the full             │
│   settlement by April 2026."                                            │
│                                                                          │
│  [✓ Show timeline on shared link]                                        │
│                                                                          │
│  [Copy Timeline Link]   [Export Timeline PDF]                            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Stage indicators:**
- `[DONE]` — filled circle ●, green background
- `[IN PROGRESS]` — half-filled circle ◑, blue background
- `[UPCOMING]` — empty circle ○, gray border
- `[PENDING]` — empty circle ○, lighter gray (prior stage not complete)

**Stage number display:**
- Completed: ① (filled)
- In Progress: ① (blue pulse animation on desktop, static on mobile)
- Upcoming: ① (empty ring)

**Progress bar:**
- Green fill for completed percentage
- Blue animated fill for in-progress portion
- Gray for remaining

### 3.2 Stage Detail Popover

Clicking any stage node opens a popover with full details:

```
┌──────────────────────────────────────────────────────────┐
│  Stage 4: BIR Estate Tax Filing            [UPCOMING]    │
│  ──────────────────────────────────────────────────────  │
│  File BIR Form 1801 with all schedules. Pay estate       │
│  tax at Authorized Agent Bank of the applicable RDO.     │
│  Deadline: 1 year from date of death.                    │
│                                                          │
│  Linked Milestones:                                      │
│  ○ BIR Estate Tax Return Filing (Form 1801)              │
│    Due: Jan 15, 2026 · Status: Upcoming (319 days)       │
│                                                          │
│  Legal Basis: Sec. 9, TRAIN Law (RA 10963)               │
│                                [View in Deadline Tracker] │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Client-Facing Shared Timeline Page

Route: `/share/:token/timeline`

Accessed via the shareable link (uses `cases.share_token`). No authentication required. Client sees:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  REYES & ASSOCIATES LAW OFFICE                                   │   │
│  │  Atty. Maria L. Reyes                                            │   │
│  │  Quezon City, Metro Manila · (02) 8888-1234                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Estate of Juan Roberto dela Cruz                                        │
│  Date of Death: January 15, 2025                                         │
│  Settlement Track: Extrajudicial Settlement                              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  SETTLEMENT PROGRESS                                    43% Complete      │
│                                                                          │
│  ████████████░░░░░░░░░░░░░░░░░                                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  ✓  Stage 1: Case Opened                           Completed             │
│     Your attorney has opened the estate case and gathered initial        │
│     information about the decedent, heirs, and properties.               │
│                                                                          │
│  ✓  Stage 2: Gathering Documents                   Completed Jan 28, 2025│
│     Required documents have been collected including the death           │
│     certificate, property titles, and bank statements.                   │
│                                                                          │
│  ◉  Stage 3: Computing Shares           ← Currently Here                 │
│     Your attorney is computing the legal inheritance share of each       │
│     heir using the Philippine Civil Code.                                │
│                                                                          │
│  ○  Stage 4: BIR Tax Filing                        Estimated Jan 15, 2026│
│     Your attorney will file the estate tax return with the Bureau        │
│     of Internal Revenue within the required one-year deadline.           │
│                                                                          │
│  ○  Stage 5: Legal Notice Published                Estimated Feb 6, 2026  │
│     The estate settlement notice will be published in a newspaper for    │
│     three consecutive weeks as required by Philippine law.               │
│                                                                          │
│  ○  Stage 6: Transfer Clearances                   Estimated Mar 11, 2026 │
│     Tax clearance certificates from the BIR and local transfer taxes     │
│     will be secured before property transfer proceeds.                   │
│                                                                          │
│  ○  Stage 7: Titles Transferred                    Estimated Apr 10, 2026 │
│     Property titles will be issued in each heir's name at the            │
│     Register of Deeds.                                                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Message from Atty. Reyes:                                               │
│  "We have computed the inheritance shares. Next, we will prepare         │
│   the BIR estate tax return. We expect to complete the full              │
│   settlement by April 2026. Please do not hesitate to contact            │
│   our office with any questions."                                         │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────      │
│  Estimated Settlement Completion: April 10, 2026                         │
│                                                                          │
│  Generated by Philippine Inheritance Calculator                          │
│  This is a status update only. This document is not a legal opinion.     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Stage icons:**
- ✓ COMPLETED — green checkmark circle, green left border
- ◉ IN PROGRESS — blue filled dot, blue left border, bold label
- ○ UPCOMING — gray empty circle, gray border
- Shows "← Currently Here" indicator next to in-progress stage

**Estimated dates for upcoming stages:**
- If stage has milestones: use earliest `due_date` from those milestones
- If stage has no milestones (consultation, inheritance_computation): show "Completed" or no date
- For stages beyond BIR filing: use deadline tracker milestone dates

### 3.4 Timeline Settings Panel (Attorney Side)

```
┌───────────────────────────────────────────────────────────┐
│  Timeline Report Settings                                  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Settlement Track                                          │
│  (●) Extrajudicial Settlement (EJS)                        │
│  ( ) Judicial / Probate                                    │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  Estimated Completion Date                                 │
│  [Apr 10, 2026  ▾]   [Use auto-computed]                  │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  Client Message                                            │
│  [______________________________________________]          │
│  [______________________________________________]          │
│  [______________________________________________]          │
│  Max 500 characters · Shown on client timeline page        │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  Client Visibility                                         │
│  [✓] Show timeline on shared case link                     │
│  [✓] Show estimated dates                                  │
│  [✓] Show attorney message                                 │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  [Cancel]                              [Save Settings]     │
└───────────────────────────────────────────────────────────┘
```

### 3.5 PDF Timeline Section (within Case PDF)

When the attorney exports the case PDF (`spec-pdf-export`), the timeline report is optionally included as a page titled "Settlement Progress Timeline":

```
────────────────────────────────────────────────────────────────────────────
SETTLEMENT PROGRESS TIMELINE
Estate of Juan Roberto dela Cruz  ·  January 15, 2025

Overall Progress: 43% Complete (3 of 7 stages)

  [●]───────[●]───────[◉]───────[○]───────[○]───────[○]───────[○]
Stage 1    Stage 2    Stage 3    Stage 4    Stage 5    Stage 6    Stage 7

────────────────────────────────────────────────────────────────────────────
STAGE                        STATUS         DATE / ESTIMATE
────────────────────────────────────────────────────────────────────────────
1. Case Opened               Completed      January 15, 2025
2. Gathering Documents       Completed      January 28, 2025
3. Computing Shares          In Progress    March 1, 2026
4. BIR Tax Filing            Upcoming       Due January 15, 2026
5. Legal Notice Published    Upcoming       Estimated February 6, 2026
6. Transfer Clearances       Upcoming       Estimated March 11, 2026
7. Titles Transferred        Upcoming       Estimated April 10, 2026
────────────────────────────────────────────────────────────────────────────
Estimated Settlement Completion: April 10, 2026

This is a status report only. Dates for upcoming stages are estimates only
and are subject to change based on BIR processing times and court schedules.
────────────────────────────────────────────────────────────────────────────
```

### 3.6 Mobile Layout (Client Shared Page, <640px)

On mobile (clients often access via WhatsApp link), the horizontal stage row collapses into a vertical progress list identical to the desktop layout's stage list — no horizontal overflow. The progress bar remains full-width at the top.

---

## 4. API / Data Layer

### 4.1 Timeline Settings CRUD

```typescript
// lib/timeline.ts
import { supabase } from './supabase'
import type { CaseTimelineSettingsRow } from '@/types/timeline'

// Upsert settings (create on first save, update thereafter)
export async function saveTimelineSettings(
  caseId: string,
  userId: string,
  settings: {
    show_on_shared_link: boolean
    client_message: string | null
    track: 'ejs' | 'probate'
    estimated_completion_date: string | null
    stage_label_overrides: Record<string, string>
  }
): Promise<void> {
  const { error } = await supabase
    .from('case_timeline_settings')
    .upsert(
      {
        case_id: caseId,
        user_id: userId,
        ...settings
      },
      { onConflict: 'case_id' }
    )

  if (error) throw error
}

// Load settings for a case
export async function loadTimelineSettings(
  caseId: string
): Promise<CaseTimelineSettingsRow | null> {
  const { data, error } = await supabase
    .from('case_timeline_settings')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Default settings (used before first save)
export function defaultTimelineSettings(
  caseId: string,
  userId: string
): CaseTimelineSettingsRow {
  return {
    id: '',
    case_id: caseId,
    user_id: userId,
    show_on_shared_link: true,
    client_message: null,
    track: 'ejs',
    estimated_completion_date: null,
    stage_label_overrides: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
```

### 4.2 Timeline Report Generation (Client-Side)

The full timeline report is generated entirely client-side from existing data — no new API endpoint required:

```typescript
// lib/timeline.ts (continued)
import { EJS_STAGES, PROBATE_STAGES, computeTimelineReport } from '@/types/timeline'
import { loadCaseDeadlines } from '@/lib/deadlines'
import type { TimelineReport } from '@/types/timeline'

export async function generateTimelineReport(
  caseId: string,
  caseStatus: 'draft' | 'computed' | 'finalized' | 'archived',
  settings: CaseTimelineSettingsRow
): Promise<TimelineReport> {
  const deadlines = await loadCaseDeadlines(caseId)
  const stages = settings.track === 'probate' ? PROBATE_STAGES : EJS_STAGES

  return computeTimelineReport(
    stages,
    deadlines,
    caseStatus,
    settings.estimated_completion_date
  )
}
```

### 4.3 Client Shared Timeline API

The client-facing timeline page at `/share/:token/timeline` fetches:

1. Case row via share token (existing RLS policy `cases_select_shared` allows this)
2. Case deadline rows (via case_id — public read allowed when share_enabled)
3. Timeline settings (via case_id — public read allowed when share_enabled)
4. User profile (firm name, attorney name, address — partial select, public fields only)

```typescript
// lib/timeline.ts (continued)
import type { UserProfile } from '@/types/db'

export interface SharedTimelineData {
  case_id: string
  case_title: string
  decedent_name: string | null
  date_of_death: string | null
  firm_name: string | null
  counsel_name: string | null
  firm_address: string | null
  firm_phone: string | null
  report: TimelineReport
  client_message: string | null
  show_estimated_dates: boolean   // derived from settings (always true in current spec)
}

export async function loadSharedTimeline(
  shareToken: string
): Promise<SharedTimelineData | null> {
  // 1. Load case by token
  const { data: caseRow, error: caseErr } = await supabase
    .from('cases')
    .select('id, title, decedent_name, date_of_death, user_id, status, share_enabled')
    .eq('share_token', shareToken)
    .eq('share_enabled', true)
    .maybeSingle()

  if (caseErr || !caseRow) return null

  // 2. Load timeline settings
  const { data: settings } = await supabase
    .from('case_timeline_settings')
    .select('*')
    .eq('case_id', caseRow.id)
    .maybeSingle()

  if (!settings || !settings.show_on_shared_link) return null

  // 3. Load deadlines
  const { data: deadlines } = await supabase
    .from('case_deadlines')
    .select('*')
    .eq('case_id', caseRow.id)
    .order('sort_order', { ascending: true })

  // 4. Load firm profile (public fields only — no sensitive data)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('firm_name, counsel_name, address, phone')
    .eq('id', caseRow.user_id)
    .maybeSingle()

  const stages = settings.track === 'probate' ? PROBATE_STAGES : EJS_STAGES
  const report = computeTimelineReport(
    stages,
    deadlines ?? [],
    caseRow.status,
    settings.estimated_completion_date
  )

  return {
    case_id: caseRow.id,
    case_title: caseRow.title,
    decedent_name: caseRow.decedent_name,
    date_of_death: caseRow.date_of_death,
    firm_name: profile?.firm_name ?? null,
    counsel_name: profile?.counsel_name ?? null,
    firm_address: profile?.address ?? null,
    firm_phone: profile?.phone ?? null,
    report,
    client_message: settings.client_message,
    show_estimated_dates: true
  }
}
```

### 4.4 PDF Timeline Component (react-pdf)

```typescript
// components/pdf/TimelineReportSection.tsx
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { TimelineReport } from '@/types/timeline'

const styles = StyleSheet.create({
  section: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  title: { fontSize: 13, fontFamily: 'Times-Bold', marginBottom: 8 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 12 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#e5e7eb', marginBottom: 16 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#16a34a' },
  table: { marginTop: 8 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', paddingBottom: 4, marginBottom: 4 },
  headerCell: { fontSize: 9, fontFamily: 'Times-Bold' },
  row: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  cellStage: { width: '50%', fontSize: 9 },
  cellStatus: { width: '25%', fontSize: 9 },
  cellDate: { width: '25%', fontSize: 9 },
  completed: { color: '#15803d' },
  inProgress: { color: '#1d4ed8' },
  upcoming: { color: '#6b7280' },
  disclaimer: { fontSize: 8, color: '#9ca3af', marginTop: 12, fontStyle: 'italic' },
  estimatedLine: { fontSize: 10, marginTop: 8, fontFamily: 'Times-Bold' }
})

function stageStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed'
    case 'in_progress': return 'In Progress'
    case 'upcoming': return 'Upcoming'
    case 'pending': return 'Pending'
    default: return 'Pending'
  }
}

function formatPHDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function TimelineReportSection({
  report,
  decedentName
}: {
  report: TimelineReport
  decedentName: string | null
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Settlement Progress Timeline</Text>
      {decedentName && (
        <Text style={styles.subtitle}>
          Estate of {decedentName}
          {' · '}{report.overall_completion_percent}% Complete
          {' ('}{report.stages.filter(s => s.status === 'completed').length} of {report.stages.length} stages{')'}
        </Text>
      )}

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { width: '50%' }]}>Stage</Text>
          <Text style={[styles.headerCell, { width: '25%' }]}>Status</Text>
          <Text style={[styles.headerCell, { width: '25%' }]}>Date / Estimate</Text>
        </View>
        {report.stages.map(sd => {
          const dateStr = sd.status === 'completed'
            ? formatPHDate(sd.latest_completed_date)
            : sd.earliest_due_date
              ? `Est. ${formatPHDate(sd.earliest_due_date)}`
              : '—'
          const statusStyle = sd.status === 'completed'
            ? styles.completed
            : sd.status === 'in_progress'
              ? styles.inProgress
              : styles.upcoming

          return (
            <View key={sd.stage.key} style={styles.row}>
              <Text style={[styles.cellStage, statusStyle]}>
                {sd.stage.stage_number}. {sd.stage.label}
              </Text>
              <Text style={[styles.cellStatus, statusStyle]}>
                {stageStatusLabel(sd.status)}
              </Text>
              <Text style={[styles.cellDate, statusStyle]}>
                {dateStr}
              </Text>
            </View>
          )
        })}
      </View>

      {report.estimated_completion_date && (
        <Text style={styles.estimatedLine}>
          Estimated Settlement Completion: {formatPHDate(report.estimated_completion_date)}
        </Text>
      )}

      <Text style={styles.disclaimer}>
        Estimated dates for upcoming stages are based on statutory deadlines and typical processing times.
        Actual dates may vary due to BIR processing times, court schedules, and Register of Deeds backlogs.
        This timeline is a planning tool only and does not constitute legal advice or a binding commitment.
      </Text>
    </View>
  )
}
```

---

## 5. Integration Points

### 5.1 With spec-deadline-tracker (Primary Data Source)

The Timeline Report is a **presentation layer** over `spec-deadline-tracker`'s data. The `case_deadlines` table is the single source of truth for milestone completion state; the timeline report reads it and maps milestones to stages.

No bidirectional coupling: the timeline report does not write to `case_deadlines`. Milestone completion is managed solely through the Deadline Tracker UI.

When `spec-deadline-tracker` marks a milestone done:
1. `case_deadlines.completed_date` is set
2. The next time the Timeline Report panel renders, `computeTimelineReport()` picks up the updated state
3. Stage status may transition from `in_progress` → `completed`

### 5.2 With spec-auth-persistence (cases table)

- `case_timeline_settings` has FK to `cases(id)` — settings are owned by and cascade-deleted with cases
- The timeline settings panel is rendered inside the Case Editor (route `/cases/:id`)
- `cases.status` is read to determine inheritance computation stage completion

### 5.3 With spec-shareable-links (share_token)

The client-facing timeline page at `/share/:token/timeline` is an extension of the shared case link feature. The share token is owned by `cases.share_token` — no separate token is needed for the timeline.

**Navigation from shared case view:**
```
┌─────────────────────────────────────┐
│  [Case Summary]  [Timeline]  [PDF]  │  ← tab bar on shared view
└─────────────────────────────────────┘
```

The attorney can control whether the timeline tab appears via `case_timeline_settings.show_on_shared_link`.

If `show_on_shared_link = false`, the `/share/:token/timeline` route returns a 404-equivalent ("Timeline not available for this case").

### 5.4 With spec-pdf-export (PDF Export)

The `TimelineReportSection` react-pdf component is injected into the full case PDF as an optional page/section. In the PDF export options modal:

```
PDF Export Options
─────────────────────────────────────────
[✓] Distribution Summary Table
[✓] Per-Heir Narratives
[✓] Computation Log
[✓] Warnings
[✓] Settlement Deadline Summary (from spec-deadline-tracker)
[✓] Settlement Progress Timeline (from spec-timeline-report)   ← new checkbox
─────────────────────────────────────────
```

### 5.5 With spec-firm-branding

The client-facing shared timeline page renders the firm header (firm name, counsel name, address, phone, logo) exactly like the shared case view. The firm profile is loaded from `user_profiles` using the `user_id` from the case row.

---

## 6. Edge Cases

### 6.1 Missing Prerequisites

| Scenario | Handling |
|----------|----------|
| `date_of_death` not set | Timeline panel shows: "Settlement timeline requires a date of death. [Edit Case]" — no stages rendered |
| `case_deadlines` table empty (deadlines not yet generated) | Timeline panel renders stages using only case status; milestone-linked stages show "awaiting deadline data" tooltip; attorney sees [Generate Deadlines] link pointing to the Deadline Tracker |
| Case has no `output_json` (draft, not computed) | Stage 3 (Inheritance Computation) shows `upcoming` instead of `in_progress` or `completed`; no error |
| Case is `archived` | Timeline panel still renders in the case view (archived cases can still be opened); all stages remain as-is |

### 6.2 Track Change (EJS ↔ Probate)

| Scenario | Handling |
|----------|----------|
| Track changed from EJS to Probate | `saveTimelineSettings()` updates `track`; on next render, `PROBATE_STAGES` is used; EJS-specific stages (Deed & Publication) are replaced by Probate-specific stages (Court Petition, Inventory) |
| Milestones exist for EJS but track switched to Probate | EJS milestones remain in `case_deadlines`; they are not used by the Probate stage definitions; no conflict; Deadline Tracker still shows them (with EJS labels); Timeline Report ignores them |
| EJS milestones are all completed, then track switched to Probate | Stage completion state resets (Probate stages use different `milestone_keys`); attorney must recomplete stages under Probate track |

### 6.3 Shared Link Scenarios

| Scenario | Handling |
|----------|----------|
| `show_on_shared_link = false` | `/share/:token/timeline` returns 404 message: "The timeline for this case is not publicly available." |
| Share token is valid but `share_enabled = false` | `loadSharedTimeline()` returns `null`; page shows "This case is no longer shared." |
| No `case_timeline_settings` row exists yet | `maybeSingle()` returns null; `loadSharedTimeline()` returns `null`; timeline tab hidden from shared view until attorney saves timeline settings at least once |
| Client message contains HTML tags | Client message is rendered as plain text (`<Text>` in react-pdf, `textContent` in HTML); no XSS risk |
| `estimated_completion_date` is in the past | Rendered as-is; attorney is responsible for updating stale estimate; no automatic warning on client view (attorney-facing panel shows a yellow notice: "Estimated completion date has passed. Update it?") |

### 6.4 Stage Completion Edge Cases

| Scenario | Handling |
|----------|----------|
| Stage has 3 milestones, 2 completed, 1 not yet in `case_deadlines` | Stage is `in_progress` (at least one complete) |
| Stage 1 (Consultation) — no milestones, always completed | Hardcoded to `completed` when a case exists |
| Stage 3 (Inheritance Computation) — no milestones, depends on case status | `completed` if `caseStatus ∈ {'computed', 'finalized'}`; otherwise `upcoming` |
| Stage 6 (Probate: Project of Partition) — no milestones | Always `pending` until the attorney manually marks it via the Deadline Tracker or adds a custom milestone |
| All 7 stages completed | `overall_completion_percent = 100`; `current_stage_number = 7`; client page shows: "Settlement Complete" header |

### 6.5 Validation Rules

| Field | Rule |
|-------|------|
| `client_message` | Max 500 characters; HTML tags stripped on save; `null` if empty |
| `track` | Must be `'ejs'` or `'probate'`; CHECK constraint enforced in DB |
| `estimated_completion_date` | Valid ISO date; if set, must be after `cases.date_of_death`; client-side validation only |
| `stage_label_overrides` | JSON object with string keys and string values; each value max 100 chars; must be valid stage keys from `EJS_STAGES` or `PROBATE_STAGES` |

### 6.6 Permissions

| Action | Permission |
|--------|------------|
| View timeline panel (attorney) | Requires auth + case ownership |
| Edit timeline settings | Requires auth + case ownership |
| View client timeline page | No auth required — share token sufficient |
| Toggle `show_on_shared_link` | Requires auth + case ownership |
| Access timeline data via API | `case_timeline_settings` RLS: only owner can read/write; public read is handled at application level via join with `cases.share_enabled` |

---

## 7. Dependencies

| Dependency | Reason |
|------------|--------|
| `spec-auth-persistence` | `case_timeline_settings` references `cases(id)` and `auth.users(id)`. The Case Editor that hosts the timeline panel requires authentication. |
| `spec-deadline-tracker` | `case_deadlines` is the primary data source for milestone completion state. The timeline report reads `case_deadlines` rows to compute stage status. Must be built before the timeline report can show meaningful progress. |

**Must be built before:**
- Nothing — `spec-timeline-report` is not a dependency of any other feature.

**Works best with (optional but enhances functionality):**
- `spec-shareable-links` — Enables the client-facing `/share/:token/timeline` page. Without it, the timeline report exists only inside the attorney's case editor.
- `spec-firm-branding` — Populates the firm header on the client-facing timeline page.
- `spec-pdf-export` — Enables including the timeline as a PDF section.

---

## 8. Acceptance Criteria

### Timeline Panel (Attorney View)

- [ ] Timeline panel appears below the Deadline Tracker panel in the Case Editor
- [ ] Panel collapses/expands with the `[▲]`/`[▼]` button; state persisted in localStorage per case
- [ ] Horizontal stage row renders 7 circles labeled Stage 1–7 with stage names below
- [ ] Completed stages show green filled circle ●
- [ ] In-progress stage shows blue half-filled circle ◑
- [ ] Upcoming stages show gray empty circle ○
- [ ] Overall progress bar fills to the correct percentage
- [ ] Clicking a stage circle opens a popover with stage description, linked milestones, and their status
- [ ] "Next" hint shows the nearest upcoming milestone label and days until due
- [ ] Estimated completion date renders; attorney can override it via date picker
- [ ] "Edit estimated date" saves to `case_timeline_settings`
- [ ] Track toggle (EJS / Probate) updates stage set immediately (no page reload)
- [ ] Attorney can type a client message and save it
- [ ] `[✓] Show timeline on shared link` toggle saves `show_on_shared_link`
- [ ] When no `date_of_death` is set: empty state message with [Edit Case] link, no stage circles rendered

### Client-Facing Shared Timeline

- [ ] `/share/:token/timeline` renders without authentication
- [ ] Firm header shows: firm name, counsel name, address, phone
- [ ] Case title and decedent name shown at top
- [ ] 7 stages rendered vertically with client-friendly labels
- [ ] Completed stages show green checkmark, completion date
- [ ] In-progress stage is highlighted (blue border, "← Currently Here" badge)
- [ ] Upcoming stages show estimated date if available
- [ ] Client message from attorney renders below stage list
- [ ] Estimated completion date renders at bottom
- [ ] Disclaimer: "This is a status update only. This document is not a legal opinion."
- [ ] If `show_on_shared_link = false`: page shows "Timeline not available" — no case data exposed
- [ ] Mobile layout (< 640px): horizontal stage row collapses to vertical list, no horizontal scroll
- [ ] Page title: "Settlement Progress — Estate of [Decedent Name]"

### Stage Completion Logic

- [ ] Stage 1 (Case Opened) is always completed once a case exists
- [ ] Stage 2 (Document Gathering) shows `completed` when `estate_tin` and `notice_of_death` milestones both have `completed_date` set
- [ ] Stage 3 (Computing Shares) shows `completed` when `case.status ∈ {'computed', 'finalized'}`
- [ ] Stage 4 (BIR Tax Filing) shows `in_progress` when `bir_filing` milestone exists but is not yet completed
- [ ] Stage 5 (Deed & Publication) shows `completed` when `deed_execution`, `pub_first`, and `pub_complete` are all done
- [ ] When all 7 stages are `completed`, overall progress shows 100% and "Settlement Complete" header
- [ ] Switching from EJS to Probate track changes the 7 stages to probate equivalents
- [ ] Stage 6 (Probate: Project of Partition) defaults to `pending` with note "Mark complete manually when court order is issued"

### PDF Export

- [ ] "Settlement Progress Timeline" checkbox appears in PDF export options
- [ ] When checked, `TimelineReportSection` is appended to the PDF after the Deadline Summary table
- [ ] PDF table shows: Stage, Status, Date/Estimate columns with correct values
- [ ] Disclaimer text renders below the table
- [ ] Estimated completion date renders after the table

### Settings

- [ ] Timeline settings saved to `case_timeline_settings` (upsert on case_id conflict)
- [ ] Saving settings does not reset milestone completion state in `case_deadlines`
- [ ] `estimated_completion_date` before `date_of_death` shows client-side validation error: "Estimated completion cannot be before the date of death"
- [ ] `client_message` exceeding 500 characters shows character counter and blocks save

### Security

- [ ] `case_timeline_settings` RLS prevents any user from reading another user's settings
- [ ] `/share/:token/timeline` does not expose `user_id`, `share_token`, or any internal case IDs in the response
- [ ] Accessing `/share/:token/timeline` with an invalid or revoked token returns a generic "not found" response
- [ ] `show_on_shared_link = false` is enforced at the API level — the Supabase query returns null, not just hidden in the UI

---

## 9. File Changes Required

| File | Change |
|------|--------|
| `supabase/migrations/012_case_timeline_settings.sql` | NEW — `case_timeline_settings` DDL, RLS, trigger |
| `src/types/timeline.ts` | NEW — `TimelineStage`, `TimelineStageDisplay`, `TimelineReport`, `StageStatus`, `EJS_STAGES`, `PROBATE_STAGES`, `computeTimelineReport`, `CaseTimelineSettingsRow` |
| `src/lib/timeline.ts` | NEW — `saveTimelineSettings`, `loadTimelineSettings`, `defaultTimelineSettings`, `generateTimelineReport`, `loadSharedTimeline` |
| `src/components/TimelinePanel.tsx` | NEW — horizontal stage progress component for Case Editor |
| `src/components/StagePopover.tsx` | NEW — popover showing stage details when stage circle clicked |
| `src/components/TimelineSettings.tsx` | NEW — settings form panel (track, estimated date, message, visibility toggle) |
| `src/pages/SharedTimeline.tsx` | NEW — client-facing timeline page at `/share/:token/timeline` |
| `src/components/pdf/TimelineReportSection.tsx` | NEW — react-pdf component for timeline table |
| `src/pages/CaseEditor.tsx` | MODIFY — add `<TimelinePanel caseId={caseId} />` below DeadlineTimeline |
| `src/pages/SharedCase.tsx` | MODIFY — add "Timeline" tab that links to `/share/:token/timeline`; tab hidden if `show_on_shared_link = false` |
| `src/components/pdf/ExportOptionsModal.tsx` | MODIFY — add "Settlement Progress Timeline" checkbox |
| `src/App.tsx` | MODIFY — add `/share/:token/timeline` route |
