# Analysis: model-device-migration
**Aspect**: model-device-migration
**Date**: 2026-03-06
**Sources**: analysis/source-deployment-guide.md (Appendix E + Appendix F), analysis/model-checklist-templates.md, final-mega-spec/data-model/schema.md

---

## Source Material

### Appendix E — Device Migration (ABM Transfer) Workflow

From `analysis/source-deployment-guide.md`:

> Steps when transferring devices from one Apple Business Manager org to another:
> 1. Original org releases devices from their ABM
> 2. Released devices are factory reset automatically (all MDM profiles removed)
> 3. New org adds devices to their ABM (serial number or Apple Configurator)
> 4. New org links ABM to their MDM (Mosyle/Jamf)
> 5. Power on devices — should auto-enroll into new MDM
> 6. Re-apply all configurations: naming, app installation, App Lock, profiles

> NOTE: Mac Mini must also be re-enrolled. The replay service and camera configs are
> unaffected by MDM migration — only Apple device management changes.

> MDM Options:
> - Mosyle: cheaper, Apple-only, current PodPlay choice
> - Jamf: premier, Apple-only, works directly with Apple, more configuration options
> - If considering Android devices, neither works — evaluate cross-platform MDMs.

### Appendix F — Open Questions (Asia Deployment) — Answered Items

| Question | Status | Resolution |
|----------|--------|-----------|
| Mosyle — own instance needed for Cosmos | ANSWERED | Cosmos is a separate entity, not a sub-org under PodPlay |
| ABM — own ABM needed | ANSWERED | Can release from PodPlay ABM → factory reset → re-enroll in Cosmos ABM |
| UniFi Account — transfer ownership planned | ANSWERED | First club under PodPlay, future under Cosmos |

### Phase 10 (iPad Setup) — Enrollment Order Warning

> WARNING: Enrollment order in Mosyle matches power-on order. If you power on out of order,
> device-to-court mapping will be wrong. Filter by enrolled date in Mosyle to verify.

### Phase 11 (Apple TV Setup) — MDM Naming

> In Mosyle, assign to client's group, name: `AppleTV {Client} Court #`

---

## What Needs Tracking in the Webapp

A device migration event involves:

1. **Migration metadata** — source org, target org, target MDM, timeline
2. **Per-device tracking** — serial number, device type, migration step status
3. **Project linkage** — which project's devices are being migrated

### Trigger Scenarios

- **International expansion**: Asia venues deploy under Cosmos PH (separate entity). Devices
  initially configured under PodPlay ABM must be transferred to Cosmos ABM + new Mosyle instance.
- **Client independence**: Venue eventually runs their own MDM.
- **MDM switch**: PodPlay switches from Mosyle to Jamf (rare, planned decision).
- **Reuse**: Repurposing devices from a cancelled/closed project to a new venue.

### Devices That Can Be Migrated

| Device Type | ABM Required | MDM Profile | Replay Config Affected? |
|-------------|-------------|-------------|------------------------|
| iPad | Yes | Yes — App Lock, VPP, App Install, P-List | No (app config via P-List LOCATION_ID, re-applies) |
| Apple TV | Yes | Yes — App Install, naming | No |
| Mac Mini | Yes | Yes — must be re-enrolled | No — replay service, DDNS, camera configs all survive |

### Factory Reset Behavior (Critical)

When a device is released from an ABM org:
- Factory reset is **automatic and immediate** on next reboot
- ALL MDM profiles removed
- All app data deleted
- Replay service and camera configs on Mac Mini are **NOT** affected (they live on the SSD / file system, not in MDM)
- Must re-apply: naming scheme, VPP app install, App Lock window, P-List config, court number assignment

### State Machine

**Migration-level states**:
```
planning → released → enrolled → configured → completed
    ↓           ↓
 cancelled   (each state stamps a date)
```

**Per-device item states**:
```
pending → released → enrolled → configured
```

Device items advance independently (partial enrollment is possible if some devices fail).

---

## Database Schema

### New Enum: `mdm_provider`

```sql
CREATE TYPE mdm_provider AS ENUM (
  'mosyle',  -- Apple-only, cheaper, current PodPlay choice
  'jamf',    -- Apple-only, premier, more config options
  'other'    -- Cross-platform or custom MDM
);
```

### New Enum: `device_migration_status`

```sql
CREATE TYPE device_migration_status AS ENUM (
  'planning',    -- Migration planned but not yet initiated with source org
  'released',    -- Source org has released devices from their ABM
  'enrolled',    -- Devices powered on and auto-enrolled in target MDM
  'configured',  -- Naming, apps, App Lock, P-List all re-applied
  'completed',   -- Verified working; migration closed
  'cancelled'    -- Migration cancelled before completion
);
```

### New Enum: `migration_device_type`

```sql
CREATE TYPE migration_device_type AS ENUM (
  'ipad',       -- iPad (kiosk) — App Lock, VPP, P-List LOCATION_ID
  'apple_tv',   -- Apple TV 4K (display) — App Install, naming
  'mac_mini'    -- Mac Mini (replay server) — re-enroll only; replay service unaffected
);
```

