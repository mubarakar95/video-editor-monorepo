use serde::{Deserialize, Serialize};
use crate::RationalTime;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MediaSource {
    pub path: String,
    pub hash: Option<String>,
}

impl MediaSource {
    pub fn new(path: impl Into<String>) -> Self {
        Self { path: path.into(), hash: None }
    }

    pub fn with_hash(mut self, hash: impl Into<String>) -> Self {
        self.hash = Some(hash.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub duration: RationalTime,
    pub frame_rate: u32,
    pub width: u32,
    pub height: u32,
    pub has_audio: bool,
    pub has_video: bool,
}

impl Default for MediaMetadata {
    fn default() -> Self {
        Self {
            duration: RationalTime::new(0, 24),
            frame_rate: 24,
            width: 1920,
            height: 1080,
            has_audio: true,
            has_video: true,
        }
    }
}
