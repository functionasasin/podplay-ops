# Amnesty Eligibility — Estate Tax Amnesty (RA 11213 / RA 11569 / RA 11956)

## Legal Basis

**Primary law**: RA 11213 (Tax Amnesty Act), Section 4 — Coverage and Eligibility
**Amendments**: RA 11569 (extended deadline to June 14, 2023), RA 11956 (extended deadline to June 14, 2025; expanded coverage to deaths on/before May 31, 2022)
**Exclusions**: RA 11213 Section 9

### Quoted Text (Sec. 4, as amended by RA 11956)

> "The estate tax amnesty shall cover the estate of decedents who died on or before May 31, 2022, whose estate taxes have remained unpaid or have accrued as of May 31, 2022."

### Legislative History

| Law | Enacted | Coverage (Date of Death) | Filing Deadline |
|---|---|---|---|
| RA 11213 | February 14, 2019 | On or before December 31, 2017 | June 14, 2021 |
| RA 11569 | July 25, 2021 | On or before December 31, 2017 (unchanged) | June 14, 2023 |
| RA 11956 | August 5, 2023 | On or before **May 31, 2022** (expanded) | June 14, 2025 |

**As of February 2026**: The filing window is **closed**. No further extension has been enacted. The engine computes the amnesty tax amount as a historical exercise; availment is no longer possible.

---

## Rule (Pseudocode)

```pseudocode
function checkAmnestyEligibility(decedent, estate, userElectsAmnesty):
  // Step 1: Engine can only apply amnesty if user explicitly elects it
  if not userElectsAmnesty:
    return { eligible: false, reason: "USER_NOT_ELECTED" }

  // Step 2: Date of death must be on or before May 31, 2022
  AMNESTY_COVERAGE_CUTOFF = Date(2022, 5, 31)
  if decedent.dateOfDeath > AMNESTY_COVERAGE_CUTOFF:
    return { eligible: false, reason: "DEATH_AFTER_COVERAGE_CUTOFF" }

  // Step 3: Estate taxes must be unpaid or unsettled as of May 31, 2022
  // (User-declared: engine accepts this as a boolean input)
  if estate.taxFullyPaidBeforeMay2022:
    return { eligible: false, reason: "TAX_ALREADY_PAID" }

  // Step 4: Check categorical exclusions (Section 9)
  if decedent.subjectToPCGGJurisdiction:
    return { eligible: false, reason: "PCGG_EXCLUSION" }
  if estate.hasRA3019Violations:       // Anti-Graft and Corrupt Practices Act
    return { eligible: false, reason: "RA3019_EXCLUSION" }
  if estate.hasRA9160Violations:       // Anti-Money Laundering Act
    return { eligible: false, reason: "RA9160_EXCLUSION" }
  if estate.hasPendingCourtCasePreAmnestyAct:  // Filed in court before RA 11213 enactment (Feb 14, 2019)
    return { eligible: false, reason: "PENDING_COURT_CASE_EXCLUSION" }
  if estate.hasUnexplainedWealthCases:         // RA 1379
    return { eligible: false, reason: "UNEXPLAINED_WEALTH_EXCLUSION" }
  if estate.hasPendingRPCFelonies:             // Revised Penal Code felony cases
    return { eligible: false, reason: "RPC_FELONY_EXCLUSION" }

  // Step 5: Determine amnesty track
  if estate.priorReturnFiled:
    track = "TRACK_B"  // Only undeclared portion is taxed
  else:
    track = "TRACK_A"  // Full net estate is taxed

  // Step 6: Identify applicable deduction rules (time-of-death rules)
  // Deaths on/before Dec 31, 2017 → pre-TRAIN deduction rules
  // Deaths Jan 1, 2018 – May 31, 2022 → TRAIN deduction rules
  PRE_TRAIN_CUTOFF = Date(2018, 1, 1)
  if decedent.dateOfDeath < PRE_TRAIN_CUTOFF:
    deductionRules = "PRE_TRAIN"
  else:
    deductionRules = "TRAIN"

  return {
    eligible: true,
    track: track,                   // "TRACK_A" or "TRACK_B"
    deductionRules: deductionRules, // "PRE_TRAIN" or "TRAIN"
    filingWindowClosed: true,       // Always true as of Feb 2026
    reason: "ELIGIBLE"
  }
```

---

## Conditions

### Positive Conditions (ALL must be true)

