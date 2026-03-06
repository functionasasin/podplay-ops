# Analysis: model-checklist-templates
**Aspect**: model-checklist-templates
**Date**: 2026-03-06
**Wave**: 2 — Data Model Extraction

---

## Goal

Specify the template data model for seeding deployment checklists per tier:
- Complete SQL INSERT for `deployment_checklist_templates` (all 121 steps)
- Template instantiation algorithm (templates → per-project checklist items)
- Tier-filtering rules
- Token substitution specification
- Schema gap: `location_id` missing from `projects` table

---

## Template Structure Summary

**Table**: `deployment_checklist_templates`
**Columns**: phase, phase_name, step_number, title, description, warnings (text[]), auto_fill_tokens (text[]), applicable_tiers (service_tier[]), is_v2_only (boolean), sort_order

**Sort order formula**: `phase × 100 + step_number`
- Phase 0, step 1 → sort_order 1
- Phase 10, step 3 → sort_order 1003
- Phase 15, step 6 → sort_order 1506

---

## Phase Inventory

| Phase | Name | Steps | Tier-Specific |
|-------|------|-------|--------------|
| 0 | Pre-Purchase & Planning | 8 | 0 |
| 1 | Pre-Configuration (PodPlay Office) | 7 | 0 |
| 2 | Unboxing & Labeling | 7 | 0 |
| 3 | Network Rack Assembly | 6 | 0 |
| 4 | Networking Setup (UniFi) | 12 | 2 |
| 5 | ISP Router Configuration | 2 | 0 |
| 6 | Camera Configuration | 13 | 0 |
| 7 | DDNS Setup (FreeDNS) | 5 | 0 |
| 8 | Mac Mini Setup | 8 | 0 |
| 9 | Replay Service Deployment (V1) | 10 | 0 |
| 10 | iPad Setup | 11 | 0 |
| 11 | Apple TV Setup | 5 | 0 |
| 12 | Physical Installation (On-Site) | 10 | 3 |
| 13 | Testing & Verification | 8 | 0 |
| 14 | Health Monitoring Setup | 3 | 0 |
| 15 | Packaging & Shipping | 6 | 0 |
| **Total** | | **121** | **5** |

---

## Tier-Specific Steps (applicable_tiers NOT NULL)

| Phase | Step | Title | Applicable Tiers |
|-------|------|-------|-----------------|
| 4 | 10 | Create SURVEILLANCE VLAN (VLAN 31) | autonomous_plus |
| 4 | 11 | Create ACCESS CONTROL VLAN (VLAN 33) | autonomous, autonomous_plus |
| 12 | 8 | Install Kisi Controller | autonomous, autonomous_plus |
| 12 | 9 | Install door readers | autonomous, autonomous_plus |
| 12 | 10 | Wire door locks | autonomous, autonomous_plus |

**PBK tier**: PBK uses standard Pro-level hardware with custom pricing. No PBK-specific deployment steps — PBK venues receive all standard steps (applicable_tiers=NULL rows only, same as Pro).

---

## Auto-Fill Token Inventory

6 token types used across 121 steps:

| Token | Source field | Steps using it |
|-------|-------------|----------------|
| `{{CUSTOMER_NAME}}` | `projects.customer_name` | Phase 1(1,2,3,4,7), 2(2,7), 4(3), 8(1,2,3), 9(2,3,5), 10(5,7,9), 11(4,5), 13(4), 14(3), 15(1,6) |
| `{{COURT_COUNT}}` | `projects.court_count` | Phase 0(3,5,8), 1(6), 2(2), 6(12), 8(2,5), 10(2), 12(1,7), 13(3,6,7), 15(1) |
| `{{DDNS_SUBDOMAIN}}` | `projects.ddns_subdomain` | Phase 1(5), 7(1,2,3,4,5), 13(1,2,6), 14(1,2) |
| `{{UNIFI_SITE_NAME}}` | `projects.unifi_site_name` | Phase 4(3) |
| `{{MAC_MINI_USERNAME}}` | `projects.mac_mini_username` | Phase 8(3,7) |
| `{{LOCATION_ID}}` | `projects.location_id` (**MISSING from schema**) | Phase 1(3), 10(7,9), 11(5) |

---

## Schema Gap: location_id Missing from projects Table

**Problem**: `{{LOCATION_ID}}` token is used in 4 checklist steps but `location_id` is NOT a field on the `projects` table.

**What it is**: The PodPlay admin dashboard assigns each venue a unique LOCATION_ID string. This ID is embedded in the MDM P-List config (`<dict><key>id</key><string>LOCATION_ID</string></dict>`) that routes the iPad/Apple TV app to the correct venue backend. The LOCATION_ID is provided by the dev team (Agustin).

