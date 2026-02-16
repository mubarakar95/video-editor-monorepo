use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::RationalTime;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MarkerColor(String);

impl MarkerColor {
    pub fn new(color: impl Into<String>) -> Self {
        Self(color.into())
    }

    pub fn red() -> Self { Self::new("red") }
    pub fn green() -> Self { Self::new("green") }
    pub fn blue() -> Self { Self::new("blue") }
    pub fn yellow() -> Self { Self::new("yellow") }
    pub fn orange() -> Self { Self::new("orange") }
    pub fn purple() -> Self { Self::new("purple") }
}

impl Default for MarkerColor {
    fn default() -> Self {
        Self::blue()
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Marker {
    pub id: Uuid,
    pub name: String,
    pub color: MarkerColor,
    pub time: RationalTime,
    pub duration: Option<RationalTime>,
    pub comment: Option<String>,
}

impl Marker {
    pub fn new(name: impl Into<String>, time: RationalTime) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            color: MarkerColor::default(),
            time,
            duration: None,
            comment: None,
        }
    }

    pub fn with_color(mut self, color: MarkerColor) -> Self {
        self.color = color;
        self
    }

    pub fn with_duration(mut self, duration: RationalTime) -> Self {
        self.duration = Some(duration);
        self
    }

    pub fn with_comment(mut self, comment: impl Into<String>) -> Self {
        self.comment = Some(comment.into());
        self
    }
}
