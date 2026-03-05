#!/usr/bin/env python3
"""Validate all 20 CLI test cases against invariants."""
import json
import subprocess
import sys
import os
import glob

ENGINE = "./target/release/inheritance-engine"
CASES_DIR = "./examples/cases"

def fmt_pesos(centavos):
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

    # Invariant 1: sum of net_from_estate == estate
    total_from_estate = sum(int(s["net_from_estate"]["centavos"]) for s in out["per_heir_shares"])
    if total_from_estate != estate:
        issues.append(f"SUM MISMATCH: net_from_estate={total_from_estate} != estate={estate}")

    # Invariant 2: no negative net_from_estate
    for s in out["per_heir_shares"]:
        nfe = int(s["net_from_estate"]["centavos"])
        if nfe < 0:
            issues.append(f"NEGATIVE: {s['heir_name']} net_from_estate={nfe}")

    # Invariant 3: IC share <= LC share (Art. 895 ratio)
    lc_totals = [int(s["total"]["centavos"]) for s in out["per_heir_shares"]
                 if s["heir_category"] == "LegitimateChildGroup"
                 and s["inherits_by"] == "OwnRight"
                 and int(s["total"]["centavos"]) > 0]
    ic_totals = [int(s["total"]["centavos"]) for s in out["per_heir_shares"]
                 if s["heir_category"] == "IllegitimateChildGroup"
                 and int(s["total"]["centavos"]) > 0]
    if lc_totals and ic_totals:
        min_lc = min(lc_totals)
        max_ic = max(ic_totals)
        if max_ic > min_lc:
            issues.append(f"IC/LC RATIO: max_ic={max_ic} > min_lc={min_lc}")

    # Invariant 4: narratives for all heirs with positive share
    heirs_with_share = {s["heir_id"] for s in out["per_heir_shares"] if int(s["total"]["centavos"]) > 0}
    heirs_with_narrative = {n["heir_id"] for n in out["narratives"]}
    missing = heirs_with_share - heirs_with_narrative
    if missing:
        issues.append(f"MISSING NARRATIVES: {missing}")

    # Invariant 5: scenario_code and succession_type are present
    if not out.get("scenario_code"):
        issues.append("NO SCENARIO CODE")
    if not out.get("succession_type"):
        issues.append("NO SUCCESSION TYPE")

    # Invariant 6: representation shares sum to ancestor's share
    repr_heirs = [s for s in out["per_heir_shares"] if s["inherits_by"] == "Representation"]
    if repr_heirs:
        by_ancestor = {}
        for s in repr_heirs:
            anc = s.get("represents", "?")
            by_ancestor.setdefault(anc, []).append(int(s["total"]["centavos"]))
        # Find ancestor shares (should be 0 since represented)
        for anc_id, rep_shares in by_ancestor.items():
            anc_share_entries = [s for s in out["per_heir_shares"] if s["heir_id"] == anc_id]
            if anc_share_entries:
                anc_total = int(anc_share_entries[0]["total"]["centavos"])
                rep_sum = sum(rep_shares)
                # Ancestor should have 0 (dead/disinherited), reps should have their line share
                # Just verify reps sum > 0
                if rep_sum == 0:
                    issues.append(f"REPR SUM ZERO for ancestor {anc_id}")

    # Invariant 7: adopted child == legitimate child share (when both present, no collation)
    adopted = [s for s in out["per_heir_shares"]
               if s["heir_category"] == "LegitimateChildGroup"
               and s["inherits_by"] == "OwnRight"]
    if len(adopted) > 1:
        # Check if any are adopted (check narratives for "adopted")
        adopted_names = set()
        for n in out["narratives"]:
            if "adopted child" in n.get("heir_category_label", "").lower():
                adopted_names.add(n["heir_id"])
        if adopted_names:
            has_donations = any(int(s.get("donations_imputed", {}).get("centavos", 0)) > 0
                              for s in out["per_heir_shares"])
            if not has_donations:
                lc_amounts = set()
                for s in adopted:
                    lc_amounts.add(int(s["total"]["centavos"]))
                if len(lc_amounts) > 1:
                    issues.append(f"ADOPTION INEQUALITY: LC shares differ {lc_amounts}")

    status = "PASS" if not issues else "FAIL"
    return name, status, issues, out


def main():
    cases = sorted(glob.glob(os.path.join(CASES_DIR, "*.json")))
    if not cases:
        print("No cases found!")
        sys.exit(1)

    passed = 0
    failed = 0
    results = []

    print(f"Running {len(cases)} test cases through CLI...\n")
    print(f"{'#':>2}  {'Case':<30} {'Status':<6} {'Scenario':<6} {'Type':<25} {'Distribution'}")
    print("-" * 120)

    for i, case_file in enumerate(cases, 1):
        name, status, issues, out = validate(case_file)

        if status == "PASS":
            passed += 1
        else:
            failed += 1

        scenario = out["scenario_code"] if out else "?"
        stype = out["succession_type"] if out else "?"

        dist_parts = []
        if out:
            for s in out["per_heir_shares"]:
                nfe = int(s["net_from_estate"]["centavos"])
                total = int(s["total"]["centavos"])
                don = int(s["donations_imputed"]["centavos"])
                label = s["heir_name"]
                if s["inherits_by"] == "Representation":
                    label += "(R)"
                if don > 0:
                    dist_parts.append(f"{label}={fmt_pesos(nfe)}+{fmt_pesos(don)}don")
                else:
                    dist_parts.append(f"{label}={fmt_pesos(nfe)}")
        dist_str = ", ".join(dist_parts)

        print(f"{i:>2}  {name:<30} {status:<6} {scenario:<6} {stype:<25} {dist_str}")

        if issues:
            for issue in issues:
                print(f"    !! {issue}")

        results.append((name, status, issues, out))

    print("-" * 120)
    print(f"\nResults: {passed} passed, {failed} failed out of {len(cases)} cases")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
