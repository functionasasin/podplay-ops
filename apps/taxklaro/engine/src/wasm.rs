use wasm_bindgen::prelude::*;
use crate::pipeline::run_pipeline;
use crate::types::TaxpayerInput;

#[wasm_bindgen]
pub fn compute_json(input_json: &str) -> Result<String, JsValue> {
    let input: TaxpayerInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("InvalidInput: {}", e)))?;
    let result = run_pipeline(input);
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("SerializeError: {}", e)))
}

#[wasm_bindgen]
pub fn validate_json(input_json: &str) -> Result<String, JsValue> {
    let input: TaxpayerInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("InvalidInput: {}", e)))?;
    let errors = crate::validation::validate_input(&input);
    serde_json::to_string(&errors)
        .map_err(|e| JsValue::from_str(&format!("SerializeError: {}", e)))
}
