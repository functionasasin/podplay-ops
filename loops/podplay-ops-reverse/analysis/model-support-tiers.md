# Analysis: model-support-tiers
**Aspect**: model-support-tiers
**Date**: 2026-03-06
**Sources**: analysis/source-deployment-guide.md (Appendix D, Appendix A)

---

## Source: Appendix D — Support Escalation Tiers

Direct quote from deployment guide:

| Tier | Handled By | Examples |
|------|------------|---------|
| Tier 1 | On-site staff / remote monitoring team | Device restart, app lock toggle, button battery replacement, basic connectivity checks |
| Tier 2 | Configuration specialist (Nico-level) | VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restart |
| Tier 3 | Engineer / Developer (Patrick-level) | Replay service code bugs, video encoding issues (pixelation, stream corruption), port 4000 architecture issues, firmware-level camera problems |

**Notes from guide**:
- Most day-to-day issues are Tier 1
- Tier 3 issues are rare — weekly developer call is used to review outstanding issues

---

## Support Tier Definitions

### Tier 1 — On-Site / Remote Ops
- **Who**: On-site venue staff or remote monitoring team
- **Escalation to Tier 2 when**: Basic restart/toggle does not resolve, or issue requires config access
- **Capabilities**: Physical device manipulation, SSH into Mac Mini, Mosyle UI for app lock toggle
- **Contact path**: Internal monitoring team (Nico monitors ~70 live locations via GCP alerts)

### Tier 2 — Configuration Specialist (Nico-level)
- **Who**: PodPlay configuration specialist (currently Nico)
- **Escalation from**: Tier 1 failure
- **Escalation to Tier 3 when**: Issue requires code change or is in replay service internals
- **Capabilities**: UniFi admin, Mosyle admin, camera web UI, SSH, DDNS config, replay service restart, cron editing
- **Contact path**: Via Chad (head of ops)

### Tier 3 — Engineer / Developer (Patrick-level)
- **Who**: Software engineer with replay service source code access
- **Escalation from**: Tier 2 failure
- **Resolution path**: Weekly developer call for review of outstanding issues
- **Capabilities**: Replay service code, deploy.py, V2 GitHub deployment, camera firmware, Firebase/cloud services

---

## 16 Known Issue/Solution Pairs (Appendix A)

Fully mapped with phase number, support tier, and severity.

| # | Issue | Solution | Phase | Support Tier | Severity |
|---|-------|----------|-------|--------------|---------|
| 1 | Mac Mini black screen (crash) | SSH in and restart. Screen share won't work if screen is black. | 8 | 1 | warning |
| 2 | Mac Mini overheating | Needs breathing room in rack — do not install flush against other equipment | 3 | 1 | warning |
| 3 | Replays not generating for a time window | Rename service may have failed. Check rename service status via /health endpoint. | 9 | 2 | warning |
| 4 | PoE adapter intermittent issues | Cable runs must be clean, not bunched up, under 100m. Very sensitive to cable quality — re-terminate if needed. | 12 | 1 | warning |
| 5 | iPad buttons won't pair | App lock must be OFF during pairing. Exit Guided Access first, then pair. | 12 | 1 | warning |
| 6 | Camera image warped | Coefficients need adjustment. Start at zero for raw image, calibrate after physical install. | 6 | 2 | warning |
| 7 | DDNS not updating | Check cron: `crontab -l` on Mac Mini. Check log at `/tmp/freedns_*.log` | 7 | 2 | warning |
| 8 | Port 4000 unreachable from outside | Verify chain: ISP router forwarding → UDM port forward → Mac Mini on 192.168.32.100. Test from cellular network. | 5 | 2 | critical |
| 9 | .DS_Store in cache folder | `cd cache && rm .DS_Store` — NEVER open cache folder in Finder (recreates .DS_Store which breaks replay processing) | 8 | 1 | warning |
| 10 | App doesn't show customer club | Check Mosyle "Install App" group — P-List config must have correct LOCATION_ID string. | 10 | 2 | warning |
| 11 | Replay video pixelated | V1 replay service uses UDP — pixelation is a known issue. Deploy V2 (TCP) to fix. Contact developer (Patrick). | 9 | 3 | info |
| 12 | Button paired but score not updating | Restart iPad to re-sync Firebase connection. If still failing, check Firebase service status. | 13 | 1 | warning |
| 13 | Flic button won't pair | App Lock MUST be off. Turn off App Lock for location in Mosyle, then retry pairing on iPad. | 12 | 1 | warning |
| 14 | Flic button unresponsive | Replace CR2032 battery. If still dead: factory reset (remove battery 5s, reinsert, hold top+bottom 10s until red blink). | 12 | 1 | info |
| 15 | iPad not receiving MDM commands | iPad may be asleep with auto-lock on. Turn off auto-lock during configuration. For deployed iPads, commands sent during 2–3 AM App Lock off window. | 10 | 1 | warning |
| 16 | iPad enrollment out of order | Filter by enrolled date in Mosyle. iPads enroll in the order they are powered on — always power on in court-number order. | 10 | 1 | warning |