| Condition | Source | Engine Input |
|---|---|---|
| User elects amnesty path | Voluntary election | `userElectsAmnesty: boolean` (user-provided) |
| Date of death ≤ May 31, 2022 | RA 11956 Sec. 4 | `decedent.dateOfDeath` (date) |
| Estate tax unpaid or accrued as of May 31, 2022 | RA 11213 Sec. 4 | `estate.taxFullyPaidBeforeMay2022: boolean` (user-declared) |

### Negative Conditions (ANY disqualifies)

| Exclusion | Legal Basis | Engine Input |
|---|---|---|
| PCGG jurisdiction | RA 11213 Sec. 9 | `decedent.subjectToPCGGJurisdiction: boolean` |
| RA 3019 violations (anti-graft) | RA 11213 Sec. 9 | `estate.hasRA3019Violations: boolean` |
| RA 9160 violations (anti-money laundering) | RA 11213 Sec. 9 | `estate.hasRA9160Violations: boolean` |
| Pending court case filed before Feb 14, 2019 | RA 11213 Sec. 9 | `estate.hasPendingCourtCasePreAmnestyAct: boolean` |
| Unexplained wealth proceedings (RA 1379) | RA 11213 Sec. 9 | `estate.hasUnexplainedWealthCases: boolean` |
| RPC felony cases | RA 11213 Sec. 9 | `estate.hasPendingRPCFelonies: boolean` |

### Track Selection (affects computation — see amnesty-computation.md)

| Condition | Track |
|---|---|
| No prior estate tax return ever filed | Track A: 6% × total net estate |
| Prior estate tax return was filed, but estate tax still unpaid/underpaid | Track B: 6% × net undeclared estate |

### Deduction Rules (determined by date of death)

| Date of Death | Applicable Deductions |
|---|---|
| Before January 1, 2018 | Pre-TRAIN rules (funeral expenses allowed; standard deduction ₱1M; family home cap ₱1M) |
| January 1, 2018 – May 31, 2022 | TRAIN rules (no funeral; standard deduction ₱5M; family home cap ₱10M) |

**Important note**: RA 11956 expanded amnesty coverage to include deaths through May 31, 2022. For these deaths (2018–2022), the decedent was already subject to TRAIN-era rules at the time of death. The amnesty computation uses the deduction rules applicable at the time of death — which for 2018+ deaths means TRAIN rules apply even under amnesty.

---

## Amnesty vs. Regular Pre-TRAIN: Decision Logic

The engine must present the user with a clear choice for eligible estates. This is a user election, not an engine determination.

```pseudocode
// Called when: decedent.dateOfDeath < Date(2018, 1, 1)
// (pre-TRAIN death; both paths potentially available)
function selectRegime(decedent, estate, userElectsAmnesty):
  if decedent.dateOfDeath >= Date(2018, 1, 1):
    // TRAIN-era deaths: amnesty available only for 2018-2022 deaths
    // under RA 11956 expansion; regular path is always TRAIN-era
    if decedent.dateOfDeath <= Date(2022, 5, 31) and userElectsAmnesty:
      return "AMNESTY"
    else:
      return "TRAIN"

  // Pre-2018 death: three possible regimes
  if not userElectsAmnesty:
    return "PRE_TRAIN"        // Regular graduated rate computation

  eligibility = checkAmnestyEligibility(decedent, estate, userElectsAmnesty)
  if eligibility.eligible:
    return "AMNESTY"
  else:
    return "PRE_TRAIN"        // Amnesty not available, fall back to regular

// Regime string values: "TRAIN" | "PRE_TRAIN" | "AMNESTY"
```

---

## Form 1801 Mapping

**Amnesty does NOT use BIR Form 1801.**

The estate tax amnesty uses its own forms:
- **Estate Tax Amnesty Return (ETAR)** — the amnesty equivalent of Form 1801
- **Acceptance Payment Form (APF)** — payment processing form

The engine should produce:
1. Amnesty computation output (mirroring ETAR structure)
2. Plain-English explainer
3. Note that ETAR and APF are the required filing forms (not Form 1801)

For engine output, the computation values map to:

