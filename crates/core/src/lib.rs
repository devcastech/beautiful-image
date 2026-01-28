use wasm_bindgen::prelude::*;
use image::imageops::{self};
use image::codecs::jpeg::JpegEncoder;
use image::{ColorType, RgbaImage};
use std::io::Cursor;

#[wasm_bindgen]
pub enum ResizeMode {
    Standard,
    HighQuality
}

#[wasm_bindgen(js_name = processImage)]
pub fn process_image(
    rgba_data: &[u8],
    width: u32,
    height: u32,
    quality: u8,
    sharpen_sigma: Option<f32>,
    sharpen_threshold: Option<i32>,
    blur_sigma: Option<f32>,
    brightness: Option<i32>,
    contrast: Option<f32>,
    grayscale: bool,
    invert: bool,
    hue_rotate: Option<i32>,
) -> Result<Vec<u8>, JsValue> {
    let mut img = RgbaImage::from_raw(width, height, rgba_data.to_vec())
        .ok_or_else(|| JsValue::from_str("Invalid RGBA data dimensions"))?;

    if let (Some(sigma), Some(threshold)) = (sharpen_sigma, sharpen_threshold) {
        img = imageops::unsharpen(&img, sigma, threshold);
    }

    if let Some(sigma) = blur_sigma {
        img = imageops::blur(&img, sigma);
    }

    if let Some(value) = brightness {
        img = imageops::brighten(&img, value);
    }

    if let Some(value) = contrast {
        img = imageops::contrast(&img, value);
    }

    if grayscale {
        let gray = imageops::grayscale(&img);
        img = image::DynamicImage::ImageLuma8(gray).to_rgba8();
    }

    if invert {
        imageops::invert(&mut img);
    }

    if let Some(degrees) = hue_rotate {
        img = imageops::huerotate(&img, degrees);
    }

    let rgb_image = image::DynamicImage::ImageRgba8(img).to_rgb8();
    let mut out_buffer = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut out_buffer, quality);

    encoder.encode(
        rgb_image.as_raw(),
        rgb_image.width(),
        rgb_image.height(),
        ColorType::Rgb8.into()
    ).map_err(|e| JsValue::from_str(&format!("Error encoding JPEG: {}", e)))?;

    Ok(out_buffer.into_inner())
}