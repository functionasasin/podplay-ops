#!/usr/bin/env python3
"""Validate all 20 testate CLI test cases against invariants."""
import json
import subprocess
import sys
import os
import glob

ENGINE = "./target/release/inheritance-engine"
CASES_DIR = "./examples/testate-cases"

def fmt(centavos):
    return f"P{centavos/100:,.2f}"

def validate(case_file):
    name = os.path.basename(case_file)
    with open(case_file) as f:
        inp = json.load(f)

    result = subprocess.run([ENGINE, case_file], capture_output=True, text=True)
    if result.returncode != 0:
        return name, "ERROR", [f"exit {result.returncode}: {result.stderr.strip()}"], None

    out = json.loads(result.stdout)
    estate = inp["net_distributable_estate"]["centavos"]
    issues = []

    # 1. Sum of net_from_estate == estate
    total_nfe = sum(int(s["net_from_estate"]["centavos"]) for s in out["per_heir_shares"])
    if total_nfe != estate:
        issues.append(f"SUM: nfe={total_nfe} != estate={estate}")

    # 2. No negative net_from_estate
    for s in out["per_heir_shares"]:
        nfe = int(s["net_from_estate"]["centavos"])
        if nfe < 0:
            issues.append(f"NEG: {s['heir_name']}={nfe}")

    # 3. IC <= LC ratio
    lc = [int(s["total"]["centavos"]) for s in out["per_heir_shares"]
          if s["heir_category"] == "LegitimateChildGroup" and s["inherits_by"] == "OwnRight"
          and int(s["total"]["centavos"]) > 0]
    ic = [int(s["total"]["centavos"]) for s in out["per_heir_shares"]
          if s["heir_category"] == "IllegitimateChildGroup" and int(s["total"]["centavos"]) > 0]
    if lc and ic and max(ic) > min(lc):
        issues.append(f"IC/LC: max_ic={max(ic)} > min_lc={min(lc)}")

    # 4. Narratives for all positive-share heirs
    pos = {s["heir_id"] for s in out["per_heir_shares"] if int(s["total"]["centavos"]) > 0}
    narr = {n["heir_id"] for n in out["narratives"]}
    if pos - narr:
        issues.append(f"NARR: missing for {pos - narr}")

    # 5. Disinherited heirs get 0 total
    if inp.get("will") and inp["will"].get("disinheritances"):
        for dis in inp["will"]["disinheritances"]:
            pid = dis["heir_reference"].get("person_id")
            if pid:
                share = next((s for s in out["per_heir_shares"] if s["heir_id"] == pid), None)
                if share and int(share["total"]["centavos"]) > 0:
                    issues.append(f"DISINHERITED {share['heir_name']} has total={int(share['total']['centavos'])}")

    status = "PASS" if not issues else "FAIL"
    return name, status, issues, out


cases = sorted(glob.glob(os.path.join(CASES_DIR, "*.json")))
print(f"Validating {len(cases)} testate cases...\n")
print(f"{'#':>2}  {'Case':<10} {'St':<6} {'Scenario':<6} {'Type':<25} Distribution")
print("-" * 130)

passed = failed = 0
for i, f in enumerate(cases, 1):
    name, status, issues, out = validate(f)
    if status == "PASS": passed += 1
    else: failed += 1

    sc = out["scenario_code"] if out else "?"
    st = out["succession_type"] if out else "?"
    dist = ", ".join(
        f"{s['heir_name']}={'(R) ' if s['inherits_by']=='Representation' else ''}{fmt(int(s['net_from_estate']['centavos']))}"
        + (f"+{fmt(int(s['donations_imputed']['centavos']))}don" if int(s['donations_imputed']['centavos']) > 0 else "")
        for s in out["per_heir_shares"]
    ) if out else ""

    print(f"{i:>2}  {name:<10} {status:<6} {sc:<6} {st:<25} {dist}")
    for issue in issues:
        print(f"    !! {issue}")

print("-" * 130)
print(f"\n{passed} passed, {failed} failed")
if failed: sys.exit(1)
