use serde::{Deserialize, Serialize};
use crate::types::TaxpayerInput;

/// Stub EngineOutput — will be fully populated in Stage 3.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineOutput {}

/// Stub pipeline — will be implemented in Stage 3.
pub fn run_pipeline(_input: TaxpayerInput) -> EngineOutput {
    EngineOutput {}
}