**Fix required**: Add `location_id TEXT` to the `projects` table:
```sql
location_id TEXT,
-- PodPlay backend venue ID provided by dev team (Agustin)
-- Used in Mosyle MDM P-List config to route app to correct venue
-- Format: short alphanumeric string (e.g., 'telepark-jc')
-- Set during Phase 1 (Pre-Configuration), confirmed with Agustin before iPad setup
```

This field is also added to `final-mega-spec/data-model/schema.md` in this aspect's deliverables.

---

## Template Instantiation Algorithm

When a project enters Stage 3 (Deployment), the system creates per-project checklist items
from templates. TypeScript pseudocode:

```typescript
async function instantiateChecklist(
  projectId: string,
  project: Project,
  supabase: SupabaseClient
): Promise<void> {
  // 1. Fetch applicable templates filtered by tier
  const { data: templates } = await supabase
    .from('deployment_checklist_templates')
    .select('*')
    .or(`applicable_tiers.is.null,applicable_tiers.cs.{${project.tier}}`)
    .eq('is_v2_only', project.replay_service_version === 'v2' ? true : false)
    .or('is_v2_only.eq.false')  // Always include V1 steps; only add V2 steps if V2 enabled
    .order('sort_order');

  // 2. Build token map from project fields
  const tokenMap: Record<string, string> = {
    CUSTOMER_NAME: project.customer_name,
    COURT_COUNT: String(project.court_count),
    DDNS_SUBDOMAIN: project.ddns_subdomain ?? '',
    UNIFI_SITE_NAME: project.unifi_site_name ?? '',
    MAC_MINI_USERNAME: project.mac_mini_username ?? '',
    LOCATION_ID: project.location_id ?? '',
  };

  // 3. Replace tokens in description (warnings are not token-substituted — kept as-is)
  function replaceTokens(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => tokenMap[key] ?? `{{${key}}}`);
  }

  // 4. Create one checklist item per template
  const items = templates.map(t => ({
    project_id: projectId,
    template_id: t.id,
    phase: t.phase,
    step_number: t.step_number,
    sort_order: t.sort_order,
    title: t.title,  // No tokens in titles
    description: replaceTokens(t.description),
    warnings: t.warnings,  // Warnings contain no tokens
    is_completed: false,
    completed_at: null,
    notes: null,
  }));

  await supabase.from('deployment_checklist_items').insert(items);
}
```

**V2 handling**: When `project.replay_service_version = 'v2'`:
- Exclude Phase 9 V1 steps (steps 1-6 are the V1 deploy process; is_v2_only=false but Phase 9 replaces them)
- NOTE: When V2 launches, new Phase 9 steps should be added with `is_v2_only = true`
- For now (March 2026), all steps are is_v2_only=false; Phase 9 V1 steps always included

**Array filter for tiers**: PostgreSQL `applicable_tiers @> ARRAY['pro']::service_tier[]` does NOT work for "tier IS ANY of the values in the array". The correct query is:
```sql
WHERE applicable_tiers IS NULL
   OR 'pro'::service_tier = ANY(applicable_tiers)
```

**Supabase equivalent**:
```typescript
.or(`applicable_tiers.is.null,applicable_tiers.cs.{${project.tier}}`)
```

---

## Phase Ordering Correction

The `schema.md` comment block in `deployment_checklist_templates` had incorrect phase names
(phases 6-15 were shifted/wrong). Correct ordering from deployment guide:

| Phase | Correct Name |
|-------|-------------|
| 0 | Pre-Purchase & Planning |
| 1 | Pre-Configuration (PodPlay Office) |
| 2 | Unboxing & Labeling |
| 3 | Network Rack Assembly |
| 4 | Networking Setup (UniFi) |
| 5 | ISP Router Configuration |
| 6 | Camera Configuration ← (schema had DDNS here, wrong) |
| 7 | DDNS Setup (FreeDNS) ← (schema had Camera here, wrong) |
| 8 | Mac Mini Setup ← (schema had iPad Setup, wrong) |
| 9 | Replay Service Deployment (V1) ← (schema had Apple TV Setup, wrong) |
| 10 | iPad Setup ← (schema had Mac Mini Setup, wrong) |
| 11 | Apple TV Setup ← (schema had Replay Service, wrong) |
| 12 | Physical Installation (On-Site) ← (schema had Testing, wrong) |
| 13 | Testing & Verification ← (schema had Packing & Shipping, wrong) |
| 14 | Health Monitoring Setup ← (schema had On-Site Installation, wrong) |
| 15 | Packaging & Shipping ← (schema had Go-Live & Handoff, wrong) |

Schema.md comment block is corrected in this aspect's deliverables.

---

## Deliverables

1. `final-mega-spec/data-model/seed-data.md` — SQL INSERT for deployment_checklist_templates (121 rows)
2. `final-mega-spec/data-model/schema.md` — Fixed phase ordering comments + added location_id to projects table
