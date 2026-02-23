# Forward Ralph — Stage Plan

Dev order: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Stage | Name                          | Spec Sections    | Depends On | Status  |
|-------|-------------------------------|------------------|------------|---------|
| 0     | Scaffold + Types + Fractions  | §3, §15          | —          | pending |
| 1     | Classify Heirs                | §4               | 0          | blocked |
| 2     | Build Lines                   | §5               | 1          | blocked |
| 3     | Succession Type + Scenario    | §3.7, §2.4       | 1          | blocked |
| 4     | Compute Estate Base           | §8.1-8.3         | 0          | blocked |
| 5     | Compute Legitimes + FP        | §6, §2.3         | 3          | blocked |
| 6     | Testate Validation            | §9               | 5          | blocked |
| 7     | Distribute Estate             | §7, §7.5         | 2, 5, 6    | blocked |
| 8     | Collation Adjustment          | §8.4-8.7         | 4, 7       | blocked |
| 9     | Vacancy Resolution            | §10              | 7          | blocked |
| 10    | Finalize + Narrate            | §11, §12         | 7, 8, 9    | blocked |
| 11    | Integration (End-to-End)      | §14              | 0-10       | blocked |

Status values: blocked | pending | active | complete
