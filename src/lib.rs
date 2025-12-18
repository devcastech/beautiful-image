use wasm_bindgen::prelude::*;
use image::imageops::FilterType;
use image::codecs::jpeg::JpegEncoder;
use image::ColorType;
use std::io::Cursor;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub enum ResizeMode {
    Standard,
    HighQuality
}


#[wasm_bindgen(js_name = optimizeImage)]
pub fn optimize_image(
    bytes: &[u8],
    width: u32,
    quality: u8,
    mode: Option<ResizeMode>
) -> Result<Vec<u8>, JsValue> {
        let image = image::load_from_memory(bytes)
            .map_err(|e| JsValue::from_str(&format!("Error reading: {}", e)))?;

        let resize_filter = match mode {
            Some(ResizeMode::Standard) => FilterType::Triangle,
            Some(ResizeMode::HighQuality) => FilterType::Lanczos3,
            None => FilterType::Triangle,
        };

        let image_to_transform = if width < image.width(){
            console_log!("resized image");
            console_log!("before {}x{}", image.width(), image.height());
            console_log!("after {}x{}", width, image.height());
            image.resize(width, image.height(), resize_filter)
        } else {
            console_log!("default image");
            console_log!("{}x{}", width, image.height());
            image.clone()
        };
        let rgb_image = image_to_transform.to_rgb8();
        let mut out_buffer= Cursor::new(Vec::new());
        
        let mut encoder = JpegEncoder::new_with_quality(&mut out_buffer, quality);

        encoder.encode(
            rgb_image.as_raw(),
            rgb_image.width(),
            rgb_image.height(),
            ColorType::Rgb8.into()
        ).map_err(|e| JsValue::from_str(&format!("Error encoding JPEG: {}", e)))?;

        Ok(out_buffer.into_inner())
    }