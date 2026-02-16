use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{Clip, RationalTime, TimeRange};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TrackKind {
    Video,
    Audio,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Track {
    pub id: Uuid,
    pub name: String,
    pub kind: TrackKind,
    pub clips: Vec<Clip>,
    pub enabled: bool,
    pub locked: bool,
}

impl Track {
    pub fn new(name: impl Into<String>, kind: TrackKind) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            kind,
            clips: Vec::new(),
            enabled: true,
            locked: false,
        }
    }

    pub fn add_clip(&mut self, clip: Clip) {
        self.clips.push(clip);
    }

    pub fn remove_clip(&mut self, clip_id: uuid::Uuid) -> Option<Clip> {
        if let Some(pos) = self.clips.iter().position(|c| c.id == clip_id) {
            Some(self.clips.remove(pos))
        } else {
            None
        }
    }

    pub fn clip_at_time(&self, time: &RationalTime) -> Option<&Clip> {
        self.clips.iter().find(|clip| clip.timeline_range.contains(time) && clip.enabled)
    }

    pub fn duration(&self) -> RationalTime {
        self.clips
            .iter()
            .filter(|c| c.enabled)
            .map(|c| c.timeline_range.end())
            .max_by(|a, b| a.to_seconds().partial_cmp(&b.to_seconds()).unwrap())
            .unwrap_or_else(|| RationalTime::new(0, 24))
    }
}

impl Default for Track {
    fn default() -> Self {
        Self::new("Track", TrackKind::Video)
    }
}
