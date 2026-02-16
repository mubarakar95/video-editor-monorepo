use wasm_bindgen::prelude::*;
use serde_wasm_bindgen;
use timeline_core::{Clip, TimeRange};

#[wasm_bindgen]
pub fn create_clip(name: String, source_path: String, source_range: JsValue, timeline_range: JsValue) -> JsValue {
    let source_range: TimeRange = match serde_wasm_bindgen::from_value(source_range) {
        Ok(r) => r,
        Err(_) => return JsValue::NULL,
    };
    let timeline_range: TimeRange = match serde_wasm_bindgen::from_value(timeline_range) {
        Ok(r) => r,
        Err(_) => return JsValue::NULL,
    };
    let clip = Clip::new(name, source_path, source_range, timeline_range);
    serde_wasm_bindgen::to_value(&clip).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen]
pub fn trim_clip(clip: JsValue, new_start: JsValue, new_duration: JsValue) -> JsValue {
    let mut clip: Clip = match serde_wasm_bindgen::from_value(clip) {
        Ok(c) => c,
        Err(_) => return JsValue::NULL,
    };
    let new_start: f64 = match serde_wasm_bindgen::from_value(new_start) {
        Ok(s) => s,
        Err(_) => return JsValue::NULL,
    };
    let new_duration: f64 = match serde_wasm_bindgen::from_value(new_duration) {
        Ok(d) => d,
        Err(_) => return JsValue::NULL,
    };
    clip.trim(new_start, new_duration);
    serde_wasm_bindgen::to_value(&clip).unwrap_or(JsValue::NULL)
}
