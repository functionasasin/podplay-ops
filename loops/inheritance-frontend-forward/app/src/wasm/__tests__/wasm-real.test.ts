/**
 * Tests for the real WASM engine integration (Stage 13).
 *
 * These tests validate structural correctness of the engine output,
 * NOT mock-specific behavior. When the real WASM engine replaces the
 * mock stub, these tests must still pass.
 *
 * Source of truth:
 *   - loops/inheritance-rust-forward/ (Rust engine)
 *   - loops/inheritance-rust-forward/examples/simple-intestate.json
 */

import { describe, it, expect } from "vitest";
import { computeWasm } from "../bridge";
import type {
  EngineInput,
  EngineOutput,
  Person,
  Decedent,
  EngineConfig,
  ScenarioCode,
  SuccessionType,
} from "../../types";

// ============================================================================
// Valid scenario codes and succession types for validation
// ============================================================================

const VALID_SCENARIO_CODES: ScenarioCode[] = [
  "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
  "T9", "T10", "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
  "I9", "I10", "I11", "I12", "I13", "I14", "I15",
];

const VALID_SUCCESSION_TYPES: SuccessionType[] = [
  "Testate", "Intestate", "Mixed", "IntestateByPreterition",
];

// ============================================================================
// Test Fixture Factories
// ============================================================================

