/**
 * Tests for the WASM bridge mock implementation (Stage 4).
 *
 * Source of truth:
 *   - engine-output.md (EngineOutput shape)
 *   - scenario-field-mapping.md (scenario prediction)
 */

import { describe, it, expect } from "vitest";
import { compute } from "../bridge";
import { EngineOutputSchema } from "../../schemas";
import { formatPeso } from "../../types";
import type {
  EngineInput,
  Person,
  Decedent,
  EngineConfig,
  EngineOutput,
  InheritanceShare,
  HeirNarrative,
} from "../../types";

// ============================================================================
// Test Fixture Factories
// ============================================================================

function makeDecedent(overrides?: Partial<Decedent>): Decedent {
  return {
    id: "decedent",
    name: "Juan Cruz",
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
    id: "lc1",
    name: "Maria Cruz",
    is_alive_at_succession: true,
    relationship_to_decedent: "LegitimateChild",
    degree: 1,
    line: null,
    children: [],
    filiation_proved: false,
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

function makeIntestateInput(
  familyTree: Person[],
  estateCentavos: number = 500000000
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
  estateCentavos: number = 500000000
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

// ============================================================================
// Tests
// ============================================================================

describe("wasm bridge", () => {
  // --------------------------------------------------------------------------
  // Return type validation
  // --------------------------------------------------------------------------
  describe("compute() return type", () => {
    it("returns an EngineOutput that passes Zod validation", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      const result = EngineOutputSchema.safeParse(output);
      expect(result.success).toBe(true);
    });

    it("returns an object with all required EngineOutput fields", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output).toHaveProperty("per_heir_shares");
      expect(output).toHaveProperty("narratives");
      expect(output).toHaveProperty("computation_log");
      expect(output).toHaveProperty("warnings");
      expect(output).toHaveProperty("succession_type");
      expect(output).toHaveProperty("scenario_code");
    });

    it("returns arrays for per_heir_shares, narratives, warnings", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(Array.isArray(output.per_heir_shares)).toBe(true);
      expect(Array.isArray(output.narratives)).toBe(true);
      expect(Array.isArray(output.warnings)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Intestate scenario prediction
  // --------------------------------------------------------------------------
  describe("intestate scenarios", () => {
    it("returns I-prefix scenario for intestate input (will=null)", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toMatch(/^I/);
      expect(output.succession_type).toBe("Intestate");
    });

    it("returns I1 for single LC intestate", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I1");
    });

    it("returns I2 for LC + spouse intestate", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I2");
    });

    it("returns I3 for LC + IC intestate", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({
          id: "ic1",
          name: "Pedro Cruz",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I3");
    });

    it("returns I4 for LC + IC + spouse intestate", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({
          id: "ic1",
          name: "Pedro Cruz",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I4");
    });

    it("returns I5 for ascendants only intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "lp1",
          name: "Jose Cruz Sr",
          relationship_to_decedent: "LegitimateParent",
          line: "Paternal",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I5");
    });

    it("returns I6 for ascendants + spouse intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "lp1",
          name: "Jose Cruz Sr",
          relationship_to_decedent: "LegitimateParent",
          line: "Paternal",
        }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I6");
    });

    it("returns I7 for IC only intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "ic1",
          name: "Pedro Cruz",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I7");
    });

    it("returns I8 for IC + spouse intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "ic1",
          name: "Pedro Cruz",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I8");
    });

    it("returns I11 for spouse only intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I11");
    });

    it("returns I13 for siblings only intestate", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "sib1",
          name: "Carlos Cruz",
          relationship_to_decedent: "Sibling",
          degree: 2,
          blood_type: "Full",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I13");
    });

    it("returns I15 for empty family tree (escheat)", async () => {
      const input = makeIntestateInput([]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("I15");
    });
  });

  // --------------------------------------------------------------------------
  // Testate scenario prediction
  // --------------------------------------------------------------------------
  describe("testate scenarios", () => {
    it("returns T-prefix scenario for testate input", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toMatch(/^T/);
      expect(output.succession_type).toBe("Testate");
    });

    it("returns T1 for LC only testate", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("T1");
    });

    it("returns T2 for 1 LC + spouse testate", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("T2");
    });

    it("returns T3 for 2+ LC + spouse testate", async () => {
      const input = makeTestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({ id: "lc2", name: "Jose Cruz Jr" }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("T3");
    });

    it("returns T13 for no compulsory heirs testate", async () => {
      const input = makeTestateInput([]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("T13");
    });

    it("returns T6 for ascendants only testate", async () => {
      const input = makeTestateInput([
        makePerson({
          id: "lp1",
          name: "Jose Cruz Sr",
          relationship_to_decedent: "LegitimateParent",
          line: "Paternal",
        }),
      ]);
      const output = await compute(input);

      expect(output.scenario_code).toBe("T6");
    });
  });

  // --------------------------------------------------------------------------
  // Invalid input rejection
  // --------------------------------------------------------------------------
  describe("invalid input", () => {
    it("throws for input that fails EngineInputSchema", async () => {
      const invalidInput = {
        net_distributable_estate: { centavos: -100 }, // negative centavos
        decedent: makeDecedent(),
        family_tree: [],
        will: null,
        donations: [],
        config: makeConfig(),
      } as EngineInput;

      await expect(compute(invalidInput)).rejects.toThrow();
    });

    it("throws for duplicate person IDs", async () => {
      const invalidInput = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({ id: "lc1", name: "Pedro Cruz" }), // duplicate
      ]);

      await expect(compute(invalidInput)).rejects.toThrow();
    });

    it("throws for multiple SurvivingSpouse", async () => {
      const invalidInput = makeIntestateInput([
        makePerson({
          id: "sp1",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
        makePerson({
          id: "sp2",
          name: "Rosa Reyes",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);

      await expect(compute(invalidInput)).rejects.toThrow();
    });

    it("throws for will date after death date", async () => {
      const invalidInput: EngineInput = {
        net_distributable_estate: { centavos: 500000000 },
        decedent: makeDecedent({ date_of_death: "2026-01-15" }),
        family_tree: [makePerson({ id: "lc1" })],
        will: {
          date_executed: "2027-06-01", // after death
          institutions: [],
          legacies: [],
          devises: [],
          disinheritances: [],
        },
        donations: [],
        config: makeConfig(),
      };

      await expect(compute(invalidInput)).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Shares per heir
  // --------------------------------------------------------------------------
  describe("shares per heir", () => {
    it("returns one share entry per heir in family_tree", async () => {
      const familyTree = [
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({ id: "lc2", name: "Jose Cruz Jr" }),
        makePerson({ id: "lc3", name: "Ana Cruz" }),
      ];
      const input = makeIntestateInput(familyTree);
      const output = await compute(input);

      expect(output.per_heir_shares).toHaveLength(familyTree.length);
    });

    it("each share has the correct heir_id from family_tree", async () => {
      const familyTree = [
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({ id: "lc2", name: "Jose Cruz Jr" }),
      ];
      const input = makeIntestateInput(familyTree);
      const output = await compute(input);

      const shareIds = output.per_heir_shares.map((s) => s.heir_id);
      expect(shareIds).toContain("lc1");
      expect(shareIds).toContain("lc2");
    });

    it("each share has required Money fields", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);
      const share = output.per_heir_shares[0];

      expect(share).toHaveProperty("from_legitime");
      expect(share.from_legitime).toHaveProperty("centavos");
      expect(share).toHaveProperty("from_free_portion");
      expect(share).toHaveProperty("from_intestate");
      expect(share).toHaveProperty("total");
      expect(share).toHaveProperty("donations_imputed");
      expect(share).toHaveProperty("gross_entitlement");
      expect(share).toHaveProperty("net_from_estate");
    });

    it("each share has heir_category as valid EffectiveCategory", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      const validCategories = [
        "LegitimateChildGroup",
        "IllegitimateChildGroup",
        "SurvivingSpouseGroup",
        "LegitimateAscendantGroup",
        "CollateralGroup",
      ];
      expect(validCategories).toContain(
        output.per_heir_shares[0].heir_category
      );
    });

    it("maps LegitimateChild to LegitimateChildGroup category", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "lc1",
          name: "Maria Cruz",
          relationship_to_decedent: "LegitimateChild",
        }),
      ]);
      const output = await compute(input);

      expect(output.per_heir_shares[0].heir_category).toBe(
        "LegitimateChildGroup"
      );
    });

    it("maps AdoptedChild to LegitimateChildGroup category", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "ac1",
          name: "Pedro Adopted",
          relationship_to_decedent: "AdoptedChild",
          adoption: {
            decree_date: "2020-01-01",
            regime: "Ra8552",
            adopter: "decedent",
            adoptee: "ac1",
            is_stepparent_adoption: false,
            biological_parent_spouse: null,
            is_rescinded: false,
            rescission_date: null,
          },
        }),
      ]);
      const output = await compute(input);

      expect(output.per_heir_shares[0].heir_category).toBe(
        "LegitimateChildGroup"
      );
    });

    it("maps IllegitimateChild to IllegitimateChildGroup category", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "ic1",
          name: "Rosa IC",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
      ]);
      const output = await compute(input);

      expect(output.per_heir_shares[0].heir_category).toBe(
        "IllegitimateChildGroup"
      );
    });

    it("maps SurvivingSpouse to SurvivingSpouseGroup category", async () => {
      const input = makeIntestateInput([
        makePerson({
          id: "sp",
          name: "Ana Spouse",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      expect(output.per_heir_shares[0].heir_category).toBe(
        "SurvivingSpouseGroup"
      );
    });

    it("returns empty shares for escheat scenario (I15)", async () => {
      const input = makeIntestateInput([]);
      const output = await compute(input);

      expect(output.per_heir_shares).toHaveLength(0);
    });

    it("shares have inherits_by defaulting to OwnRight", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.per_heir_shares[0].inherits_by).toBe("OwnRight");
    });
  });

  // --------------------------------------------------------------------------
  // Narratives per heir
  // --------------------------------------------------------------------------
  describe("narratives per heir", () => {
    it("returns one narrative entry per heir in family_tree", async () => {
      const familyTree = [
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({ id: "lc2", name: "Jose Cruz Jr" }),
      ];
      const input = makeIntestateInput(familyTree);
      const output = await compute(input);

      expect(output.narratives).toHaveLength(familyTree.length);
    });

    it("each narrative has matching heir_id from shares", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      const shareIds = output.per_heir_shares.map((s) => s.heir_id);
      const narrativeIds = output.narratives.map((n) => n.heir_id);
      expect(narrativeIds).toEqual(shareIds);
    });

    it("narrative text contains Markdown bold markers", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.narratives[0].text).toMatch(/\*\*.+\*\*/);
    });

    it("narrative has non-empty heir_category_label", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.narratives[0].heir_category_label.length).toBeGreaterThan(
        0
      );
    });

    it("narrative heir_name matches the input person name", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.narratives[0].heir_name).toBe("Maria Cruz");
    });

    it("returns empty narratives for escheat scenario", async () => {
      const input = makeIntestateInput([]);
      const output = await compute(input);

      expect(output.narratives).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Computation log
  // --------------------------------------------------------------------------
  describe("computation log", () => {
    it("has at least one step entry", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.computation_log.steps.length).toBeGreaterThanOrEqual(1);
    });

    it("final_scenario matches scenario_code", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.computation_log.final_scenario).toBe(
        output.scenario_code
      );
    });

    it("total_restarts is a non-negative integer", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(output.computation_log.total_restarts).toBeGreaterThanOrEqual(0);
      expect(
        Number.isInteger(output.computation_log.total_restarts)
      ).toBe(true);
    });

    it("step entry has step_number, step_name, description", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);
      const step = output.computation_log.steps[0];

      expect(step).toHaveProperty("step_number");
      expect(step).toHaveProperty("step_name");
      expect(step).toHaveProperty("description");
      expect(typeof step.step_number).toBe("number");
      expect(typeof step.step_name).toBe("string");
      expect(typeof step.description).toBe("string");
    });
  });

  // --------------------------------------------------------------------------
  // Warnings
  // --------------------------------------------------------------------------
  describe("warnings", () => {
    it("returns warnings as an array (may be empty)", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
      ]);
      const output = await compute(input);

      expect(Array.isArray(output.warnings)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // formatPeso on output amounts
  // --------------------------------------------------------------------------
  describe("formatPeso on output amounts", () => {
    it("correctly formats output centavo amounts from shares", async () => {
      const input = makeIntestateInput(
        [makePerson({ id: "lc1", name: "Maria Cruz" })],
        500000000
      );
      const output = await compute(input);
      const share = output.per_heir_shares[0];

      const formatted = formatPeso(share.net_from_estate.centavos);
      expect(formatted).toMatch(/^₱/);
      expect(formatted).toMatch(/[\d,]+/);
    });

    it("formatPeso formats 500000000 centavos as ₱5,000,000", () => {
      expect(formatPeso(500000000)).toBe("₱5,000,000");
    });

    it("formatPeso formats 50025 centavos as ₱500.25", () => {
      expect(formatPeso(50025)).toBe("₱500.25");
    });

    it("formatPeso formats 0 centavos as ₱0", () => {
      expect(formatPeso(0)).toBe("₱0");
    });
  });

  // --------------------------------------------------------------------------
  // Equal split among heirs (mock behavior)
  // --------------------------------------------------------------------------
  describe("mock distribution", () => {
    it("distributes estate equally among LC heirs in intestate", async () => {
      const estateCentavos = 600000000; // ₱6,000,000
      const input = makeIntestateInput(
        [
          makePerson({ id: "lc1", name: "Maria Cruz" }),
          makePerson({ id: "lc2", name: "Jose Cruz Jr" }),
          makePerson({ id: "lc3", name: "Ana Cruz" }),
        ],
        estateCentavos
      );
      const output = await compute(input);

      // Mock does equal split — each heir gets E/n
      const totalNet = output.per_heir_shares.reduce((sum, s) => {
        const c =
          typeof s.net_from_estate.centavos === "number"
            ? s.net_from_estate.centavos
            : parseInt(s.net_from_estate.centavos as string, 10);
        return sum + c;
      }, 0);

      // Total distributed should equal estate (within rounding)
      expect(Math.abs(totalNet - estateCentavos)).toBeLessThanOrEqual(
        input.family_tree.length
      );
    });

    it("single heir gets the full estate", async () => {
      const estateCentavos = 500000000;
      const input = makeIntestateInput(
        [makePerson({ id: "lc1", name: "Maria Cruz" })],
        estateCentavos
      );
      const output = await compute(input);

      const netCentavos =
        typeof output.per_heir_shares[0].net_from_estate.centavos === "number"
          ? output.per_heir_shares[0].net_from_estate.centavos
          : parseInt(
              output.per_heir_shares[0].net_from_estate.centavos as string,
              10
            );
      expect(netCentavos).toBe(estateCentavos);
    });
  });

  // --------------------------------------------------------------------------
  // Cross-validation: shares + narratives consistency
  // --------------------------------------------------------------------------
  describe("shares and narratives consistency", () => {
    it("every share heir_id has a matching narrative", async () => {
      const input = makeIntestateInput([
        makePerson({ id: "lc1", name: "Maria Cruz" }),
        makePerson({
          id: "sp",
          name: "Ana Santos",
          relationship_to_decedent: "SurvivingSpouse",
        }),
      ]);
      const output = await compute(input);

      const shareIds = new Set(output.per_heir_shares.map((s) => s.heir_id));
      const narrativeIds = new Set(output.narratives.map((n) => n.heir_id));

      for (const id of shareIds) {
        expect(narrativeIds.has(id)).toBe(true);
      }
    });
  });
});
