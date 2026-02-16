use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::RationalTime;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TransitionType {
    Cut,
    CrossDissolve,
    DipToBlack,
    Wipe,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Transition {
    pub id: Uuid,
    pub kind: TransitionType,
    pub duration: RationalTime,
    pub in_point: RationalTime,
}

impl Transition {
    pub fn new(kind: TransitionType, duration: RationalTime, in_point: RationalTime) -> Self {
        Self {
            id: Uuid::new_v4(),
            kind,
            duration,
            in_point,
        }
    }

    pub fn cut(at_time: RationalTime) -> Self {
        Self::new(TransitionType::Cut, RationalTime::new(0, at_time.rate), at_time)
    }

    pub fn cross_dissolve(duration: RationalTime, in_point: RationalTime) -> Self {
        Self::new(TransitionType::CrossDissolve, duration, in_point)
    }
}
