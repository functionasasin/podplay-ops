#!/usr/bin/env python3
"""Generate ~100 randomized fuzz test cases for the inheritance engine.

Each case is a structurally valid EngineInput JSON file. A companion Rust test
(tests/fuzz_invariants.rs) loads these and checks all 10 spec invariants.

Usage:
    python3 examples/generate-fuzz-cases.py
"""
import json
import os
import random

CASES_DIR = "./examples/fuzz-cases"
SEED = 20260224  # Fixed seed for reproducibility
os.makedirs(CASES_DIR, exist_ok=True)

rng = random.Random(SEED)

# ── Name pools ──────────────────────────────────────────────────────

FIRST_NAMES = [
    "Ana", "Ben", "Carlos", "Diana", "Eduardo", "Fatima", "Gabriel", "Helena",
    "Ivan", "Julia", "Kevin", "Lorna", "Miguel", "Nora", "Oscar", "Patricia",
    "Quintin", "Rosa", "Sandra", "Tomas", "Ursela", "Victor", "Wendy", "Xavier",
    "Yolanda", "Zenaida", "Amara", "Bruno", "Celine", "Dante",
]
LAST_NAMES = [
    "Santos", "Reyes", "Cruz", "Garcia", "Mendoza", "Torres", "Lopez",
    "Gonzales", "Ramos", "Aquino",
]

CHILD_DISINHERITANCE_CAUSES = [
    "ChildAttemptOnLife", "ChildGroundlessAccusation", "ChildAdulteryWithSpouse",
    "ChildFraudUndueInfluence", "ChildRefusalToSupport", "ChildMaltreatment",
    "ChildDishonorableLife", "ChildCivilInterdiction",
]
PARENT_DISINHERITANCE_CAUSES = [
    "ParentAbandonmentCorruption", "ParentAttemptOnLife", "ParentGroundlessAccusation",
    "ParentAdulteryWithSpouse", "ParentFraudUndueInfluence", "ParentLossParentalAuthority",
    "ParentRefusalToSupport", "ParentAttemptOnOther",
]
SPOUSE_DISINHERITANCE_CAUSES = [
    "SpouseAttemptOnLife", "SpouseGroundlessAccusation", "SpouseFraudUndueInfluence",
    "SpouseCauseLegalSeparation", "SpouseLossParentalAuthority", "SpouseRefusalToSupport",
]

FILIATION_PROOFS = [
    "BirthCertificate", "FinalJudgment", "PublicDocumentAdmission",
    "PrivateHandwrittenAdmission", "OpenContinuousPossession", "OtherEvidence",
]

# ── Helper builders ─────────────────────────────────────────────────

def rand_name():
    return f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"

def pesos(p):
    return {"centavos": p * 100}

def rand_estate():
    """Random estate between 100,000 and 100,000,000 pesos."""
    return rng.choice([
        rng.randint(1000, 10000) * 100,           # 100K - 1M
        rng.randint(10000, 100000) * 100,          # 1M - 10M
        rng.randint(100000, 1000000) * 100,        # 10M - 100M
    ])

def decedent(name, married=False, articulo_mortis=False, ill=False,
             illness_death=False, cohab=0, legal_sep=False):
    return {
        "id": "d", "name": name, "date_of_death": "2026-01-15",
        "is_married": married,
        "date_of_marriage": "2000-01-01" if married else None,
        "marriage_solemnized_in_articulo_mortis": articulo_mortis,
        "was_ill_at_marriage": ill,
        "illness_caused_death": illness_death,
        "years_of_cohabitation": cohab,
        "has_legal_separation": legal_sep,
        "is_illegitimate": False,
    }