function makeDecedent(overrides?: Partial<Decedent>): Decedent {
  return {
    id: "decedent",
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

function makePerson(overrides?: Partial<Person>): Person {
  return {
    id: "child1",
    name: "Maria",
    is_alive_at_succession: true,
    relationship_to_decedent: "LegitimateChild",
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: "BirthCertificate",
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

/**
 * The simple-intestate example from the Rust engine.
 * Single LC (Maria), ₱1,000,000 estate, no will.
 */
function makeSimpleIntestateInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000000 },
    decedent: makeDecedent(),
    family_tree: [
      makePerson({ id: "child1", name: "Maria" }),
    ],
    will: null,
    donations: [],
    config: makeConfig(),
  };
}

function makeIntestateInput(
  familyTree: Person[],
  estateCentavos: number = 100000000
): EngineInput {
  return {
    net_distributable_estate: { centavos: estateCentavos },
    decedent: makeDecedent(),
    family_tree: familyTree,
    will: null,
    donations: [],
    config: makeConfig(),
  };
}

function makeTestateInput(
  familyTree: Person[],
  estateCentavos: number = 100000000
): EngineInput {
  return {
    net_distributable_estate: { centavos: estateCentavos },
    decedent: makeDecedent(),
    family_tree: familyTree,
    will: {
      date_executed: "2025-06-01",
      institutions: [],
      legacies: [],
      devises: [],
      disinheritances: [],
    },
    donations: [],
    config: makeConfig(),
  };
}

function toCentavosNumber(centavos: number | string): number {
  return typeof centavos === "number"
    ? centavos
    : parseInt(centavos, 10);
}

// ============================================================================
// Tests — Real WASM Engine
// ============================================================================

describe("wasm-real engine", () => {
  // --------------------------------------------------------------------------
  // Basic structural validation with simple intestate input
  // --------------------------------------------------------------------------
  describe("computeWasm() with simple intestate input returns valid EngineOutput", () => {
    it("returns an object with all required EngineOutput fields", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output).toHaveProperty("per_heir_shares");
      expect(output).toHaveProperty("narratives");
      expect(output).toHaveProperty("computation_log");
      expect(output).toHaveProperty("warnings");
      expect(output).toHaveProperty("succession_type");
      expect(output).toHaveProperty("scenario_code");
    });

    it("returns arrays for per_heir_shares, narratives, warnings", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(Array.isArray(output.per_heir_shares)).toBe(true);
      expect(Array.isArray(output.narratives)).toBe(true);
      expect(Array.isArray(output.warnings)).toBe(true);
    });

    it("returns computation_log as an object with steps array", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.computation_log).toBeDefined();
      expect(Array.isArray(output.computation_log.steps)).toBe(true);
      expect(typeof output.computation_log.total_restarts).toBe("number");
      expect(output.computation_log.final_scenario).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // per_heir_shares[] has one entry per heir in input
  // --------------------------------------------------------------------------
  describe("per_heir_shares[] has one entry per heir in input", () => {
    it("single heir produces 1 share entry", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.per_heir_shares).toHaveLength(1);
      expect(output.per_heir_shares[0].heir_id).toBe("child1");
    });

    it("multiple heirs produce matching share entries", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
        makePerson({ id: "lc2", name: "Jose Jr" }),
        makePerson({
          id: "sp",
          name: "Ana",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await computeWasm(input);

      expect(output.per_heir_shares.length).toBeGreaterThanOrEqual(
        input.family_tree.length
      );

      const shareIds = output.per_heir_shares.map((s) => s.heir_id);
      for (const person of input.family_tree) {
        expect(shareIds).toContain(person.id);
      }
    });
  });

  // --------------------------------------------------------------------------
  // narratives[] has one entry per heir
  // --------------------------------------------------------------------------
  describe("narratives[] has one entry per heir", () => {
    it("single heir produces 1 narrative entry", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.narratives).toHaveLength(1);
      expect(output.narratives[0].heir_id).toBe("child1");
    });

    it("narrative count matches share count", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
        makePerson({ id: "lc2", name: "Jose Jr" }),
      ]);
      const output = await computeWasm(input);

      expect(output.narratives.length).toBe(output.per_heir_shares.length);

      const shareIds = output.per_heir_shares.map((s) => s.heir_id).sort();
      const narrativeIds = output.narratives.map((n) => n.heir_id).sort();
      expect(narrativeIds).toEqual(shareIds);
    });

    it("each narrative has non-empty text", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      for (const n of output.narratives) {
        expect(n.text.length).toBeGreaterThan(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // scenario_code is a valid ScenarioCode enum value
  // --------------------------------------------------------------------------
  describe("scenario_code is a valid ScenarioCode enum value", () => {
    it("simple intestate returns a valid scenario code", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(VALID_SCENARIO_CODES).toContain(output.scenario_code);
    });

    it("testate input returns a valid scenario code", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
      ]);
      const output = await computeWasm(input);

      expect(VALID_SCENARIO_CODES).toContain(output.scenario_code);
    });
  });

  // --------------------------------------------------------------------------
  // succession_type matches input (intestate when will=null)
  // --------------------------------------------------------------------------
  describe("succession_type matches input", () => {
    it("intestate input (will=null) returns Intestate succession_type", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.succession_type).toBe("Intestate");
      expect(VALID_SUCCESSION_TYPES).toContain(output.succession_type);
    });

    it("testate input returns Testate succession_type", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
      ]);
      const output = await computeWasm(input);

      expect(output.succession_type).toBe("Testate");
      expect(VALID_SUCCESSION_TYPES).toContain(output.succession_type);
    });

    it("intestate scenario_code starts with I", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.scenario_code).toMatch(/^I/);
    });

    it("testate scenario_code starts with T", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
      ]);
      const output = await computeWasm(input);

      expect(output.scenario_code).toMatch(/^T/);
    });
  });

  // --------------------------------------------------------------------------
  // computation_log has at least one step
  // --------------------------------------------------------------------------
  describe("computation_log has at least one step", () => {
    it("computation_log.steps is non-empty", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.computation_log.steps.length).toBeGreaterThanOrEqual(1);
    });

    it("each step has step_number, step_name, description", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      for (const step of output.computation_log.steps) {
        expect(step).toHaveProperty("step_number");
        expect(step).toHaveProperty("step_name");
        expect(step).toHaveProperty("description");
        expect(typeof step.step_number).toBe("number");
        expect(typeof step.step_name).toBe("string");
        expect(typeof step.description).toBe("string");
      }
    });

    it("final_scenario in computation_log matches output scenario_code", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.computation_log.final_scenario).toBe(output.scenario_code);
    });

    it("total_restarts is a non-negative integer", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.computation_log.total_restarts).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(output.computation_log.total_restarts)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Output Money fields have centavos property
  // --------------------------------------------------------------------------
  describe("output Money fields have centavos property", () => {
    it("per_heir_shares Money fields have centavos", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);
      const share = output.per_heir_shares[0];

      expect(share.from_legitime).toHaveProperty("centavos");
      expect(share.from_free_portion).toHaveProperty("centavos");
      expect(share.from_intestate).toHaveProperty("centavos");
      expect(share.total).toHaveProperty("centavos");
      expect(share.donations_imputed).toHaveProperty("centavos");
      expect(share.gross_entitlement).toHaveProperty("centavos");
      expect(share.net_from_estate).toHaveProperty("centavos");
    });

    it("centavos values are numbers or numeric strings", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);
      const share = output.per_heir_shares[0];

      // centavos should be parseable as a number
      const totalCentavos = toCentavosNumber(share.total.centavos);
      expect(typeof totalCentavos).toBe("number");
      expect(Number.isFinite(totalCentavos)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // computeWasm() with invalid input throws/rejects
  // --------------------------------------------------------------------------
  describe("computeWasm() with invalid input throws/rejects", () => {
    it("rejects negative estate centavos", async () => {
      const input = makeIntestateInput(
        [makePerson({ id: "lc1", name: "Maria" })],
        -100
      );

      await expect(computeWasm(input)).rejects.toThrow();
    });

    it("rejects duplicate person IDs", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
        makePerson({ id: "lc1", name: "Jose" }),
      ]);

      await expect(computeWasm(input)).rejects.toThrow();
    });

    it("rejects multiple SurvivingSpouse", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "sp1",
          name: "Ana",
          relationship_to_decedent: "SurvivingSpouse",
        }),
        makePerson({
          id: "sp2",
          name: "Rosa",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);

      await expect(computeWasm(input)).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Known scenario: 2 LC + spouse intestate → I4, 3 heir shares
  // --------------------------------------------------------------------------
  describe("known scenario: 2 LC + spouse intestate (I2)", () => {
    it("returns scenario I2 for 2 LC + spouse intestate", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
        makePerson({ id: "lc2", name: "Jose Jr" }),
        makePerson({
          id: "sp",
          name: "Ana",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await computeWasm(input);

      // hasLc && !hasIc && sp → I2 (any LC count + spouse, no IC)
      expect(output.scenario_code).toBe("I2");
    });

    it("returns 3 heir shares for 2 LC + spouse", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria" }),
        makePerson({ id: "lc2", name: "Jose Jr" }),
        makePerson({
          id: "sp",
          name: "Ana",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await computeWasm(input);

      // Should have a share entry for each of the 3 heirs
      expect(output.per_heir_shares.length).toBeGreaterThanOrEqual(3);

      const shareIds = output.per_heir_shares.map((s) => s.heir_id);
      expect(shareIds).toContain("lc1");
      expect(shareIds).toContain("lc2");
      expect(shareIds).toContain("sp");
    });
  });

  // --------------------------------------------------------------------------
  // Known scenario: single LC intestate → I1
  // --------------------------------------------------------------------------
  describe("known scenario: single LC intestate (example input)", () => {
    it("returns I1 for single LC intestate", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      expect(output.scenario_code).toBe("I1");
      expect(output.succession_type).toBe("Intestate");
    });

    it("single heir gets the full estate", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      const totalCentavos = toCentavosNumber(
        output.per_heir_shares[0].total.centavos
      );
      expect(totalCentavos).toBe(100000000);
    });
  });

  // --------------------------------------------------------------------------
  // Total of all per_heir_shares[].total.centavos equals estate
  // --------------------------------------------------------------------------
  describe("total shares sum equals estate", () => {
    it("single heir: total equals estate", async () => {
      const estateCentavos = 100000000;
      const input = makeIntestateInput(
        [makePerson({ id: "lc1", name: "Maria" })],
        estateCentavos
      );
      const output = await computeWasm(input);

      const totalDistributed = output.per_heir_shares.reduce((sum, s) => {
        return sum + toCentavosNumber(s.total.centavos);
      }, 0);

      expect(totalDistributed).toBe(estateCentavos);
    });

    it("multiple heirs: total equals estate", async () => {
      const estateCentavos = 600000000; // ₱6,000,000
      const input = makeIntestateInput(
        [
          makePerson({ id: "lc1", name: "Maria" }),
          makePerson({ id: "lc2", name: "Jose Jr" }),
          makePerson({
            id: "sp",
            name: "Ana",
            relationship_to_decedent: "SurvivingSpouse",
          }),
        ],
        estateCentavos
      );
      const output = await computeWasm(input);

      const totalDistributed = output.per_heir_shares.reduce((sum, s) => {
        return sum + toCentavosNumber(s.total.centavos);
      }, 0);

      // Total distributed should equal estate (exact match for real engine)
      expect(totalDistributed).toBe(estateCentavos);
    });

    it("escheat: no shares, total is 0", async () => {
      const input = makeIntestateInput([], 100000000);
      const output = await computeWasm(input);

      const totalDistributed = output.per_heir_shares.reduce((sum, s) => {
        return sum + toCentavosNumber(s.total.centavos);
      }, 0);

      expect(totalDistributed).toBe(0);
      expect(output.scenario_code).toBe("I15");
    });
  });

  // --------------------------------------------------------------------------
  // Additional structural validation
  // --------------------------------------------------------------------------
  describe("InheritanceShare structural fields", () => {
    it("each share has heir_category as valid EffectiveCategory", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "lc1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
        makePerson({
          id: "sp",
          name: "Ana",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await computeWasm(input);

      const validCategories = [
        "LegitimateChildGroup",
        "IllegitimateChildGroup",
        "SurvivingSpouseGroup",
        "LegitimateAscendantGroup",
        "CollateralGroup",
      ];

      for (const share of output.per_heir_shares) {
        expect(validCategories).toContain(share.heir_category);
      }
    });

    it("each share has inherits_by as OwnRight or Representation", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      for (const share of output.per_heir_shares) {
        expect(["OwnRight", "Representation"]).toContain(share.inherits_by);
      }
    });

    it("each share has legal_basis as an array", async () => {
      const input = makeSimpleIntestateInput();
      const output = await computeWasm(input);

      for (const share of output.per_heir_shares) {
        expect(Array.isArray(share.legal_basis)).toBe(true);
      }
    });
  });
});
