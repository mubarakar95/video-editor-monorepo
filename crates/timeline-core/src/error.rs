use thiserror::Error;

#[derive(Debug, Clone, Error)]
pub enum TimelineError {
    #[error("Clip not found: {0}")]
    ClipNotFound(uuid::Uuid),

    #[error("Track not found: {0}")]
    TrackNotFound(uuid::Uuid),

    #[error("Invalid time range: start {start} exceeds end {end}")]
    InvalidTimeRange { start: i64, end: i64 },

    #[error("Clip overlap detected at time {time}")]
    ClipOverlap { time: f64 },

    #[error("Invalid frame rate: {0}")]
    InvalidFrameRate(u32),

    #[error("Media source not found: {0}")]
    MediaSourceNotFound(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),

    #[error("Invalid state: {0}")]
    InvalidState(String),
}
