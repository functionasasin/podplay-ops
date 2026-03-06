use serde::{Deserialize, Serialize};

/// Stub TaxpayerInput — will be fully populated in Stage 2.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TaxpayerInput {
    // Intentionally empty stub — Stage 2 fills in all fields.
}
