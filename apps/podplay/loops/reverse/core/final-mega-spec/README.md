# PodPlay Ops Wizard — Complete Specification

This spec is produced by the reverse ralph loop analyzing PodPlay's MRP spreadsheet, deployment guides, and hardware installation docs. It contains everything needed for a forward loop to build the full webapp.

## Sections

### Data Model
- `data-model/schema.md` — Complete Supabase schema (CREATE TABLE, enums, indexes, RLS)
- `data-model/seed-data.md` — Hardware catalog, BOM templates, checklist templates, settings defaults
- `data-model/relationships.md` — Entity relationships, foreign keys, cascade rules

### Business Logic
- `business-logic/bom-generation.md` — Auto-BOM algorithm per tier
- `business-logic/cost-analysis.md` — Complete pricing chain
- `business-logic/inventory-management.md` — Stock lifecycle
- `business-logic/deployment-tracking.md` — Status progression, progress calculation
- `business-logic/financial-reporting.md` — P&L, HER, reconciliation
- `business-logic/invoicing-expenses.md` — Billing and expense tracking

### UI Spec
- `ui-spec/routes.md` — Route map, auth guards, layouts
- `ui-spec/dashboard.md` — Home dashboard
- `ui-spec/wizard-intake.md` — Stage 1: Client intake wizard
- `ui-spec/wizard-procurement.md` — Stage 2: Hardware & procurement
- `ui-spec/wizard-deployment.md` — Stage 3: 15-phase deployment checklist
- `ui-spec/wizard-financials.md` — Stage 4: Financials & close-out
- `ui-spec/inventory-view.md` — Global inventory
- `ui-spec/financials-view.md` — Global financial dashboard
- `ui-spec/settings-view.md` — Settings & catalog management

### Deployment
- `deployment/infrastructure.md` — Fly.io, Supabase, env vars
- `deployment/data-migration.md` — XLSX → database migration

### Testing
- `testing/test-plan.md` — Test strategy and key test files
