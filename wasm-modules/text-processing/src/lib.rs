use wasm_bindgen::prelude::*;
use regex::Regex;
use aho_corasick::AhoCorasick;
use serde::{Deserialize, Serialize};

// Initialize panic hook
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize)]
pub struct Match {
    pub start: usize,
    pub end: usize,
    pub text: String,
}

/// Search for a pattern in text using regex
#[wasm_bindgen]
pub fn regex_search(text: &str, pattern: &str, case_sensitive: bool) -> Result<JsValue, JsValue> {
    let pattern_str = if case_sensitive {
        pattern.to_string()
    } else {
        format!("(?i){}", pattern)
    };

    let re = Regex::new(&pattern_str)
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))?;

    let matches: Vec<Match> = re
        .find_iter(text)
        .map(|m| Match {
            start: m.start(),
            end: m.end(),
            text: m.as_str().to_string(),
        })
        .collect();

    serde_wasm_bindgen::to_value(&matches)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Count occurrences of a pattern
#[wasm_bindgen]
pub fn count_matches(text: &str, pattern: &str, case_sensitive: bool) -> Result<usize, JsValue> {
    let pattern_str = if case_sensitive {
        pattern.to_string()
    } else {
        format!("(?i){}", pattern)
    };

    let re = Regex::new(&pattern_str)
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))?;

    Ok(re.find_iter(text).count())
}

/// Replace pattern in text using regex
#[wasm_bindgen]
pub fn regex_replace(text: &str, pattern: &str, replacement: &str, case_sensitive: bool) -> Result<String, JsValue> {
    let pattern_str = if case_sensitive {
        pattern.to_string()
    } else {
        format!("(?i){}", pattern)
    };

    let re = Regex::new(&pattern_str)
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))?;

    Ok(re.replace_all(text, replacement).to_string())
}

/// Multi-pattern search using Aho-Corasick (very fast for multiple patterns)
#[wasm_bindgen]
pub fn multi_pattern_search(text: &str, patterns: JsValue) -> Result<JsValue, JsValue> {
    let patterns: Vec<String> = serde_wasm_bindgen::from_value(patterns)
        .map_err(|e| JsValue::from_str(&format!("Invalid patterns: {}", e)))?;

    let ac = AhoCorasick::new(&patterns)
        .map_err(|e| JsValue::from_str(&format!("Failed to build automaton: {}", e)))?;

    let mut matches: Vec<Match> = Vec::new();
    for mat in ac.find_iter(text) {
        matches.push(Match {
            start: mat.start(),
            end: mat.end(),
            text: text[mat.start()..mat.end()].to_string(),
        });
    }

    serde_wasm_bindgen::to_value(&matches)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Split text by pattern
#[wasm_bindgen]
pub fn regex_split(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    let re = Regex::new(pattern)
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))?;

    let parts: Vec<String> = re.split(text).map(|s| s.to_string()).collect();

    serde_wasm_bindgen::to_value(&parts)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Test if text matches pattern
#[wasm_bindgen]
pub fn regex_test(text: &str, pattern: &str, case_sensitive: bool) -> Result<bool, JsValue> {
    let pattern_str = if case_sensitive {
        pattern.to_string()
    } else {
        format!("(?i){}", pattern)
    };

    let re = Regex::new(&pattern_str)
        .map_err(|e| JsValue::from_str(&format!("Invalid regex: {}", e)))?;

    Ok(re.is_match(text))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex_search() {
        let text = "Hello WebOS! Welcome to WebOS.";
        let result = regex_search(text, "WebOS", true);
        assert!(result.is_ok());
    }

    #[test]
    fn test_count_matches() {
        let text = "foo bar foo baz foo";
        let count = count_matches(text, "foo", true).unwrap();
        assert_eq!(count, 3);
    }

    #[test]
    fn test_regex_replace() {
        let text = "Hello World";
        let result = regex_replace(text, "World", "WebOS", true).unwrap();
        assert_eq!(result, "Hello WebOS");
    }

    #[test]
    fn test_regex_test() {
        let text = "test@example.com";
        let is_email = regex_test(text, r"^\S+@\S+\.\S+$", true).unwrap();
        assert!(is_email);
    }
}
