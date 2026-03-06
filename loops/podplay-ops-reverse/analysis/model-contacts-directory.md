# Analysis: model-contacts-directory

**Aspect**: model-contacts-directory
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06
**Sources**: `analysis/source-deployment-guide.md` (Appendix C Key Contacts, Appendix D Support Tiers), `analysis/source-mrp-usage-guide.md` (team roles throughout), `analysis/model-team-opex.md` (salary allocations)

---

## Team Members — Complete Roster

All contacts derived from Appendix C (Key Contacts table) and Appendix D (Support Tiers) of the deployment guide, plus role context from training transcripts and config guide.

| Slug | Name | Role | Phone | Email | Contact Via | Support Tier |
|------|------|------|-------|-------|-------------|-------------|
| `andy` | Andy Korzeniacki | Project Manager — specs, kickoff, camera positions, site survey | 917-937-6896 | andyk@podplay.app | Direct | — |
| `nico` | Nico | Hardware/Installs Lead — replay service, device config, 70+ live location monitoring | — | — | Via Chad | Tier 2 |
| `chad` | Chad | Head of Operations — account decisions, credentials, shipping sign-off | — | — | Direct | — |
| `stan` | Stan Wu | Config Specialist — config guide author, hardware expert | — | — | — | Tier 2 |
| `agustin` | Agustin | App Readiness — LOCATION_ID creation, PodPlay app release confirmation | — | — | — | — |
| `cs-team` | CS Team | Booking & Credits — booking questions, free replay credits | — | — | — | — |
| `patrick` | Patrick | Engineer/Developer — replay service code, video encoding, port 4000 architecture | — | — | — | Tier 3 |

---

## Role Details (From Source Documents)

### Andy Korzeniacki — Project Manager
- **Source**: Appendix C Key Contacts table; Step 1 (Phase 0 Pre-Purchase)
- **Phone**: 917-937-6896
- **Email**: andyk@podplay.app
- **Responsibilities**:
  - Schedule kickoff call with venue (Step 1 of deployment guide)
  - Provide hardware installation guide (cited as "Andy" in deployment guide header)
  - Specs, camera positioning, site layout decisions
  - Court count and tier determination for new venues
- **HER allocation**: 0% direct, 0% indirect (informational only per model-team-opex)
- **In MRP**: Referenced as PM on Form Responses tab

### Nico — Hardware/Installs Lead
- **Source**: Appendix C; Appendix D (Tier 2 handler); Phase 14 note ("Nico monitors ~70 live locations")
- **Contact**: Via Chad (no direct phone/email in any source)
- **Responsibilities**:
  - Physical hardware configuration and installation
  - Replay service administration
  - Health monitoring of ~70 live locations via GCP + Slack alerts
  - Tier 2 support: VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restart
  - Training call on 2026-02-25 (cited in deployment guide header)
- **HER allocation**: 50% direct (hardware/install), 50% indirect per model-team-opex
- **In MRP**: "Niko" (spelling variant) in FINANCIALS tab salary rows

### Chad — Head of Operations
- **Source**: Appendix C; Step 125 ("contact Stan or Chad" if BOM mismatch)
- **Contact**: Direct (no phone/email in any source)
- **Responsibilities**:
  - Account decisions and credentials management
  - Authoritative contact for Nico (all Nico contact goes via Chad)
  - BOM mismatch resolution during packing
  - Holds credentials for sensitive accounts (UniFi PingPodIT, FreeDNS, etc.)
- **HER allocation**: 20% indirect per model-team-opex
- **In MRP**: "Chad" in FINANCIALS tab salary rows

### Stan Wu — Config Specialist
- **Source**: Config Guide v1.0 byline; Appendix C; Step 125 ("contact Stan or Chad" if BOM mismatch)
- **Contact**: Unknown (no phone/email in any source)
- **Responsibilities**:
  - Author of PodPlay Configuration Guide v1.0
  - Hardware expert — camera config, VLAN setup, Mac Mini configuration
  - BOM mismatch resolution during packing
  - Tier 2 support
- **In MRP**: Referenced in config guide; no salary row found

