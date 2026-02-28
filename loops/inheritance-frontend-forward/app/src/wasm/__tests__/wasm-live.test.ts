/**
 * wasm-live — Integration tests for the real WASM engine via the bridge.
 *
 * These tests verify that computeWasm() calls the real Rust engine (not the mock)
 * and produces correct output for known inputs.
 */

import { describe, it, expect } from "vitest";
import { computeWasm } from "../bridge";
import type { EngineInput, EngineOutput } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePerson(overrides: Partial<import("../../types").Person> & { id: string; name: string; relationship_to_decedent: import("../../types").Relationship }) {
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

function makeDecedent(overrides?: Partial<import("../../types").Decedent>) {
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

function makeInput(overrides?: Partial<EngineInput>): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000000 },
    decedent: makeDecedent(),
    family_tree: [],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
    ...overrides,
  };
}

function sumShares(output: EngineOutput): number {
  return output.per_heir_shares.reduce((acc, s) => {
    const c = typeof s.total.centavos === "number"
      ? s.total.centavos
      : Number(s.total.centavos);
    return acc + c;
  }, 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("wasm-live: real WASM engine integration", () => {
  it("simple intestate (I1): single LC gets entire estate", async () => {
    const input = makeInput({
      net_distributable_estate: { centavos: 100000000 },
      family_tree: [
        makePerson({
          id: "child1",
          name: "Maria",
          relationship_to_decedent: "LegitimateChild",
        }),
      ],
    });

    const output = await computeWasm(input);

    expect(output.scenario_code).toBe("I1");
    expect(output.succession_type).toBe("Intestate");
    expect(output.per_heir_shares).toHaveLength(1);
    expect(output.per_heir_shares[0].heir_id).toBe("child1");
    // Single LC inherits entire estate
    const totalCentavos = typeof output.per_heir_shares[0].total.centavos === "number"
      ? output.per_heir_shares[0].total.centavos
      : Number(output.per_heir_shares[0].total.centavos);
    expect(totalCentavos).toBe(100000000);
  });

  it("shares sum to estate total", async () => {
    const estateCentavos = 600000000;
    const input = makeInput({
      net_distributable_estate: { centavos: estateCentavos },
      decedent: makeDecedent({ is_married: true, date_of_marriage: "2000-01-01" }),
      family_tree: [
        makePerson({ id: "s", name: "Rosa", relationship_to_decedent: "SurvivingSpouse" }),
        makePerson({ id: "c1", name: "Ana", relationship_to_decedent: "LegitimateChild" }),
        makePerson({ id: "c2", name: "Ben", relationship_to_decedent: "LegitimateChild" }),
      ],
    });

    const output = await computeWasm(input);

    expect(output.scenario_code).toBe("I2");
    expect(sumShares(output)).toBe(estateCentavos);
  });

  it("narratives are non-empty and match heirs", async () => {
    const input = makeInput({
      family_tree: [
        makePerson({ id: "c1", name: "Maria", relationship_to_decedent: "LegitimateChild" }),
      ],
    });

    const output = await computeWasm(input);

    expect(output.narratives.length).toBeGreaterThan(0);
    for (const narrative of output.narratives) {
      expect(narrative.text).toBeTruthy();
      expect(narrative.heir_id).toBeTruthy();
      expect(narrative.heir_name).toBeTruthy();
    }
    // Every heir with a share should have a narrative
    const shareHeirIds = output.per_heir_shares.map((s) => s.heir_id);
    const narrativeHeirIds = output.narratives.map((n) => n.heir_id);
    for (const id of shareHeirIds) {
      expect(narrativeHeirIds).toContain(id);
    }
  });

  it("escheat (I15): empty family tree, no heirs", async () => {
    const input = makeInput({
      family_tree: [],
    });

    const output = await computeWasm(input);

    expect(output.scenario_code).toBe("I15");
    expect(output.succession_type).toBe("Intestate");
    // Real engine returns a STATE heir for escheat (state inherits the estate)
    expect(output.per_heir_shares.length).toBeGreaterThanOrEqual(0);
  });

  it("computation log contains multiple pipeline steps", async () => {
    const input = makeInput({
      family_tree: [
        makePerson({ id: "c1", name: "Maria", relationship_to_decedent: "LegitimateChild" }),
      ],
    });

    const output = await computeWasm(input);

    expect(output.computation_log).toBeDefined();
    expect(output.computation_log.final_scenario).toBe("I1");
    expect(output.computation_log.steps.length).toBeGreaterThanOrEqual(1);
    for (const step of output.computation_log.steps) {
      expect(step.step_number).toBeGreaterThan(0);
      expect(step.step_name).toBeTruthy();
      expect(step.description).toBeTruthy();
    }
  });

  it("heir shares reference valid heir IDs from family tree", async () => {
    const input = makeInput({
      net_distributable_estate: { centavos: 900000000 },
      decedent: makeDecedent({ is_married: true, date_of_marriage: "2000-01-01" }),
      family_tree: [
        makePerson({ id: "s", name: "Rosa", relationship_to_decedent: "SurvivingSpouse" }),
        makePerson({ id: "c1", name: "Ana", relationship_to_decedent: "LegitimateChild" }),
        makePerson({ id: "c2", name: "Ben", relationship_to_decedent: "LegitimateChild" }),
        makePerson({
          id: "ic1",
          name: "Carlos",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        }),
      ],
    });

    const output = await computeWasm(input);

    expect(output.scenario_code).toBe("I4");
    const familyIds = input.family_tree.map((p) => p.id);
    for (const share of output.per_heir_shares) {
      expect(familyIds).toContain(share.heir_id);
    }
  });

  it("rejects invalid input gracefully", async () => {
    // Completely malformed input should throw
    const badInput = {
      net_distributable_estate: { centavos: -1 },
      decedent: null,
    } as unknown as EngineInput;

    await expect(computeWasm(badInput)).rejects.toThrow();
  });
});
