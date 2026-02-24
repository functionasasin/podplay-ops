#!/usr/bin/env python3
"""Generate 20 testate test cases, run through the engine, and produce markdown."""
import json
import subprocess
import os
import textwrap

ENGINE = "./target/release/inheritance-engine"
CASES_DIR = "./examples/testate-cases"
OUTPUT_FILE = "./examples/testate-test-results.md"

os.makedirs(CASES_DIR, exist_ok=True)

def pesos(p):
    return {"centavos": p * 100}

def decedent(name, married=False, articulo_mortis=False, ill=False, illness_death=False, cohab=0):
    return {
        "id": "d", "name": name, "date_of_death": "2026-01-15",
        "is_married": married,
        "date_of_marriage": "2000-01-01" if married else None,
        "marriage_solemnized_in_articulo_mortis": articulo_mortis,
        "was_ill_at_marriage": ill,
        "illness_caused_death": illness_death,
        "years_of_cohabitation": cohab,
        "has_legal_separation": False, "is_illegitimate": False,
    }

def person(pid, name, rel, alive=True, children=None, degree=None, filiation_proof=None, blood=None, renounced=False):
    deg = degree
    if deg is None:
        deg = {"LegitimateChild":1,"LegitimatedChild":1,"AdoptedChild":1,"IllegitimateChild":1,
               "SurvivingSpouse":1,"LegitimateParent":1,"LegitimateAscendant":2,
               "Sibling":2,"NephewNiece":3,"OtherCollateral":4,"Stranger":0}.get(rel, 1)
    return {
        "id": pid, "name": name, "is_alive_at_succession": alive,
        "relationship_to_decedent": rel, "degree": deg, "line": None,
        "children": children or [], "filiation_proved": True,
        "filiation_proof_type": filiation_proof,
        "is_guilty_party_in_legal_separation": False,
        "adoption": None, "is_unworthy": False, "unworthiness_condoned": False,
        "has_renounced": renounced, "blood_type": blood,
    }

def parent(pid, name, line):
    p = person(pid, name, "LegitimateParent")
    p["line"] = line
    return p

def heir_ref(pid, name):
    return {"person_id": pid, "name": name, "is_collective": False, "class_designation": None}

def stranger_ref(name):
    return {"person_id": None, "name": name, "is_collective": False, "class_designation": None}

def institution(iid, heir, share, residuary=False):
    return {"id": iid, "heir": heir, "share": share, "conditions": [], "substitutes": [], "is_residuary": residuary}

def legacy(lid, legatee, amount_pesos, preferred=False):
    return {"id": lid, "legatee": legatee, "property": {"FixedAmount": pesos(amount_pesos)},
            "conditions": [], "substitutes": [], "is_preferred": preferred}

def disinheritance(heir, cause):
    return {"heir_reference": heir, "cause_code": cause,
            "cause_specified_in_will": True, "cause_proven": True, "reconciliation_occurred": False}

def will(institutions=None, legacies=None, devises=None, disinheritances=None, date="2025-06-01"):
    return {"institutions": institutions or [], "legacies": legacies or [],
            "devises": devises or [], "disinheritances": disinheritances or [],
            "date_executed": date}

def donation(did, recipient, amount_pesos):
    return {"id": did, "recipient_heir_id": recipient, "recipient_is_stranger": False,
            "value_at_time_of_donation": pesos(amount_pesos), "date": "2020-01-01",
            "description": "advance on inheritance", "is_expressly_exempt": False,
            "is_support_education_medical": False, "is_customary_gift": False,
            "is_professional_expense": False, "professional_expense_parent_required": False,
            "professional_expense_imputed_savings": None, "is_joint_from_both_parents": False,
            "is_to_child_spouse_only": False, "is_joint_to_child_and_spouse": False,
            "is_wedding_gift": False, "is_debt_payment_for_child": False,
            "is_election_expense": False, "is_fine_payment": False}

def case(estate_pesos, dec, family, w, donations=None):
    return {"net_distributable_estate": pesos(estate_pesos), "decedent": dec,
            "family_tree": family, "will": w, "donations": donations or [],
            "config": {"retroactive_ra_11642": False, "max_pipeline_restarts": 10}}

# ── 20 Testate Cases ─────────────────────────────────────────────────
# Each entry: (description, case_data, will_text)

cases = []

