use wasm_bindgen::prelude::*;
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce, Key
};
use sha2::{Sha256, Sha512, Digest};
use pbkdf2::pbkdf2_hmac;
use hmac::Hmac;
use base64::{Engine as _, engine::general_purpose};

type HmacSha256 = Hmac<Sha256>;

// Initialize panic hook
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Derive a key from password using PBKDF2
#[wasm_bindgen]
pub fn derive_key(password: &str, salt: &[u8], iterations: u32) -> Vec<u8> {
    let mut key = vec![0u8; 32]; // 256 bits for AES-256
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, iterations, &mut key);
    key
}

/// Encrypt data using AES-256-GCM
#[wasm_bindgen]
pub fn aes_encrypt(data: &[u8], key: &[u8], nonce: &[u8]) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(JsValue::from_str("Key must be 32 bytes (256 bits)"));
    }
    if nonce.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes (96 bits)"));
    }

    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce);

    cipher
        .encrypt(nonce, data)
        .map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))
}

/// Decrypt data using AES-256-GCM
#[wasm_bindgen]
pub fn aes_decrypt(ciphertext: &[u8], key: &[u8], nonce: &[u8]) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(JsValue::from_str("Key must be 32 bytes (256 bits)"));
    }
    if nonce.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes (96 bits)"));
    }

    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| JsValue::from_str(&format!("Decryption failed: {}", e)))
}

/// Hash data using SHA-256
#[wasm_bindgen]
pub fn sha256_hash(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

/// Hash data using SHA-512
#[wasm_bindgen]
pub fn sha512_hash(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha512::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

/// Hash data using SHA-256 and return as hex string
#[wasm_bindgen]
pub fn sha256_hash_hex(data: &[u8]) -> String {
    let hash = sha256_hash(data);
    hex_encode(&hash)
}

/// Hash data using SHA-512 and return as hex string
#[wasm_bindgen]
pub fn sha512_hash_hex(data: &[u8]) -> String {
    let hash = sha512_hash(data);
    hex_encode(&hash)
}

/// Encode bytes to hex string
fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Generate a random salt for PBKDF2
#[wasm_bindgen]
pub fn generate_salt(length: usize) -> Vec<u8> {
    use getrandom::getrandom;
    let mut salt = vec![0u8; length];
    getrandom(&mut salt).expect("Failed to generate random salt");
    salt
}

/// Generate a random nonce for AES-GCM
#[wasm_bindgen]
pub fn generate_nonce() -> Vec<u8> {
    use getrandom::getrandom;
    let mut nonce = vec![0u8; 12]; // 96 bits
    getrandom(&mut nonce).expect("Failed to generate random nonce");
    nonce
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256() {
        let data = b"Hello, WebOS!";
        let hash = sha256_hash(data);
        assert_eq!(hash.len(), 32); // SHA-256 produces 32 bytes
    }

    #[test]
    fn test_sha512() {
        let data = b"Hello, WebOS!";
        let hash = sha512_hash(data);
        assert_eq!(hash.len(), 64); // SHA-512 produces 64 bytes
    }

    #[test]
    fn test_derive_key() {
        let password = "test_password";
        let salt = b"test_salt_12345";
        let key = derive_key(password, salt, 10000);
        assert_eq!(key.len(), 32); // 256 bits
    }

    #[test]
    fn test_aes_roundtrip() {
        let data = b"Secret message for WebOS";
        let key = vec![0u8; 32]; // Test key
        let nonce = vec![1u8; 12]; // Test nonce

        let encrypted = aes_encrypt(data, &key, &nonce).unwrap();
        let decrypted = aes_decrypt(&encrypted, &key, &nonce).unwrap();

        assert_eq!(data.to_vec(), decrypted);
        assert_ne!(data.to_vec(), encrypted);
    }
}
