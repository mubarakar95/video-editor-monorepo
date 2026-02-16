use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{RationalTime, Track, TrackKind, Clip};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TimelineMetadata {
    pub frame_rate: u32,
    pub width: u32,
    pub height: u32,
    pub sample_rate: u32,
}

impl Default for TimelineMetadata {
    fn default() -> Self {
        Self {
            frame_rate: 24,
            width: 1920,
            height: 1080,
            sample_rate: 48000,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Timeline {
    pub id: Uuid,
    pub name: String,
    pub metadata: TimelineMetadata,
    pub tracks: Vec<Track>,
    pub global_start_time: RationalTime,
}

impl Timeline {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            metadata: TimelineMetadata::default(),
            tracks: Vec::new(),
            global_start_time: RationalTime::default(),
        }
    }

    pub fn with_metadata(mut self, metadata: TimelineMetadata) -> Self {
        self.metadata = metadata;
        self
    }

    pub fn with_frame_rate(mut self, frame_rate: u32) -> Self {
        self.metadata.frame_rate = frame_rate;
        self.global_start_time = RationalTime::new(0, frame_rate);
        self
    }

    pub fn add_track(&mut self, track: Track) {
        self.tracks.push(track);
    }

    pub fn remove_track(&mut self, track_id: Uuid) -> Option<Track> {
        if let Some(pos) = self.tracks.iter().position(|t| t.id == track_id) {
            Some(self.tracks.remove(pos))
        } else {
            None
        }
    }

    pub fn duration(&self) -> RationalTime {
        self.tracks
            .iter()
            .filter(|t| t.enabled)
            .map(|t| t.duration())
            .max_by(|a, b| a.to_seconds().partial_cmp(&b.to_seconds()).unwrap())
            .unwrap_or_else(|| RationalTime::new(0, self.metadata.frame_rate))
    }

    pub fn clip_at_time(&self, time: &RationalTime) -> Option<&Clip> {
        self.tracks
            .iter()
            .filter(|t| t.enabled)
            .find_map(|track| track.clip_at_time(time))
    }

    pub fn video_tracks(&self) -> impl Iterator<Item = &Track> {
        self.tracks.iter().filter(|t| t.kind == TrackKind::Video)
    }

    pub fn audio_tracks(&self) -> impl Iterator<Item = &Track> {
        self.tracks.iter().filter(|t| t.kind == TrackKind::Audio)
    }
}

impl Default for Timeline {
    fn default() -> Self {
        Self::new("Timeline")
    }
}
