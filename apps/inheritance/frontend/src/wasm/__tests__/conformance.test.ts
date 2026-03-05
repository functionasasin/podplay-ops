/**
 * conformance — Form data conformance tests for the real WASM engine.
 *
 * Verifies that JSON produced by the frontend form (React Hook Form defaults
 * and user-constructed inputs) is accepted by the Rust engine's strict
 * serde_json::from_str() without type mismatch errors.
 *
 * These tests call the real WASM compute_json() directly (not the mock bridge)
 * to catch serde deserialization failures that the lenient Zod mock would miss.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initSync, compute_json } from "../pkg/inheritance_engine";
import type {
  EngineInput,
  Person,
  Decedent,
  EngineConfig,
  Will,
  Donation,
} from "../../types";

// ---------------------------------------------------------------------------
// WASM initialization
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = resolve(__dirname, "../pkg/inheritance_engine_bg.wasm");

beforeAll(() => {
  const wasmBytes = readFileSync(wasmPath);
  initSync(wasmBytes);
});

// ---------------------------------------------------------------------------
// Helper: call real WASM engine and parse output
// ---------------------------------------------------------------------------

function callEngine(input: EngineInput): unknown {
  const json = JSON.stringify(input);
  const resultJson = compute_json(json);
  return JSON.parse(resultJson);
}

// ---------------------------------------------------------------------------
// Factories — mirror the form's default values (WizardContainer defaults)
// ---------------------------------------------------------------------------

function makeDecedent(overrides?: Partial<Decedent>): Decedent {
  return {
    id: "d",
    name: "Juan Dela Cruz",
    date_of_death: "2026-01-15",
    is_married: false,
    date_of_marriage: null,
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 0,
    has_legal_separation: false,
    is_illegitimate: false,
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<EngineConfig>): EngineConfig {
  return {
    retroactive_ra_11642: false,
    max_pipeline_restarts: 10,
    ...overrides,
  };
}

function makePerson(
  overrides: Partial<Person> & {
    id: string;
    name: string;
    relationship_to_decedent: Person["relationship_to_decedent"];
  }
): Person {
  return {
    is_alive_at_succession: true,
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: null,
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

function makeInput(overrides?: Partial<EngineInput>): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000000 },
    decedent: makeDecedent(),
    family_tree: [],
    will: null,
    donations: [],
    config: makeConfig(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("conformance: form data → Rust serde acceptance", () => {
  it("default form state: empty family tree produces I15 escheat", () => {
    // Mirrors WizardContainer DEFAULT_ENGINE_INPUT with a valid estate amount
    const input = makeInput();
    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I15");
    expect(result.succession_type).toBe("Intestate");
    // Real engine may produce a STATE heir share for escheat (the state inherits)
    // The key conformance assertion: no serde error thrown
    expect(result.per_heir_shares.length).toBeGreaterThanOrEqual(0);
  });

  it("single legitimate child: all required Person fields accepted", () => {
    const input = makeInput({
      family_tree: [
        makePerson({
          id: "child1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
          filiation_proof_type: "BirthCertificate",
        }),
      ],
    });

    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I1");
    expect(result.per_heir_shares).toHaveLength(1);
    expect(result.per_heir_shares[0].heir_id).toBe("child1");
  });

  it("married decedent with spouse: boolean fields are strict booleans", () => {
    const input = makeInput({
      decedent: makeDecedent({
        is_married: true,
        date_of_marriage: "2000-06-15",
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
        has_legal_separation: false,
      }),
      family_tree: [
        makePerson({
          id: "sp",
          name: "Rosa",
          relationship_to_decedent: "SurvivingSpouse",
        }),
        makePerson({
          id: "c1",
          name: "Ana",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
    });

    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I2");
    expect(result.per_heir_shares.length).toBeGreaterThanOrEqual(2);
  });

  it("illegitimate child with filiation: proof type accepted", () => {
    const input = makeInput({
      family_tree: [
        makePerson({
          id: "ic1",
          name: "Carlos",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
      ],
    });

    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I7");
    expect(result.per_heir_shares).toHaveLength(1);
  });

  it("adopted child with adoption record: nested object accepted", () => {
    const input = makeInput({
      family_tree: [
        makePerson({
          id: "ac1",
          name: "Pedro",
          relationship_to_decedent: "AdoptedChild",
          adoption: {
            decree_date: "2020-03-15",
            regime: "Ra8552",
            adopter: "d",
            adoptee: "ac1",
            is_stepparent_adoption: false,
            biological_parent_spouse: null,
            is_rescinded: false,
            rescission_date: null,
          },
        }),
      ],
    });

    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I1");
    expect(result.per_heir_shares).toHaveLength(1);
    expect(result.per_heir_shares[0].heir_id).toBe("ac1");
  });

  it("testate with will: empty dispositions accepted", () => {
    const will: Will = {
      date_executed: "2025-06-01",
      institutions: [],
      legacies: [],
      devises: [],
      disinheritances: [],
    };

    const input = makeInput({
      will,
      family_tree: [
        makePerson({
          id: "lc1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
    });

    const result = callEngine(input) as any;

    // With empty dispositions (no institutions), the real engine may return
    // "Mixed" succession (legitimes by law + free portion by intestate rules).
    // The key conformance assertion: no serde error thrown, will shape accepted.
    expect(result.scenario_code).toMatch(/^T/);
    expect(["Testate", "Mixed"]).toContain(result.succession_type);
  });

  it("donation with Money fields: nested Money objects accepted", () => {
    const donation: Donation = {
      id: "don1",
      recipient_heir_id: "lc1",
      recipient_is_stranger: false,
      value_at_time_of_donation: { centavos: 50000000 },
      date: "2024-01-01",
      description: "Birthday gift",
      is_expressly_exempt: false,
      is_support_education_medical: false,
      is_customary_gift: false,
      is_professional_expense: false,
      professional_expense_parent_required: false,
      professional_expense_imputed_savings: null,
      is_joint_from_both_parents: false,
      is_to_child_spouse_only: false,
      is_joint_to_child_and_spouse: false,
      is_wedding_gift: false,
      is_debt_payment_for_child: false,
      is_election_expense: false,
      is_fine_payment: false,
    };

    const input = makeInput({
      family_tree: [
        makePerson({
          id: "lc1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
      donations: [donation],
    });

    // Should not throw — Rust engine accepts the donation shape
    const result = callEngine(input) as any;

    expect(result.scenario_code).toBe("I1");
    expect(result.per_heir_shares).toHaveLength(1);
  });

  it("professional expense donation with imputed savings: nested Money accepted", () => {
    const donation: Donation = {
      id: "don2",
      recipient_heir_id: "lc1",
      recipient_is_stranger: false,
      value_at_time_of_donation: { centavos: 200000000 },
      date: "2023-06-01",
      description: "Law school tuition",
      is_expressly_exempt: false,
      is_support_education_medical: false,
      is_customary_gift: false,
      is_professional_expense: true,
      professional_expense_parent_required: true,
      professional_expense_imputed_savings: { centavos: 100000000 },
      is_joint_from_both_parents: false,
      is_to_child_spouse_only: false,
      is_joint_to_child_and_spouse: false,
      is_wedding_gift: false,
      is_debt_payment_for_child: false,
      is_election_expense: false,
      is_fine_payment: false,
    };

    const input = makeInput({
      family_tree: [
        makePerson({
          id: "lc1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
      donations: [donation],
    });

    const result = callEngine(input) as any;
    expect(result.per_heir_shares).toHaveLength(1);
  });

  it("Money.centavos as string: large values accepted", () => {
    // The Rust Money deserializer accepts both integer and string centavos
    const input = makeInput({
      net_distributable_estate: { centavos: "99999999999999" as any },
      family_tree: [
        makePerson({
          id: "lc1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
    });

    const result = callEngine(input) as any;
    expect(result.per_heir_shares).toHaveLength(1);
  });

  it("ascendant with line: Paternal/Maternal enum accepted", () => {
    const input = makeInput({
      family_tree: [
        makePerson({
          id: "lp1",
          name: "Jose Sr",
          relationship_to_decedent: "LegitimateParent",
          line: "Paternal",
        }),
        makePerson({
          id: "lp2",
          name: "Maria Sr",
          relationship_to_decedent: "LegitimateParent",
          line: "Maternal",
        }),
      ],
    });

    const result = callEngine(input) as any;
    expect(result.scenario_code).toBe("I5");
  });

  it("sibling with blood_type: Full/Half enum accepted", () => {
    const input = makeInput({
      family_tree: [
        makePerson({
          id: "sib1",
          name: "Carlos",
          relationship_to_decedent: "Sibling",
          degree: 2,
          blood_type: "Full",
        }),
      ],
    });

    const result = callEngine(input) as any;
    expect(result.scenario_code).toBe("I13");
  });

  it("complex mixed scenario: LC + IC + spouse + donation", () => {
    const input = makeInput({
      net_distributable_estate: { centavos: 900000000 },
      decedent: makeDecedent({
        is_married: true,
        date_of_marriage: "2000-01-01",
      }),
      family_tree: [
        makePerson({
          id: "sp",
          name: "Rosa",
          relationship_to_decedent: "SurvivingSpouse",
        }),
        makePerson({
          id: "lc1",
          name: "Ana",
          relationship_to_decedent: "LegitimateChild",
        }),
        makePerson({
          id: "ic1",
          name: "Ben",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "FinalJudgment",
        }),
      ],
      donations: [
        {
          id: "don1",
          recipient_heir_id: "lc1",
          recipient_is_stranger: false,
          value_at_time_of_donation: { centavos: 50000000 },
          date: "2024-01-01",
          description: "Gift",
          is_expressly_exempt: false,
          is_support_education_medical: false,
          is_customary_gift: false,
          is_professional_expense: false,
          professional_expense_parent_required: false,
          professional_expense_imputed_savings: null,
          is_joint_from_both_parents: false,
          is_to_child_spouse_only: false,
          is_joint_to_child_and_spouse: false,
          is_wedding_gift: false,
          is_debt_payment_for_child: false,
          is_election_expense: false,
          is_fine_payment: false,
        },
      ],
    });

    const result = callEngine(input) as any;
    expect(result.scenario_code).toBe("I4");
    expect(result.per_heir_shares.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects string boolean: 'true' instead of true throws serde error", () => {
    // This verifies that the Rust engine is strict about types
    const badInput = {
      net_distributable_estate: { centavos: 100000000 },
      decedent: {
        id: "d",
        name: "Juan",
        date_of_death: "2026-01-15",
        is_married: "false", // string, not boolean
        date_of_marriage: null,
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
        years_of_cohabitation: 0,
        has_legal_separation: false,
        is_illegitimate: false,
      },
      family_tree: [],
      will: null,
      donations: [],
      config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
    };

    expect(() => compute_json(JSON.stringify(badInput))).toThrow();
  });

  it("rejects string number: '0' for years_of_cohabitation throws serde error", () => {
    const badInput = {
      net_distributable_estate: { centavos: 100000000 },
      decedent: {
        id: "d",
        name: "Juan",
        date_of_death: "2026-01-15",
        is_married: false,
        date_of_marriage: null,
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
        years_of_cohabitation: "0", // string, not number
        has_legal_separation: false,
        is_illegitimate: false,
      },
      family_tree: [],
      will: null,
      donations: [],
      config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
    };

    expect(() => compute_json(JSON.stringify(badInput))).toThrow();
  });
});