def person(pid, name, rel, alive=True, children=None, degree=None,
           filiation_proof=None, blood=None, renounced=False, line=None):
    deg = degree
    if deg is None:
        deg = {
            "LegitimateChild": 1, "LegitimatedChild": 1, "AdoptedChild": 1,
            "IllegitimateChild": 1, "SurvivingSpouse": 1, "LegitimateParent": 1,
            "LegitimateAscendant": 2, "Sibling": 2, "NephewNiece": 3,
            "OtherCollateral": 4, "Stranger": 0,
        }.get(rel, 1)
    return {
        "id": pid, "name": name, "is_alive_at_succession": alive,
        "relationship_to_decedent": rel, "degree": deg, "line": line,
        "children": children or [], "filiation_proved": True,
        "filiation_proof_type": filiation_proof,
        "is_guilty_party_in_legal_separation": False,
        "adoption": None, "is_unworthy": False, "unworthiness_condoned": False,
        "has_renounced": renounced, "blood_type": blood,
    }

def heir_ref(pid, name):
    return {"person_id": pid, "name": name, "is_collective": False, "class_designation": None}

def stranger_ref(name):
    return {"person_id": None, "name": name, "is_collective": False, "class_designation": None}

def institution(iid, heir, share, residuary=False):
    return {"id": iid, "heir": heir, "share": share, "conditions": [],
            "substitutes": [], "is_residuary": residuary}

def legacy(lid, legatee, amount_pesos, preferred=False):
    return {"id": lid, "legatee": legatee,
            "property": {"FixedAmount": pesos(amount_pesos)},
            "conditions": [], "substitutes": [], "is_preferred": preferred}

def disinheritance(heir, cause):
    return {"heir_reference": heir, "cause_code": cause,
            "cause_specified_in_will": True, "cause_proven": True,
            "reconciliation_occurred": False}

def make_will(institutions=None, legacies=None, devises=None, disinheritances=None):
    return {"institutions": institutions or [], "legacies": legacies or [],
            "devises": devises or [], "disinheritances": disinheritances or [],
            "date_executed": "2025-06-01"}

def donation(did, recipient, amount_pesos, exempt=False):
    return {
        "id": did, "recipient_heir_id": recipient, "recipient_is_stranger": False,
        "value_at_time_of_donation": pesos(amount_pesos), "date": "2020-01-01",
        "description": "advance on inheritance", "is_expressly_exempt": exempt,
        "is_support_education_medical": False, "is_customary_gift": False,
        "is_professional_expense": False, "professional_expense_parent_required": False,
        "professional_expense_imputed_savings": None, "is_joint_from_both_parents": False,
        "is_to_child_spouse_only": False, "is_joint_to_child_and_spouse": False,
        "is_wedding_gift": False, "is_debt_payment_for_child": False,
        "is_election_expense": False, "is_fine_payment": False,
    }

def case(estate_pesos, dec, family, w=None, donations=None):
    return {
        "net_distributable_estate": pesos(estate_pesos),
        "decedent": dec,
        "family_tree": family,
        "will": w,
        "donations": donations or [],
        "config": {"retroactive_ra_11642": False, "max_pipeline_restarts": 10},
    }

# ── Family tree generators ──────────────────────────────────────────

def gen_legitimate_children(n, dead_indices=None, grandchildren_for=None):
    """Generate n legitimate children. Some may be dead with grandchildren."""
    dead_indices = dead_indices or set()
    grandchildren_for = grandchildren_for or {}
    family = []
    for i in range(n):
        pid = f"lc{i+1}"
        name = rand_name()
        alive = i not in dead_indices
        gc_ids = []
        if i in grandchildren_for:
            gc_count = grandchildren_for[i]
            for j in range(gc_count):
                gc_id = f"gc{i+1}_{j+1}"
                gc_ids.append(gc_id)
                family.append(person(gc_id, rand_name(), "LegitimateChild",
                                     degree=2, children=[]))
            # The gc are children[] of this person, set parent ref
        family.append(person(pid, name, "LegitimateChild", alive=alive,
                             children=gc_ids))
    return family

def gen_illegitimate_children(n, start=1):
    """Generate n illegitimate children with filiation proofs."""
    family = []
    for i in range(n):
        pid = f"ic{start + i}"
        proof = rng.choice(FILIATION_PROOFS)
        family.append(person(pid, rand_name(), "IllegitimateChild",
                             filiation_proof=proof))
    return family

