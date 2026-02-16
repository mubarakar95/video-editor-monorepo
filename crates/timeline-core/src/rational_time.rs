use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RationalTime {
    pub value: i64,
    pub rate: u32,
}

impl RationalTime {
    pub fn new(value: i64, rate: u32) -> Self {
        Self { value, rate }
    }

    pub fn from_seconds(seconds: f64, rate: u32) -> Self {
        let value = (seconds * rate as f64).round() as i64;
        Self { value, rate }
    }

    pub fn to_seconds(&self) -> f64 {
        self.value as f64 / self.rate as f64
    }

    pub fn to_frames(&self) -> i64 {
        self.value
    }

    pub fn rescaled(&self, new_rate: u32) -> Self {
        let new_value = (self.value as f64 * new_rate as f64 / self.rate as f64).round() as i64;
        Self { value: new_value, rate: new_rate }
    }

    pub fn add(&self, other: &RationalTime) -> Self {
        if self.rate == other.rate {
            Self { value: self.value + other.value, rate: self.rate }
        } else {
            let rescaled = self.rescaled(other.rate);
            Self { value: rescaled.value + other.value, rate: other.rate }
        }
    }

    pub fn subtract(&self, other: &RationalTime) -> Self {
        if self.rate == other.rate {
            Self { value: self.value - other.value, rate: self.rate }
        } else {
            let rescaled = self.rescaled(other.rate);
            Self { value: rescaled.value - other.value, rate: other.rate }
        }
    }
}

impl Default for RationalTime {
    fn default() -> Self {
        Self { value: 0, rate: 24 }
    }
}
