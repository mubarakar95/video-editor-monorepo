use wasm_bindgen::prelude::*;

mod clip_wasm;
mod timeline_wasm;
mod track_wasm;

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

pub use clip_wasm::*;
pub use timeline_wasm::*;
pub use track_wasm::*;