def gen_spouse(guilty=False):
    sp = person("sp", rand_name(), "SurvivingSpouse")
    if guilty:
        sp["is_guilty_party_in_legal_separation"] = True
    return sp

def gen_parents(both=True):
    """Generate parents (one or both)."""
    family = []
    family.append(person("p1", rand_name(), "LegitimateParent", line="Paternal"))
    if both:
        family.append(person("p2", rand_name(), "LegitimateParent", line="Maternal"))
    return family

def gen_siblings(n, half_blood_indices=None):
    """Generate siblings, some optionally half-blood."""
    half_blood_indices = half_blood_indices or set()
    family = []
    for i in range(n):
        pid = f"sib{i+1}"
        blood = "Half" if i in half_blood_indices else "Full"
        family.append(person(pid, rand_name(), "Sibling", blood=blood))
    return family

def gen_nephews(n, parent_sibling_id=None):
    """Generate nephews/nieces."""
    family = []
    for i in range(n):
        pid = f"nn{i+1}"
        family.append(person(pid, rand_name(), "NephewNiece"))
    return family

# ── Case generators by category ─────────────────────────────────────

def gen_intestate_simple():
    """Intestate: 1-6 LC, with/without spouse."""
    n_children = rng.randint(1, 6)
    has_spouse = rng.choice([True, False])
    family = gen_legitimate_children(n_children)
    if has_spouse:
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()
    desc = f"intestate-{n_children}lc" + ("-sp" if has_spouse else "")
    return desc, case(estate, dec, family)

def gen_intestate_illegitimate():
    """Intestate: mix of LC + IC, with/without spouse."""
    n_lc = rng.randint(1, 4)
    n_ic = rng.randint(1, 3)
    has_spouse = rng.choice([True, False])
    family = gen_legitimate_children(n_lc)
    family.extend(gen_illegitimate_children(n_ic))
    if has_spouse:
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()
    desc = f"intestate-{n_lc}lc-{n_ic}ic" + ("-sp" if has_spouse else "")
    return desc, case(estate, dec, family)

def gen_intestate_ascendants_collaterals():
    """Intestate: no children, parents/siblings/nephews."""
    config = rng.choice(["parents-only", "parents-spouse", "siblings-only",
                          "siblings-spouse", "parents-siblings"])
    family = []
    has_spouse = False
    if "parents" in config:
        both = rng.choice([True, False])
        family.extend(gen_parents(both=both))
    if "siblings" in config:
        n = rng.randint(1, 4)
        half = set(rng.sample(range(n), k=rng.randint(0, min(2, n))))
        family.extend(gen_siblings(n, half_blood_indices=half))
    if "spouse" in config:
        has_spouse = True
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()
    desc = f"intestate-{config}"
    return desc, case(estate, dec, family)

def gen_testate_simple():
    """Testate: simple institutions (fractions, equal, entire FP, residuary)."""
    n_children = rng.randint(1, 4)
    has_spouse = rng.choice([True, False])
    family = gen_legitimate_children(n_children)
    if has_spouse:
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()

    # Build institutions — give FP to a stranger or split among heirs
    insts = []
    style = rng.choice(["entire_fp_stranger", "equal_heirs", "fractions"])
    if style == "entire_fp_stranger":
        insts.append(institution("i1", stranger_ref(rand_name()), "EntireFreePort"))
    elif style == "equal_heirs":
        for i in range(n_children):
            pid = f"lc{i+1}"
            name = family[i]["name"]
            insts.append(institution(f"i{i+1}", heir_ref(pid, name), "EqualWithOthers"))
    elif style == "fractions":
        # Give each instituted heir an equal fraction of FP
        n_inst = rng.randint(1, min(3, n_children))
        for i in range(n_inst):
            pid = f"lc{i+1}"
            name = family[i]["name"]
            frac = f"1/{n_inst}" if n_inst > 1 else "1/1"
            insts.append(institution(f"i{i+1}", heir_ref(pid, name),
                                     {"Fraction": frac}))

    w = make_will(institutions=insts)
    desc = f"testate-simple-{style}-{n_children}lc" + ("-sp" if has_spouse else "")
    return desc, case(estate, dec, family, w=w)

