# Forward Ralph — Stage Plan (Inheritance Premium)

Dev order: 1 → 2 → 3 → 4-9 (parallel) → 10 → 11 → 12-16 (parallel) → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25

| Stage | Name                        | Spec     | Test Filter                        | Depends On        | Status  |
|-------|-----------------------------|----------|------------------------------------|--------------------|---------|
| 1     | Supabase + Deps Setup       | —        | supabase                           | —                  | complete |
| 2     | TanStack Router + Layout    | —        | router\|layout                     | 1                  | complete |
| 3     | Auth & Persistence          | §4.2     | auth\|cases\|auto-save\|dashboard  | 1, 2               | complete |
| 4     | Decedent Header             | §4.13    | decedent-header                    | —                  | complete |
| 5     | Representation Display      | §4.14    | representation                     | —                  | complete |
| 6     | Share Breakdown Panel       | §4.12    | share-breakdown                    | —                  | complete |
| 7     | Statute Citations UI        | §4.5     | statute-citations\|ncc-article     | —                  | complete |
| 8     | Print Layout                | §4.7     | print                              | —                  | active |
| 9     | Donation Summary            | §4.15    | donation-summary                   | —                  | blocked |
| 10    | Firm Branding               | §4.4     | firm-branding\|settings            | 3                  | blocked |
| 11    | PDF Export                  | §4.1     | pdf                                | 7, 6, 4, 5, 9, 10 | blocked |
| 12    | Case Notes                  | §4.6     | case-notes                         | 3                  | blocked |
| 13    | Shareable Links             | §4.10    | share\|shareable                   | 3                  | blocked |
| 14    | Case Export ZIP             | §4.16    | zip\|export-archive                | 11, 3              | blocked |
| 15    | Scenario Comparison         | §4.8     | comparison\|scenario-compare       | 3                  | blocked |
| 16    | Family Tree Visualizer      | §4.19    | family-tree-viz\|tree-tab          | —                  | blocked |
| 17    | Client Profiles             | §4.3     | client\|crm                        | 3                  | blocked |
| 18    | Conflict Check              | §4.17    | conflict                           | 17                 | blocked |
| 19    | Guided Intake Form          | §4.18    | intake                             | 17, 18             | blocked |
| 20    | Deadline Tracker            | §4.20    | deadline                           | 3                  | blocked |
| 21    | Document Checklist          | §4.22    | document-checklist\|doc-check      | 3                  | blocked |
| 22    | Timeline Report             | §4.21    | timeline                           | 20                 | blocked |
| 23    | Estate Tax Inputs Wizard    | §4.23    | estate-tax\|tax-wizard             | 3                  | blocked |
| 24    | BIR Form 1801 Integration   | §4.9     | bir\|form-1801\|tax-bridge         | 23, 11             | blocked |
| 25    | Multi-Seat Firm Accounts    | §4.11    | multi-seat\|organization\|team     | all                | blocked |

Status values: blocked | pending | active | complete
