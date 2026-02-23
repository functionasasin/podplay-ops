# Forward Ralph — Stage Plan

Dev order: 1 → 2 → 4 → 3 → 5 → 6 → 7

| Stage | Name              | Spec Section | Depends On | Status   |
|-------|-------------------|-------------|------------|----------|
| 1     | Content Ingestion | 3.1, 9.1   | —          | pending  |
| 2     | Script Generation | 3.2, 9.2   | 1          | blocked  |
| 4     | TTS Narration     | 3.4, 9.3   | 2          | blocked  |
| 3     | Scene Matching    | 3.3, 9.4   | 1, 2       | blocked  |
| 5     | Dialogue Moments  | 3.5, 9.5   | 1, 2       | blocked  |
| 6     | Audio Mixing      | 3.6, 9.6   | 4, 5       | blocked  |
| 7     | Video Assembly    | 3.7, 9.7   | 3, 6       | blocked  |

Status values: blocked | pending | active | complete