def gen_testate_disinheritance():
    """Testate: 1-4 disinheritances, with/without representing grandchildren."""
    n_children = rng.randint(3, 6)
    n_disinherit = rng.randint(1, min(4, n_children - 1))  # Leave at least 1 non-disinherited
    has_spouse = rng.choice([True, False])

    # Decide which children get grandchildren (for representation)
    grandchildren_for = {}
    dead_indices = set()
    disinherit_indices = rng.sample(range(n_children), k=n_disinherit)

    for idx in disinherit_indices:
        if rng.random() < 0.4:  # 40% chance of having grandchildren
            grandchildren_for[idx] = rng.randint(1, 3)

    family = gen_legitimate_children(n_children, dead_indices=dead_indices,
                                     grandchildren_for=grandchildren_for)
    if has_spouse:
        family.append(gen_spouse())

    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()

    # Build disinheritances
    disinhers = []
    for idx in disinherit_indices:
        pid = f"lc{idx+1}"
        # Find the person's name
        p = next(p for p in family if p["id"] == pid)
        cause = rng.choice(CHILD_DISINHERITANCE_CAUSES)
        disinhers.append(disinheritance(heir_ref(pid, p["name"]), cause))

    # Optionally institute a non-disinherited child for the free portion
    insts = []
    non_disinherited = [i for i in range(n_children) if i not in disinherit_indices]
    if non_disinherited and rng.random() < 0.6:
        idx = rng.choice(non_disinherited)
        pid = f"lc{idx+1}"
        p = next(p for p in family if p["id"] == pid)
        insts.append(institution("i1", heir_ref(pid, p["name"]), "EntireFreePort"))

    w = make_will(institutions=insts, disinheritances=disinhers)
    desc = (f"testate-disinherit-{n_disinherit}of{n_children}"
            + ("-gc" if grandchildren_for else "")
            + ("-sp" if has_spouse else ""))
    return desc, case(estate, dec, family, w=w)

def gen_testate_legacies():
    """Testate: fixed amount legacies, some potentially inofficious."""
    n_children = rng.randint(1, 4)
    has_spouse = rng.choice([True, False])
    family = gen_legitimate_children(n_children)
    if has_spouse:
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()

    # Generate 1-3 legacies
    n_legacies = rng.randint(1, 3)
    legs = []
    for i in range(n_legacies):
        # Legacy amount: between 1% and 30% of estate (some may be inofficious)
        pct = rng.uniform(0.01, 0.30)
        amount = int(estate * pct)
        legatee = stranger_ref(rand_name())
        legs.append(legacy(f"leg{i+1}", legatee, amount))

    # Maybe also institute someone
    insts = []
    if rng.random() < 0.5:
        insts.append(institution("i1", stranger_ref(rand_name()), "Residuary",
                                 residuary=True))

    w = make_will(institutions=insts, legacies=legs)
    desc = f"testate-legacies-{n_legacies}leg-{n_children}lc" + ("-sp" if has_spouse else "")
    return desc, case(estate, dec, family, w=w)

def gen_testate_donations():
    """Testate with donations (collation)."""
    n_children = rng.randint(2, 4)
    has_spouse = rng.choice([True, False])
    family = gen_legitimate_children(n_children)
    if has_spouse:
        family.append(gen_spouse())
    dec = decedent(rand_name(), married=has_spouse)
    estate = rand_estate()

    # Generate 1-3 donations to heirs
    n_donations = rng.randint(1, 3)
    dons = []
    for i in range(n_donations):
        recipient_idx = rng.randint(0, n_children - 1)
        recipient_id = f"lc{recipient_idx + 1}"
        # Donation amount: 5-25% of estate
        pct = rng.uniform(0.05, 0.25)
        amount = int(estate * pct)
        exempt = rng.random() < 0.2  # 20% chance exempt
        dons.append(donation(f"don{i+1}", recipient_id, amount, exempt=exempt))

    # Simple will
    insts = [institution("i1", stranger_ref(rand_name()), "EntireFreePort")]
    w = make_will(institutions=insts)
    desc = f"testate-donations-{n_donations}don-{n_children}lc" + ("-sp" if has_spouse else "")
    return desc, case(estate, dec, family, w=w, donations=dons)

