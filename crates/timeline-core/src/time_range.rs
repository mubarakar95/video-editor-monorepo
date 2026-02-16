use serde::{Deserialize, Serialize};
use crate::RationalTime;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: RationalTime,
    pub duration: RationalTime,
}

impl TimeRange {
    pub fn new(start: RationalTime, duration: RationalTime) -> Self {
        Self { start, duration }
    }

    pub fn end(&self) -> RationalTime {
        self.start.add(&self.duration)
    }

    pub fn contains(&self, time: &RationalTime) -> bool {
        let end = self.end();
        time.to_seconds() >= self.start.to_seconds() && time.to_seconds() < end.to_seconds()
    }

    pub fn overlaps(&self, other: &TimeRange) -> bool {
        let self_end = self.end();
        let other_end = other.end();
        
        self.start.to_seconds() < other_end.to_seconds() && other.start.to_seconds() < self_end.to_seconds()
    }
}

impl Default for TimeRange {
    fn default() -> Self {
        Self {
            start: RationalTime::default(),
            duration: RationalTime::new(0, 24),
        }
    }
}
