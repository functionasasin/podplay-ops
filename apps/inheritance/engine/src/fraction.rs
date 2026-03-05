//! Exact rational arithmetic wrapper around `num_rational::BigRational`.
//!
//! ALL intermediate computations in the engine use `Frac`. Conversion to
//! centavo-precision `Money` happens only in Step 10 (finalization).
//! See Spec §15.2.

use std::fmt;
use std::ops::{Add, Div, Mul, Sub};

use num_bigint::BigInt;
use num_integer::Integer;
use num_rational::BigRational;
use num_traits::{One, Signed, Zero};
use serde::{Deserialize, Serialize};

/// Exact rational number wrapper. Always stored in lowest terms (GCD-reduced).
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Frac(BigRational);

impl Frac {
    /// Create a new fraction from numerator and denominator.
    /// Panics if denominator is zero. Automatically GCD-reduces.
    pub fn new(numer: i64, denom: i64) -> Self {
        assert!(denom != 0, "Frac: denominator cannot be zero");
        Self(BigRational::new(BigInt::from(numer), BigInt::from(denom)))
    }

    /// Create from BigInt numerator and denominator.
    pub fn from_bigint(numer: BigInt, denom: BigInt) -> Self {
        assert!(!denom.is_zero(), "Frac: denominator cannot be zero");
        Self(BigRational::new(numer, denom))
    }

    /// Create from a `BigRational` directly.
    pub fn from_rational(r: BigRational) -> Self {
        Self(r)
    }

    /// Zero.
    pub fn zero() -> Self {
        Self(BigRational::zero())
    }

    /// One.
    pub fn one() -> Self {
        Self(BigRational::one())
    }

    /// Get the underlying `BigRational`.
    pub fn as_rational(&self) -> &BigRational {
        &self.0
    }

    /// Into the underlying `BigRational`.
    pub fn into_rational(self) -> BigRational {
        self.0
    }

    /// Numerator (after GCD reduction).
    pub fn numer(&self) -> &BigInt {
        self.0.numer()
    }

    /// Denominator (after GCD reduction).
    pub fn denom(&self) -> &BigInt {
        self.0.denom()
    }

    /// Is this fraction zero?
    pub fn is_zero(&self) -> bool {
        self.0.is_zero()
    }

    /// Is this fraction negative?
    pub fn is_negative(&self) -> bool {
        self.0.is_negative()
    }

    /// Is this fraction positive?
    pub fn is_positive(&self) -> bool {
        self.0.is_positive()
    }

    /// Absolute value.
    pub fn abs(&self) -> Self {
        Self(self.0.abs())
    }

    /// Convert a Money value (centavos) to Frac.
    /// E.g., ₱1,000,000 stored as 100_000_000 centavos → Frac(100_000_000/1).
    pub fn from_money_centavos(centavos: &BigInt) -> Self {
        Self(BigRational::new(centavos.clone(), BigInt::one()))
    }

    /// Convert this fraction to centavos using banker's rounding
    /// (round half to even). Returns the rounded centavo amount.
    ///
    /// Spec §12: banker's rounding, remainder distributed to largest-share heir.
    pub fn to_centavos_rounded(&self) -> BigInt {
        bankers_round(&self.0)
    }
}

/// Banker's rounding (round half to even) for BigRational → BigInt.
fn bankers_round(r: &BigRational) -> BigInt {
    let (quotient, remainder) = r.numer().div_rem(r.denom());

    if remainder.is_zero() {
        return quotient;
    }

    // Compare 2 * |remainder| with |denom| to determine rounding direction
    let two_remainder = ((&remainder).abs()) * BigInt::from(2);
    let abs_denom = r.denom().abs();

    match two_remainder.cmp(&abs_denom) {
        std::cmp::Ordering::Less => {
            // Round toward zero (truncate)
            quotient
        }
        std::cmp::Ordering::Greater => {
            // Round away from zero
            if r.is_negative() {
                quotient - BigInt::one()
            } else {
                quotient + BigInt::one()
            }
        }
        std::cmp::Ordering::Equal => {
            // Exactly half — round to even
            if (&quotient).is_odd() {
                // Odd → round away from zero to make even
                if r.is_negative() {
                    quotient - BigInt::one()
                } else {
                    quotient + BigInt::one()
                }
            } else {
                // Even → keep (truncate)
                quotient
            }
        }
    }
}