| Amnesty Output Field | TRAIN Form 1801 Equivalent | Description |
|---|---|---|
| Gross Estate | Item 34 | Total FMV of estate assets |
| Allowable Deductions | Item 35 | All applicable deductions |
| Net Estate | Item 38 or Item 36 | Gross estate − deductions |
| Surviving Spouse Share | Item 39 | 50% of net conjugal/community |
| Net Taxable Estate | Item 40 | Net estate − spouse share |
| Amnesty Tax Due | Item 42 | 6% × net taxable estate (or net undeclared estate) |
| Minimum Tax | — | ₱5,000 if computed tax < ₱5,000 |

---

## Edge Cases

### EC-AMN-ELIG-01: Death after May 31, 2022
- **Scenario**: Decedent died June 15, 2022. User asks about amnesty.
- **Expected behavior**: `eligible: false`, reason `DEATH_AFTER_COVERAGE_CUTOFF`. Engine directs user to TRAIN-era regular computation.

### EC-AMN-ELIG-02: Tax already paid
- **Scenario**: Estate tax was paid in full in 2010 under regular pre-TRAIN rules. User asks about amnesty.
- **Expected behavior**: `eligible: false`, reason `TAX_ALREADY_PAID`. Amnesty is for unpaid/unsettled taxes.

### EC-AMN-ELIG-03: Partially paid estate tax
- **Scenario**: Partial estate tax was paid in 2011, but remainder is still outstanding.
- **Expected behavior**: `eligible: true`. Tax has "accrued" and remains partially unpaid. Track B applies — prior return was filed, so only the undeclared/underpaid portion is subject to amnesty tax.

### EC-AMN-ELIG-04: PCGG estate
- **Scenario**: Decedent was a former government official whose assets are under PCGG sequestration.
- **Expected behavior**: `eligible: false`, reason `PCGG_EXCLUSION`. Hard exclusion, no override.

### EC-AMN-ELIG-05: Death in 2020 (TRAIN-era, under RA 11956 expansion)
- **Scenario**: Decedent died March 15, 2020 (during TRAIN era, within RA 11956 expanded coverage). Estate tax unpaid.
- **Expected behavior**: `eligible: true`. Deduction rules = TRAIN (₱5M standard, ₱10M family home cap, no funeral). Tax rate = flat 6% (same as regular TRAIN). The amnesty benefit is waiver of penalties and surcharges, not a rate difference.
- **Key note**: For 2018–2022 deaths, amnesty and regular TRAIN produce the SAME base tax amount. The only benefit of amnesty for these estates is waiver of penalties/surcharges, which the engine does not compute anyway. Engine should inform user of this.

### EC-AMN-ELIG-06: Partial estate settlement
- **Scenario**: Some properties in the estate were transferred/sold; others remain unsettled.
- **Expected behavior**: Amnesty covers the ENTIRE estate, including previously transferred properties. The settled properties' tax may still be covered if the overall estate tax was not properly settled.
- **Ambiguity**: Engine should flag this for professional review.

### EC-AMN-ELIG-07: No prior return, but estate partly transferred via partition
- **Scenario**: No estate tax return was ever filed, but heirs informally divided properties years ago.
- **Expected behavior**: Track A applies (no prior return filed). The amnesty base includes ALL estate property at FMV at date of death, regardless of subsequent disposition by heirs.

### EC-AMN-ELIG-08: Multiple decedents, one estate
- **Scenario**: Married couple both died before 2018. Their combined estate was never settled.
- **Expected behavior**: Each decedent's estate is a separate amnesty application. Engine must handle them separately, though they may share assets.

### EC-AMN-ELIG-09: Prior return filed with zero tax due
- **Scenario**: Estate tax return was filed but showed ₱0 tax due (all deductions exceeded gross estate). BIR never assessed.
- **Expected behavior**: Prior return was filed → Track B. Net undeclared estate = total net estate − previously declared net estate. If previously declared = current estimate, net undeclared ≤ 0 → minimum ₱5,000 applies.

### EC-AMN-ELIG-10: Pending criminal case vs. pre-Feb 2019 court case
- **Scenario**: BIR filed a tax evasion case in court in January 2019 (before RA 11213 enacted Feb 14, 2019).
- **Expected behavior**: Case was filed before enactment → `hasPendingCourtCasePreAmnestyAct: true` → excluded.

### EC-AMN-ELIG-11: BIR assessment issued after RA 11213 enactment
- **Scenario**: BIR issued an estate tax assessment in 2020. Estate still unpaid.
- **Expected behavior**: Assessment issued after enactment date, no court case pending → amnesty available. "With or without prior BIR assessments" per Sec. 4. Track B if prior return was filed; Track A if not.

