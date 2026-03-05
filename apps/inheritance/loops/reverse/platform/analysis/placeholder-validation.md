# Placeholder Validation — HARD GATE

**Aspect**: placeholder-validation (Wave 4, HARD GATE)
**Date**: 2026-03-04
**Verdict**: **PASS**
**Spec file**: `docs/plans/inheritance-platform-spec.md` (81.1 KB)

---

## Scan Method

Ran four independent regex checks against the full spec:

1. **Marker words**: `(?i)\bTODO\b|\bTBD\b|\bFIXME\b|\bXXX\b|\bHACK\b|\bPLACEHOLDER\b|\bSTUB\b`
2. **Deferral phrases**: `(?i)to be defined|to be determined|will be specified later|needs further research|details tbd|see later|coming soon`
3. **Empty table cells**: `^\| .* \|  \| | \|  \| .* \|`
4. **Bare headings** (heading followed immediately by another heading with only blank line): multiline pattern

---

## Scan Results

### Check 1: Marker Words — 13 instances found, ALL PASS

| Line | Text | Classification | Pass/Fail |
|------|------|----------------|-----------|
| 12 | `"stub, UX dead end"` | Overview sentence describing what the spec covers. "stub" is a noun describing codebase category. | PASS |
| 42 | `"Cases section is a stub placeholder"` | Route Table "Key Gaps" column. Describes current state of `clients/$clientId.tsx`. Fix spec provided in §8. | PASS |
| 47 | `"Results not rendered (TODO comment)"` | Route Table "Key Gaps" column. References a literal `// TODO` comment in `share/$token.tsx:97-101`. Exact fix provided in §8 JSC-002. | PASS |
| 94 | `placeholder "Law Office of…"` | HTML `<Input placeholder="...">` attribute text. Standard UI design specification. | PASS |
| 1007 | `replace TODO comment with full ResultsHeader...` | Fix instruction: "replace the TODO comment [in source code] with [exact component code]". This is the fix, not the problem. | PASS |
| 1384 | `placeholder "Reyes & Associates Law Offices"` | HTML `<Input placeholder="...">` attribute text in onboarding form spec. | PASS |
| 1405 | `firm logo placeholder` | Refers to a placeholder image element in the onboarding UI layout. Design spec detail. | PASS |
| 1432 | `Cases section stub` | Appendix A file inventory status column. Describes code state. | PASS |
| 1434 | `window.location.reload hack` | Appendix A status column. Describes existing code. The word "hack" identifies a bad pattern to fix, per §8. | PASS |
| 1436 | `Results are a TODO comment` | Appendix A status column. Refers to `// TODO` in source. Fix in §8 JSC-002. | PASS |
| 1454 | `STUB — ClientForm + ClientList use raw HTML` | Appendix A status column. Fix in §8 JSC-009/JSC-010. | PASS |
| 1455 | `STUB — InviteMemberDialog raw HTML div` | Appendix A status column. Fix in §8 JRV-015. | PASS |
| 1504 | `placeholder stub` | Appendix B Known Failures table. Historical failure description. | PASS |

**Rule applied**: Banned words used to *describe the codebase state being fixed* are not spec-level placeholders. A spec-level placeholder would look like "TODO: specify auth flow here" or "TBD: migration strategy". None of the 13 instances match that pattern.

### Check 2: Deferral Phrases — 0 matches

Phrases "to be defined", "to be determined", "will be specified later", "needs further research", "details TBD", "see later", "coming soon" were not found anywhere in the spec.

**Result**: PASS

### Check 3: Empty Table Cells — 0 matches

No table rows with empty cells found.

**Result**: PASS

### Check 4: Bare Headings — 0 matches

No section heading immediately followed by another heading with no content between them.

**Result**: PASS

---

## Structural Completeness Spot-Check

Manually sampled 6 sections to verify substantive content:

| Section | Lines Checked | Content Present? |
|---------|--------------|------------------|
| §3.3 Session Management | 203–210 | Yes — 3 paragraphs, exact fix for flash of unauthenticated content |
| §3.4 Sign-out | 211–226 | Yes — file path, exact TSX code, behavioral explanation |
| §3.5 Password Reset | 228–338 | Yes — 2 complete new file implementations with full TSX |
| §3.6 Auth Callback | 340–419 | Yes — complete PKCE implementation + layout isolation pattern |
| §4 Environment Config | 423–500+ | Yes — env var table, exact .env.local.example, graceful fallback code |
| §10 Onboarding | 1371–1416 | Yes — 3-step flow with exact CTA text, guard logic, route registration |
| Appendix B | 1496–1530 | Yes — failure table + critical gap count summary |

All checked sections have substantive, implementation-ready content.

---

## Final Determination

**HARD GATE: PASS**

The spec at `docs/plans/inheritance-platform-spec.md` contains zero spec-level placeholders. Every section has real content. All 13 occurrences of banned-pattern words are contextual references to the codebase being audited, not deferred spec content.

The spec is cleared to proceed to `completeness-audit`.
