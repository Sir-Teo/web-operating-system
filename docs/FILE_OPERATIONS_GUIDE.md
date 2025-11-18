# Advanced File Operations Guide - Phase 2.1

## Overview

WebOS now includes Unix-style file operations with permissions, symbolic links, extended attributes, and file watching capabilities.

---

## 🔐 File Permissions

### chmod - Change File Permissions

Change file permissions using numeric or symbolic modes.

**Numeric Mode:**
```bash
# rwxr-xr-x (755) - Owner: rwx, Group: r-x, Others: r-x
$ chmod 755 script.sh
✅ Changed permissions of 'script.sh': -rwxr-xr-x

# rw-r--r-- (644) - Owner: rw-, Group: r--, Others: r--
$ chmod 644 file.txt
✅ Changed permissions of 'file.txt': -rw-r--r--

# rwx------ (700) - Owner only
$ chmod 700 private.sh
✅ Changed permissions of 'private.sh': -rwx------
```

**Symbolic Mode:**
```bash
# Add execute permission for owner
$ chmod +x script.sh
✅ Changed permissions of 'script.sh': -rwxr--r--

# Add write permission for group
$ chmod g+w file.txt
✅ Changed permissions of 'file.txt': -rw-rw-r--

# Remove read permission for others
$ chmod o-r secret.txt
✅ Changed permissions of 'secret.txt': -rw-rw----

# Set user permissions to read+write
$ chmod u+rw file.txt
✅ Changed permissions of 'file.txt': -rw-r--r--
```

**Permission Breakdown:**
```
-rwxr-xr-x
│││││││││└─ Others: execute
││││││││└── Others: write
│││││││└─── Others: read
││││││└──── Group: execute
│││││└───── Group: write
││││└────── Group: read
│││└─────── Owner: execute
││└──────── Owner: write
│└───────── Owner: read
└────────── File type: - (file), d (directory), l (symlink)
```

---

## 👥 File Ownership

### chown - Change File Owner

Change file owner and group.

```bash
# Change owner
$ chown alice file.txt
✅ Changed ownership of 'file.txt' to alice

# Change owner and group
$ chown bob:developers project.txt
✅ Changed ownership of 'project.txt' to bob:developers

# Change only group (using colon)
$ chown :admins config.txt
✅ Changed ownership of 'config.txt' to :admins
```

---

## 📊 File Statistics

### stat - Display Detailed File Information

Get comprehensive file statistics including permissions, ownership, timestamps, and more.

```bash
$ stat notes.txt
📊 File: notes.txt
==================================================

  Type:        file
  Size:        1024 bytes
  Permissions: -rw-r--r-- (644)
  Owner:       user:user
  Inode:       1732047123456
  Links:       1

  Created:     11/18/2025, 2:30:15 PM
  Modified:    11/18/2025, 3:45:22 PM
  Accessed:    11/18/2025, 4:00:10 PM
```

---

## 🔗 Symbolic Links

### ln -s - Create Symbolic Links

Create symbolic links (shortcuts) to files or directories.

```bash
# Create a symbolic link
$ ln -s /home/user/documents/important.txt mylink
✅ Created symbolic link: mylink → /home/user/documents/important.txt

# Link to a directory
$ ln -s /var/log logs
✅ Created symbolic link: logs → /var/log

# Create link in different directory
$ ln -s /home/user/project/data.txt /tmp/data_link
✅ Created symbolic link: /tmp/data_link → /home/user/project/data.txt
```

### readlink - Read Symbolic Link Target

Display the target of a symbolic link.

```bash
$ readlink mylink
📎 /home/user/documents/important.txt

$ readlink logs
📎 /var/log
```

**Using Symbolic Links:**
```bash
# Create a link
$ ln -s /home/user/documents/report.txt report

# Use the link like a regular file
$ cat report
This is the report content...

# Check what it points to
$ readlink report
📎 /home/user/documents/report.txt

# Get detailed info
$ stat report
📊 File: report
==================================================

  Type:        symlink
  Size:        0 bytes
  Permissions: lrwxrwxrwx (777)
  Owner:       user:user
  Inode:       1732047123789
  Links:       1
  Symlink to:  /home/user/documents/report.txt

  Created:     11/18/2025, 2:30:15 PM
  Modified:    11/18/2025, 2:30:15 PM
  Accessed:    11/18/2025, 2:30:15 PM
```

