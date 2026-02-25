/**
 * WASM Bridge — mock implementation for UI development.
 * Real WASM integration will replace this in Stage 12.
 *
 * Source of truth:
 *   - engine-output.md (EngineOutput shape)
 *   - scenario-field-mapping.md (scenario prediction logic)
 */

import { EngineInputSchema } from "../schemas";
import type {
  EngineInput,
  EngineOutput,
  EffectiveCategory,
  InheritanceShare,
  HeirNarrative,
  ScenarioCode,
  SuccessionType,
  Money,
  Person,
  Relationship,
} from "../types";
import { EFFECTIVE_CATEGORY_LABELS, formatPeso } from "../types";

/**
 * Map relationship to effective category for grouping.
 */
function relationshipToCategory(rel: Relationship): EffectiveCategory {
  switch (rel) {
    case "LegitimateChild":
    case "LegitimatedChild":
    case "AdoptedChild":
      return "LegitimateChildGroup";
    case "IllegitimateChild":
      return "IllegitimateChildGroup";
    case "SurvivingSpouse":
      return "SurvivingSpouseGroup";
    case "LegitimateParent":
    case "LegitimateAscendant":
      return "LegitimateAscendantGroup";
    case "Sibling":
    case "NephewNiece":
    case "OtherCollateral":
    case "Stranger":
      return "CollateralGroup";
  }
}

/**
 * Category label for narratives (lowercase, human-readable).
 */
function categoryLabel(rel: Relationship): string {
  switch (rel) {
    case "LegitimateChild":
      return "legitimate child";
    case "LegitimatedChild":
      return "legitimated child";
    case "AdoptedChild":
      return "adopted child";
    case "IllegitimateChild":
      return "illegitimate child";
    case "SurvivingSpouse":
      return "surviving spouse";
    case "LegitimateParent":
      return "legitimate parent";
    case "LegitimateAscendant":
      return "legitimate ascendant";
    case "Sibling":
      return "sibling";
    case "NephewNiece":
      return "nephew/niece";
    case "OtherCollateral":
      return "collateral relative";
    case "Stranger":
      return "beneficiary";
  }
}

/**
 * Predict scenario code from heir counts.
 * Mirrors step3_scenario.rs:52-235 exactly.
 */
function predictScenario(
  hasWill: boolean,
  familyTree: Person[],
  decedentIsIllegitimate: boolean
): { scenarioCode: ScenarioCode; successionType: SuccessionType } {
  const alive = familyTree.filter((p) => p.is_alive_at_succession !== false);

  const lc = alive.filter(
    (p) =>
      p.relationship_to_decedent === "LegitimateChild" ||
      p.relationship_to_decedent === "LegitimatedChild" ||
      p.relationship_to_decedent === "AdoptedChild"
  ).length;

  const ic = alive.filter(
    (p) =>
      p.relationship_to_decedent === "IllegitimateChild" &&
      p.filiation_proved === true
  ).length;

  const sp =
    alive.filter((p) => p.relationship_to_decedent === "SurvivingSpouse")
      .length > 0;

  const asc = alive.filter(
    (p) =>
      p.relationship_to_decedent === "LegitimateParent" ||
      p.relationship_to_decedent === "LegitimateAscendant"
  ).length;

  const siblings =
    alive.filter(
      (p) =>
        p.relationship_to_decedent === "Sibling" ||
        p.relationship_to_decedent === "NephewNiece"
    ).length > 0;

  const collaterals =
    alive.filter((p) => p.relationship_to_decedent === "OtherCollateral")
      .length > 0;

  const hasLc = lc > 0;
  const hasIc = ic > 0;
  const hasAsc = asc > 0;

  if (hasWill) {
    if (hasLc) {
      if (!hasIc && !sp)
        return { scenarioCode: "T1", successionType: "Testate" };
      if (hasIc && !sp)
        return { scenarioCode: "T4", successionType: "Testate" };
      if (!hasIc && sp)
        return {
          scenarioCode: lc === 1 ? "T2" : "T3",
          successionType: "Testate",
        };
      return {
        scenarioCode: lc === 1 ? "T5a" : "T5b",
        successionType: "Testate",
      };
    }

    if (decedentIsIllegitimate && hasAsc) {
      return {
        scenarioCode: sp ? "T15" : "T14",
        successionType: "Testate",
      };
    }

    if (hasAsc) {
      if (!hasIc && !sp)
        return { scenarioCode: "T6", successionType: "Testate" };
      if (!hasIc && sp)
        return { scenarioCode: "T7", successionType: "Testate" };
      if (hasIc && !sp)
        return { scenarioCode: "T8", successionType: "Testate" };
      return { scenarioCode: "T9", successionType: "Testate" };
    }

    if (hasIc && sp)
      return { scenarioCode: "T10", successionType: "Testate" };
    if (hasIc && !sp)
      return { scenarioCode: "T11", successionType: "Testate" };
    if (!hasIc && sp)
      return { scenarioCode: "T12", successionType: "Testate" };
    return { scenarioCode: "T13", successionType: "Testate" };
  } else {
    if (hasLc) {
      if (!hasIc && !sp)
        return { scenarioCode: "I1", successionType: "Intestate" };
      if (!hasIc && sp)
        return { scenarioCode: "I2", successionType: "Intestate" };
      if (hasIc && !sp)
        return { scenarioCode: "I3", successionType: "Intestate" };
      return { scenarioCode: "I4", successionType: "Intestate" };
    }

    if (hasAsc) {
      if (!hasIc && !sp)
        return { scenarioCode: "I5", successionType: "Intestate" };
      if (!hasIc && sp)
        return { scenarioCode: "I6", successionType: "Intestate" };
      if (hasIc && !sp)
        return { scenarioCode: "I9", successionType: "Intestate" };
      return { scenarioCode: "I10", successionType: "Intestate" };
    }

    if (hasIc) {
      return sp
        ? { scenarioCode: "I8", successionType: "Intestate" }
        : { scenarioCode: "I7", successionType: "Intestate" };
    }
    if (sp) {
      return siblings
        ? { scenarioCode: "I12", successionType: "Intestate" }
        : { scenarioCode: "I11", successionType: "Intestate" };
    }
    if (siblings)
      return { scenarioCode: "I13", successionType: "Intestate" };
    if (collaterals)
      return { scenarioCode: "I14", successionType: "Intestate" };
    return { scenarioCode: "I15", successionType: "Intestate" };
  }
}