### New Enum: `migration_device_status`

```sql
CREATE TYPE migration_device_status AS ENUM (
  'pending',     -- Not yet released from source ABM
  'released',    -- Released from source ABM; factory reset will occur on next boot
  'enrolled',    -- Auto-enrolled in target MDM (confirmed in Mosyle/Jamf console)
  'configured'   -- Naming, apps, App Lock, P-List all re-applied and verified
);
```

### Table: `device_migrations`

Tracks one ABM org transfer event. One migration can cover multiple devices.
May be linked to a project (if migrating devices for a specific venue handoff)
or NULL (if migrating a pool of devices not yet assigned).

```sql
CREATE TABLE device_migrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES projects(id) ON DELETE SET NULL,
  -- Human-readable label for this migration event
  migration_label       TEXT NOT NULL,
  -- Source organization (releasing devices)
  source_org_name       TEXT NOT NULL,               -- e.g., "PingPod Inc"
  source_abm_org_id     TEXT,                         -- Apple's internal org ID if known
  -- Target organization (receiving devices)
  target_org_name       TEXT NOT NULL,               -- e.g., "Cosmos PH"
  target_abm_org_id     TEXT,
  target_mdm            mdm_provider NOT NULL DEFAULT 'mosyle',
  target_mosyle_group   TEXT,                         -- e.g., "Cosmos PH - Venue X"
  -- Migration status
  status                device_migration_status NOT NULL DEFAULT 'planning',
  -- Timeline (each transition stamps a date)
  initiated_date        DATE,                         -- When ops contacts source org to request release
  devices_released_date DATE,                         -- When source org confirms release in their ABM
  devices_enrolled_date DATE,                         -- When all devices appear in target MDM
  configs_applied_date  DATE,                         -- When naming/apps/App Lock all re-applied
  completed_date        DATE,
  -- Notes (open-ended — used for async coordination with Andy, Nico, external contact)
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_device_migrations_project ON device_migrations(project_id);
CREATE INDEX idx_device_migrations_status  ON device_migrations(status);

CREATE TRIGGER update_device_migrations_updated_at
  BEFORE UPDATE ON device_migrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Table: `device_migration_items`

One row per physical device being migrated. Serial numbers are the canonical
identifier (from Apple Configurator or Mosyle device list).

```sql
CREATE TABLE device_migration_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id        UUID NOT NULL REFERENCES device_migrations(id) ON DELETE CASCADE,
  serial_number       TEXT NOT NULL,                   -- Apple serial number (12 chars)
  device_type         migration_device_type NOT NULL,
  -- Court assignment (NULL for Mac Mini — one per venue, not per court)
  court_number        INTEGER CHECK (court_number >= 1),
  -- Target label to apply in MDM after enrollment
  -- Pattern: "iPad {Client} Court #" / "AppleTV {Client} Court #" / "{Client} Mac Mini"
  target_mdm_label    TEXT,
  -- Item-level migration status (advances independently of migration-level status)
  status              migration_device_status NOT NULL DEFAULT 'pending',
  -- Timestamps for per-device steps
  enrolled_at         TIMESTAMPTZ,                     -- When confirmed in Mosyle/Jamf
  configured_at       TIMESTAMPTZ,                     -- When naming/apps/App Lock verified
  -- Warning: for iPads, must verify enrollment ORDER matches court number order
  -- (Mosyle assigns device to court based on power-on order)
  enrollment_order    INTEGER,                         -- Expected power-on sequence (1, 2, 3...)
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Serial number must be unique within a migration
  CONSTRAINT uq_migration_serial UNIQUE (migration_id, serial_number)
);

CREATE INDEX idx_migration_items_migration ON device_migration_items(migration_id);
CREATE INDEX idx_migration_items_serial    ON device_migration_items(serial_number);
CREATE INDEX idx_migration_items_status    ON device_migration_items(status);

CREATE TRIGGER update_device_migration_items_updated_at
  BEFORE UPDATE ON device_migration_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## RLS Policies

```sql
-- device_migrations: single-user app (auth.uid() always matches)
ALTER TABLE device_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY device_migrations_all ON device_migrations
  USING (true) WITH CHECK (true);

-- device_migration_items: same single-user policy
ALTER TABLE device_migration_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY device_migration_items_all ON device_migration_items
  USING (true) WITH CHECK (true);
```

---

## Field Source Map — `device_migrations`

