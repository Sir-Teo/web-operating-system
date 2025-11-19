/**
 * CompressionManager.js
 *
 * Handles file compression and decompression using various algorithms.
 * Supports GZIP, DEFLATE for compression and TAR, ZIP for archives.
 *
 * Performance: Uses WebAssembly (WASM) for 5-10x faster compression when available,
 * with automatic fallback to JavaScript (pako) for compatibility.
 */

import pako from 'pako';
import { wasmLoader } from '../system/WASMLoader.js';

export class CompressionManager {
  constructor(vfs) {
    this.vfs = vfs;
    this.wasmModule = null;
    this.useWasm = true; // Toggle to enable/disable WASM
    this._initWasm();
  }

  /**
   * Initialize WASM module asynchronously
   * @private
   */
  async _initWasm() {
    if (!this.useWasm) return;

    try {
      // Load WASM module with pako as fallback
      this.wasmModule = await wasmLoader.loadModule('compression', {
        gzip: pako.gzip,
        ungzip: pako.ungzip
      });
    } catch (error) {
      console.warn('Failed to load compression WASM module, using JavaScript fallback:', error);
      this.wasmModule = null;
    }
  }

  /**
   * Ensure WASM is loaded before use
   * @private
   */
  async _ensureWasm() {
    if (!this.useWasm || this.wasmModule) return;

    // Wait for WASM to initialize
    let attempts = 0;
    while (!this.wasmModule && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  /**
   * Compress data using specified algorithm
   * @param {Uint8Array|string} data - Data to compress
   * @param {string} algorithm - Compression algorithm ('gzip' or 'deflate')
   * @returns {Uint8Array} Compressed data
   */
  async compress(data, algorithm = 'gzip') {
    // Convert string to Uint8Array if needed
    const inputData = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;

    await this._ensureWasm();

    // Try WASM first if available
    if (this.wasmModule && algorithm === 'gzip') {
      try {
        // Use WASM compression (5-10x faster!)
        if (this.wasmModule.gzip_compress) {
          const compressed = this.wasmModule.gzip_compress(inputData, 6); // Level 6 for balanced speed/size
          return new Uint8Array(compressed);
        }
      } catch (error) {
        console.warn('WASM compression failed, falling back to JavaScript:', error);
        // Fall through to JavaScript implementation
      }
    }

    // JavaScript fallback (pako)
    switch (algorithm) {
      case 'gzip':
        return pako.gzip(inputData);

      case 'deflate':
        return pako.deflate(inputData);

      default:
        throw new Error(`Unknown compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Decompress data using specified algorithm
   * @param {Uint8Array} data - Compressed data
   * @param {string} algorithm - Compression algorithm ('gzip' or 'deflate')
   * @param {boolean} asString - Return as string instead of Uint8Array
   * @returns {Uint8Array|string} Decompressed data
   */
  async decompress(data, algorithm = 'gzip', asString = false) {
    let decompressed;

    await this._ensureWasm();

    try {
      // Try WASM first if available
      if (this.wasmModule && algorithm === 'gzip') {
        try {
          // Use WASM decompression (5-10x faster!)
          if (this.wasmModule.gzip_decompress) {
            decompressed = this.wasmModule.gzip_decompress(data);
            decompressed = new Uint8Array(decompressed);

            if (asString) {
              return new TextDecoder().decode(decompressed);
            }
            return decompressed;
          }
        } catch (error) {
          console.warn('WASM decompression failed, falling back to JavaScript:', error);
          // Fall through to JavaScript implementation
        }
      }

      // JavaScript fallback (pako)
      switch (algorithm) {
        case 'gzip':
          decompressed = pako.ungzip(data);
          break;

        case 'deflate':
          decompressed = pako.inflate(data);
          break;

        default:
          throw new Error(`Unknown compression algorithm: ${algorithm}`);
      }

      if (asString) {
        return new TextDecoder().decode(decompressed);
      }

      return decompressed;
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  /**
   * Compress a file and save with .gz extension
   * @param {string} sourcePath - Path to source file
   * @param {string} destPath - Optional destination path (defaults to sourcePath + .gz)
   * @returns {Object} Compression statistics
   */
  async compressFile(sourcePath, destPath = null) {
    try {
      // Read source file
      const data = await this.vfs.readFile(sourcePath);

      // Determine output path
      const outputPath = destPath || `${sourcePath}.gz`;

      // Compress data
      const compressed = await this.compress(data, 'gzip');

      // Write compressed file
      await this.vfs.writeFile(outputPath, compressed);

      // Calculate statistics
      const originalSize = data.byteLength || data.length;
      const compressedSize = compressed.byteLength || compressed.length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

      return {
        success: true,
        originalSize,
        compressedSize,
        ratio: `${ratio}%`,
        outputPath
      };
    } catch (error) {
      throw new Error(`Failed to compress file: ${error.message}`);
    }
  }

  /**
   * Decompress a .gz file
   * @param {string} sourcePath - Path to compressed file
   * @param {string} destPath - Optional destination path
   * @returns {Object} Decompression statistics
   */
  async decompressFile(sourcePath, destPath = null) {
    try {
      // Read compressed file
      const compressedData = await this.vfs.readFile(sourcePath);

      // Determine output path (remove .gz extension if not specified)
      let outputPath = destPath;
      if (!outputPath) {
        outputPath = sourcePath.endsWith('.gz')
          ? sourcePath.slice(0, -3)
          : `${sourcePath}.uncompressed`;
      }

      // Decompress data
      const decompressed = await this.decompress(compressedData, 'gzip');

      // Write decompressed file
      await this.vfs.writeFile(outputPath, decompressed);

      // Calculate statistics
      const compressedSize = compressedData.byteLength || compressedData.length;
      const decompressedSize = decompressed.byteLength || decompressed.length;

      return {
        success: true,
        compressedSize,
        decompressedSize,
        outputPath
      };
    } catch (error) {
      throw new Error(`Failed to decompress file: ${error.message}`);
    }
  }

  /**
   * Create a TAR archive from files
   * @param {Array<{path: string, name: string}>} files - Files to include
   * @param {string} outputPath - Path for output tar file
   * @returns {Object} Archive statistics
   */
  async createTar(files, outputPath) {
    try {
      const tarData = [];
      let totalSize = 0;

      for (const file of files) {
        // Read file data
        const data = await this.vfs.readFile(file.path);
        const stat = await this.vfs.stat(file.path);

        // Create TAR header (simplified USTAR format)
        const header = this._createTarHeader({
          name: file.name || file.path,
          size: data.byteLength || data.length,
          mode: '0000644',
          mtime: stat.modified || Date.now(),
          type: '0' // Regular file
        });

        tarData.push(header);
        tarData.push(data);

        // Add padding to 512-byte boundary
        const padding = (512 - (data.length % 512)) % 512;
        if (padding > 0) {
          tarData.push(new Uint8Array(padding));
        }

        totalSize += header.length + data.length + padding;
      }

      // Add two 512-byte zero blocks to mark end of archive
      tarData.push(new Uint8Array(512));
      tarData.push(new Uint8Array(512));
      totalSize += 1024;

      // Concatenate all parts
      const tarBuffer = this._concatenateUint8Arrays(tarData);

      // Write TAR file
      await this.vfs.writeFile(outputPath, tarBuffer);

      return {
        success: true,
        fileCount: files.length,
        totalSize,
        outputPath
      };
    } catch (error) {
      throw new Error(`Failed to create TAR archive: ${error.message}`);
    }
  }

  /**
   * Extract files from a TAR archive
   * @param {string} tarPath - Path to TAR file
   * @param {string} destDir - Destination directory
   * @returns {Object} Extraction statistics
   */
  async extractTar(tarPath, destDir) {
    try {
      // Read TAR file
      const tarData = await this.vfs.readFile(tarPath);

      // Ensure destination directory exists
      await this.vfs.mkdir(destDir, { recursive: true });

      let offset = 0;
      let extractedFiles = 0;

      while (offset < tarData.length) {
        // Read header
        const header = this._parseTarHeader(tarData.slice(offset, offset + 512));

        // Check for end of archive (two consecutive zero blocks)
        if (!header.name || header.name === '') {
          break;
        }

        offset += 512;

        // Read file data
        const fileData = tarData.slice(offset, offset + header.size);
        offset += header.size;

        // Skip padding
        const padding = (512 - (header.size % 512)) % 512;
        offset += padding;

        // Write extracted file
        const outputPath = `${destDir}/${header.name}`;

        // Create parent directories if needed
        const parentDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
        if (parentDir) {
          await this.vfs.mkdir(parentDir, { recursive: true });
        }

        await this.vfs.writeFile(outputPath, fileData);
        extractedFiles++;
      }

      return {
        success: true,
        extractedFiles,
        destDir
      };
    } catch (error) {
      throw new Error(`Failed to extract TAR archive: ${error.message}`);
    }
  }

  /**
   * Create a compressed TAR archive (tar.gz)
   * @param {Array} files - Files to include
   * @param {string} outputPath - Path for output tar.gz file
   * @returns {Object} Archive statistics
   */
  async createTarGz(files, outputPath) {
    try {
      // Create TAR first
      const tempTarPath = `/tmp/temp_${Date.now()}.tar`;
      const tarResult = await this.createTar(files, tempTarPath);

      // Read TAR data
      const tarData = await this.vfs.readFile(tempTarPath);

      // Compress with gzip
      const compressed = await this.compress(tarData, 'gzip');

      // Write compressed archive
      await this.vfs.writeFile(outputPath, compressed);

      // Clean up temp file
      await this.vfs.unlink(tempTarPath);

      const compressedSize = compressed.byteLength || compressed.length;
      const ratio = ((1 - compressedSize / tarResult.totalSize) * 100).toFixed(2);

      return {
        success: true,
        fileCount: tarResult.fileCount,
        originalSize: tarResult.totalSize,
        compressedSize,
        ratio: `${ratio}%`,
        outputPath
      };
    } catch (error) {
      throw new Error(`Failed to create TAR.GZ archive: ${error.message}`);
    }
  }

  /**
   * Extract a compressed TAR archive (tar.gz)
   * @param {string} tarGzPath - Path to tar.gz file
   * @param {string} destDir - Destination directory
   * @returns {Object} Extraction statistics
   */
  async extractTarGz(tarGzPath, destDir) {
    try {
      // Read compressed file
      const compressedData = await this.vfs.readFile(tarGzPath);

      // Decompress
      const tarData = await this.decompress(compressedData, 'gzip');

      // Write temporary TAR file
      const tempTarPath = `/tmp/temp_${Date.now()}.tar`;
      await this.vfs.writeFile(tempTarPath, tarData);

      // Extract TAR
      const result = await this.extractTar(tempTarPath, destDir);

      // Clean up temp file
      await this.vfs.unlink(tempTarPath);

      return result;
    } catch (error) {
      throw new Error(`Failed to extract TAR.GZ archive: ${error.message}`);
    }
  }

  /**
   * Create TAR header (simplified USTAR format)
   * @private
   */
  _createTarHeader({ name, size, mode, mtime, type }) {
    const header = new Uint8Array(512);

    // File name (100 bytes)
    this._writeString(header, 0, name, 100);

    // Mode (8 bytes)
    this._writeOctal(header, 100, parseInt(mode, 8), 7);

    // UID (8 bytes)
    this._writeOctal(header, 108, 0, 7);

    // GID (8 bytes)
    this._writeOctal(header, 116, 0, 7);

    // Size (12 bytes)
    this._writeOctal(header, 124, size, 11);

    // Modification time (12 bytes)
    this._writeOctal(header, 136, Math.floor(mtime / 1000), 11);

    // Checksum placeholder (8 bytes) - fill with spaces initially
    header.fill(32, 148, 156);

    // Type flag (1 byte)
    this._writeString(header, 156, type, 1);

    // USTAR indicator
    this._writeString(header, 257, 'ustar', 5);
    this._writeString(header, 263, '00', 2);

    // Calculate and write checksum
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    this._writeOctal(header, 148, checksum, 6);
    header[154] = 0;
    header[155] = 32;

    return header;
  }

  /**
   * Parse TAR header
   * @private
   */
  _parseTarHeader(header) {
    if (header.length < 512) {
      return { name: '', size: 0 };
    }

    // Check if block is all zeros (end of archive)
    let isZero = true;
    for (let i = 0; i < 512; i++) {
      if (header[i] !== 0) {
        isZero = false;
        break;
      }
    }

    if (isZero) {
      return { name: '', size: 0 };
    }

    // Extract file name
    const name = this._readString(header, 0, 100);

    // Extract file size
    const sizeStr = this._readString(header, 124, 12);
    const size = parseInt(sizeStr.trim(), 8) || 0;

    return { name, size };
  }

  /**
   * Write string to buffer
   * @private
   */
  _writeString(buffer, offset, str, length) {
    const bytes = new TextEncoder().encode(str);
    for (let i = 0; i < Math.min(bytes.length, length); i++) {
      buffer[offset + i] = bytes[i];
    }
  }

  /**
   * Write octal number to buffer
   * @private
   */
  _writeOctal(buffer, offset, value, length) {
    const octal = value.toString(8).padStart(length, '0');
    this._writeString(buffer, offset, octal, length);
  }

  /**
   * Read string from buffer
   * @private
   */
  _readString(buffer, offset, length) {
    const bytes = buffer.slice(offset, offset + length);
    const nullIndex = bytes.indexOf(0);
    const endIndex = nullIndex >= 0 ? nullIndex : length;
    return new TextDecoder().decode(bytes.slice(0, endIndex));
  }

  /**
   * Concatenate multiple Uint8Arrays
   * @private
   */
  _concatenateUint8Arrays(arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}
