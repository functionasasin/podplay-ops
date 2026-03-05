#!/bin/bash
# Generate 20 test cases, run them through the engine, and produce a markdown report.
set -euo pipefail

ENGINE="./target/release/inheritance-engine"
CASES_DIR="./examples/cases"
OUTPUT_FILE="./examples/test-results.md"

mkdir -p "$CASES_DIR"

# Build release binary
cargo build --release 2>/dev/null

# ── Helper: base person JSON ─────────────────────────────────────────
person() {
  local id="$1" name="$2" rel="$3"
  local degree=1
  case "$rel" in
    LegitimateAscendant) degree=2 ;;
    Sibling) degree=2 ;;
    NephewNiece) degree=3 ;;
    OtherCollateral) degree=4 ;;
    Stranger) degree=0 ;;
  esac
  cat <<PERSON
{
  "id": "$id",
  "name": "$name",
  "is_alive_at_succession": true,
  "relationship_to_decedent": "$rel",
  "degree": $degree,
  "line": null,
  "children": [],
  "filiation_proved": true,
  "filiation_proof_type": null,
  "is_guilty_party_in_legal_separation": false,
  "adoption": null,
  "is_unworthy": false,
  "unworthiness_condoned": false,
  "has_renounced": false,
  "blood_type": null
}
PERSON
}

