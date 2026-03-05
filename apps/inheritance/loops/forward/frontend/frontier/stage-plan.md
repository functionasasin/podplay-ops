# Forward Ralph — Stage Plan

Dev order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13

| Stage | Name                          | Test Filter                              | Depends On | Status  |
|-------|-------------------------------|------------------------------------------|------------|---------|
| 1     | Project Scaffold              | smoke                                    | —          | pending |
| 2     | Types & Enums                 | types                                    | 1          | blocked |
| 3     | Zod Schemas                   | schemas                                  | 2          | blocked |
| 4     | WASM Bridge Mock              | wasm                                     | 2          | blocked |
| 5     | Shared Components             | shared                                   | 1          | blocked |
| 6     | Wizard Steps 1-2              | EstateStep\|DecedentStep\|WizardContainer | 3, 5      | blocked |
| 7     | Wizard Step 3                 | FamilyTreeStep\|PersonCard\|AdoptionSubForm\|FiliationSection | 3, 5 | blocked |
| 8     | Wizard Step 4                 | WillStep\|InstitutionsTab\|LegaciesTab\|DevisesTab\|DisinheritancesTab\|ShareSpecForm\|HeirReferenceForm | 7 | blocked |
| 9     | Wizard Steps 5-6              | DonationsStep\|DonationCard\|ReviewStep  | 7          | blocked |
| 10    | Results View                  | results                                  | 4          | blocked |
| 11    | Validation Layer 3            | validation\|warning                      | 6, 7, 8, 9 | blocked |
| 12    | Integration & Polish          | integration\|e2e                         | all 1-11   | blocked |
| 13    | Real WASM Engine              | wasm-real\|wasm-engine                   | 4, 12      | blocked |

Status values: blocked | pending | active | complete
