# Fork Audit — clsandoval

**Aspect**: fork-audit (Wave 2)
**Analyzed**: 2026-02-23
**Depends on**: repo-inventory
**Method**: GitHub API — `commits?author=clsandoval&per_page=5` for each of 16 forks. Also checked parent repo info.

---

## Summary

Of 16 forked repos, **14 are pure clones** (0 commits by clsandoval), **1 has minor contributions** (sapai, 2 commits Jan 2022), and **1 has meaningful upstream contributions** (ivy, 5 commits / multiple PRs merged, Jun–Aug 2023). No fork justifies showcase status. Only ivy is worth mentioning in the profile narrative (as an OSS contributor signal), but neither fork needs to remain visible on the profile — the contributions live on the upstream repos.

---

## Detailed Results

### Forks with Meaningful Commits (2)

**ivy — 5 commits, Jun–Aug 2023** — ARCHIVE fork, reference in narrative
- Implemented `torch.affine_grid` in the unify/ivy framework (PR #17384)
- Fixed missing decorator support for paddle activation backends
- All PRs merged upstream into the main ivy codebase
- Verdict: **ARCHIVE** the fork (it's a plain clone of a 16k+ star project), but this OSS contribution is worth surfacing in the profile README. Contributing merged PRs to a major ML framework shows the ability to navigate large codebases and ship production-quality work.

**sapai — 2 commits, Jan 2022** — ARCHIVE
- Added shop seeding logic
- Fixed ShopSlot/Pet state seed bugs
- Submitted as PRs to upstream sapai repo
- Context: This was part of the Super Auto Pets game AI work (connected to alpha-zero-c4 narrative), but 2 bug fixes 3+ years ago don't elevate this fork above archive threshold.
- Verdict: **ARCHIVE**

---

### Pure Clone Forks (14) — All ARCHIVE

| Fork | Last Active | Category | Reason |
|------|------------|----------|--------|
| maestro | 2026-02-14 | Agent orchestration | 0 commits by clsandoval. Fork of RunMaestro/Maestro. Recently cloned but zero original work. |
| agent-skills | 2026-01-21 | Claude/PyMC skills | 0 commits. Fork of pymc-labs/agent-skills. Cloned for reference — work happens in private org repo. |
| pymc-model-interactivity | 2026-01-28 | Bayesian | 0 commits. Clone for local exploration. |
| pymc-extras | 2026-01-26 | Bayesian | 0 commits. Clone for local exploration. |
| pytensor-workshop-demo | 2025-11-04 | Bayesian | 0 commits. Workshop participation — used the demo, didn't modify it. |
| marimo | 2025-11-26 | Tooling | 0 commits. Just cloned the reactive notebook framework. |
| rag-from-scratch | 2024-07-31 | Tutorial | 0 commits. Tutorial clone, zero follow-through. |
| StreamRAG | 2024-01-25 | Agent | 0 commits. Video streaming agent, just exploring. |
| tinygrad | 2023-11-09 | ML Framework | 0 commits. Cloned geohot's project to read the code. |
| zenml | 2023-09-15 | MLOps | 0 commits. MLOps framework evaluation. |
| sapai-gym | 2022-11-23 | Game AI | 0 commits. OpenAI Gym env for Super Auto Pets — cloned as scaffold. |
| super-auto-ai | 2022-02-03 | Game AI | 0 commits. Clone of Super Auto Pets RL agent. |
| alpha-zero-general | 2022-01-17 | Game AI | 0 commits. Forked as base to build alpha-zero-c4 from — all original work went into the separate alpha-zero-c4 repo. |
| object-detection-in-keras | 2021-11-16 | CV | 0 commits. CV tutorial clone. |

---

## Pattern: Why So Many Forks?

The fork pattern tells a consistent story: **clsandoval forks to explore/read, then builds original work in a separate repo.** Examples:

- Forked `alpha-zero-general` → built `alpha-zero-c4` from scratch (separate original repo)
- Forked `sapai*` → contributed 2 bug fixes, then abandoned for original game AI work
- Forked `agent-skills` → uses it as reference while building actual agent skills in private org repos
- Forked PyMC ecosystem repos → actively uses PyMC/PyTensor in private work at pymc-labs

This is actually a decent pattern to explain — forks are research/reference, originals are output — but it creates a noisy profile appearance. The fix is to archive all forks, not explain the pattern.

---

## Final Verdicts (All 16 Forks)

| Fork | Verdict | Commits | Reasoning |
|------|---------|---------|-----------|
| maestro | **ARCHIVE** | 0 | Pure clone, no original work |
| agent-skills | **ARCHIVE** | 0 | Clone of pymc-labs resource; actual skills work is private |
| pymc-model-interactivity | **ARCHIVE** | 0 | Clone for local exploration |
| pymc-extras | **ARCHIVE** | 0 | Clone for local exploration |
| pytensor-workshop-demo | **ARCHIVE** | 0 | Workshop demo, not original |
| marimo | **ARCHIVE** | 0 | Clone only |
| rag-from-scratch | **ARCHIVE** | 0 | Tutorial clone |
| ivy | **ARCHIVE** (fork) | 5 | Archive fork, mention OSS contributions in README narrative |
| StreamRAG | **ARCHIVE** | 0 | Clone only |
| tinygrad | **ARCHIVE** | 0 | Clone only |
| zenml | **ARCHIVE** | 0 | Clone only |
| sapai-gym | **ARCHIVE** | 0 | Clone only |
| super-auto-ai | **ARCHIVE** | 0 | Clone only |
| sapai | **ARCHIVE** | 2 | Minor bug fixes 3+ years ago, below keep threshold |
| alpha-zero-general | **ARCHIVE** | 0 | Original work lives in alpha-zero-c4 instead |
| object-detection-in-keras | **ARCHIVE** | 0 | CV tutorial clone |

**All 16 forks: ARCHIVE**

---

## Spec Implications

1. **Archive all 16 forks** — No fork justifies staying visible. signal-vs-noise's tentative KEEP for agent-skills is revoked: 0 original commits means it's a pure clone despite interesting subject matter.

2. **ivy OSS contributions → profile README** — The merged PRs to ivy are worth one line in the profile narrative: "contributed to open source ML frameworks (ivy/unifyai)." This demonstrates ability to contribute to large codebases without keeping a noisy fork visible.

3. **Revised KEEP count**: Previous signal-vs-noise kept agent-skills as a potential KEEP — this audit changes that to ARCHIVE. Total archive count: **20 repos** (7 originals + 13 forks previously ARCHIVE + agent-skills fork).

4. **No fork needs pinning** — The 6 pin slots are all original repos.

5. **The "forks to explore, builds originals" pattern** is actually a positive character trait worth noting in the profile README (tinkerer instinct: fork to understand, then build from scratch).