# ── Case 1: Single legitimate child ──────────────────────────────────
cat > "$CASES_DIR/01-single-lc.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 100000000},
  "decedent": {"id":"d","name":"Juan","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Maria","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 2: Married with 3 legitimate children ──────────────────────
cat > "$CASES_DIR/02-married-3lc.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 600000000},
  "decedent": {"id":"d","name":"Pedro","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"2000-01-01","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Rosa","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c1","name":"Ana","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Ben","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c3","name":"Carlos","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 3: 2 LC + 1 IC ─────────────────────────────────────────────
cat > "$CASES_DIR/03-2lc-1ic.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 300000000},
  "decedent": {"id":"d","name":"Diego","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Liza","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Marco","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic1","name":"Nora","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 4: Spouse only ──────────────────────────────────────────────
cat > "$CASES_DIR/04-spouse-only.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 500000000},
  "decedent": {"id":"d","name":"Elena","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"1990-06-01","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Felipe","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 5: Parents and spouse ───────────────────────────────────────
cat > "$CASES_DIR/05-parents-spouse.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 400000000},
  "decedent": {"id":"d","name":"Gloria","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"2010-03-15","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Hector","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"f","name":"Father","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateParent","degree":1,"line":"Paternal","children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"m","name":"Mother","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateParent","degree":1,"line":"Maternal","children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 6: Testate - FP to charity ─────────────────────────────────
cat > "$CASES_DIR/06-testate-charity.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 1000000000},
  "decedent": {"id":"d","name":"Isabela","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Jose","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": {
    "institutions": [
      {"id":"i1","heir":{"person_id":null,"name":"Red Cross PH","is_collective":false,"class_designation":null},"share":"EntireFreePort","conditions":[],"substitutes":[],"is_residuary":false}
    ],
    "legacies": [], "devises": [], "disinheritances": [],
    "date_executed": "2025-06-01"
  },
  "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 7: 5 legitimate children, large estate ─────────────────────
cat > "$CASES_DIR/07-5lc-large.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 5000000000},
  "decedent": {"id":"d","name":"Karlo","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Child 1","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Child 2","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c3","name":"Child 3","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c4","name":"Child 4","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c5","name":"Child 5","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 8: Parents only (no children, no spouse) ───────────────────
cat > "$CASES_DIR/08-parents-only.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 200000000},
  "decedent": {"id":"d","name":"Leo","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"f","name":"Father","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateParent","degree":1,"line":"Paternal","children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"m","name":"Mother","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateParent","degree":1,"line":"Maternal","children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 9: Illegitimate children only ───────────────────────────────
cat > "$CASES_DIR/09-ic-only.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 240000000},
  "decedent": {"id":"d","name":"Manuel","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"ic1","name":"Nina","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic2","name":"Oscar","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"FinalJudgment","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic3","name":"Paula","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 10: Married, 1LC + 1IC + spouse ─────────────────────────────
cat > "$CASES_DIR/10-married-lc-ic.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 1200000000},
  "decedent": {"id":"d","name":"Roberto","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"1995-05-20","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Sandra","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c1","name":"Tomas","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic1","name":"Ursela","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 11: Collateral siblings ─────────────────────────────────────
cat > "$CASES_DIR/11-siblings.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 360000000},
  "decedent": {"id":"d","name":"Victor","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s1","name":"Full Brother","is_alive_at_succession":true,"relationship_to_decedent":"Sibling","degree":2,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":"Full"},
    {"id":"s2","name":"Half Sister","is_alive_at_succession":true,"relationship_to_decedent":"Sibling","degree":2,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":"Half"}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 12: Escheat (no heirs) ─────────────────────────────────────
cat > "$CASES_DIR/12-escheat.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 100000000},
  "decedent": {"id":"d","name":"Wanda","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 13: Small estate (₱10,000) ─────────────────────────────────
cat > "$CASES_DIR/13-small-estate.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 1000000},
  "decedent": {"id":"d","name":"Xavier","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"2015-12-25","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Yolanda","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c1","name":"Zara","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 14: Testate with legacy ─────────────────────────────────────
cat > "$CASES_DIR/14-testate-legacy.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 2000000000},
  "decedent": {"id":"d","name":"Alberto","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"1985-04-10","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Beatriz","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c1","name":"Cesar","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Dolores","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": {
    "institutions": [],
    "legacies": [
      {"id":"l1","legatee":{"person_id":null,"name":"Church of Manila","is_collective":false,"class_designation":null},"property":{"FixedAmount":{"centavos":200000000}},"conditions":[],"substitutes":[],"is_preferred":false}
    ],
    "devises": [], "disinheritances": [],
    "date_executed": "2024-11-01"
  },
  "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 15: Representation (grandchild via predeceased parent) ──────
cat > "$CASES_DIR/15-representation.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 900000000},
  "decedent": {"id":"d","name":"Fernando","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Alive Child","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Dead Child","is_alive_at_succession":false,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":["gc1","gc2"],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"gc1","name":"Grandchild 1","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":2,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"gc2","name":"Grandchild 2","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":2,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 16: One parent + spouse ─────────────────────────────────────
cat > "$CASES_DIR/16-one-parent-spouse.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 800000000},
  "decedent": {"id":"d","name":"Gabriela","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"2005-09-01","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Hugo","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"m","name":"Mother","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateParent","degree":1,"line":"Maternal","children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 17: Adopted child (RA 8552) ────────────────────────────────
cat > "$CASES_DIR/17-adopted-child.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 600000000},
  "decedent": {"id":"d","name":"Ivan","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Bio Child","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ac1","name":"Adopted Child","is_alive_at_succession":true,"relationship_to_decedent":"AdoptedChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":{"decree_date":"2015-01-01","regime":"Ra8552","adopter":"d","adoptee":"ac1","is_stepparent_adoption":false,"biological_parent_spouse":null,"is_rescinded":false,"rescission_date":null},"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 18: IC + spouse (no LC) ─────────────────────────────────────
cat > "$CASES_DIR/18-ic-spouse.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 400000000},
  "decedent": {"id":"d","name":"Jaime","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"2000-01-01","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Karen","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic1","name":"Luis","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 19: Large family — 2LC + 2IC + spouse ───────────────────────
cat > "$CASES_DIR/19-large-family.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 3000000000},
  "decedent": {"id":"d","name":"Miguel","date_of_death":"2026-01-15","is_married":true,"date_of_marriage":"1990-01-01","marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"s","name":"Natalia","is_alive_at_succession":true,"relationship_to_decedent":"SurvivingSpouse","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c1","name":"Olivia","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Pablo","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic1","name":"Quennie","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"BirthCertificate","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"ic2","name":"Ramon","is_alive_at_succession":true,"relationship_to_decedent":"IllegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":"FinalJudgment","is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null, "donations": [],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

# ── Case 20: Donation collation ──────────────────────────────────────
cat > "$CASES_DIR/20-collation.json" <<'EOF'
{
  "net_distributable_estate": {"centavos": 800000000},
  "decedent": {"id":"d","name":"Santiago","date_of_death":"2026-01-15","is_married":false,"date_of_marriage":null,"marriage_solemnized_in_articulo_mortis":false,"was_ill_at_marriage":false,"illness_caused_death":false,"years_of_cohabitation":0,"has_legal_separation":false,"is_illegitimate":false},
  "family_tree": [
    {"id":"c1","name":"Teresa","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null},
    {"id":"c2","name":"Ulises","is_alive_at_succession":true,"relationship_to_decedent":"LegitimateChild","degree":1,"line":null,"children":[],"filiation_proved":true,"filiation_proof_type":null,"is_guilty_party_in_legal_separation":false,"adoption":null,"is_unworthy":false,"unworthiness_condoned":false,"has_renounced":false,"blood_type":null}
  ],
  "will": null,
  "donations": [
    {"id":"don1","recipient_heir_id":"c1","recipient_is_stranger":false,"value_at_time_of_donation":{"centavos":200000000},"date":"2020-01-01","description":"advance on inheritance","is_expressly_exempt":false,"is_support_education_medical":false,"is_customary_gift":false,"is_professional_expense":false,"professional_expense_parent_required":false,"professional_expense_imputed_savings":null,"is_joint_from_both_parents":false,"is_to_child_spouse_only":false,"is_joint_to_child_and_spouse":false,"is_wedding_gift":false,"is_debt_payment_for_child":false,"is_election_expense":false,"is_fine_payment":false}
  ],
  "config": {"retroactive_ra_11642":false,"max_pipeline_restarts":10}
}
EOF

echo "Generated 20 test cases in $CASES_DIR"
echo ""

# ── Run all cases and build markdown ─────────────────────────────────

DESCRIPTIONS=(
  "Single legitimate child (entire estate)"
  "Married with 3 legitimate children + spouse"
  "2 legitimate children + 1 illegitimate child"
  "Surviving spouse only"
  "Parents and surviving spouse"
  "Testate: free portion to charity"
  "5 legitimate children, large estate (₱50M)"
  "Parents only (no children, no spouse)"
  "3 illegitimate children only"
  "Married: 1 LC + 1 IC + spouse"
  "Collateral siblings (full + half blood)"
  "Escheat to state (no heirs)"
  "Small estate (₱10,000) — married with 1 child"
  "Testate with legacy to Church"
  "Representation: grandchildren via predeceased child"
  "One parent + surviving spouse"
  "Adopted child (RA 8552) + biological child"
  "Illegitimate child + surviving spouse"
  "Large family: 2LC + 2IC + spouse"
  "Donation collation: advance on inheritance"
)

{
cat <<'HEADER'
# Inheritance Engine — Test Results

20 test cases run through the Philippine Inheritance Distribution Engine.
All amounts in Philippine Pesos (₱). Engine uses exact rational arithmetic internally.

---

HEADER

for i in $(seq 1 20); do
  NUM=$(printf "%02d" "$i")
  FILE=$(ls "$CASES_DIR"/${NUM}-*.json 2>/dev/null)
  DESC="${DESCRIPTIONS[$((i-1))]}"

  echo "## Case $i: $DESC"
  echo ""

  if [ -z "$FILE" ]; then
    echo "> **ERROR**: No input file found for case $NUM"
    echo ""
    continue
  fi

  # Run engine
  RESULT=$($ENGINE "$FILE" 2>&1)
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    echo "> **ERROR** (exit $EXIT_CODE):"
    echo '```'
    echo "$RESULT"
    echo '```'
    echo ""
    continue
  fi

  # Extract key fields
  SCENARIO=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['scenario_code'])" 2>/dev/null || echo "?")
  SUCC_TYPE=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['succession_type'])" 2>/dev/null || echo "?")
  ESTATE_CENTAVOS=$(python3 -c "import json; d=json.load(open('$FILE')); print(d['net_distributable_estate']['centavos'])" 2>/dev/null || echo "?")
  ESTATE_PESOS=$(python3 -c "print(f'₱{int($ESTATE_CENTAVOS)/100:,.2f}')" 2>/dev/null || echo "?")

  echo "| Field | Value |"
  echo "|-------|-------|"
  echo "| **Estate** | $ESTATE_PESOS |"
  echo "| **Scenario** | $SCENARIO |"
  echo "| **Succession Type** | $SUCC_TYPE |"
  echo ""

  echo "### Distribution"
  echo ""
  echo "| Heir | Category | Total | From Legitime | From FP | From Intestate | Donations Imputed |"
  echo "|------|----------|-------|---------------|---------|----------------|-------------------|"

  echo "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for s in d['per_heir_shares']:
    def fmt(c):
        v = c['centavos'] if isinstance(c, dict) else c
        return f'₱{int(v)/100:,.2f}'
    cat = s['heir_category'].replace('Group','')
    mode = ' (repr)' if s['inherits_by'] == 'Representation' else ''
    print(f\"| {s['heir_name']}{mode} | {cat} | {fmt(s['total'])} | {fmt(s['from_legitime'])} | {fmt(s['from_free_portion'])} | {fmt(s['from_intestate'])} | {fmt(s['donations_imputed'])} |\")
" 2>/dev/null

  echo ""
  echo "### Narratives"
  echo ""

  echo "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for n in d['narratives']:
    print(f\"> {n['text']}\")
    print()
" 2>/dev/null

  echo "---"
  echo ""
done
} > "$OUTPUT_FILE"

echo "Results written to $OUTPUT_FILE"
