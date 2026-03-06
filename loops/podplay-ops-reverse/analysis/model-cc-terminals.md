# Analysis: model-cc-terminals
**Aspect**: model-cc-terminals
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06

---

## Goal

Specify the CC Terminal and front desk equipment model:
- `cc_terminals` table: BBPOS WisePOS E ordering, cost tracking, delivery status
- `replay_signs` table: sign fulfillment lifecycle (included here as it follows the same side-channel procurement pattern)
- Front desk equipment bundling logic (`has_front_desk = true` triggers BOM items + cc_terminals row)
- Distinction: FD-CC-TERMINAL is in BOM for cost/invoice purposes but procured via `cc_terminals` workflow, not standard PO

---

## Key Findings

1. **Vendor correction**: The initial `cc_terminals` table had `square_order_id` — **Square is incorrect**. The BBPOS WisePOS E is ordered through **Stripe**. Fixed to `stripe_order_id`.

2. **Two parallel fulfillment workflows**: CC terminals and replay signs are both side-channel procurements that bypass the standard PO/inventory system:
   - CC terminals: ordered via Stripe hardware portal, $249/unit, admin PIN 07139
   - Replay signs: ordered via Fast Signs (vendor), $25/unit, 2 per court

3. **Auto-row creation on Stage 2 entry**: Both `cc_terminals` (when `has_front_desk = true`) and `replay_signs` (always) are created when a project enters the Procurement stage.

4. **Front desk BOM distinction**: `FD-CC-TERMINAL` appears in `project_bom_items` for cost chain and invoice calculation, but its physical procurement is tracked in `cc_terminals` only. `FD-QR-SCANNER` and `FD-WEBCAM` go through standard PO flow.

5. **Replay sign inventory decrement**: When replay signs status → `installed`, an `inventory_movements` record is created for `REPLAY-SIGN` SKU (movement_type=`shipped`, delta=negative qty).

6. **Admin PIN in settings**: `settings.cc_terminal_pin = '07139'` — stored globally so it can be shown in the deployment checklist and updated org-wide.

---

## Source

- Frontier aspect description: `model-cc-terminals`
- Schema.md existing tables: `cc_terminals` (lines 1393–1437), `replay_signs` (lines 1340–1391)
- Seed data: `FD-CC-TERMINAL` ($249, Stripe vendor), `FD-QR-SCANNER` ($40), `FD-WEBCAM` ($46)
- Settings: `cc_terminal_pin = '07139'`, `replay_sign_multiplier = 2`
- XLSX "CC Form" sheet: NOT AVAILABLE — column names derived from frontier description

---

## Output Written

`final-mega-spec/data-model/schema.md` — appended section:
- "CC Terminal & Front Desk Equipment Model"
- Field source maps for both `cc_terminals` and `replay_signs`
- Status state machines for both `cc_terminal_status` and `sign_status`
- Front desk equipment bundling logic with TypeScript service snippets
- Replay sign ordering workflow with inventory decrement logic
- CC terminal ordering workflow (replaces MRP "CC Form" sheet)
- Stage 2 entry trigger (idempotent row creation)
- Known gaps table (5 items)
