use serde::{Deserialize, Serialize};
use crate::types::{ErrorSeverity, RegimePath};

/// Hard error — computation cannot proceed.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub code: String,      // ERR_* or ASSERT_*
    pub message: String,
    pub field: Option<String>,
    pub severity: ErrorSeverity,
}

/// Non-fatal warning from validation or eligibility checks.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationWarning {
    pub code: String,      // WARN_*
    pub message: String,
    pub field: Option<String>,
}

/// Path-level ineligibility notification (IN-01 through IN-05).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IneligibilityNotification {
    pub code: String,      // IN-01 to IN-05
    pub message: String,
    pub path_excluded: RegimePath,
}

/// Item requiring human judgment that the engine cannot fully resolve.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualReviewFlag {
    pub code: String,          // MRF_*
    pub message: String,
    pub suggested_action: String,
}
