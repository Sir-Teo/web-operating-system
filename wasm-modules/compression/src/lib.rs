use wasm_bindgen::prelude::*;
use flate2::write::{GzEncoder, GzDecoder};
use flate2::Compression;
use std::io::Write;

// Initialize panic hook for better error messages
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Compress data using gzip
#[wasm_bindgen]
pub fn gzip_compress(data: &[u8], level: u8) -> Result<Vec<u8>, JsValue> {
    let compression_level = match level {
        0..=9 => Compression::new(level as u32),
        _ => Compression::default(),
    };

    let mut encoder = GzEncoder::new(Vec::new(), compression_level);
    encoder.write_all(data)
        .map_err(|e| JsValue::from_str(&format!("Compression failed: {}", e)))?;

    encoder.finish()
        .map_err(|e| JsValue::from_str(&format!("Failed to finalize compression: {}", e)))
}

/// Decompress gzip data
#[wasm_bindgen]
pub fn gzip_decompress(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let mut decoder = GzDecoder::new(Vec::new());
    decoder.write_all(data)
        .map_err(|e| JsValue::from_str(&format!("Decompression failed: {}", e)))?;

    decoder.finish()
        .map_err(|e| JsValue::from_str(&format!("Failed to finalize decompression: {}", e)))
}

/// Get compression ratio as a percentage
#[wasm_bindgen]
pub fn get_compression_ratio(original_size: usize, compressed_size: usize) -> f64 {
    if original_size == 0 {
        return 0.0;
    }
    (1.0 - (compressed_size as f64 / original_size as f64)) * 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gzip_roundtrip() {
        let original = b"Hello, WebOS! This is a test of gzip compression in WASM.";
        let compressed = gzip_compress(original, 6).unwrap();
        let decompressed = gzip_decompress(&compressed).unwrap();

        assert_eq!(original.to_vec(), decompressed);
        assert!(compressed.len() < original.len());
    }

    #[test]
    fn test_compression_ratio() {
        let ratio = get_compression_ratio(1000, 500);
        assert_eq!(ratio, 50.0);
    }
}
