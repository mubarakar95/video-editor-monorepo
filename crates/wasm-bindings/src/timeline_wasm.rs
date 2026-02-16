use wasm_bindgen::prelude::*;
use serde_wasm_bindgen;
use timeline_core::{Timeline, TimelineTrack, Clip, TimeRange};

#[wasm_bindgen]
pub fn create_timeline(name: String, frame_rate: u32) -> JsValue {
    let timeline = Timeline::new(name, frame_rate);
    serde_wasm_bindgen::to_value(&timeline).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen]
pub fn parse_timeline(json: String) -> Result<JsValue, JsValue> {
    let timeline: Timeline = serde_json::from_str(&json)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;
    serde_wasm_bindgen::to_value(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn serialize_timeline(timeline: JsValue) -> Result<String, JsValue> {
    let timeline: Timeline = serde_wasm_bindgen::from_value(timeline)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    serde_json::to_string(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn add_track_to_timeline(timeline: JsValue, track: JsValue) -> Result<JsValue, JsValue> {
    let mut timeline: Timeline = serde_wasm_bindgen::from_value(timeline)
        .map_err(|e| JsValue::from_str(&format!("Timeline error: {}", e)))?;
    let track: TimelineTrack = serde_wasm_bindgen::from_value(track)
        .map_err(|e| JsValue::from_str(&format!("Track error: {}", e)))?;
    timeline.add_track(track);
    serde_wasm_bindgen::to_value(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn add_clip_to_track(timeline: JsValue, track_id: String, clip: JsValue) -> Result<JsValue, JsValue> {
    let mut timeline: Timeline = serde_wasm_bindgen::from_value(timeline)
        .map_err(|e| JsValue::from_str(&format!("Timeline error: {}", e)))?;
    let clip: Clip = serde_wasm_bindgen::from_value(clip)
        .map_err(|e| JsValue::from_str(&format!("Clip error: {}", e)))?;
    timeline.add_clip_to_track(&track_id, clip)
        .map_err(|e| JsValue::from_str(&format!("Add clip error: {}", e)))?;
    serde_wasm_bindgen::to_value(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn remove_clip(timeline: JsValue, track_id: String, clip_id: String) -> Result<JsValue, JsValue> {
    let mut timeline: Timeline = serde_wasm_bindgen::from_value(timeline)
        .map_err(|e| JsValue::from_str(&format!("Timeline error: {}", e)))?;
    timeline.remove_clip(&track_id, &clip_id)
        .map_err(|e| JsValue::from_str(&format!("Remove clip error: {}", e)))?;
    serde_wasm_bindgen::to_value(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn split_clip(timeline: JsValue, track_id: String, clip_id: String, position: JsValue) -> Result<JsValue, JsValue> {
    let mut timeline: Timeline = serde_wasm_bindgen::from_value(timeline)
        .map_err(|e| JsValue::from_str(&format!("Timeline error: {}", e)))?;
    let position: f64 = serde_wasm_bindgen::from_value(position)
        .map_err(|e| JsValue::from_str(&format!("Position error: {}", e)))?;
    timeline.split_clip(&track_id, &clip_id, position)
        .map_err(|e| JsValue::from_str(&format!("Split clip error: {}", e)))?;
    serde_wasm_bindgen::to_value(&timeline)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn get_timeline_duration(timeline: JsValue) -> JsValue {
    let timeline: Timeline = match serde_wasm_bindgen::from_value(timeline) {
        Ok(t) => t,
        Err(_) => return JsValue::from_f64(0.0),
    };
    JsValue::from_f64(timeline.duration())
}