### Agustin — App Readiness
- **Source**: Step 16 Phase 1 ("ask Agustin"); Appendix F item 14 ("LOCATION_ID from dev team (Agustin)")
- **Contact**: Unknown (no phone/email in any source)
- **Responsibilities**:
  - Confirm PodPlay app is ready for a new customer before deployment begins
  - Create LOCATION_ID per facility (used in Mosyle P-List MDM config)
  - White-labeled app binary creation for international deployments (VPP distribution)
- **Trigger point in workflow**: Must be contacted at Step 16 (Pre-Configuration phase) before hardware ships

### CS Team — Booking & Credits
- **Source**: Appendix C Key Contacts
- **Contact**: Unknown (no individual name, phone, or email in any source)
- **Responsibilities**:
  - Booking questions
  - Replay credit questions (adding free credits to user profiles)
  - Step 117: "Give yourself free replays" — CS team handles this for non-ops staff
- **Note**: Group contact, not an individual

### Patrick — Engineer/Developer
- **Source**: Appendix A Troubleshooting row ("Replay video pixelated → V1 service uses UDP. Contact developer (Patrick)")
- **Contact**: Unknown (no phone/email in any source)
- **Responsibilities**:
  - Replay service codebase (V1 UDP, V2 TCP)
  - Video encoding issues (pixelation, stream corruption)
  - Port 4000 architecture
  - Firmware-level camera issues
  - Weekly developer call for outstanding Tier 3 issues
- **Tier**: 3 — only escalated for code-level bugs

---

## Database Schema

### New Table: `team_contacts`

```sql
-- team_contacts
-- Internal PodPlay team directory — seeded once, editable in Settings > Team
-- Source: Appendix C (Key Contacts), Appendix D (Support Tiers)
CREATE TABLE team_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,          -- 'andy', 'nico', 'chad', 'stan', 'agustin', 'cs-team', 'patrick'
  name          TEXT        NOT NULL,                 -- Full name or team name
  role          TEXT        NOT NULL,                 -- Human-readable role description
  department    TEXT        NOT NULL,                 -- 'pm', 'hardware', 'operations', 'config', 'app', 'cs', 'engineering'
  phone         TEXT,                                 -- E.164 or formatted; NULL if unknown
  email         TEXT,                                 -- NULL if unknown
  contact_via   TEXT,                                 -- Free text: 'Via Chad', 'Slack #installs', etc. NULL if direct
  support_tier  SMALLINT    CHECK (support_tier IN (1, 2, 3)),  -- NULL if not a support escalation contact
  notes         TEXT,                                 -- Role notes, when to contact, responsibilities
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: single-org app; user must be authenticated to read/write contacts
ALTER TABLE team_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read contacts"
  ON team_contacts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can insert contacts"
  ON team_contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can update contacts"
  ON team_contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can delete contacts"
  ON team_contacts FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger: auto-update updated_at
CREATE TRIGGER team_contacts_updated_at
  BEFORE UPDATE ON team_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index: lookup by slug (Settings page loads by slug)
CREATE INDEX idx_team_contacts_slug ON team_contacts (slug);
-- Index: filter by department
CREATE INDEX idx_team_contacts_department ON team_contacts (department);
-- Index: filter by support tier (escalation lookup)
CREATE INDEX idx_team_contacts_support_tier ON team_contacts (support_tier) WHERE support_tier IS NOT NULL;
```

---

## Seed Data

