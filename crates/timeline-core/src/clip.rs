use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{MediaSource, TimeRange};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Clip {
    pub id: Uuid,
    pub name: String,
    pub source: MediaSource,
    pub source_range: TimeRange,
    pub timeline_range: TimeRange,
    pub effects: Vec<String>,
    pub markers: Vec<String>,
    pub enabled: bool,
    pub locked: bool,
}

impl Clip {
    pub fn new(name: impl Into<String>, source: MediaSource) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            source,
            source_range: TimeRange::default(),
            timeline_range: TimeRange::default(),
            effects: Vec::new(),
            markers: Vec::new(),
            enabled: true,
            locked: false,
        }
    }

    pub fn with_source_range(mut self, range: TimeRange) -> Self {
        self.source_range = range;
        self
    }

    pub fn with_timeline_range(mut self, range: TimeRange) -> Self {
        self.timeline_range = range;
        self
    }
}
