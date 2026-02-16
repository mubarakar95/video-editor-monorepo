use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodeConfig {
    pub hardware_acceleration: bool,
    pub thread_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameInfo {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub data: Vec<u8>,
}

impl Default for DecodeConfig {
    fn default() -> Self {
        Self {
            hardware_acceleration: true,
            thread_count: 4,
        }
    }
}

pub fn init_decoder(config: DecodeConfig) -> Result<VideoDecoder, String> {
    Ok(VideoDecoder { config })
}

pub fn detect_hardware_acceleration() -> bool {
    #[cfg(target_os = "windows")]
    {
        true
    }
    #[cfg(target_os = "macos")]
    {
        true
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var("WAYLAND_DISPLAY").is_ok() 
            || std::env::var("DISPLAY").is_ok()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        false
    }
}

pub struct VideoDecoder {
    config: DecodeConfig,
}

impl VideoDecoder {
    pub fn decode_frame(&self, _data: &[u8]) -> Result<FrameInfo, String> {
        Ok(FrameInfo {
            width: 1920,
            height: 1080,
            format: "rgba8".to_string(),
            data: vec![0u8; 1920 * 1080 * 4],
        })
    }

    pub fn decode_video(&self, _path: &str) -> Result<Vec<FrameInfo>, String> {
        Ok(vec![])
    }

    pub fn get_config(&self) -> &DecodeConfig {
        &self.config
    }
}

pub fn decode_video_file(path: &str, hardware_accel: bool) -> Result<VideoDecoder, String> {
    let config = DecodeConfig {
        hardware_acceleration: hardware_accel,
        thread_count: num_cpus::get(),
    };
    init_decoder(config)
}

#[tauri::command]
pub fn decode_frame(path: String, frame_number: u32) -> Result<FrameInfo, String> {
    let config = DecodeConfig::default();
    let decoder = init_decoder(config)?;
    
    let content = std::fs::read(&path)
        .map_err(|e| format!("Failed to read video file: {}", e))?;
    
    decoder.decode_frame(&content)
}
