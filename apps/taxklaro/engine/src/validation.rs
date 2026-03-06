use crate::errors::EngineError;
use crate::types::TaxpayerInput;

/// Stub validation — will be implemented in Stage 3.
pub fn validate_input(_input: &TaxpayerInput) -> Vec<EngineError> {
    vec![]
}
