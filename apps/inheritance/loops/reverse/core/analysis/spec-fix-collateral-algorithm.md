# Spec Fix: Collateral Distribution Sub-Algorithm

**Aspect**: spec-fix-collateral-algorithm
**Wave**: 6 (Spec Fixes)
**Gap**: C2 from spec-review — §7.2 described collateral distribution rules in prose but provided no pseudocode
**Source Analysis**: `analysis/intestate-order.md` (complete functions)

---

## Problem

The spec's §7.2 I12-I14 sections contained only prose descriptions:
- I12: "Spouse = ½, siblings/nephews/nieces = ½"
- I13: Bullet list of rules (Art. 1004, 1006, 1005, 975)
- I14: "5th-degree limit. Equal shares among nearest-degree collaterals."

A developer implementing I12-I14 would not know:
1. How to build sibling lines for representation
2. How the full/half blood 2:1 ratio interacts with per-stirpes representation
3. When the per capita switch (Art. 975) triggers and whether Art. 1006 blood weighting applies in per capita mode
4. The exact nearest-degree exclusion algorithm with 5th-degree filtering

## Fix Applied

Added new **§7.6 Collateral Distribution Sub-Algorithm** to the spec with:

### 1. Master Function (`distribute_collaterals`)
4-branch decision tree:
- Branch 1: Siblings + nephews/nieces → `distribute_siblings_with_representation()`
- Branch 2: Siblings only → `distribute_siblings()`
- Branch 3: Nephews/nieces only → `distribute_nephews_only()`
- Branch 4: Other collaterals → `distribute_other_collaterals()`

### 2. Full/Half Blood Logic (`distribute_siblings`)
Three cases with pseudocode:
- Case A: All full blood → equal shares (Art. 1004)
- Case B: All half blood → equal shares, no line distinction (Art. 1007)
- Case C: Mixed → 2:1 unit ratio (Art. 1006)

### 3. Per Stirpes with Blood Weighting (`distribute_siblings_with_representation`)
- `SiblingLine` struct: original sibling, blood type, mode (OWN_RIGHT/REPRESENTATION), representatives
- `build_sibling_lines()`: constructs line list from living siblings + predeceased siblings' children
- Distribution: blood weighting applied per **line** (not per individual), then per-stirpes within each represented line

### 4. Per Capita Switch (`distribute_nephews_only`)
- Art. 975 triggers when ALL siblings predeceased
- Documented the scholarly debate: does Art. 1006 blood weighting apply in per capita mode?
- Art. 1008 ("in accordance with the rules laid down for the brothers and sisters of the full blood") suggests YES
- Default: apply blood weighting; configurable via `nephews_per_capita_ignore_blood` flag

### 5. Other Collaterals (`distribute_other_collaterals`)
- Art. 1010: 5th-degree hard limit
- Art. 962: nearest degree excludes more remote
- Art. 1009: no blood or line distinction
- Empty result → estate escheats (I15)
- Degree reference table: siblings=2, nephews=3, first cousins=4, children of first cousins=5

### 6. I12 Integration
Explicit `distribute_I12()` function showing spouse ½ + collateral ½ via `distribute_collaterals()`.

### 7. Updated I12-I14 References
I12, I13, I14 entries in §7.2 now cross-reference §7.6 functions instead of containing inline prose descriptions.

## Worked Examples Added

| Example | Scenario | Key Feature |
|---------|----------|-------------|
| Siblings-only mixed blood | 2 full + 1 half | 2:1 unit ratio |
| Siblings + nephews mixed | Full alive + full predeceased(2 nephews) + half alive | Per-stirpes + blood weighting per line |
| Nephews-only per capita | 3 nephews from 2 predeceased (1 full, 1 half) | Art. 975 switch + Art. 1008 blood weighting |
| Other collaterals | 2 first cousins + 1 child of first cousin | Nearest-degree exclusion |
| I12 integration | Spouse + 1 full sib + 1 half sib | ½ spouse + collateral sub-algorithm |

## Legal Basis Summary

| Article | Rule | Pseudocode Function |
|---------|------|-------------------|
| Art. 1004 | Siblings per capita, equal shares | `distribute_siblings()` Case A |
| Art. 1005 | Siblings + nephews: per capita + per stirpes | `distribute_siblings_with_representation()` |
| Art. 1006 | Full blood = double of half blood | `distribute_siblings()` Case C, applied per-line in Branch 1 |
| Art. 1007 | All half blood = equal, no line distinction | `distribute_siblings()` Case B |
| Art. 1008 | Nephews follow sibling rules | `distribute_nephews_only()` blood weighting |
| Art. 1009 | Other collaterals: no blood/line distinction | `distribute_other_collaterals()` |
| Art. 1010 | 5th-degree limit | `distribute_other_collaterals()` filter step |
| Art. 962 | Nearest degree excludes more remote | `distribute_other_collaterals()` min-degree |
| Art. 975 | Nephews alone → per capita | `distribute_nephews_only()` trigger |
| Art. 1001 | Spouse + siblings concurrence | `distribute_I12()` |

## Configuration Flag Added

| Flag | Default | Effect |
|------|---------|--------|
| `nephews_per_capita_ignore_blood` | `false` | If `true`, Art. 975 per capita gives pure equal shares ignoring parent's blood type. If `false` (default), Art. 1008 blood weighting applies even in per capita mode. |

## Cross-Reference

- **Source analysis**: `analysis/intestate-order.md` §§ I13, I13a, I13b, I14, Collateral Distribution Algorithm
- **Spec sections updated**: §7.2 (I12, I13, I14 entries), §7.6 (new section)
- **Related spec sections**: §5 (Representation — collateral limit Art. 972), §7.4 (Iron Curtain — collateral filtering)

---

*Fix resolves spec-review gap C2. All collateral distribution scenarios now have complete pseudocode with worked examples.*