function zeroMoney(): Money {
  return { centavos: 0 };
}

/**
 * Compute inheritance distribution from the given input.
 * Currently a mock — validates input, predicts scenario, returns synthetic output.
 */
export async function compute(input: EngineInput): Promise<EngineOutput> {
  // 1. Validate input with EngineInputSchema
  const parseResult = EngineInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(
      `Validation failed: ${parseResult.error.issues.map((i) => i.message).join("; ")}`
    );
  }

  // 2. Predict scenario from heir counts
  const hasWill = input.will !== null;
  const { scenarioCode, successionType } = predictScenario(
    hasWill,
    input.family_tree,
    input.decedent.is_illegitimate
  );

  // 3. Build synthetic shares — equal split among all heirs
  const heirs = input.family_tree;
  const estateCentavos =
    typeof input.net_distributable_estate.centavos === "number"
      ? input.net_distributable_estate.centavos
      : parseInt(input.net_distributable_estate.centavos as string, 10);

  const n = heirs.length;
  const perHeirShares: InheritanceShare[] = [];
  const narratives: HeirNarrative[] = [];

  if (n > 0) {
    const baseShare = Math.floor(estateCentavos / n);
    const remainder = estateCentavos - baseShare * n;

    for (let i = 0; i < n; i++) {
      const person = heirs[i];
      const shareCentavos = baseShare + (i < remainder ? 1 : 0);
      const category = relationshipToCategory(
        person.relationship_to_decedent
      );
      const catLabel = categoryLabel(person.relationship_to_decedent);
      const groupLabel = EFFECTIVE_CATEGORY_LABELS[category];

      const share: InheritanceShare = {
        heir_id: person.id,
        heir_name: person.name,
        heir_category: category,
        inherits_by: "OwnRight",
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: shareCentavos },
        legitime_fraction: "",
        legal_basis: [],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: shareCentavos },
        net_from_estate: { centavos: shareCentavos },
      };
      perHeirShares.push(share);

      const formattedAmount = formatPeso(shareCentavos);
      const narrative: HeirNarrative = {
        heir_id: person.id,
        heir_name: person.name,
        heir_category_label: catLabel,
        text: `**${person.name} (${groupLabel})** receives **${formattedAmount}**. As a ${catLabel}, ${person.name} is entitled to a share of the estate.`,
      };
      narratives.push(narrative);
    }
  }

  // 4. Build computation log
  const computationLog = {
    steps: [
      {
        step_number: 10,
        step_name: "Finalize + Narrate",
        description:
          "Converted fractional shares to peso amounts and generated narratives",
      },
    ],
    total_restarts: 0,
    final_scenario: scenarioCode,
  };

  return {
    per_heir_shares: perHeirShares,
    narratives,
    computation_log: computationLog,
    warnings: [],
    succession_type: successionType,
    scenario_code: scenarioCode,
  };
}
