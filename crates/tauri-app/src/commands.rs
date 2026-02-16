use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineInfo {
    pub duration: f64,
    pub track_count: usize,
    pub clip_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
    pub has_hardware_acceleration: bool,
}

#[tauri::command]
pub fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub fn write_file(path: String, data: Vec<u8>) -> Result<(), String> {
    let parent = Path::new(&path)
        .parent()
        .ok_or_else(|| format!("Invalid path: {}", path))?;
    
    if !parent.exists() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    fs::write(&path, data).map_err(|e| format!("Failed to write file '{}': {}", path, e))
}

#[tauri::command]
pub fn get_timeline_info(path: String) -> Result<TimelineInfo, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read timeline file: {}", e))?;
    
    let timeline: timeline_core::Timeline = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse timeline: {}", e))?;
    
    let clip_count: usize = timeline.tracks.iter().map(|t| t.clips.len()).sum();
    
    Ok(TimelineInfo {
        duration: timeline.duration.as_secs_f64(),
        track_count: timeline.tracks.len(),
        clip_count,
    })
}

#[tauri::command]
pub fn export_timeline(timeline: String, output_path: String) -> Result<(), String> {
    let _timeline: timeline_core::Timeline = serde_json::from_str(&timeline)
        .map_err(|e| format!("Failed to parse timeline: {}", e))?;
    
    let parent = Path::new(&output_path)
        .parent()
        .ok_or_else(|| format!("Invalid output path: {}", output_path))?;
    
    if !parent.exists() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }
    
    fs::write(&output_path, timeline)
        .map_err(|e| format!("Failed to export timeline: {}", e))
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        has_hardware_acceleration: true,
    }
}