---

## Data Model Decision

Support tiers require a `troubleshooting_tips` table to:
1. Seed the 16 known issue/solution pairs from Appendix A
2. Tag each tip with a phase number so they appear contextually in the deployment wizard UI
3. Tag each tip with support tier so the UI can show an escalation badge
4. Allow future additions as new issues are discovered

**No separate `support_tiers` reference table is needed** — tiers are a fixed integer 1/2/3 with a CHECK constraint, documented in code and seed data.

---

## Table: troubleshooting_tips

```sql
CREATE TABLE troubleshooting_tips (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_number    INTEGER CHECK (phase_number >= 0 AND phase_number <= 15),
  -- NULL = applies globally (not phase-specific)

  issue           TEXT    NOT NULL,
  -- Short description of the problem (displayed as the tip "title")

  solution        TEXT    NOT NULL,
  -- Full resolution steps (displayed as the tip "body")

  support_tier    INTEGER NOT NULL CHECK (support_tier IN (1, 2, 3)),
  -- 1 = On-site/remote ops (Tier 1)
  -- 2 = Config specialist, Nico-level (Tier 2)
  -- 3 = Engineer/developer, Patrick-level (Tier 3)

  severity        TEXT    NOT NULL DEFAULT 'warning'
                  CHECK (severity IN ('info', 'warning', 'critical')),
  -- info     = FYI, non-blocking
  -- warning  = Something to watch out for
  -- critical = Blocks deployment if not resolved

  sort_order      INTEGER NOT NULL DEFAULT 0
  -- Order within the same phase (lower = shown first)
);

CREATE INDEX idx_troubleshooting_tips_phase ON troubleshooting_tips (phase_number);
CREATE INDEX idx_troubleshooting_tips_tier  ON troubleshooting_tips (support_tier);
```

---

## Seed Data (16 rows)

See `final-mega-spec/data-model/seed-data.md` — "Troubleshooting Tips" section.

---

## UI Integration Points

The `troubleshooting_tips` table feeds three UI surfaces:

### 1. Deployment Wizard — Phase-Contextual Tips
- On Stage 3 (wizard-deployment), each phase panel queries `troubleshooting_tips WHERE phase_number = $current_phase`
- Tips are collapsed by default under a "Troubleshooting" accordion
- Severity badge colors: critical=red, warning=amber, info=blue
- Support tier badge: T1=gray, T2=yellow, T3=red
- Tier 2+ tips show: "Escalate to Config Specialist" or "Escalate to Engineer" callout

### 2. Global Troubleshooting Reference
- Settings or reference page shows all 16 tips grouped by phase
- Filterable by support tier and severity

### 3. Support Escalation Contact Chain
Stored in `settings` table (already specified in model-settings):
- Tier 1 contact: internal monitoring team (GCP alerts → Slack)
- Tier 2 contact: Nico (via Chad)
- Tier 3 contact: Patrick (weekly developer call)

---

## Escalation Path State Machine

```
Issue detected
    │
    ▼
[Tier 1] On-site restart / app lock toggle / battery check
    │ Not resolved
    ▼
[Tier 2] Config specialist: VLAN / camera / Mosyle / DDNS / replay service
    │ Not resolved
    ▼
[Tier 3] Developer: code fix / firmware / architecture
    │ Resolved
    ▼
Document in troubleshooting_tips (if new issue type)
```

---

## Contacts Directory (from Appendix C)

These map to the `contacts_directory` seed data (see model-contacts-directory aspect):

| Name | Role | Tier | Contact |
|------|------|------|---------|
| Monitoring team | Tier 1 — GCP alerts | 1 | Slack alert channel |
| Nico | Tier 2 — hardware/replay/installs | 2 | Via Chad |
| Chad | Ops lead — account decisions | 2 | — |
| Stan Wu | Config specialist — hardware expert | 2 | — |
| Patrick | Tier 3 — replay service engineer | 3 | Weekly dev call |
| Andy Korzeniacki | PM — specs/kickoff | — | 917-937-6896 / andyk@podplay.app |
| Agustin | App readiness / LOCATION_ID | — | — |
| CS Team | Booking / credits | — | — |

---

## Known Gaps

1. **Issue #11 (pixelation)**: Tier 3 escalation to Patrick — contact info not specified beyond "weekly developer call". Full contact TBD until XLSX confirmed.
2. **Phase null tips**: No tips documented as globally applicable (all 16 are phase-specific). If future tips span multiple phases, phase_number should be set to NULL with a note in the solution.
3. **applicable_tiers**: None of the 16 tips are tier-specific (all apply to all tiers). Column omitted from this table to keep schema simple — tier-specific tips would need a join table or array column if needed in future.