def gen_mixed_complex():
    """Complex cases: representation, renunciation, preterition, articulo mortis."""
    variant = rng.choice(["representation", "renunciation", "preterition",
                           "articulo_mortis", "legal_separation"])

    if variant == "representation":
        # Dead child with grandchildren (representation in intestate)
        n_children = rng.randint(2, 5)
        dead_idx = rng.randint(0, n_children - 1)
        gc_count = rng.randint(1, 3)
        family = gen_legitimate_children(
            n_children, dead_indices={dead_idx},
            grandchildren_for={dead_idx: gc_count})
        has_spouse = rng.choice([True, False])
        if has_spouse:
            family.append(gen_spouse())
        dec = decedent(rand_name(), married=has_spouse)
        estate = rand_estate()
        desc = f"mixed-representation-{n_children}lc-dead{dead_idx+1}"
        return desc, case(estate, dec, family)

    elif variant == "renunciation":
        # A child who renounces
        n_children = rng.randint(2, 4)
        renounce_idx = rng.randint(0, n_children - 1)
        family = gen_legitimate_children(n_children)
        family[renounce_idx]["has_renounced"] = True
        # Note: the renouncing person is at the end of family (after gc if any)
        # Actually gen_legitimate_children appends in order, so find by id
        pid = f"lc{renounce_idx+1}"
        for p in family:
            if p["id"] == pid:
                p["has_renounced"] = True
        has_spouse = rng.choice([True, False])
        if has_spouse:
            family.append(gen_spouse())
        dec = decedent(rand_name(), married=has_spouse)
        estate = rand_estate()
        desc = f"mixed-renunciation-{n_children}lc"
        return desc, case(estate, dec, family)

    elif variant == "preterition":
        # Will that skips a compulsory heir -> preterition
        n_children = rng.randint(2, 4)
        family = gen_legitimate_children(n_children)
        has_spouse = rng.choice([True, False])
        if has_spouse:
            family.append(gen_spouse())
        dec = decedent(rand_name(), married=has_spouse)
        estate = rand_estate()
        # Institute only some children, skip at least one compulsory heir
        n_inst = rng.randint(1, n_children - 1)
        insts = []
        for i in range(n_inst):
            pid = f"lc{i+1}"
            p = next(p for p in family if p["id"] == pid)
            insts.append(institution(f"i{i+1}", heir_ref(pid, p["name"]),
                                     "EqualWithOthers"))
        w = make_will(institutions=insts)
        desc = f"mixed-preterition-{n_inst}of{n_children}lc"
        return desc, case(estate, dec, family, w=w)

    elif variant == "articulo_mortis":
        # Marriage in articulo mortis
        n_children = rng.randint(0, 3)
        family = gen_legitimate_children(n_children) if n_children > 0 else []
        family.append(gen_spouse())
        cohab = rng.randint(0, 10)
        ill = True
        illness_death = rng.choice([True, False])
        dec = decedent(rand_name(), married=True, articulo_mortis=True,
                       ill=ill, illness_death=illness_death, cohab=cohab)
        estate = rand_estate()
        desc = f"mixed-articulo-mortis-{n_children}lc-cohab{cohab}"
        return desc, case(estate, dec, family)

    else:  # legal_separation
        # Spouse is guilty party in legal separation
        n_children = rng.randint(1, 3)
        family = gen_legitimate_children(n_children)
        family.append(gen_spouse(guilty=True))
        dec = decedent(rand_name(), married=True, legal_sep=True)
        estate = rand_estate()
        desc = f"mixed-legal-sep-{n_children}lc"
        return desc, case(estate, dec, family)

