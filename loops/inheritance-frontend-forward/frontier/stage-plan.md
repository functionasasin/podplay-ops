# Forward Ralph — Stage Plan

Dev order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Stage | Name                          | Test Filter                              | Depends On | Status  |
|-------|-------------------------------|------------------------------------------|------------|---------|
| 1     | Project Scaffold              | smoke                                    | —          | pending |
| 2     | Types & Enums                 | types                                    | 1          | blocked |
| 3     | Zod Schemas                   | schemas                                  | 2          | blocked |
| 4     | WASM Bridge Mock              | wasm                                     | 2          | blocked |
| 5     | Shared Components             | shared                                   | 1          | blocked |
| 6     | Wizard Steps 1-2              | wizard-step1\|wizard-step2\|estate\|decedent | 3, 5   | blocked |
| 7     | Wizard Step 3                 | wizard-step3\|family-tree\|person        | 3, 5       | blocked |
| 8     | Wizard Step 4                 | wizard-step4\|will\|institution\|legacy  | 7          | blocked |
| 9     | Wizard Steps 5-6              | wizard-step5\|wizard-step6\|donation\|review | 7      | blocked |
| 10    | Results View                  | results                                  | 4          | blocked |
| 11    | Validation Layer 3            | validation\|warning                      | 6, 7, 8, 9 | blocked |
| 12    | Integration & Polish          | integration\|e2e                         | all        | blocked |

Status values: blocked | pending | active | complete
