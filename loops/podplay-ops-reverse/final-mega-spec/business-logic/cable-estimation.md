# Cable Estimation Logic

**Aspect:** logic-cable-estimation
**Wave:** 3 — Business Logic & Workflows
**Sources:** `analysis/source-hardware-guide.md` (Section 5), `analysis/source-deployment-guide.md` (Phase 0 Step 8)

---

## Overview

The cable estimation calculator helps the ops person determine how much Cat6 cable (and low-voltage wire for doors) to order before installation. It is surfaced in **Stage 1 (Intake Wizard)** at Step 2 (Service Configuration) as a read-only estimate panel, and again in **Stage 3 (Deployment Wizard)** Phase 0 Step 8 as an editable calculator with per-run override.

Cable is **not supplied by PodPlay** — it must be sourced by the installer or customer. The calculator produces an estimate that ops shares with the venue so they can procure appropriately.

---

## Input Fields

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `num_courts` | integer | yes | `projects.num_courts` |
| `num_doors` | integer | yes | `projects.num_doors` (0 for Pro tier) |
| `num_security_cameras` | integer | yes | `projects.num_security_cameras` (0 for Pro tier) |
| `avg_distance_courts_ft` | integer | yes | user-provided estimate of average cable run length (network rack → court location) |
| `avg_distance_doors_ft` | integer | yes | user-provided estimate of average cable run length (rack → door reader) |
| `avg_distance_cameras_ft` | integer | yes | user-provided estimate of average cable run length (rack → security camera) |

**Default values for avg distances** (pre-filled in the calculator UI, overridable by ops):

| Category | Default (ft) | Rationale |
|----------|-------------|-----------|
| Courts | 150 | Typical court-to-rack distance in mid-size venue |
| Doors | 200 | Doors typically further from rack than courts |
| Security cameras | 100 | Perimeter cameras often at shorter runs |

These defaults are not stored in the database — they are UI constants. The final calculated estimate can be overridden by the ops person entering actual measured distances from the site survey or venue blueprints.

---

## Cat6 Estimation Formula

**Source:** Hardware Installation Guide Section 5 ("Total Cat6 Estimation Formula")

### Per-Segment Calculation

```
courts_cat6_ft   = num_courts          × avg_distance_courts_ft  × 3
doors_cat6_ft    = num_doors           × avg_distance_doors_ft   × 1
cameras_cat6_ft  = num_security_cameras × avg_distance_cameras_ft × 1

total_cat6_ft    = courts_cat6_ft + doors_cat6_ft + cameras_cat6_ft
```

### Why ×3 for Courts