### EC-AMN-ELIG-12: User elects amnesty for a TRAIN-era death with no benefit
- **Scenario**: Decedent died in 2020. Estate tax was not filed. User elects amnesty.
- **Expected behavior**: Eligible (RA 11956 coverage). Deduction rules = TRAIN. Tax = 6% (same as regular TRAIN rate). Engine should display informational note: "For estates of decedents who died after January 1, 2018, the amnesty tax rate (6%) is identical to the regular TRAIN estate tax rate. The primary benefit of the amnesty path for this estate is the waiver of any surcharges and interest — which this engine does not compute. If the estate has no penalty exposure, the regular TRAIN computation produces the same result."

---

## Test Implications

| Test ID | Scenario | Expected Eligibility |
|---|---|---|
| T-AMN-E-01 | Death Jan 2, 2022, tax unpaid, no exclusions, user elects → TRAIN deductions | eligible: true, Track A, TRAIN deductions |
| T-AMN-E-02 | Death Dec 31, 2017, tax unpaid, no exclusions, user elects → pre-TRAIN deductions | eligible: true, Track A, pre-TRAIN deductions |
| T-AMN-E-03 | Death June 1, 2022 (one day after cutoff) | eligible: false, DEATH_AFTER_COVERAGE_CUTOFF |
| T-AMN-E-04 | Death May 31, 2022 (exactly at cutoff), unpaid | eligible: true |
| T-AMN-E-05 | Death 2015, tax FULLY paid in 2016 | eligible: false, TAX_ALREADY_PAID |
| T-AMN-E-06 | Death 2013, partial prior return filed, user elects | eligible: true, Track B, pre-TRAIN deductions |
| T-AMN-E-07 | Death 2010, PCGG jurisdiction | eligible: false, PCGG_EXCLUSION |
| T-AMN-E-08 | Death 2016, prior court case filed Jan 2019 (pre-enactment) | eligible: false, PENDING_COURT_CASE_EXCLUSION |
| T-AMN-E-09 | Death 2016, BIR assessment issued 2021 (post-enactment), no court case | eligible: true, Track B |
| T-AMN-E-10 | Death 2012, user does NOT elect amnesty | eligible: false (USER_NOT_ELECTED); engine uses PRE_TRAIN regime |

---

## Interaction with Other Aspects

- **amnesty-computation.md** (next): Uses the `eligible`, `track`, and `deductionRules` outputs from this aspect to run the actual tax computation.
- **amnesty-vs-regular.md**: The full decision tree for choosing between amnesty and regular pre-TRAIN path, including user guidance on when each is preferable.
- **regime-detection.md** (Wave 5): Incorporates amnesty eligibility check into the master regime selector.
- **deductions-pre-train-diffs.md**: When `deductionRules == "PRE_TRAIN"`, apply pre-TRAIN deduction rules (funeral, judicial/admin, ₱1M standard, ₱1M family home cap).
- **deduction-standard.md**: Standard deduction amount depends on `deductionRules` flag derived here (₱1M for pre-TRAIN; ₱5M for TRAIN-era amnesty deaths).

---

## Notes for Engine Implementation

1. **Closed program disclosure**: Always display a notice that the filing window closed June 14, 2025. The engine computes historical amnesty tax amounts for reference only; actual availment requires a prior filing.

2. **User election is explicit**: The engine does not auto-select the amnesty path. The user must explicitly request it. This is important because amnesty has different documentation requirements (ETAR vs. Form 1801) and the window is closed.

3. **Deduction scope ambiguity**: The amnesty law says "deductions applicable at the time of death." The engine implements the full deduction set per time-of-death rules (not the narrow "standard + spouse only" interpretation), but should display a warning that professional tax advice is recommended on this point.

4. **RA 11956 coverage surprise**: Many users may not know that RA 11956 expanded coverage to 2018–2022 deaths. Engine should proactively inform users whose decedent died after January 1, 2018 and before/on May 31, 2022, that amnesty may have been available.

5. **No engine penalty computation**: The engine does not compute surcharges or interest. For TRAIN-era deaths under amnesty (2018–2022), the base tax is identical to the regular TRAIN computation. The engine should note this equivalence and explain that the amnesty benefit (for these estates) was penalty waiver only.