---

## 🏷️ Extended Attributes

### lsattr - List Extended Attributes

List extended attributes on files.

```bash
# List attributes for files in current directory
$ lsattr
-               notes.txt
immutable       config.sys
readonly        data.db

# List attributes for specific file
$ lsattr config.sys
📄 config.sys:

  immutable = true
  readonly = true
```

### chattr - Change Extended Attributes

Set or remove extended attributes.

```bash
# Set immutable attribute (file cannot be modified/deleted)
$ chattr +immutable important.txt
✅ Set attribute 'immutable' on important.txt

# Remove immutable attribute
$ chattr -immutable important.txt
✅ Removed attribute 'immutable' from important.txt

# Set readonly attribute
$ chattr +readonly config.ini
✅ Set attribute 'readonly' on config.ini

# Set custom attributes
$ chattr +archived backup.tar
✅ Set attribute 'archived' on backup.tar

$ chattr +encrypted secrets.txt
✅ Set attribute 'encrypted' on secrets.txt
```

**Common Extended Attributes:**
- `immutable` - File cannot be modified, renamed, or deleted
- `readonly` - File cannot be written to
- `archived` - File has been backed up
- `encrypted` - File is encrypted
- `compressed` - File is compressed
- Custom attributes for application-specific metadata

---

## 👁️ File Watching

### watch - Monitor Files/Directories for Changes

Watch files or directories and get notified of changes.

```bash
# Watch a directory
$ watch /home/user/projects
✅ Watching /home/user/projects (ID: 1)
💡 Changes will be logged to console

# Watch recursively
$ watch -r /home/user
✅ Watching /home/user (ID: 2)
💡 Changes will be logged to console

# List active watchers
$ watch
👁️  Active Watchers:

[1] /home/user/projects (non-recursive)
[2] /home/user (recursive)

💡 Use Ctrl+C to stop watching
```

**What Gets Watched:**
- File creation
- File modification
- File deletion
- File renaming

Changes are logged to the browser console in real-time.

---

## 🎯 Practical Examples

### Example 1: Secure Script Execution

```bash
# Create a script
$ echo "echo 'Hello World'" > hello.sh

# Initially no execute permission
$ ./hello.sh
❌ Permission denied

# Add execute permission
$ chmod +x hello.sh
✅ Changed permissions of 'hello.sh': -rwxr--r--

# Now it works
$ ./hello.sh
Hello World
```

### Example 2: Protect Important Files

```bash
# Create an important configuration file
$ echo "API_KEY=secret123" > .env

# Make it readonly
$ chmod 400 .env
✅ Changed permissions of '.env': -r--------

# Add immutable flag
$ chattr +immutable .env
✅ Set attribute 'immutable' on .env

# Verify protection
$ stat .env
📊 File: .env
==================================================
  Type:        file
  Permissions: -r-------- (400)
  Extended attributes: immutable
```

### Example 3: Create Project Shortcuts

```bash
# Current project structure
$ tree
📁 /home/user
├── 📁 projects
│   ├── 📁 webapp
│   └── 📁 api
└── 📁 Documents

# Create convenient links
$ ln -s /home/user/projects/webapp ~/webapp
$ ln -s /home/user/projects/api ~/api

# Now access directly
$ cd ~/webapp
$ pwd
📍 /home/user/webapp

$ readlink ~/webapp
📎 /home/user/projects/webapp
```

### Example 4: Monitor Log Directory

```bash
# Start watching logs
$ watch -r /var/log
✅ Watching /var/log (ID: 1)

# In another terminal, create a log file
$ echo "Error: Something went wrong" > /var/log/app.log

# Console will show:
# 📢 File create: /var/log/app.log

# Modify the file
$ echo "Error: Another issue" >> /var/log/app.log

# Console will show:
# 📢 File modify: /var/log/app.log
```

### Example 5: Team Collaboration Setup