| Field | Source in MRP / Deployment Guide | Notes |
|-------|----------------------------------|-------|
| project_id | New — links migration to a project | Optional; NULL if migrating a device pool before project assignment |
| migration_label | No MRP equivalent | Internal label for ops reference |
| source_org_name | Appendix F Q9 — "PingPod Inc" | Known source org for Asia migration |
| target_org_name | Appendix F Q9 — "Cosmos PH" | Known target org for Asia migration |
| target_mdm | Appendix E — Mosyle (current choice) | Jamf mentioned as alternative |
| target_mosyle_group | Phase 10 Step 91 — "iPad {Client} Court #" naming group | Group created per venue in Mosyle |
| status | Appendix E — 6-step workflow → 5 status values | Maps workflow steps to states |
| initiated_date | Appendix E Step 1 | When ops asks source org to release |
| devices_released_date | Appendix E Step 2 | Automatic factory reset follows release |
| devices_enrolled_date | Appendix E Step 5 | Auto-enrollment on power-on |
| configs_applied_date | Appendix E Step 6 | Naming + apps + App Lock |

## Field Source Map — `device_migration_items`

| Field | Source in MRP / Deployment Guide | Notes |
|-------|----------------------------------|-------|
| serial_number | Apple Business Manager / Apple Configurator | 12-character Apple serial |
| device_type | Appendix E device list (iPad / Apple TV / Mac Mini) | Determines which configs to re-apply |
| court_number | Phase 10 Step 91 — "iPad {Client} Court #" | NULL for Mac Mini (1 per venue) |
| target_mdm_label | Phase 10 Step 91, Phase 11 Step 96b naming schemes | Formatted at config time |
| status | Per-device migration step tracking | Independent of migration-level status |
| enrollment_order | Phase 10 WARNING — "power on in court-number order" | Mosyle enrolls in power-on order; must be sequential |

---

## MDM Comparison Seed Data

The webapp Settings page should present the MDM comparison for reference when choosing
a target MDM for a migration. Store as seed data in the settings reference, NOT as a DB table.

| Provider | Type | Apple Only? | Cost | Notes |
|----------|------|-------------|------|-------|
| Mosyle | Cloud MDM | Yes | Lower | Current PodPlay choice; Apple-only, solid for iPad/AppleTV/Mac Mini |
| Jamf | Cloud MDM | Yes | Higher | Premier option; works directly with Apple; more config options |
| Other | Varies | No | Varies | Needed if Android devices added to deployment |

---

## Migration Status Derivation Rule

Migration-level status is derived from item statuses but also allows manual override:

```
planning    → op manually advances after contacting source org
released    → op advances when source org confirms release in their ABM console
enrolled    → auto-derived: ALL items have status='enrolled' OR 'configured'
configured  → auto-derived: ALL items have status='configured'
completed   → op manually marks complete after end-to-end test passes
cancelled   → op manually cancels
```

Progress percentage for UI display:
```typescript
const migrationProgress = (migration: DeviceMigration, items: DeviceMigrationItem[]) => {
  if (items.length === 0) return 0;
  const weights = { pending: 0, released: 25, enrolled: 75, configured: 100 };
  const total = items.reduce((sum, item) => sum + weights[item.status], 0);
  return Math.round(total / items.length);
};
```

---

## Key Business Rules

1. **Enrollment order is critical for iPads**: Power on iPads in court-number order (1, 2, 3...).
   Mosyle assigns devices in the order they connect. `enrollment_order` field enforces this sequencing.
   After enrollment, filter by enrolled date in Mosyle console to verify correct order.

2. **Mac Mini replay service survives migration**: Only MDM profiles are removed on factory reset.
   The Samsung SSD (clips, cache), DDNS cron, and replay service binary persist.
   However, Mac Mini MUST be re-enrolled in the new ABM to receive future MDM updates.

3. **App Lock must be OFF before re-pairing Flic buttons**: After MDM re-enrollment,
   Bluetooth buttons need to be re-paired. Set App Lock to 24/7 OFF until all pairing complete,
   then schedule the 2:00–3:00 AM daily window.

4. **VPP licenses must be transferred**: When moving to a new ABM org, VPP (Volume Purchase Program)
   app licenses do NOT automatically transfer. New org must purchase or receive transferred licenses
   via Apple Business Manager. Confirm with Agustin (app readiness) before migration.

5. **One migration can span multiple device types**: A single `device_migrations` row covers
   iPads + Apple TVs + Mac Mini for the same venue transfer event.

---

## Updated Migration Order

Add after step 20 (`troubleshooting_tips`):

```
21. device_migrations     (references projects)
22. device_migration_items (references device_migrations)
```

---

## Known Gaps

| Gap | Impact | Resolution |
|----|--------|-----------|
| VPP license transfer process (new org needs licenses) | Migration will appear complete but apps won't install without licenses | Requires Agustin / Apple Business Manager confirmation |
| `source_abm_org_id` exact format | Field may be empty in practice; Apple's internal ID not well-documented | Non-blocking — field is optional |
| Android MDM path | If PodPlay adds Android kiosks, neither Mosyle nor Jamf works | Requires product decision — not a current concern |
| Jamf cost tier | Exact pricing unknown | Non-blocking — Mosyle is current choice |
| Whether serial numbers available before migration | Ops may not have serial list until devices arrive | `serial_number` + `device_migration_items` rows can be added progressively |
