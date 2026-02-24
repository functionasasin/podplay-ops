//! Philippine Inheritance Distribution Engine
//!
//! A fully deterministic engine that computes inheritance distribution
//! for Philippine estates using exact rational arithmetic.

pub mod fraction;
pub mod step1_classify;
pub mod step2_lines;
pub mod step3_scenario;
pub mod step4_estate_base;
pub mod step5_legitimes;
pub mod step6_validation;
pub mod step7_distribute;
pub mod step8_collation;
pub mod step9_vacancy;
pub mod step10_finalize;
pub mod types;