Each court requires **3 Cat6 home runs** from the network rack:
1. Display (65" TV) — 1× Cat6
2. Kiosk (iPad + PoE adapter) — 1× Cat6
3. Replay camera — 1× Cat6

Each court also requires 1× 120V duplex outlet (not Cat6 — electrical, out of scope).

### Why ×1 for Doors

Each door in Autonomous tier requires:
- 1× Cat6 (access control reader) — included in Cat6 estimate
- 1× 18/2 wire (electric strike or maglock) — separate low-voltage estimate (see below)
- 1× 22/4 wire (push-to-exit button) — separate low-voltage estimate
- 1× 22/4 wire (door sensor, if required) — separate low-voltage estimate

### Why ×1 for Security Cameras

Each security camera requires:
- 1× Cat6 (PoE-powered) — included in Cat6 estimate

---

## Worked Example (from Hardware Installation Guide)

**Venue:** 8-court Autonomous venue

| Segment | Formula | Result |
|---------|---------|--------|
| Courts | 8 courts × 200 ft × 3 drops | 4,800 ft |
| Doors | 2 doors × 300 ft × 1 drop | 600 ft |
| Security cameras | 8 cameras × 150 ft × 1 drop | 1,200 ft |
| **Total Cat6** | | **6,600 ft** |

---

## Low-Voltage Wire Estimates (Doors Only — Autonomous/Autonomous+)

In addition to Cat6, Autonomous installations require low-voltage wire per door. These are **not Cat6** and must be procured separately.

```
door_18_2_wire_ft = num_doors × avg_distance_doors_ft × 1   // electric strike or maglock
door_22_4_exit_ft = num_doors × avg_distance_doors_ft × 1   // push-to-exit button
door_22_4_sensor_ft = num_doors × avg_distance_doors_ft × 1 // door sensor (if required)
```

**Whether a door requires a push-to-exit button:**
- **Mag lock (glass doors):** push-to-exit button REQUIRED (fail-safe unlock)
- **Electric strike (panic bar doors):** push-to-exit NOT required

**Whether a door sensor is required:** site-specific; ops must confirm per door. Use `1` as a conservative default.

**Wire specs:**
- 18/2: solid copper, stranded, low-voltage rated
- 22/4: solid copper, stranded, low-voltage rated

---

## Constraints and Validation Rules

### Maximum Run Length
- **Max Cat6 run:** 100 meters (328 feet) from network rack to endpoint
- If any single run exceeds 100m, an **intermediate switch** (PoE) must be installed at the midpoint
- The calculator does NOT validate per-run max — it only validates the average distance input
- **Validation:** if `avg_distance_courts_ft > 328` or `avg_distance_doors_ft > 328` or `avg_distance_cameras_ft > 328`, show warning: "Average distance exceeds 100m maximum Cat6 run. An intermediate switch will be required on long runs."

### Cable Slack Allowances (informational, not added to formula)
The formula uses net distances. Ops must account for these additional slack requirements when purchasing:
- Replay cameras: leave **12 feet** coiled at camera location
- Display: leave minimum **3 feet** coiled at display
- Kiosk: leave minimum **3 feet** coiled at kiosk

**Recommended purchase overage:** add 15–20% to total estimate to account for slack, termination waste, and routing detours around obstacles.

### Cable Specs (for sharing with installer)
All Cat6 must be:
- Solid copper core (not CCA — copper-clad aluminum)
- UTP (Unshielded Twisted Pair)
- UL Listed
- Jacket: Riser (CMR) or Plenum (CMP) per local fire code
- PoE adapters are **very sensitive to cable quality** — cable certification recommended; re-terminate if PoE adapter shows intermittent issues

---

## TypeScript Implementation

### Function Signature

```typescript
// src/services/cableEstimationService.ts

export interface CableEstimationInputs {
  num_courts: number;
  num_doors: number;
  num_security_cameras: number;
  avg_distance_courts_ft: number;
  avg_distance_doors_ft: number;
  avg_distance_cameras_ft: number;
}

export interface CableEstimationResult {
  // Cat6
  courts_cat6_ft: number;
  doors_cat6_ft: number;
  cameras_cat6_ft: number;
  total_cat6_ft: number;
  // Low-voltage (doors only)
  door_18_2_wire_ft: number;
  door_22_4_exit_ft: number;
  door_22_4_sensor_ft: number;
  // Derived
  total_cat6_boxes: number; // total_cat6_ft / 1000, rounded up (standard 1000ft box)
  // Warnings
  warnings: CableWarning[];
}

export interface CableWarning {
  field: 'avg_distance_courts_ft' | 'avg_distance_doors_ft' | 'avg_distance_cameras_ft';
  message: string;
}

export function calculateCableEstimate(inputs: CableEstimationInputs): CableEstimationResult {
  const {
    num_courts,
    num_doors,
    num_security_cameras,
    avg_distance_courts_ft,
    avg_distance_doors_ft,
    avg_distance_cameras_ft,
  } = inputs;

  // Cat6 segments
  const courts_cat6_ft = num_courts * avg_distance_courts_ft * 3;
  const doors_cat6_ft = num_doors * avg_distance_doors_ft * 1;
  const cameras_cat6_ft = num_security_cameras * avg_distance_cameras_ft * 1;
  const total_cat6_ft = courts_cat6_ft + doors_cat6_ft + cameras_cat6_ft;

  // Low-voltage wire for doors
  const door_18_2_wire_ft = num_doors * avg_distance_doors_ft;
  const door_22_4_exit_ft = num_doors * avg_distance_doors_ft;
  const door_22_4_sensor_ft = num_doors * avg_distance_doors_ft;

  // Convenience: how many 1000ft boxes of Cat6 to order
  const total_cat6_boxes = Math.ceil(total_cat6_ft / 1000);

  // Warnings
  const MAX_RUN_FT = 328; // 100 meters
  const warnings: CableWarning[] = [];
  if (avg_distance_courts_ft > MAX_RUN_FT) {
    warnings.push({
      field: 'avg_distance_courts_ft',
      message: `Average court run (${avg_distance_courts_ft}ft) exceeds 100m max. An intermediate PoE switch will be required on long runs.`,
    });
  }
  if (avg_distance_doors_ft > MAX_RUN_FT) {
    warnings.push({
      field: 'avg_distance_doors_ft',
      message: `Average door run (${avg_distance_doors_ft}ft) exceeds 100m max. An intermediate PoE switch will be required on long runs.`,
    });
  }
  if (avg_distance_cameras_ft > MAX_RUN_FT) {
    warnings.push({
      field: 'avg_distance_cameras_ft',
      message: `Average security camera run (${avg_distance_cameras_ft}ft) exceeds 100m max. An intermediate PoE switch will be required on long runs.`,
    });
  }

  return {
    courts_cat6_ft,
    doors_cat6_ft,
    cameras_cat6_ft,
    total_cat6_ft,
    door_18_2_wire_ft,
    door_22_4_exit_ft,
    door_22_4_sensor_ft,
    total_cat6_boxes,
    warnings,
  };
}
```

### Default Distance Constants

```typescript
// src/constants/cableEstimation.ts

export const CABLE_ESTIMATE_DEFAULTS = {
  avg_distance_courts_ft: 150,
  avg_distance_doors_ft: 200,
  avg_distance_cameras_ft: 100,
} as const;
```

---

## UI Integration

### Stage 1 — Intake Wizard, Step 2 (Service Configuration)

- Displayed as a **read-only estimate panel** after the user enters court/door/camera counts
- Uses default distances (not user-adjustable in intake)
- Shows summary: "Estimated Cat6: ~X,XXX ft (~N boxes of 1000ft)"
- Shows low-voltage section only if `num_doors > 0`
- Purpose: quick sanity check during intake, not a final procurement figure

### Stage 3 — Deployment Wizard, Phase 0, Step 8

- Displayed as an **editable calculator**
- Pre-fills with default distances; ops can override each
- Shows full breakdown: courts segment + doors segment + cameras segment + total
- Shows box count recommendation
- Shows low-voltage estimates if `num_doors > 0`
- Shows cable spec requirements (solid copper, UL rated, riser/plenum note)
- Shows 15–20% overage recommendation note
- Warnings shown inline under affected distance inputs with yellow border + icon

### Display Format

```
Cat6 Estimation

  Courts:           8 courts × 200 ft × 3 drops  =  4,800 ft
  Doors:            2 doors  × 300 ft × 1 drop   =    600 ft
  Security cameras: 8 cams   × 150 ft × 1 drop   =  1,200 ft
  ──────────────────────────────────────────────────────────
  Total Cat6:                                        6,600 ft
                                          (~7 boxes of 1000ft)

  Recommended purchase (with 15% overage):          7,590 ft
                                          (~8 boxes of 1000ft)

Low-Voltage Wire (per-door — Autonomous tier)

  18/2 (strike/maglock):  2 doors × 300 ft  =    600 ft
  22/4 (push-to-exit):    2 doors × 300 ft  =    600 ft
  22/4 (door sensor):     2 doors × 300 ft  =    600 ft
```

---

## Tier Behavior

| Tier | Courts Cat6 | Doors Cat6 | Cameras Cat6 | Low-Voltage Wire |
|------|-------------|------------|--------------|-----------------|
| Pro | Yes (×3) | No (num_doors=0) | No | No |
| Autonomous | Yes (×3) | Yes (×1) | Yes (×1) | Yes |
| Autonomous+ | Yes (×3) | Yes (×1) | Yes (×1) | Yes |
| PBK | Yes (×3) | No (num_doors=0 for PBK) | No | No |

PBK is treated as Pro-tier for cable purposes — access control not included.

---

## No Database Storage Required

Cable estimates are **computed client-side on the fly** from project fields. No separate DB table is needed. The estimate is displayed in the wizard and can be printed/exported as part of the Phase 0 checklist output, but is not persisted separately.

The project fields that drive the estimate (`num_courts`, `num_doors`, `num_security_cameras`) are already stored in the `projects` table. Distance inputs are ephemeral UI state — not stored.

---

## Concrete Verification Example

**Input:**
- 6-court Pro venue
- avg_distance_courts_ft = 150 (default)

**Output:**
```
courts_cat6_ft  = 6 × 150 × 3 = 2,700 ft
doors_cat6_ft   = 0 × 0 × 1   = 0 ft
cameras_cat6_ft = 0 × 0 × 1   = 0 ft
total_cat6_ft   = 2,700 ft
total_cat6_boxes = ceil(2700 / 1000) = 3 boxes
```

Recommended purchase with 15% overage: 3,105 ft → 4 boxes.

**Input:**
- 8-court Autonomous venue (from Hardware Installation Guide example)
- avg_distance_courts_ft = 200
- avg_distance_doors_ft = 300
- avg_distance_cameras_ft = 150
- num_doors = 2
- num_security_cameras = 8

**Output:**
```
courts_cat6_ft   = 8 × 200 × 3 = 4,800 ft
doors_cat6_ft    = 2 × 300 × 1 =   600 ft
cameras_cat6_ft  = 8 × 150 × 1 = 1,200 ft
total_cat6_ft    = 6,600 ft
total_cat6_boxes = ceil(6600 / 1000) = 7 boxes

door_18_2_wire_ft    = 2 × 300 = 600 ft
door_22_4_exit_ft    = 2 × 300 = 600 ft
door_22_4_sensor_ft  = 2 × 300 = 600 ft
```

Matches the exact example values from the Hardware Installation Guide. Formula verified.