```bash
# Create shared directory
$ mkdir /shared/team-project

# Set proper permissions
$ chmod 775 /shared/team-project
✅ Changed permissions of '/shared/team-project': drwxrwxr-x

# Change ownership to team group
$ chown user:team /shared/team-project
✅ Changed ownership of '/shared/team-project' to user:team

# Create symbolic links for team members
$ ln -s /shared/team-project ~/my-project
✅ Created symbolic link: ~/my-project → /shared/team-project

# Set attributes
$ chattr +shared /shared/team-project
✅ Set attribute 'shared' on /shared/team-project
```

---

## 🔧 Advanced Usage

### Permission Calculator

Calculate permission values:

| Permission | Binary | Octal |
|------------|--------|-------|
| ---        | 000    | 0     |
| --x        | 001    | 1     |
| -w-        | 010    | 2     |
| -wx        | 011    | 3     |
| r--        | 100    | 4     |
| r-x        | 101    | 5     |
| rw-        | 110    | 6     |
| rwx        | 111    | 7     |

**Examples:**
- `755` = rwxr-xr-x (Owner: all, Group: read+execute, Others: read+execute)
- `644` = rw-r--r-- (Owner: read+write, Group: read, Others: read)
- `700` = rwx------ (Owner: all, Group: none, Others: none)
- `777` = rwxrwxrwx (Everyone: all permissions)

### Batch Operations

```bash
# Change permissions for all .sh files
$ for file in *.sh; do
    chmod +x "$file"
  done

# Set attributes on multiple files
$ for file in *.conf; do
    chattr +readonly "$file"
  done

# Create multiple links
$ for dir in project1 project2 project3; do
    ln -s "/home/user/projects/$dir" "~/$dir"
  done
```

---

## 📚 Command Reference

| Command | Usage | Description |
|---------|-------|-------------|
| `chmod` | `chmod <mode> <file>` | Change file permissions |
| `chown` | `chown <owner[:group]> <file>` | Change file ownership |
| `stat` | `stat <file>` | Display file statistics |
| `ln -s` | `ln -s <target> <link>` | Create symbolic link |
| `readlink` | `readlink <link>` | Read symbolic link target |
| `lsattr` | `lsattr [file]` | List extended attributes |
| `chattr` | `chattr +/-<attr> <file>` | Change extended attributes |
| `watch` | `watch [-r] <path>` | Watch for file changes |

---

## 🐛 Troubleshooting

### Permission Denied

**Problem:** Cannot execute a script
```bash
$ ./script.sh
❌ Permission denied
```

**Solution:** Add execute permission
```bash
$ chmod +x script.sh
```

### Broken Symbolic Link

**Problem:** Link points to non-existent file
```bash
$ cat mylink
❌ cat: file not found
```

**Solution:** Check link target and recreate if needed
```bash
$ readlink mylink
📎 /path/to/missing/file

$ rm mylink
$ ln -s /correct/path/to/file mylink
```

### Cannot Modify File

**Problem:** File seems readonly
```bash
$ echo "data" > file.txt
❌ Permission denied
```

**Solution:** Check permissions and attributes
```bash
$ stat file.txt
# Check permissions and extended attributes

$ chmod +w file.txt  # Add write permission
$ chattr -immutable file.txt  # Remove immutable flag if set
```

---

## 🎓 Best Practices

1. **Use Appropriate Permissions**
   - Scripts: `755` (rwxr-xr-x)
   - Config files: `644` (rw-r--r--)
   - Secrets: `400` or `600` (r-------- or rw-------)

2. **Symbolic Links**
   - Use absolute paths for reliability
   - Document links in README
   - Check targets exist before creating

3. **Extended Attributes**
   - Use meaningful attribute names
   - Document custom attributes
   - Check attributes before operations

4. **File Watching**
   - Watch specific directories, not entire filesystem
   - Use recursive watching sparingly
   - Stop watchers when done

---

## 📖 Additional Resources

- [Main Terminal Guide](./ADVANCED_TERMINAL_FEATURES.md)
- [API Reference](./API_REFERENCE.md)
- [WebOS Architecture](./WEB_OS_ARCHITECTURE.md)

---

**Version:** 2.1
**Last Updated:** 2025-11-18
**Compatibility:** WebOS v1.0.0+
