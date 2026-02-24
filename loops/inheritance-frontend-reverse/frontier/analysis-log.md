# Analysis Log

| # | Timestamp | Aspect | Duration | Key Findings |
|---|-----------|--------|----------|--------------|
| 1 | 2026-02-24 | engine-input-root | 1 iteration | 6 top-level fields (all required in JSON). `will` is `Option<Will>` (null=intestate). `family_tree`/`donations` are `Vec` (can be `[]`). `config` required but has logical defaults. No runtime validation beyond serde — frontend must validate more. Frac serializes as `"n/d"` string, NOT `{numer, denom}`. |
