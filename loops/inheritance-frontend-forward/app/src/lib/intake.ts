/**
 * Guided Intake Form mapping functions (§4.18)
 * Source: docs/plans/inheritance-premium-spec.md §4.18
 *
 * Converts intake form state into:
 * - EngineInput (pre-populated case wizard)
 * - CreateClientData (client record)
 * - IntakeData (stored in cases.intake_data JSONB)
 * - MilestoneSeed[] (deadline generation)
 */

import type { EngineInput, Person, Decedent } from '@/types';
import type {
  IntakeFormState,
  IntakeData,
  MilestoneSeed,
  SettlementTrack,
  DecedentInfoStepState,
  FamilyCompositionStepState,
  IntakeHeirEntry,
} from '@/types/intake';

// --------------------------------------------------------------------------
// ID generation
// --------------------------------------------------------------------------

let _idCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
}

// --------------------------------------------------------------------------
// createInitialIntakeState
// --------------------------------------------------------------------------

export function createInitialIntakeState(): IntakeFormState {
  return {
    currentStep: 0,
    conflictCheck: {
      outcome: null,
      checkedName: '',
      checkedTin: null,
      notes: '',
    },
    clientDetails: {
      full_name: '',
      nickname: '',
      date_of_birth: '',
      email: '',
      phone: '',
      address: '',
      tin: '',
      gov_id_type: null,
      gov_id_number: '',
      civil_status: null,
      referral_source: '',
      relationship_to_decedent: null,
    },
    decedentInfo: {
      full_name: '',
      date_of_death: '',
      place_of_death: '',
      last_known_address: '',
      civil_status: null,
      has_will: false,
      property_regime: null,
      citizenship: 'Filipino',
      tin: '',
    },
    familyComposition: {
      heirs: [],
    },
    assetSummary: {
      real_property_count: 0,
      real_property_total_value: 0,
      has_cash: false,
      has_vehicles: false,
      vehicle_count: 0,
    },
    settlementTrack: {
      track: null,
    },
  };
}

// --------------------------------------------------------------------------
// mapDecedentInfoToDecedent
// --------------------------------------------------------------------------

export function mapDecedentInfoToDecedent(info: DecedentInfoStepState): Decedent {
  const isMarried =
    info.civil_status === 'married' || info.civil_status === 'legally_separated';
  const hasLegalSeparation = info.civil_status === 'legally_separated';

  return {
    id: generateId('decedent'),
    name: info.full_name,
    date_of_death: info.date_of_death,
    is_married: isMarried,
    date_of_marriage: null,
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 0,
    has_legal_separation: hasLegalSeparation,
    is_illegitimate: false,
  };
}

// --------------------------------------------------------------------------
// mapHeirEntryToPerson
// --------------------------------------------------------------------------

export function mapHeirEntryToPerson(heir: IntakeHeirEntry, index: number): Person {
  return {
    id: generateId(`person-${index}`),
    name: heir.name,
    is_alive_at_succession: heir.is_alive,
    relationship_to_decedent: heir.relationship,
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
  };
}

// --------------------------------------------------------------------------
// mapFamilyToPersons
// --------------------------------------------------------------------------

export function mapFamilyToPersons(family: FamilyCompositionStepState): Person[] {
  return family.heirs.map((heir, index) => mapHeirEntryToPerson(heir, index));
}

// --------------------------------------------------------------------------
// mapIntakeToEngineInput
// --------------------------------------------------------------------------

export function mapIntakeToEngineInput(state: IntakeFormState): EngineInput {
  const decedent = mapDecedentInfoToDecedent(state.decedentInfo);
  const family_tree = mapFamilyToPersons(state.familyComposition);
  const will = state.decedentInfo.has_will
    ? {
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [],
        date_executed: '',
      }
    : null;

  return {
    net_distributable_estate: { centavos: 0 },
    decedent,
    family_tree,
    will,
    donations: [],
    config: {
      retroactive_ra_11642: false,
      max_pipeline_restarts: 10,
    },
  };
}

// --------------------------------------------------------------------------
// mapIntakeToClientData
// --------------------------------------------------------------------------

export function mapIntakeToClientData(
  state: IntakeFormState,
  orgId: string,
  userId: string,
) {
  const c = state.clientDetails;
  const today = new Date().toISOString().slice(0, 10);

  return {
    org_id: orgId,
    created_by: userId,
    full_name: c.full_name,
    nickname: c.nickname || null,
    date_of_birth: c.date_of_birth || null,
    email: c.email || null,
    phone: c.phone || null,
    address: c.address || null,
    tin: c.tin || null,
    gov_id_type: c.gov_id_type,
    gov_id_number: c.gov_id_number || null,
    civil_status: c.civil_status,
    referral_source: c.referral_source || null,
    intake_date: today,
  };
}

// --------------------------------------------------------------------------
// mapIntakeToIntakeData
// --------------------------------------------------------------------------

