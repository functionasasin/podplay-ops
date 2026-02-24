# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-24 | engine-input-root | 1 iteration | 6 top-level fields (all required in JSON). `will` is `Option<Will>` (null=intestate). `family_tree`/`donations` are `Vec` (can be `[]`). `config` required but has logical defaults. No runtime validation beyond serde — frontend must validate more. Frac serializes as `"n/d"` string, NOT `{numer, denom}`. |
| 2 | 2026-02-24 | money | 1 iteration | Single-field struct `{centavos: number\|string}`. Custom serde: i64 as JSON number, BigInt overflow as string. Frontend displays pesos (÷100) with ₱ prefix, comma thousands, conditional centavos. Non-negative enforced by frontend (engine has no explicit check). Used in 5 input contexts + 7 output fields. `formatPeso()`, `pesosToCentavos()`, `centavosToPesos()` helper functions specified. |
