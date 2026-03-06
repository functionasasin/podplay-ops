# Current Stage: 3 (Engine Pipeline)

## Status
Stage 2 complete. Types, rates, and errors fully implemented. cargo check passes.

## What To Do
Read spec §3.5, §3.6, §3.7. Implement the 16-step computation pipeline in
src/pipeline.rs. Copy test vectors from reverse loop. Write unit tests sourced
from basic.md and edge-cases.md covering all 3 paths.

Test command: `cargo test`

## Work Log
- 2026-03-06: Stage 1 complete — cargo check passes, advancing to stage 2
- 2026-03-06: Stage 2 complete — all types + rates implemented, cargo check passes