```sql
-- Seed: team_contacts (7 rows)
-- Source: Appendix C Key Contacts + Appendix D Support Tiers + training transcripts
INSERT INTO team_contacts (slug, name, role, department, phone, email, contact_via, support_tier, notes) VALUES

  ('andy',
   'Andy Korzeniacki',
   'Project Manager — specs, kickoff, camera positions, site survey',
   'pm',
   '917-937-6896',
   'andyk@podplay.app',
   NULL,
   NULL,
   'First contact for all new venue deployments. Schedule kickoff call at Phase 0. Provides site survey, hardware specs, camera positioning, and tier determination. Author of hardware installation guide.'),

  ('nico',
   'Nico',
   'Hardware & Installs Lead — replay service, device configuration, live monitoring',
   'hardware',
   NULL,
   NULL,
   'Via Chad',
   2,
   'Contact via Chad for Nico availability. Handles: VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restarts. Monitors ~70 live locations via GCP health checks + Slack alerts. Training call 2026-02-25.'),

  ('chad',
   'Chad',
   'Head of Operations — account decisions, credentials, shipping',
   'operations',
   NULL,
   NULL,
   NULL,
   NULL,
   'Holds credentials for sensitive accounts (UniFi PingPodIT, FreeDNS, 1Password). Authoritative contact for Nico access. Contact for BOM mismatch resolution during packing (Phase 15 Step 125). Account and billing decisions.'),

  ('stan',
   'Stan Wu',
   'Config Specialist — hardware expert, camera configuration',
   'config',
   NULL,
   NULL,
   NULL,
   2,
   'Author of PodPlay Configuration Guide v1.0. Expert in camera encoding settings, VLAN setup, Mac Mini replay service deployment. Contact for BOM mismatch resolution (Step 125). Tier 2 support escalation.'),

  ('agustin',
   'Agustin',
   'App Readiness — LOCATION_ID creation, app release confirmation',
   'app',
   NULL,
   NULL,
   NULL,
   NULL,
   'Must be contacted at Phase 1 Step 16 before hardware ships to confirm PodPlay app is ready for the customer. Creates LOCATION_ID per facility (used in Mosyle P-List config: <key>id</key><string>CUSTOMERNAME</string>). Manages white-labeled app binaries for international deployments via VPP.'),

  ('cs-team',
   'CS Team',
   'Customer Success — booking and replay credits',
   'cs',
   NULL,
   NULL,
   NULL,
   NULL,
   'Group contact. Handle booking questions and adding free replay credits to user profiles. Contact when testing deployment (Step 117: create operations reservation and add free replays).'),

  ('patrick',
   'Patrick',
   'Engineer/Developer — replay service, video encoding, port 4000 architecture',
   'engineering',
   NULL,
   NULL,
   NULL,
   3,
   'Tier 3 escalation only. Owns replay service codebase (V1 UDP, V2 TCP). Contact for: pixelated video (V1 UDP issue — deploy V2 to fix), stream corruption, port 4000 architecture issues, firmware-level camera problems. Weekly developer call used to review outstanding issues.');
```

---

## Migration Order Update

```
-- Additions (append after existing 29-item migration order):
30. team_contacts              (no FK dependencies)
31. INSERT seed data for team_contacts    (7 rows)
```

---

## MRP Source Mapping

| Contact | MRP Location | Notes |
|---------|-------------|-------|
| Andy Korzeniacki | Form Responses tab (PM field) | Phone/email confirmed in deployment guide Step 1 |
| Nico | FINANCIALS tab "Niko Salary" row | Salary row present; contact details not in MRP |
| Chad | FINANCIALS tab "Chad Salary" row | Salary row present; contact details not in MRP |
| Stan Wu | Config Guide v1.0 byline | Not in MRP; referenced in deployment guide |
| Agustin | Referenced in deployment guide Step 16, Appendix F | Not in MRP |
| CS Team | Referenced in deployment guide Appendix C | Not in MRP |
| Patrick | Referenced in Appendix A troubleshooting | Not in MRP |

---

## UI: Settings > Team Contacts

- Display as a simple table with columns: Name, Role, Department, Phone, Email, Contact Via, Support Tier, Notes
- "Edit" inline for each row (all fields editable)
- "Add Contact" button — opens form with all fields
- Support tier shown as pill: Tier 1 (green), Tier 2 (yellow), Tier 3 (red); blank if NULL
- Contacts with `is_active = false` hidden by default, toggled by "Show inactive" filter

---

## Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| Nico email/phone unknown | Cannot contact Nico directly in app | Always contact via Chad; gap is acceptable |
| Chad email/phone unknown | Cannot surface in app | Operational knowledge; resolve by asking Kim Lapus |
| Stan email/phone unknown | Cannot surface in app | Same |
| Agustin email/phone unknown | Cannot surface in app | Same |
| Patrick email/phone unknown | Cannot surface in app | Same |
| CS Team individual names unknown | Group contact only | Acceptable — CS Team is collective |
