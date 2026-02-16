use wasm_bindgen::prelude::*;
use serde_wasm_bindgen;
use timeline_core::{TimelineTrack, TrackKind};

#[wasm_bindgen]
pub fn create_track(name: String, kind: String) -> JsValue {
    let track_kind = match kind.as_str() {
        "video" => TrackKind::Video,
        "audio" => TrackKind::Audio,
        _ => return JsValue::NULL,
    };
    let track = TimelineTrack::new(name, track_kind);
    serde_wasm_bindgen::to_value(&track).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen]
pub fn create_video_track(name: String) -> JsValue {
    let track = TimelineTrack::new(name, TrackKind::Video);
    serde_wasm_bindgen::to_value(&track).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen]
pub fn create_audio_track(name: String) -> JsValue {
    let track = TimelineTrack::new(name, TrackKind::Audio);
    serde_wasm_bindgen::to_value(&track).unwrap_or(JsValue::NULL)
}