export function mapIntakeToIntakeData(state: IntakeFormState): IntakeData {
  const d = state.decedentInfo;
  const a = state.assetSummary;

  return {
    decedent_tin: d.tin || null,
    asset_categories: {
      has_real_property: a.real_property_count > 0,
      real_property_count: a.real_property_count,
      real_property_total_value: a.real_property_total_value,
      has_cash: a.has_cash,
      has_vehicles: a.has_vehicles,
      vehicle_count: a.vehicle_count,
    },
    will_status: d.has_will ? 'testate' : 'intestate',
    settlement_track: state.settlementTrack.track!,
    relationship_to_decedent: state.clientDetails.relationship_to_decedent,
  };
}

// --------------------------------------------------------------------------
// getSettlementMilestones
// --------------------------------------------------------------------------

const EJS_MILESTONES: MilestoneSeed[] = [
  {
    label: 'Secure PSA Death Certificate',
    offset_days: 7,
    description: 'Obtain certified true copy of PSA death certificate for the decedent.',
    legal_basis: null,
  },
  {
    label: 'Gather Required Documents',
    offset_days: 30,
    description:
      'Collect all required documents: birth certificates, marriage certificate, land titles, bank certifications.',
    legal_basis: null,
  },
  {
    label: 'Execute Deed of Extrajudicial Settlement',
    offset_days: 60,
    description:
      'Draft and notarize the Deed of Extrajudicial Settlement among all heirs.',
    legal_basis: 'Rule 74, Rules of Court',
  },
  {
    label: 'Publish Settlement Notice',
    offset_days: 75,
    description:
      'Publish the extrajudicial settlement in a newspaper of general circulation once a week for 3 consecutive weeks.',
    legal_basis: 'Sec. 1, Rule 74, Rules of Court',
  },
  {
    label: 'File BIR Estate Tax Return',
    offset_days: 365,
    description:
      'File BIR Form 1801 (Estate Tax Return) and pay estate tax within 1 year from date of death.',
    legal_basis: 'Sec. 90, NIRC',
  },
  {
    label: 'Obtain eCAR',
    offset_days: 395,
    description:
      'Secure eCAR from BIR after estate tax payment for each real property and bank account.',
    legal_basis: null,
  },
  {
    label: 'Transfer Land Titles',
    offset_days: 425,
    description: 'Present eCAR and Deed to Registry of Deeds for title transfer.',
    legal_basis: null,
  },
  {
    label: 'Update Tax Declarations',
    offset_days: 455,
    description:
      'File new tax declarations at the local assessor for transferred real properties.',
    legal_basis: null,
  },
  {
    label: 'Release Bank Accounts',
    offset_days: 455,
    description:
      'Present eCAR and settlement documents to banks for release of deposits.',
    legal_basis: null,
  },
];

const JUDICIAL_MILESTONES: MilestoneSeed[] = [
  {
    label: 'File Petition for Probate / Settlement',
    offset_days: 30,
    description:
      'File the petition for probate of will or judicial settlement of estate in the proper court.',
    legal_basis: 'Rule 76 / Rule 73, Rules of Court',
  },
  {
    label: 'Court Hearing and Publication',
    offset_days: 120,
    description:
      'Attend court hearings; publication of notice to creditors and heirs as ordered by the court.',
    legal_basis: 'Sec. 3, Rule 76, Rules of Court',
  },
  {
    label: 'File BIR Estate Tax Return',
    offset_days: 365,
    description:
      'File BIR Form 1801 and pay estate tax within 1 year from date of death.',
    legal_basis: 'Sec. 90, NIRC',
  },
  {
    label: 'Court Order of Distribution',
    offset_days: 545,
    description:
      'Obtain final court order approving the project of partition and distribution of estate.',
    legal_basis: 'Rule 90, Rules of Court',
  },
];

export function getSettlementMilestones(track: SettlementTrack): MilestoneSeed[] {
  return track === 'ejs' ? [...EJS_MILESTONES] : [...JUDICIAL_MILESTONES];
}

// --------------------------------------------------------------------------
// isStepComplete
// --------------------------------------------------------------------------

export function isStepComplete(state: IntakeFormState, step: number): boolean {
  switch (step) {
    case 0: // Conflict Check
      return state.conflictCheck.outcome !== null;

    case 1: // Client Details
      return (
        state.clientDetails.full_name.trim() !== '' &&
        state.clientDetails.relationship_to_decedent !== null
      );

    case 2: // Decedent Info
      return (
        state.decedentInfo.full_name.trim() !== '' &&
        state.decedentInfo.date_of_death.trim() !== '' &&
        state.decedentInfo.civil_status !== null
      );

    case 3: // Family Composition
      return state.familyComposition.heirs.length > 0;

    case 4: // Asset Summary (all fields have defaults)
      return true;

    case 5: // Settlement Track
      return state.settlementTrack.track !== null;

    case 6: // Review (no input required)
      return true;

    default:
      return false;
  }
}
