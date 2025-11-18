# 📦 Compression & Archives Guide

Complete guide to file compression and archive management in WebOS Terminal.

## Table of Contents

1. [Overview](#overview)
2. [File Compression](#file-compression)
3. [TAR Archives](#tar-archives)
4. [Practical Examples](#practical-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

WebOS includes built-in support for file compression and archiving, allowing you to:

- **Compress files** with gzip to save space
- **Create archives** to bundle multiple files together
- **Extract archives** to restore files
- **Reduce bandwidth** when transferring files
- **Backup data** efficiently

### Supported Formats

| Format | Extension | Type | Commands |
|--------|-----------|------|----------|
| GZIP | `.gz` | Compression | `gzip`, `gunzip` |
| TAR | `.tar` | Archive | `tar -cf`, `tar -xf` |
| TAR+GZIP | `.tar.gz`, `.tgz` | Archive + Compression | `tar -czf`, `tar -xzf` |

---

## File Compression

### GZIP Compression

GZIP is a widely-used compression algorithm that provides good compression ratios with fast performance.

#### Compress a File

```bash
gzip file.txt
```

**Output:**
```
✅ Compressed: file.txt → file.txt.gz
📊 Original:   1.50 MB
   Compressed: 450.25 KB
   Ratio:      70.02% smaller
```

**Notes:**
- Creates `file.txt.gz` in the same directory
- Original file remains unchanged
- Compression ratio depends on file type and content

#### Decompress a File

```bash
gunzip file.txt.gz
```

**Output:**
```
✅ Decompressed: file.txt.gz → file.txt
📊 Compressed:   450.25 KB
   Decompressed: 1.50 MB
```

#### Decompress with gzip -d

You can also use `gzip -d` as an alternative to `gunzip`:

```bash
gzip -d file.txt.gz
```

### Compression Examples

#### Compress Multiple Files

```bash
# Compress each file individually
gzip file1.txt
gzip file2.txt
gzip file3.txt

# Result: file1.txt.gz, file2.txt.gz, file3.txt.gz
```

#### Compress Large Files

```bash
# Compress a large log file
gzip application.log

# View compression statistics
ls -lh application.log.gz
```

#### Compress and Keep Original

WebOS gzip currently creates compressed copies. Original files are preserved by default.

---

## TAR Archives

TAR (Tape Archive) bundles multiple files and directories into a single archive file.

### Create Archives

#### Basic TAR Archive

```bash
tar -cf archive.tar file1.txt file2.txt directory/
```

**Flags:**
- `-c`: Create new archive
- `-f`: Specify archive filename

**Output:**
```
✅ Created archive: archive.tar
📦 Files: 3
📊 Size: 2.50 MB
```

#### Compressed TAR Archive (tar.gz)

```bash
tar -czf backup.tar.gz Documents/ Photos/ notes.txt
```

**Flags:**
- `-c`: Create
- `-z`: Compress with gzip
- `-f`: Filename

**Output:**
```
✅ Created archive: backup.tar.gz
📦 Files: 3
📊 Size: 15.75 MB
   Ratio: 65.23% smaller
```

### Extract Archives

#### Extract TAR Archive

```bash
tar -xf archive.tar
```

**Flags:**
- `-x`: Extract files
- `-f`: Archive filename

**Output:**
```
✅ Extracted: archive.tar
📂 Destination: /home/user
📄 Files extracted: 3
```

#### Extract Compressed Archive (tar.gz)

```bash
tar -xzf backup.tar.gz
```

**Flags:**
- `-x`: Extract
- `-z`: Decompress with gzip
- `-f`: Filename

#### Extract to Specific Directory

```bash
tar -xzf backup.tar.gz -C /home/user/restore/
```

**Flags:**
- `-C`: Change to directory before extracting

**Output:**
```
✅ Extracted: backup.tar.gz
📂 Destination: /home/user/restore/
📄 Files extracted: 156
```

### TAR Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `tar -cf` | Create archive | `tar -cf backup.tar files/` |
| `tar -czf` | Create compressed archive | `tar -czf backup.tar.gz files/` |
| `tar -xf` | Extract archive | `tar -xf backup.tar` |
| `tar -xzf` | Extract compressed archive | `tar -xzf backup.tar.gz` |
| `tar -xzf -C` | Extract to directory | `tar -xzf backup.tar.gz -C /dest/` |

---

## Practical Examples

### Example 1: Backup Your Documents

```bash
# Create compressed backup
tar -czf documents-backup-$(date +%Y%m%d).tar.gz Documents/

# Output: documents-backup-20250118.tar.gz
```

### Example 2: Archive Project Files

```bash
# Create archive of project (excluding node_modules)
cd /home/user/projects/
tar -czf myproject-v1.0.tar.gz myproject/

# Restore later
cd /home/user/restore/
tar -xzf myproject-v1.0.tar.gz
```

### Example 3: Compress Log Files

```bash
# Compress old logs to save space
cd /var/log/
gzip application.log.1
gzip application.log.2
gzip application.log.3

# Result: .gz files that are 70-90% smaller
```

### Example 4: Create Multi-File Archive

```bash
# Archive multiple configuration files
tar -czf config-backup.tar.gz \
  ~/.bashrc \
  ~/.profile \
  /etc/system.conf \
  Documents/settings/

# Extract specific files later
tar -xzf config-backup.tar.gz
```

### Example 5: Compress Before Transfer

```bash
# Compress files before sharing
gzip large-dataset.csv
# Creates: large-dataset.csv.gz (much smaller)

# Recipient decompresses
gunzip large-dataset.csv.gz
# Restores: large-dataset.csv
```

### Example 6: Archive with Directory Structure

```bash
# Create archive preserving directory structure
tar -czf website-backup.tar.gz html/ css/ js/ images/

# Extract preserving structure
tar -xzf website-backup.tar.gz -C /var/www/
```

---

## Best Practices

### 1. **Use Compression for Large Files**

```bash
# Good: Compress large files
gzip database-dump.sql          # 50MB → 5MB
tar -czf logs.tar.gz logs/      # 200MB → 20MB

# Files that compress well:
# - Text files (.txt, .log, .csv)
# - Code files (.js, .py, .html)
# - Databases (.sql, .json)

# Files that don't compress well:
# - Already compressed (.jpg, .mp4, .zip)
# - Encrypted files
# - Random data
```

### 2. **Use tar.gz for Multiple Files**

```bash
# Good: Bundle and compress together
tar -czf project.tar.gz src/ docs/ tests/

# Less efficient: Compress individually
gzip src/*
gzip docs/*
gzip tests/*
```

### 3. **Naming Conventions**

```bash
# Include dates for backups
tar -czf backup-$(date +%Y%m%d).tar.gz data/
# Output: backup-20250118.tar.gz

# Include version numbers
tar -czf myproject-v2.1.0.tar.gz myproject/

# Use descriptive names
tar -czf photos-vacation-2025.tar.gz Photos/Vacation/
```

### 4. **Verify Archives After Creation**

```bash
# Create archive
tar -czf important-data.tar.gz data/

# Verify by listing contents (future feature)
# tar -tzf important-data.tar.gz

# Or test extraction to temp directory
mkdir test-extract
tar -xzf important-data.tar.gz -C test-extract/
```

### 5. **Use Compression Levels**

Currently, WebOS uses default compression levels. Future versions may support:

```bash
# Fast compression (level 1)
gzip -1 file.txt

# Best compression (level 9)
gzip -9 file.txt

# Balanced (level 6, default)
gzip file.txt
```

---

## Compression Statistics

### Typical Compression Ratios

| File Type | Uncompressed | Compressed | Ratio |
|-----------|--------------|------------|-------|
| Text (.txt) | 1.0 MB | 250 KB | 75% |
| Code (.js) | 500 KB | 100 KB | 80% |
| Logs (.log) | 10 MB | 1.5 MB | 85% |
| CSV (.csv) | 5 MB | 800 KB | 84% |
| HTML (.html) | 200 KB | 40 KB | 80% |
| JSON (.json) | 2 MB | 400 KB | 80% |
| Images (.jpg) | 2 MB | 1.95 MB | 2.5% |
| Videos (.mp4) | 100 MB | 99.5 MB | 0.5% |
| Archives (.zip) | 10 MB | 10 MB | 0% |

### Performance Guidelines

- **Small files (<1MB)**: Instant compression
- **Medium files (1-10MB)**: <1 second
- **Large files (10-100MB)**: 1-5 seconds
- **Very large files (>100MB)**: May take longer

---

## Troubleshooting

### Issue: "File not found"

```bash
# Error
tar -czf backup.tar.gz nonexistent-file.txt

# Output
❌ tar: nonexistent-file.txt: No such file or directory

# Solution
# Check file path and spelling
ls -la
# Verify file exists before archiving
```

### Issue: Archive Creation Fails

```bash
# Error
tar -czf backup.tar.gz /protected/directory/

# Solution
# Ensure you have read permissions
# Check current directory is writable
pwd
ls -la
```

### Issue: Decompression Fails

```bash
# Error
gunzip corrupted.gz

# Output
❌ gunzip: Decompression failed: incorrect header check

# Solution
# File may be corrupted
# Download again or use backup copy
# Verify file integrity if available
```

### Issue: Disk Space

```bash
# Error
gzip very-large-file.dat

# Output
❌ gzip: Failed to compress file: Quota exceeded

# Solution
# Check available space
# Remove temporary files
# Compress to different location
```

### Issue: Wrong File Extension

```bash
# Trying to decompress non-gzip file
gunzip file.txt

# Output
❌ gunzip: file.txt: not in gzip format

# Solution
# Only decompress .gz files
# Check file type first
stat file.txt
```

---

## Advanced Usage

### Create Incremental Backups

```bash
# Daily backup
tar -czf backup-day1.tar.gz data/

# Next day (future feature: incremental)
# tar -czf backup-day2-incremental.tar.gz --newer-mtime='1 day ago' data/
```

### Archive with Timestamps

```bash
# Preserve modification times
tar -czf backup.tar.gz files/

# Restoration maintains timestamps
tar -xzf backup.tar.gz
```

### Selective Extraction (Future Feature)

```bash
# Extract only specific files
# tar -xzf backup.tar.gz file1.txt file2.txt
```

---

## Comparison with Unix Commands

WebOS compression commands are designed to be compatible with Unix/Linux:

| WebOS Command | Unix Equivalent | Compatibility |
|---------------|-----------------|---------------|
| `gzip file.txt` | `gzip file.txt` | ✅ Identical |
| `gunzip file.gz` | `gunzip file.gz` | ✅ Identical |
| `tar -czf` | `tar -czf` | ✅ Same flags |
| `tar -xzf` | `tar -xzf` | ✅ Same flags |

### Differences

1. **Original File Preservation**: WebOS gzip keeps original files by default
2. **Compression Levels**: Not yet configurable in WebOS
3. **Archive Listing**: `tar -tzf` not yet implemented
4. **Verbose Mode**: `-v` flag not yet supported

---

## Future Enhancements

Planned features for future releases:

1. **Archive Listing**: View contents without extracting
   ```bash
   tar -tzf archive.tar.gz
   ```

2. **Compression Levels**: Control speed vs size
   ```bash
   gzip -9 file.txt  # Maximum compression
   ```

3. **Bzip2 Support**: Better compression for some files
   ```bash
   bzip2 file.txt
   tar -cjf archive.tar.bz2 files/
   ```

4. **ZIP Format**: Cross-platform archives
   ```bash
   zip -r archive.zip directory/
   unzip archive.zip
   ```

5. **Progress Indicators**: Show compression progress
   ```bash
   gzip -v file.txt
   tar -czvf archive.tar.gz files/
   ```

---

## Quick Reference Card

### Essential Commands

```bash
# Compress
gzip file.txt               # Compress single file
gzip *.txt                  # Compress multiple files

# Decompress
gunzip file.txt.gz          # Decompress file
gzip -d file.txt.gz         # Alternative syntax

# Create Archive
tar -cf archive.tar files/          # Uncompressed archive
tar -czf archive.tar.gz files/      # Compressed archive

# Extract Archive
tar -xf archive.tar                 # Extract uncompressed
tar -xzf archive.tar.gz             # Extract compressed
tar -xzf archive.tar.gz -C /dest/   # Extract to directory
```

### Common Flag Combinations

```bash
-c   Create archive
-x   Extract archive
-z   Use gzip compression
-f   Specify filename
-C   Change to directory
-v   Verbose mode (future)
-t   List contents (future)
```

---

## Real-World Scenarios

### Scenario 1: Website Deployment

```bash
# Developer: Create deployment package
tar -czf website-v2.0.tar.gz html/ css/ js/ images/

# Server: Extract to production
tar -xzf website-v2.0.tar.gz -C /var/www/production/
```

### Scenario 2: Database Backup

```bash
# Export and compress database
# (assuming database exported to SQL file)
gzip database-backup-20250118.sql

# Restore later
gunzip database-backup-20250118.sql.gz
# Import database-backup-20250118.sql
```

### Scenario 3: Log Rotation

```bash
# Archive old logs
tar -czf logs-2025-01.tar.gz /var/log/*.log

# Compress current log
gzip /var/log/application.log
```

---

## Additional Resources

- **File Operations Guide**: See `FILE_OPERATIONS_GUIDE.md` for file management
- **Terminal Guide**: Type `help` in terminal for command reference
- **API Documentation**: See `/docs/API_REFERENCE.md` for programmatic access

---

## Summary

WebOS provides powerful compression and archiving tools:

✅ **GZIP** for efficient file compression
✅ **TAR** for bundling multiple files
✅ **TAR.GZ** for compressed archives
✅ **Unix-compatible** commands
✅ **Easy to use** with helpful output

Master these tools to efficiently manage storage space and bundle files for backup or transfer!

---

*Last updated: 2025-01-18*
*WebOS Version: 1.0.0 - Phase 2.2*