def gen_stress_edge():
    """Stress/edge cases: large families, tiny estates, single heir."""
    variant = rng.choice(["large_family", "tiny_estate", "single_heir",
                           "many_ic", "max_disinherit"])

    if variant == "large_family":
        n_children = rng.randint(8, 12)
        has_spouse = rng.choice([True, False])
        family = gen_legitimate_children(n_children)
        if has_spouse:
            family.append(gen_spouse())
        dec = decedent(rand_name(), married=has_spouse)
        estate = rand_estate()
        desc = f"stress-large-{n_children}lc"
        return desc, case(estate, dec, family)

    elif variant == "tiny_estate":
        # 1 centavo to a few pesos
        estate = rng.randint(1, 100)  # 1 centavo to 1 peso
        n_children = rng.randint(1, 3)
        family = gen_legitimate_children(n_children)
        dec = decedent(rand_name(), married=False)
        # pesos() multiplies by 100, but we want centavos directly
        desc = f"stress-tiny-{estate}centavos-{n_children}lc"
        c = {
            "net_distributable_estate": {"centavos": estate},
            "decedent": dec,
            "family_tree": family,
            "will": None,
            "donations": [],
            "config": {"retroactive_ra_11642": False, "max_pipeline_restarts": 10},
        }
        return desc, c

    elif variant == "single_heir":
        heir_type = rng.choice(["lc", "sp", "parent"])
        if heir_type == "lc":
            family = gen_legitimate_children(1)
            dec = decedent(rand_name(), married=False)
        elif heir_type == "sp":
            family = [gen_spouse()]
            dec = decedent(rand_name(), married=True)
        else:
            family = gen_parents(both=False)
            dec = decedent(rand_name(), married=False)
        estate = rand_estate()
        desc = f"stress-single-{heir_type}"
        return desc, case(estate, dec, family)

    elif variant == "many_ic":
        n_ic = rng.randint(3, 6)
        has_spouse = rng.choice([True, False])
        family = gen_illegitimate_children(n_ic)
        if has_spouse:
            family.append(gen_spouse())
        dec = decedent(rand_name(), married=has_spouse)
        estate = rand_estate()
        desc = f"stress-{n_ic}ic" + ("-sp" if has_spouse else "")
        return desc, case(estate, dec, family)

    else:  # max_disinherit
        # Disinherit as many as possible
        n_children = rng.randint(4, 6)
        n_disinherit = n_children - 1  # Leave exactly 1
        family = gen_legitimate_children(n_children)
        family.append(gen_spouse())
        dec = decedent(rand_name(), married=True)
        estate = rand_estate()
        disinhers = []
        # Disinherit all but the first child
        for i in range(1, n_disinherit + 1):
            pid = f"lc{i+1}"
            p = next(p for p in family if p["id"] == pid)
            cause = rng.choice(CHILD_DISINHERITANCE_CAUSES)
            disinhers.append(disinheritance(heir_ref(pid, p["name"]), cause))
        insts = []
        p0 = next(p for p in family if p["id"] == "lc1")
        insts.append(institution("i1", heir_ref("lc1", p0["name"]), "EntireFreePort"))
        w = make_will(institutions=insts, disinheritances=disinhers)
        desc = f"stress-maxdisinherit-{n_disinherit}of{n_children}"
        return desc, case(estate, dec, family, w=w)

# ── Main generation ─────────────────────────────────────────────────

GENERATORS = [
    (gen_intestate_simple, 15),
    (gen_intestate_illegitimate, 10),
    (gen_intestate_ascendants_collaterals, 10),
    (gen_testate_simple, 10),
    (gen_testate_disinheritance, 15),
    (gen_testate_legacies, 10),
    (gen_testate_donations, 10),
    (gen_mixed_complex, 10),
    (gen_stress_edge, 10),
]

def main():
    # Clear existing cases
    for f in os.listdir(CASES_DIR):
        if f.endswith(".json"):
            os.remove(os.path.join(CASES_DIR, f))

    case_num = 0
    for gen_fn, count in GENERATORS:
        for _ in range(count):
            case_num += 1
            desc, data = gen_fn()
            filename = f"{case_num:03d}-{desc}.json"
            filepath = os.path.join(CASES_DIR, filename)
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)

    print(f"Generated {case_num} fuzz cases in {CASES_DIR}/")

if __name__ == "__main__":
    main()