// ── Convenience constructor ────────────────────────────────────────

/// Shorthand: `frac(1, 2)` → `Frac(1/2)`.
pub fn frac(numer: i64, denom: i64) -> Frac {
    Frac::new(numer, denom)
}

/// Convert Money centavos (BigInt) to a Frac.
pub fn money_to_frac(centavos: &BigInt) -> Frac {
    Frac::from_money_centavos(centavos)
}

/// Convert a Frac to centavos (BigInt) using banker's rounding.
pub fn frac_to_centavos(f: &Frac) -> BigInt {
    f.to_centavos_rounded()
}

// ── Arithmetic operators ───────────────────────────────────────────

impl Add for Frac {
    type Output = Frac;
    fn add(self, rhs: Frac) -> Frac {
        Frac(self.0 + rhs.0)
    }
}

impl Add for &Frac {
    type Output = Frac;
    fn add(self, rhs: &Frac) -> Frac {
        Frac(&self.0 + &rhs.0)
    }
}

impl Sub for Frac {
    type Output = Frac;
    fn sub(self, rhs: Frac) -> Frac {
        Frac(self.0 - rhs.0)
    }
}

impl Sub for &Frac {
    type Output = Frac;
    fn sub(self, rhs: &Frac) -> Frac {
        Frac(&self.0 - &rhs.0)
    }
}

impl Mul for Frac {
    type Output = Frac;
    fn mul(self, rhs: Frac) -> Frac {
        Frac(self.0 * rhs.0)
    }
}

impl Mul for &Frac {
    type Output = Frac;
    fn mul(self, rhs: &Frac) -> Frac {
        Frac(&self.0 * &rhs.0)
    }
}

impl Div for Frac {
    type Output = Frac;
    fn div(self, rhs: Frac) -> Frac {
        assert!(!rhs.is_zero(), "Frac: division by zero");
        Frac(self.0 / rhs.0)
    }
}

impl Div for &Frac {
    type Output = Frac;
    fn div(self, rhs: &Frac) -> Frac {
        assert!(!rhs.is_zero(), "Frac: division by zero");
        Frac(&self.0 / &rhs.0)
    }
}

// ── Display ────────────────────────────────────────────────────────

impl fmt::Display for Frac {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}/{}", self.0.numer(), self.0.denom())
    }
}

impl fmt::Debug for Frac {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Frac({}/{})", self.0.numer(), self.0.denom())
    }
}

// ── Serde ──────────────────────────────────────────────────────────

impl Serialize for Frac {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let s = format!("{}/{}", self.0.numer(), self.0.denom());
        serializer.serialize_str(&s)
    }
}

impl<'de> Deserialize<'de> for Frac {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let s = String::deserialize(deserializer)?;
        let parts: Vec<&str> = s.split('/').collect();
        if parts.len() != 2 {
            return Err(serde::de::Error::custom(
                "expected fraction in format 'n/d'",
            ));
        }
        let numer: BigInt = parts[0]
            .parse()
            .map_err(|_| serde::de::Error::custom("invalid numerator"))?;
        let denom: BigInt = parts[1]
            .parse()
            .map_err(|_| serde::de::Error::custom("invalid denominator"))?;
        if denom.is_zero() {
            return Err(serde::de::Error::custom("denominator cannot be zero"));
        }
        Ok(Frac(BigRational::new(numer, denom)))
    }
}