# 1. Simple will: entire FP to charity
cases.append(("Will entire FP to charity (2 LC)",
    case(10_000_000, decedent("Carmen Dela Cruz"), [
        person("lc1", "Daniel Dela Cruz", "LegitimateChild"),
        person("lc2", "Eva Dela Cruz", "LegitimateChild"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Daniel Dela Cruz"), "EqualWithOthers"),
        institution("i2", heir_ref("lc2", "Eva Dela Cruz"), "EqualWithOthers"),
        institution("i3", stranger_ref("Red Cross"), "Residuary", residuary=True),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF CARMEN DELA CRUZ

        I, CARMEN DELA CRUZ, of legal age, Filipino, single, and a resident of
        Quezon City, Metro Manila, being of sound and disposing mind, do hereby
        declare this to be my Last Will and Testament, revoking all prior wills
        and codicils previously made by me.

        ARTICLE I — INSTITUTION OF HEIRS

        I hereby institute as my heirs, in equal shares, my beloved children:

            1. DANIEL DELA CRUZ
            2. EVA DELA CRUZ

        ARTICLE II — DISPOSITION OF FREE PORTION

        Whatever remains of my estate after satisfaction of the legitimes of
        my compulsory heirs, constituting the free portion, I bequeath to the
        PHILIPPINE RED CROSS, to be used for its humanitarian operations.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in the City of Quezon City, Philippines.

                                        [Signed]
                                        CARMEN DELA CRUZ
                                        Testatrix""")))

# 2. Fractional institutions
cases.append(("Fractional institutions (1/3 + 2/3 of FP)",
    case(12_000_000, decedent("Pedro Reyes", married=True), [
        person("lc1", "Ana Reyes", "LegitimateChild"),
        person("sp", "Rosa Reyes", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", stranger_ref("Foundation A"), {"Fraction": "1/3"}),
        institution("i2", stranger_ref("Foundation B"), {"Fraction": "2/3"}),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF PEDRO REYES

        I, PEDRO REYES, of legal age, Filipino, married to ROSA REYES, and
        a resident of Makati City, Metro Manila, being of sound and disposing
        mind, do hereby declare this to be my Last Will and Testament.

        ARTICLE I — DISPOSITION OF FREE PORTION

        Out of the disposable free portion of my estate, I direct as follows:

            1. One-third (1/3) thereof to FOUNDATION A, a duly registered
               non-profit organization, for its educational programs;

            2. Two-thirds (2/3) thereof to FOUNDATION B, a duly registered
               charitable institution, for its medical mission activities.

        The legitimes of my compulsory heirs shall be respected in accordance
        with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Makati City, Philippines.

                                        [Signed]
                                        PEDRO REYES
                                        Testator""")))

# 3. Preterition: omit one LC
cases.append(("Preterition: omit LC2 from will",
    case(8_000_000, decedent("Diego Santos"), [
        person("lc1", "Liza Santos", "LegitimateChild"),
        person("lc2", "Marco Santos", "LegitimateChild"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Liza Santos"), "EntireEstate"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF DIEGO SANTOS

        I, DIEGO SANTOS, of legal age, Filipino, single, and a resident of
        Cebu City, Cebu, being of sound and disposing mind, do hereby declare
        this to be my Last Will and Testament.

        ARTICLE I — INSTITUTION OF SOLE HEIR

        I hereby institute as my sole and universal heir my daughter,
        LIZA SANTOS, to receive the entirety of my estate, both real and
        personal, wherever situated.

        I make no other institution of heirs.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Cebu City, Philippines.

                                        [Signed]
                                        DIEGO SANTOS
                                        Testator

        [NOTE: The testator's son MARCO SANTOS is not mentioned anywhere
         in this instrument.]""")))

# 4. Disinheritance with grandchild representation
cases.append(("Disinheritance with grandchild representation",
    case(15_000_000, decedent("Hector Villanueva", married=True), [
        person("lc1", "Irene Villanueva", "LegitimateChild"),
        person("lc2", "Karen Villanueva", "LegitimateChild", children=["gc1", "gc2"]),
        person("gc1", "Luis Villanueva", "LegitimateChild", degree=2),
        person("gc2", "Marta Villanueva", "LegitimateChild", degree=2),
        person("sp", "Nora Villanueva", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Irene Villanueva"), "EqualWithOthers"),
        institution("i2", stranger_ref("Charity B"), "Residuary", residuary=True),
    ], disinheritances=[
        disinheritance(heir_ref("lc2", "Karen Villanueva"), "ChildMaltreatment"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF HECTOR VILLANUEVA

        I, HECTOR VILLANUEVA, of legal age, Filipino, married to
        NORA VILLANUEVA, and a resident of Davao City, being of sound
        and disposing mind, do hereby declare this to be my Last Will
        and Testament.

        ARTICLE I — DISINHERITANCE

        For just cause, I hereby DISINHERIT my daughter KAREN VILLANUEVA,
        pursuant to Article 919(6) of the Civil Code, on the ground that
        she has been guilty of maltreatment of the testator by word or
        deed. Specifically, Karen has repeatedly subjected me to verbal
        abuse and physical threats over the course of several years, as
        can be attested to by members of our household.

        ARTICLE II — INSTITUTION OF HEIRS

        I hereby institute as my heir my daughter IRENE VILLANUEVA, to
        receive her share in equal proportion with other instituted heirs.

        ARTICLE III — RESIDUARY ESTATE

        Whatever remains of the disposable portion of my estate, after
        the foregoing dispositions, I bequeath to CHARITY B, INC.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Davao City, Philippines.

                                        [Signed]
                                        HECTOR VILLANUEVA
                                        Testator""")))

# 5. Legacy to stranger (within FP)
cases.append(("Legacy P1M to friend, 2 LC + spouse",
    case(20_000_000, decedent("Alberto Mendoza", married=True), [
        person("lc1", "Cesar Mendoza", "LegitimateChild"),
        person("lc2", "Dolores Mendoza", "LegitimateChild"),
        person("sp", "Beatriz Mendoza", "SurvivingSpouse"),
    ], will(legacies=[
        legacy("l1", stranger_ref("Friend Miguel"), 1_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF ALBERTO MENDOZA

        I, ALBERTO MENDOZA, of legal age, Filipino, married to
        BEATRIZ MENDOZA, and a resident of Pasig City, Metro Manila,
        being of sound and disposing mind, do hereby declare this to be
        my Last Will and Testament.

        ARTICLE I — LEGACY

        I give and bequeath to my dear friend MIGUEL RAMOS, of legal
        age, Filipino, and a resident of Mandaluyong City, the sum of
        ONE MILLION PESOS (P1,000,000.00), in recognition of his
        unwavering friendship and support throughout my life.

        ARTICLE II — RESIDUARY ESTATE

        All the rest, residue, and remainder of my estate, I leave to
        be distributed among my compulsory heirs in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Pasig City, Philippines.

                                        [Signed]
                                        ALBERTO MENDOZA
                                        Testator""")))

# 6. Inofficious legacy: exceeds FP
cases.append(("Inofficious legacy P8M on P10M estate (1 LC + spouse)",
    case(10_000_000, decedent("Vivian Aquino", married=True), [
        person("lc1", "Wes Aquino", "LegitimateChild"),
        person("sp", "Xena Aquino", "SurvivingSpouse"),
    ], will(legacies=[
        legacy("l1", stranger_ref("Alma Mater"), 8_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF VIVIAN AQUINO

        I, VIVIAN AQUINO, of legal age, Filipino, married to XENA AQUINO,
        and a resident of Manila, being of sound and disposing mind, do
        hereby declare this to be my Last Will and Testament.

        ARTICLE I — LEGACY TO EDUCATIONAL INSTITUTION

        I give and bequeath to my beloved ALMA MATER, the University of
        the Philippines, the sum of EIGHT MILLION PESOS (P8,000,000.00),
        to be used as scholarship fund for deserving students from
        low-income families.

        ARTICLE II — RESIDUARY ESTATE

        All the rest, residue, and remainder of my estate shall pass to
        my compulsory heirs in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Manila, Philippines.

                                        [Signed]
                                        VIVIAN AQUINO
                                        Testator""")))

# 7. Multiple legacies to strangers
cases.append(("Three legacies totaling P3M on P12M estate",
    case(12_000_000, decedent("Santiago Garcia"), [
        person("lc1", "Teresa Garcia", "LegitimateChild"),
        person("lc2", "Ulises Garcia", "LegitimateChild"),
    ], will(legacies=[
        legacy("l1", stranger_ref("Church"), 1_000_000),
        legacy("l2", stranger_ref("School"), 1_000_000),
        legacy("l3", stranger_ref("Hospital"), 1_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF SANTIAGO GARCIA

        I, SANTIAGO GARCIA, of legal age, Filipino, single, and a
        resident of Iloilo City, being of sound and disposing mind, do
        hereby declare this to be my Last Will and Testament.

        ARTICLE I — LEGACIES

        I give and bequeath the following sums from the disposable free
        portion of my estate:

            1. To the SAN AGUSTIN CHURCH OF ILOILO, the sum of
               ONE MILLION PESOS (P1,000,000.00), for the restoration
               of its historic facade;

            2. To the ILOILO CENTRAL SCHOOL, the sum of ONE MILLION
               PESOS (P1,000,000.00), for the construction of a new
               science laboratory;

            3. To the WESTERN VISAYAS MEDICAL CENTER, the sum of
               ONE MILLION PESOS (P1,000,000.00), for the purchase
               of diagnostic equipment.

        ARTICLE II — RESIDUARY ESTATE

        All the rest, residue, and remainder of my estate I leave to
        my compulsory heirs in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Iloilo City, Philippines.

                                        [Signed]
                                        SANTIAGO GARCIA
                                        Testator""")))

# 8. Institution + legacy combined
cases.append(("Institution to charity + legacy to friend",
    case(16_000_000, decedent("Gloria Lim", married=True), [
        person("lc1", "Hugo Lim", "LegitimateChild"),
        person("sp", "Irma Lim", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", stranger_ref("WWF Philippines"), "Residuary", residuary=True),
    ], legacies=[
        legacy("l1", stranger_ref("Old Friend"), 1_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF GLORIA LIM

        I, GLORIA LIM, of legal age, Filipino, married to IRMA LIM,
        and a resident of Taguig City, Metro Manila, being of sound
        and disposing mind, do hereby declare this to be my Last Will
        and Testament.

        ARTICLE I — LEGACY

        I give and bequeath to my lifelong friend and confidante,
        referred to herein as OLD FRIEND, the sum of ONE MILLION PESOS
        (P1,000,000.00), with my deepest gratitude for decades of
        loyal friendship.

        ARTICLE II — DISPOSITION OF RESIDUARY FREE PORTION

        After satisfaction of the above legacy and the legitimes of my
        compulsory heirs, I give, devise, and bequeath the entire
        residue and remainder of the disposable free portion of my
        estate to WWF PHILIPPINES, INC., to be used for the
        conservation of Philippine marine biodiversity.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Taguig City, Philippines.

                                        [Signed]
                                        GLORIA LIM
                                        Testatrix""")))

# 9. Cap rule: 1 LC + 3 IC + spouse
cases.append(("Cap rule: 1 LC + 3 IC + spouse, all instituted",
    case(24_000_000, decedent("Alma Bautista", married=True), [
        person("lc1", "Bianca Bautista", "LegitimateChild"),
        person("ic1", "Carlo Bautista", "IllegitimateChild", filiation_proof="BirthCertificate"),
        person("ic2", "Dante Bautista", "IllegitimateChild", filiation_proof="FinalJudgment"),
        person("ic3", "Elisa Bautista", "IllegitimateChild", filiation_proof="BirthCertificate"),
        person("sp", "Fiona Bautista", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Bianca Bautista"), "EqualWithOthers"),
        institution("i2", heir_ref("ic1", "Carlo Bautista"), "EqualWithOthers"),
        institution("i3", heir_ref("ic2", "Dante Bautista"), "EqualWithOthers"),
        institution("i4", heir_ref("ic3", "Elisa Bautista"), "EqualWithOthers"),
        institution("i5", heir_ref("sp", "Fiona Bautista"), "EqualWithOthers"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF ALMA BAUTISTA

        I, ALMA BAUTISTA, of legal age, Filipino, married to
        FIONA BAUTISTA, and a resident of San Juan City, Metro Manila,
        being of sound and disposing mind, do hereby declare this to be
        my Last Will and Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        It is my wish that my entire estate be divided equally among the
        following persons, in equal shares:

            1. BIANCA BAUTISTA, my legitimate daughter;
            2. CARLO BAUTISTA, my acknowledged child;
            3. DANTE BAUTISTA, my acknowledged child;
            4. ELISA BAUTISTA, my acknowledged child;
            5. FIONA BAUTISTA, my beloved spouse.

        I direct that each of the above-named shall receive an equal
        portion, subject to the limitations imposed by law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in San Juan City, Philippines.

                                        [Signed]
                                        ALMA BAUTISTA
                                        Testatrix""")))

# 10. Mixed succession: will covers part of FP
cases.append(("Mixed: charity gets 1/10, rest intestate",
    case(10_000_000, decedent("Andres Lim", married=True), [
        person("lc1", "Belen Lim", "LegitimateChild"),
        person("lc2", "Cesar Lim", "LegitimateChild"),
        person("sp", "Diana Lim", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Belen Lim"), "EqualWithOthers"),
        institution("i2", heir_ref("lc2", "Cesar Lim"), "EqualWithOthers"),
        institution("i3", stranger_ref("Charity X"), {"Fraction": "1/10"}),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF ANDRES LIM

        I, ANDRES LIM, of legal age, Filipino, married to DIANA LIM,
        and a resident of Muntinlupa City, Metro Manila, being of sound
        and disposing mind, do hereby declare this to be my Last Will
        and Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        I hereby institute as my heirs, in equal shares, my children:

            1. BELEN LIM
            2. CESAR LIM

        ARTICLE II — CHARITABLE BEQUEST

        I give and bequeath to CHARITY X, INC., a duly registered
        non-profit, one-tenth (1/10) of my entire estate, to be
        charged against the disposable free portion.

        ARTICLE III — RESIDUARY ESTATE

        I make no further disposition of the remainder of my estate,
        which shall pass according to the rules of intestate succession.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Muntinlupa City, Philippines.

                                        [Signed]
                                        ANDRES LIM
                                        Testator""")))

# 11. Articulo mortis marriage + will
cases.append(("Articulo mortis: spouse + stranger",
    case(9_000_000,
        decedent("Ignacio Bello", married=True, articulo_mortis=True, ill=True, illness_death=True, cohab=1),
    [
        person("sp", "Julia Bello", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("sp", "Julia Bello"), "EqualWithOthers"),
        institution("i2", stranger_ref("Nephew"), "Residuary", residuary=True),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF IGNACIO BELLO

        I, IGNACIO BELLO, of legal age, Filipino, married to
        JULIA BELLO, and a resident of Baguio City, being of sound
        and disposing mind, though presently suffering from illness,
        do hereby declare this to be my Last Will and Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        I hereby institute as my heir my beloved wife, JULIA BELLO,
        to receive her rightful share of my estate.

        ARTICLE II — RESIDUARY ESTATE

        Whatever remains of the disposable portion of my estate after
        satisfaction of all legitimes and prior dispositions, I give and
        bequeath to my nephew, herein referred to as NEPHEW, who has
        been like a son to me and has cared for me during my illness.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Baguio City, Philippines.

                                        [Signed]
                                        IGNACIO BELLO
                                        Testator

        [NOTE: Marriage to Julia Bello was solemnized on April 1, 2026,
         while testator was suffering from illness. Testator died on
         January 15, 2026. They had cohabited for approximately one
         year prior to the marriage.]""")))

# 12. Collation + will: donation to one LC
cases.append(("Collation: LC1 got P2M donation, legacy to museum",
    case(18_000_000, decedent("Oscar Navarro", married=True), [
        person("lc1", "Pilar Navarro", "LegitimateChild"),
        person("lc2", "Ramon Navarro", "LegitimateChild"),
        person("ic1", "Sofia Navarro", "IllegitimateChild", filiation_proof="FinalJudgment"),
        person("sp", "Tina Navarro", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Pilar Navarro"), "EqualWithOthers"),
        institution("i2", heir_ref("lc2", "Ramon Navarro"), "EqualWithOthers"),
    ], legacies=[
        legacy("l1", stranger_ref("Museum"), 3_000_000),
    ]), donations=[
        donation("d1", "lc1", 2_000_000),
    ]),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF OSCAR NAVARRO

        I, OSCAR NAVARRO, of legal age, Filipino, married to
        TINA NAVARRO, and a resident of Quezon City, being of sound and
        disposing mind, do hereby declare this to be my Last Will and
        Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        I hereby institute as my heirs, in equal shares, my legitimate
        children:

            1. PILAR NAVARRO
            2. RAMON NAVARRO

        ARTICLE II — LEGACY

        I give and bequeath to the NATIONAL MUSEUM OF THE PHILIPPINES
        the sum of THREE MILLION PESOS (P3,000,000.00), to support the
        acquisition of works by contemporary Filipino artists.

        ARTICLE III — ACKNOWLEDGMENT OF PRIOR DONATIONS

        I acknowledge that during my lifetime, I donated to my daughter
        PILAR NAVARRO properties valued at TWO MILLION PESOS
        (P2,000,000.00) as an advance on her inheritance. Said donation
        shall be subject to collation in the settlement of my estate.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Quezon City, Philippines.

                                        [Signed]
                                        OSCAR NAVARRO
                                        Testator""")))

# 13. Will leaving everything to spouse (no children)
cases.append(("Spouse as sole instituted heir, parents alive",
    case(6_000_000, decedent("Elena Torres", married=True), [
        person("sp", "Felipe Torres", "SurvivingSpouse"),
        parent("f", "Father", "Paternal"),
        parent("m", "Mother", "Maternal"),
    ], will(institutions=[
        institution("i1", heir_ref("sp", "Felipe Torres"), "EntireEstate"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF ELENA TORRES

        I, ELENA TORRES, of legal age, Filipino, married to
        FELIPE TORRES, and a resident of Paranaque City, being of sound
        and disposing mind, do hereby declare this to be my Last Will
        and Testament.

        ARTICLE I — INSTITUTION OF SOLE HEIR

        I hereby institute my beloved husband, FELIPE TORRES, as my
        sole and universal heir, to receive the entirety of my estate,
        both real and personal, wherever situated.

        It is my expressed wish that my husband receive everything that
        the law permits me to freely dispose of.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Paranaque City, Philippines.

                                        [Signed]
                                        ELENA TORRES
                                        Testatrix

        [NOTE: The testatrix's parents are both living at the time of
         execution. They are compulsory heirs under Philippine law.]""")))

# 14. Will to two strangers only (preterition)
cases.append(("Will to strangers only, 1 LC exists (preterition)",
    case(5_000_000, decedent("Manuel Cruz"), [
        person("lc1", "Nina Cruz", "LegitimateChild"),
    ], will(institutions=[
        institution("i1", stranger_ref("Best Friend"), {"Fraction": "1/2"}),
        institution("i2", stranger_ref("Godchild"), {"Fraction": "1/2"}),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF MANUEL CRUZ

        I, MANUEL CRUZ, of legal age, Filipino, single, and a resident
        of Las Pinas City, being of sound and disposing mind, do hereby
        declare this to be my Last Will and Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        I hereby institute the following as my heirs, to divide my
        entire estate between them equally:

            1. My BEST FRIEND, to receive one-half (1/2) of my estate,
               in gratitude for a lifetime of brotherhood;

            2. My GODCHILD, to receive one-half (1/2) of my estate,
               in the hope that it may help secure a better future.

        I make no other disposition of my estate.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Las Pinas City, Philippines.

                                        [Signed]
                                        MANUEL CRUZ
                                        Testator

        [NOTE: The testator's legitimate daughter NINA CRUZ is
         completely omitted from this will.]""")))

# 15. Disinheritance with FP to favorite child
cases.append(("Disinherit 1 of 3 children, FP to sibling",
    case(30_000_000, decedent("Roberto Ramos", married=True), [
        person("lc1", "Sandra Ramos", "LegitimateChild"),
        person("lc2", "Tomas Ramos", "LegitimateChild"),
        person("lc3", "Ursela Ramos", "LegitimateChild", children=["gc1"]),
        person("gc1", "Wendy Ramos", "LegitimateChild", degree=2),
        person("sp", "Victor Ramos", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Sandra Ramos"), "EntireFreePort"),
    ], disinheritances=[
        disinheritance(heir_ref("lc3", "Ursela Ramos"), "ChildGroundlessAccusation"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF ROBERTO RAMOS

        I, ROBERTO RAMOS, of legal age, Filipino, married to
        VICTOR RAMOS, and a resident of Mandaluyong City, being of
        sound and disposing mind, do hereby declare this to be my
        Last Will and Testament.

        ARTICLE I — DISINHERITANCE

        For just cause, I hereby DISINHERIT my daughter URSELA RAMOS,
        pursuant to Article 919(2) of the Civil Code, on the ground
        that she has made groundless accusations of a crime against
        the testator, specifically filing a baseless criminal complaint
        for estafa in 2023, which was subsequently dismissed by the
        Office of the City Prosecutor.

        ARTICLE II — DISPOSITION OF FREE PORTION

        I hereby give, devise, and bequeath the entirety of the
        disposable free portion of my estate to my daughter
        SANDRA RAMOS, in recognition of her devotion, loyalty, and
        care for our family.

        ARTICLE III — COMPULSORY HEIRS

        The legitimes of my remaining compulsory heirs shall be
        respected and distributed in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Mandaluyong City, Philippines.

                                        [Signed]
                                        ROBERTO RAMOS
                                        Testator""")))

# 16. Legacy larger than estate
cases.append(("Massive legacy P50M on P20M estate",
    case(20_000_000, decedent("Jaime Flores"), [
        person("lc1", "Karen Flores", "LegitimateChild"),
        person("lc2", "Luis Flores", "LegitimateChild"),
    ], will(legacies=[
        legacy("l1", stranger_ref("Mega Foundation"), 50_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF JAIME FLORES

        I, JAIME FLORES, of legal age, Filipino, single, and a
        resident of Tagaytay City, Cavite, being of sound and
        disposing mind, do hereby declare this to be my Last Will
        and Testament.

        ARTICLE I — LEGACY

        I give and bequeath to the MEGA FOUNDATION FOR FILIPINO
        EDUCATION, INC. the sum of FIFTY MILLION PESOS
        (P50,000,000.00), to be used exclusively for the establishment
        of technical-vocational training centers in rural areas.

        ARTICLE II — RESIDUARY ESTATE

        All the rest of my estate shall pass to my compulsory heirs
        in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Tagaytay City, Philippines.

                                        [Signed]
                                        JAIME FLORES
                                        Testator

        [NOTE: The testator's net estate at death is only P20,000,000,
         making the P50,000,000 legacy inofficious.]""")))

# 17. Preferred legacy + regular legacy
cases.append(("Preferred legacy P2M + regular legacy P3M on P10M (1 LC)",
    case(10_000_000, decedent("Wanda Tan"), [
        person("lc1", "Xavier Tan", "LegitimateChild"),
    ], will(legacies=[
        legacy("l1", stranger_ref("Favorite Charity"), 2_000_000, preferred=True),
        legacy("l2", stranger_ref("Local Church"), 3_000_000),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF WANDA TAN

        I, WANDA TAN, of legal age, Filipino, single, and a resident
        of Caloocan City, Metro Manila, being of sound and disposing
        mind, do hereby declare this to be my Last Will and Testament.

        ARTICLE I — PREFERRED LEGACY

        I give and bequeath, with preference over all other legacies
        herein, to my FAVORITE CHARITY, INC., the sum of TWO MILLION
        PESOS (P2,000,000.00). This legacy shall be satisfied first
        before any other testamentary dispositions from the free
        portion, should the free portion be insufficient to cover all.

        ARTICLE II — LEGACY TO CHURCH

        I give and bequeath to the LOCAL CHURCH OF CALOOCAN the sum
        of THREE MILLION PESOS (P3,000,000.00), for the renovation of
        its parish hall.

        ARTICLE III — RESIDUARY ESTATE

        All the rest of my estate shall pass to my compulsory heirs
        according to law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Caloocan City, Philippines.

                                        [Signed]
                                        WANDA TAN
                                        Testatrix""")))

# 18. Testate with parents as compulsory heirs
cases.append(("Will with parents + stranger, no children",
    case(8_000_000, decedent("Leo Reyes"), [
        parent("f", "Father", "Paternal"),
        parent("m", "Mother", "Maternal"),
    ], will(institutions=[
        institution("i1", stranger_ref("Business Partner"), "EntireFreePort"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF LEO REYES

        I, LEO REYES, of legal age, Filipino, single, and a resident
        of Antipolo City, Rizal, being of sound and disposing mind, do
        hereby declare this to be my Last Will and Testament.

        ARTICLE I — DISPOSITION OF FREE PORTION

        I hereby give, devise, and bequeath the entirety of the
        disposable free portion of my estate to my BUSINESS PARTNER,
        with whom I have built a successful enterprise over two decades,
        and whose collaboration has been the foundation of my
        professional life.

        ARTICLE II — COMPULSORY HEIRS

        The legitimes of my parents, who are my compulsory heirs under
        the law, shall be respected and satisfied in accordance with
        the Civil Code of the Philippines.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Antipolo City, Philippines.

                                        [Signed]
                                        LEO REYES
                                        Testator""")))

# 19. LC and IC instituted equal
cases.append(("LC and IC instituted equal, will enforces ratio",
    case(10_000_000, decedent("Patricia Gomez", married=True), [
        person("lc1", "Quentin Gomez", "LegitimateChild"),
        person("ic1", "Rita Gomez", "IllegitimateChild", filiation_proof="BirthCertificate"),
        person("sp", "Sam Gomez", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Quentin Gomez"), "EqualWithOthers"),
        institution("i2", heir_ref("ic1", "Rita Gomez"), "EqualWithOthers"),
        institution("i3", heir_ref("sp", "Sam Gomez"), "EqualWithOthers"),
    ])),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF PATRICIA GOMEZ

        I, PATRICIA GOMEZ, of legal age, Filipino, married to
        SAM GOMEZ, and a resident of Marikina City, Metro Manila,
        being of sound and disposing mind, do hereby declare this
        to be my Last Will and Testament.

        ARTICLE I — INSTITUTION OF HEIRS

        It is my wish and desire that my estate be divided equally
        among the following, in equal shares:

            1. QUENTIN GOMEZ, my legitimate son;
            2. RITA GOMEZ, my acknowledged daughter;
            3. SAM GOMEZ, my beloved husband.

        I direct that each shall receive an equal share, to the
        extent permitted by law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Marikina City, Philippines.

                                        [Signed]
                                        PATRICIA GOMEZ
                                        Testatrix

        [NOTE: The testator wishes equal shares, but the law imposes
         the rule that an illegitimate child's share cannot exceed
         one-half of a legitimate child's share (Art. 895).]""")))

# 20. Complex: disinheritance + collation + legacy + representation
cases.append(("Complex: disinheritance + collation + legacy + representation",
    case(25_000_000, decedent("Fernando Cruz", married=True), [
        person("lc1", "Grace Cruz", "LegitimateChild"),
        person("lc2", "Henry Cruz", "LegitimateChild"),
        person("lc3", "Ivy Cruz", "LegitimateChild", children=["gc1"]),
        person("gc1", "Jack Cruz", "LegitimateChild", degree=2),
        person("sp", "Kelly Cruz", "SurvivingSpouse"),
    ], will(institutions=[
        institution("i1", heir_ref("lc1", "Grace Cruz"), "EqualWithOthers"),
        institution("i2", heir_ref("lc2", "Henry Cruz"), "EqualWithOthers"),
    ], legacies=[
        legacy("l1", stranger_ref("Orphanage"), 2_000_000),
    ], disinheritances=[
        disinheritance(heir_ref("lc3", "Ivy Cruz"), "ChildRefusalToSupport"),
    ]), donations=[
        donation("d1", "lc1", 1_000_000),
    ]),
    textwrap.dedent("""\
        LAST WILL AND TESTAMENT
        OF FERNANDO CRUZ

        I, FERNANDO CRUZ, of legal age, Filipino, married to
        KELLY CRUZ, and a resident of Batangas City, Batangas, being
        of sound and disposing mind, do hereby declare this to be my
        Last Will and Testament.

        ARTICLE I — DISINHERITANCE

        For just cause, I hereby DISINHERIT my daughter IVY CRUZ,
        pursuant to Article 919(5) of the Civil Code, on the ground
        that she has refused without justifiable cause to support me
        during my period of need. Despite my repeated requests for
        assistance during my prolonged hospitalization from 2022 to
        2024, Ivy refused to provide any form of support, financial
        or otherwise.

        ARTICLE II — INSTITUTION OF HEIRS

        I hereby institute as my heirs, in equal shares, my children:

            1. GRACE CRUZ
            2. HENRY CRUZ

        ARTICLE III — LEGACY

        I give and bequeath to the BAHAY KALINGA ORPHANAGE the sum of
        TWO MILLION PESOS (P2,000,000.00), for the care and education
        of orphaned children.

        ARTICLE IV — ACKNOWLEDGMENT OF PRIOR DONATIONS

        I acknowledge that during my lifetime, I donated to my daughter
        GRACE CRUZ properties and funds valued at ONE MILLION PESOS
        (P1,000,000.00) as an advance on her inheritance. Said donation
        shall be collated in the partition of my estate.

        ARTICLE V — RESIDUARY ESTATE

        All the rest, residue, and remainder of my estate shall pass to
        my compulsory heirs in accordance with law.

        IN WITNESS WHEREOF, I have hereunto set my hand this 1st day of
        June 2025, in Batangas City, Philippines.

                                        [Signed]
                                        FERNANDO CRUZ
                                        Testator""")))


# ── Write cases and run ──────────────────────────────────────────────

def fmt_pesos_str(centavos):
    return f"P{centavos/100:,.2f}"

lines = []
lines.append("# Inheritance Engine — Testate Test Results")
lines.append("")
lines.append("20 test cases with various will configurations run through the Philippine Inheritance Distribution Engine.")
lines.append("All amounts in Philippine Pesos. Engine uses exact rational arithmetic internally.")
lines.append("")
lines.append("---")
lines.append("")

passed = 0
failed = 0

for i, (desc, case_data, will_prose) in enumerate(cases, 1):
    num = f"{i:02d}"
    case_file = os.path.join(CASES_DIR, f"{num}.json")
    with open(case_file, "w") as f:
        json.dump(case_data, f, indent=2)

    result = subprocess.run([ENGINE, case_file], capture_output=True, text=True)

    lines.append(f"## Case {i}: {desc}")
    lines.append("")

    if result.returncode != 0:
        lines.append(f"> **ERROR** (exit {result.returncode}): `{result.stderr.strip()}`")
        lines.append("")
        failed += 1
        continue

    out = json.loads(result.stdout)
    estate = case_data["net_distributable_estate"]["centavos"]

    # Validate
    total_from_estate = sum(int(s["net_from_estate"]["centavos"]) for s in out["per_heir_shares"])
    sum_ok = total_from_estate == estate
    issues = []
    if not sum_ok:
        issues.append(f"SUM: {total_from_estate} != {estate}")
    for s in out["per_heir_shares"]:
        if int(s["net_from_estate"]["centavos"]) < 0:
            issues.append(f"NEGATIVE: {s['heir_name']}")

    status = "PASS" if not issues else "FAIL"
    if issues:
        failed += 1
    else:
        passed += 1

    # Summary table
    w = case_data["will"]
    will_parts = []
    if w["institutions"]:
        will_parts.append(f"{len(w['institutions'])} institution(s)")
    if w["legacies"]:
        will_parts.append(f"{len(w['legacies'])} legacy/legacies")
    if w["disinheritances"]:
        will_parts.append(f"{len(w['disinheritances'])} disinheritance(s)")
    will_summary = ", ".join(will_parts) if will_parts else "empty will"

    lines.append(f"| Field | Value |")
    lines.append(f"|-------|-------|")
    lines.append(f"| **Estate** | {fmt_pesos_str(estate)} |")
    lines.append(f"| **Scenario** | {out['scenario_code']} |")
    lines.append(f"| **Succession Type** | {out['succession_type']} |")
    lines.append(f"| **Will** | {will_summary} |")
    lines.append(f"| **Validation** | {status} |")
    if issues:
        lines.append(f"| **Issues** | {'; '.join(issues)} |")
    lines.append("")

    # ── Will text (as it would appear on the PDF) ──
    lines.append("### Last Will and Testament")
    lines.append("")
    lines.append("```")
    lines.append(will_prose)
    lines.append("```")
    lines.append("")

    # ── Will configuration (structured) ──
    lines.append("### Will Configuration (engine input)")
    lines.append("")
    if w["institutions"]:
        lines.append("**Institutions:**")
        for inst in w["institutions"]:
            share = inst["share"]
            if isinstance(share, dict) and "Fraction" in share:
                share_str = share["Fraction"]
            elif isinstance(share, str):
                share_str = share
            else:
                share_str = str(share)
            name = inst["heir"]["name"]
            pid = inst["heir"].get("person_id")
            heir_type = "family" if pid else "stranger"
            res = " (residuary)" if inst.get("is_residuary") else ""
            lines.append(f"- {name} ({heir_type}): {share_str}{res}")
        lines.append("")
    if w["legacies"]:
        lines.append("**Legacies:**")
        for leg in w["legacies"]:
            name = leg["legatee"]["name"]
            if "FixedAmount" in leg["property"]:
                amt = leg["property"]["FixedAmount"]["centavos"]
                pref = " (preferred)" if leg.get("is_preferred") else ""
                lines.append(f"- {name}: {fmt_pesos_str(amt)}{pref}")
        lines.append("")
    if w["disinheritances"]:
        lines.append("**Disinheritances:**")
        for dis in w["disinheritances"]:
            name = dis["heir_reference"]["name"]
            cause = dis["cause_code"]
            lines.append(f"- {name}: {cause}")
        lines.append("")
    if case_data.get("donations"):
        lines.append("**Donations (collation):**")
        for don in case_data["donations"]:
            amt = don["value_at_time_of_donation"]["centavos"]
            lines.append(f"- {don['recipient_heir_id']}: {fmt_pesos_str(amt)}")
        lines.append("")

    # ── Distribution table ──
    lines.append("### Distribution")
    lines.append("")
    lines.append("| Heir | Category | Net From Estate | Donations | Total | Mode |")
    lines.append("|------|----------|-----------------|-----------|-------|------|")
    for s in out["per_heir_shares"]:
        cat = s["heir_category"].replace("Group", "")
        nfe = fmt_pesos_str(int(s["net_from_estate"]["centavos"]))
        don = int(s["donations_imputed"]["centavos"])
        don_str = fmt_pesos_str(don) if don > 0 else "-"
        total = fmt_pesos_str(int(s["total"]["centavos"]))
        mode = s["inherits_by"]
        if mode == "Representation":
            mode = f"Repr ({s.get('represents', '?')})"
        lines.append(f"| {s['heir_name']} | {cat} | {nfe} | {don_str} | {total} | {mode} |")
    lines.append("")

    # ── Narratives ──
    lines.append("### Narratives")
    lines.append("")
    for n in out["narratives"]:
        lines.append(f"> {n['text']}")
        lines.append("")

    lines.append("---")
    lines.append("")

# Summary
lines.insert(6, f"**Results: {passed} passed, {failed} failed out of {len(cases)} cases**")
lines.insert(7, "")

with open(OUTPUT_FILE, "w") as f:
    f.write("\n".join(lines))

print(f"Results: {passed} passed, {failed} failed out of {len(cases)} cases")
print(f"Written to {OUTPUT_FILE}")
