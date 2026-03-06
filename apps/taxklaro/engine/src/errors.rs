use serde::{Deserialize, Serialize};

/// Stub error types — will be fully populated in Stage 2.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub code: String,
    pub message: String,
}