// ── Tests ──────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_frac_creation_and_reduction() {
        // 2/4 should reduce to 1/2
        let f = frac(2, 4);
        assert_eq!(f.numer(), &BigInt::from(1));
        assert_eq!(f.denom(), &BigInt::from(2));
    }

    #[test]
    fn test_frac_negative_reduction() {
        // -6/9 should reduce to -2/3
        let f = frac(-6, 9);
        assert_eq!(f.numer(), &BigInt::from(-2));
        assert_eq!(f.denom(), &BigInt::from(3));
    }

    #[test]
    fn test_frac_negative_denom() {
        // 3/-6 should normalize to -1/2
        let f = frac(3, -6);
        assert_eq!(f.numer(), &BigInt::from(-1));
        assert_eq!(f.denom(), &BigInt::from(2));
    }

    #[test]
    fn test_frac_zero() {
        let f = frac(0, 5);
        assert!(f.is_zero());
        assert_eq!(f.numer(), &BigInt::from(0));
    }

    #[test]
    fn test_frac_one() {
        let f = Frac::one();
        assert_eq!(f, frac(1, 1));
        assert_eq!(f, frac(3, 3));
    }

    #[test]
    #[should_panic(expected = "denominator cannot be zero")]
    fn test_frac_zero_denom_panics() {
        frac(1, 0);
    }

    #[test]
    fn test_addition() {
        // 1/3 + 1/6 = 1/2
        let result = frac(1, 3) + frac(1, 6);
        assert_eq!(result, frac(1, 2));
    }

    #[test]
    fn test_addition_ref() {
        let a = frac(1, 4);
        let b = frac(1, 4);
        let result = &a + &b;
        assert_eq!(result, frac(1, 2));
    }

    #[test]
    fn test_subtraction() {
        // 3/4 - 1/4 = 1/2
        let result = frac(3, 4) - frac(1, 4);
        assert_eq!(result, frac(1, 2));
    }

    #[test]
    fn test_subtraction_negative_result() {
        // 1/4 - 3/4 = -1/2
        let result = frac(1, 4) - frac(3, 4);
        assert_eq!(result, frac(-1, 2));
        assert!(result.is_negative());
    }

    #[test]
    fn test_multiplication() {
        // 2/3 * 3/4 = 1/2
        let result = frac(2, 3) * frac(3, 4);
        assert_eq!(result, frac(1, 2));
    }

    #[test]
    fn test_division() {
        // (1/2) / (2/1) = 1/4
        let result = frac(1, 2) / frac(2, 1);
        assert_eq!(result, frac(1, 4));
    }

    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_division_by_zero_panics() {
        let _ = frac(1, 2) / Frac::zero();
    }

    #[test]
    fn test_comparison() {
        assert!(frac(1, 3) < frac(1, 2));
        assert!(frac(1, 2) > frac(1, 3));
        assert!(frac(2, 4) == frac(1, 2));
        assert!(frac(1, 2) <= frac(1, 2));
        assert!(frac(1, 2) >= frac(1, 2));
    }

    #[test]
    fn test_gcd_reduction_large() {
        // 100/200 = 1/2
        let f = frac(100, 200);
        assert_eq!(f.numer(), &BigInt::from(1));
        assert_eq!(f.denom(), &BigInt::from(2));

        // 12/18 = 2/3
        let f = frac(12, 18);
        assert_eq!(f.numer(), &BigInt::from(2));
        assert_eq!(f.denom(), &BigInt::from(3));
    }

    #[test]
    fn test_gcd_coprime() {
        // 7/11 is already reduced
        let f = frac(7, 11);
        assert_eq!(f.numer(), &BigInt::from(7));
        assert_eq!(f.denom(), &BigInt::from(11));
    }

    #[test]
    fn test_money_to_frac_and_back() {
        // ₱1,000,000 = 100_000_000 centavos
        let centavos = BigInt::from(100_000_000i64);
        let f = money_to_frac(&centavos);
        let back = frac_to_centavos(&f);
        assert_eq!(back, centavos);
    }

    #[test]
    fn test_centavo_conversion_exact() {
        // 1/2 of 1,000,000 centavos = 500,000
        let estate = money_to_frac(&BigInt::from(1_000_000i64));
        let half = &estate * &frac(1, 2);
        assert_eq!(frac_to_centavos(&half), BigInt::from(500_000i64));
    }

    #[test]
    fn test_centavo_conversion_thirds() {
        // 1/3 of 100 centavos = 33.333... → banker's round to 33
        let f = frac(100, 3);
        assert_eq!(frac_to_centavos(&f), BigInt::from(33));
    }

    #[test]
    fn test_bankers_rounding_half_to_even() {
        // 1/2 = 0.5 → round to 0 (even)
        assert_eq!(frac_to_centavos(&frac(1, 2)), BigInt::from(0));

        // 3/2 = 1.5 → round to 2 (even)
        assert_eq!(frac_to_centavos(&frac(3, 2)), BigInt::from(2));

        // 5/2 = 2.5 → round to 2 (even)
        assert_eq!(frac_to_centavos(&frac(5, 2)), BigInt::from(2));

        // 7/2 = 3.5 → round to 4 (even)
        assert_eq!(frac_to_centavos(&frac(7, 2)), BigInt::from(4));
    }

    #[test]
    fn test_bankers_rounding_non_half() {
        // 7/4 = 1.75 → round to 2
        assert_eq!(frac_to_centavos(&frac(7, 4)), BigInt::from(2));

        // 5/4 = 1.25 → round to 1
        assert_eq!(frac_to_centavos(&frac(5, 4)), BigInt::from(1));
    }

    #[test]
    fn test_bankers_rounding_negative() {
        // -3/2 = -1.5 → round to -2 (even)
        assert_eq!(frac_to_centavos(&frac(-3, 2)), BigInt::from(-2));

        // -5/2 = -2.5 → round to -2 (even)
        assert_eq!(frac_to_centavos(&frac(-5, 2)), BigInt::from(-2));
    }

    #[test]
    fn test_display() {
        assert_eq!(format!("{}", frac(1, 2)), "1/2");
        assert_eq!(format!("{}", frac(10, 20)), "1/2");
        assert_eq!(format!("{}", frac(-3, 4)), "-3/4");
    }

    #[test]
    fn test_serde_roundtrip() {
        let f = frac(3, 7);
        let json = serde_json::to_string(&f).unwrap();
        assert_eq!(json, "\"3/7\"");
        let back: Frac = serde_json::from_str(&json).unwrap();
        assert_eq!(back, f);
    }

    #[test]
    fn test_min_max() {
        assert_eq!(frac(1, 3).min(frac(1, 2)), frac(1, 3));
        assert_eq!(frac(1, 3).max(frac(1, 2)), frac(1, 2));
    }

    #[test]
    fn test_abs() {
        assert_eq!(frac(-3, 4).abs(), frac(3, 4));
        assert_eq!(frac(3, 4).abs(), frac(3, 4));
    }

    #[test]
    fn test_estate_division_scenario() {
        // Simulate: estate of ₱10,000,000 (1_000_000_000 centavos)
        // 3 legitimate children, each gets 1/6 of estate (legitime = 1/2, split 3 ways)
        let estate = money_to_frac(&BigInt::from(1_000_000_000i64));
        let legitime_pool = &estate * &frac(1, 2); // 500,000,000
        let per_child = &legitime_pool / &frac(3, 1); // 166,666,666.666...

        // Verify the three shares sum to the legitime pool
        let sum = &per_child + &(&per_child + &per_child);
        assert_eq!(sum, legitime_pool);

        // Each child gets 166,666,667 centavos (banker's round of .666...)
        let centavos = frac_to_centavos(&per_child);
        assert_eq!(centavos, BigInt::from(166_666_667i64));
    }

    #[test]
    fn test_from_bigint() {
        let f = Frac::from_bigint(BigInt::from(10), BigInt::from(4));
        assert_eq!(f, frac(5, 2));
    }

    #[test]
    fn test_is_positive() {
        assert!(frac(1, 2).is_positive());
        assert!(!frac(-1, 2).is_positive());
        assert!(!Frac::zero().is_positive());
    }
}
