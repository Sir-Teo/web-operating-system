# Phase 8: AI & ML Integration - Usage Examples

This document provides practical examples of using the AI features in WebOS.

## Table of Contents
- [AI Terminal Assistant](#ai-terminal-assistant)
- [Smart File Search](#smart-file-search)
- [Smart File Organization](#smart-file-organization)
- [Code Assistance](#code-assistance)
- [AI Chat Assistant](#ai-chat-assistant)

---

## AI Terminal Assistant

### Get Command Suggestions

```bash
# Ask how to perform a task
> ai "how do I find all PDF files?"
💡 Suggested command:
  find / -name "*.pdf"

This finds all PDF files starting from the root directory.

# Get help with file operations
> ai "show me large files in my home directory"
💡 Suggested command:
  find /home/user -type f -size +100M

This finds files larger than 100MB in your home directory.
```

### Explain Commands

```bash
# Explain a command you don't understand
> ai explain "tar -czf backup.tar.gz folder"
📖 Explanation:

The command "tar -czf backup.tar.gz folder" creates a compressed archive:
- tar: Archive utility
- -c: Create new archive
- -z: Compress with gzip
- -f: Specify output file name
- backup.tar.gz: Output file
- folder: Directory to archive

# Explain complex pipes
> ai explain "cat file.txt | grep pattern | wc -l"
📖 Explanation:

This command counts lines matching a pattern:
1. cat file.txt: Read file contents
2. grep pattern: Filter lines containing "pattern"
3. wc -l: Count the number of lines
```

### Generate Scripts

```bash
# Generate a backup script
> ai script "backup all my documents to /backup"
📝 Generated script:

#!/bin/webos
# Backup script for documents

# Create backup directory
mkdir -p /backup

# Copy documents
cp -r /home/user/documents /backup/

# Show completion message
echo "Backup completed at $(date)"
```

### Fix Errors

```bash
# Get help with an error
> ai help "command not found: pyton"
🔧 Suggestion:

Command: python

The error occurred because of a typo. You typed "pyton" instead of "python".
If python is not installed, you may need to install it first.
```

---

## Smart File Search

### Natural Language Search

```bash
# Find files by description
> smart-search "my presentation from last week"
📊 Found 2 matching files:

  95% - /home/user/documents/webos_presentation.pptx
        2.5 MB, modified 11/12/2025, 3:45 PM

  87% - /home/user/downloads/slides.pdf
        1.2 MB, modified 11/10/2025, 10:30 AM
```

### Search by File Type

```bash
# Find specific file types
> smart-search "javascript files larger than 1MB"
📊 Found 3 matching files:

  92% - /home/user/projects/app.js
        1.5 MB, modified 11/18/2025, 9:15 AM

  88% - /home/user/projects/bundle.js
        2.1 MB, modified 11/17/2025, 4:30 PM

  75% - /home/user/downloads/library.js
        1.3 MB, modified 11/15/2025, 2:00 PM
```

### Search by Time

```bash
# Find recent files
> smart-search "documents modified yesterday"
📊 Found 5 matching files:

  98% - /home/user/documents/notes.txt
        15 KB, modified 11/18/2025, 11:45 AM

  95% - /home/user/documents/report.pdf
        450 KB, modified 11/18/2025, 9:30 AM
  ...
```

---

## Smart File Organization

### Analyze and Organize

```bash
# Preview organization plan
> smart-organize /home/user/downloads --dry-run
📊 Organization Plan for /home/user/downloads:

Total files: 45

Documents (12 files):
  → /home/user/documents
    - invoice_2024.pdf
    - report.docx
    - notes.txt
    ... and 9 more

Images (23 files):
  → /home/user/pictures
    - photo1.jpg
    - screenshot.png
    - diagram.svg
    ... and 20 more

Archives (5 files):
  → /home/user/archives
    - backup.zip
    - old_files.tar.gz
    ... and 3 more

Code (5 files):
  → /home/user/projects
    - app.js
    - index.html
    ... and 3 more

(Dry run - no files were moved)
Run without --dry-run to apply changes.
```

### Apply Organization

```bash
# Actually organize the files
> smart-organize /home/user/downloads
Apply this organization? [y/n]
> y

✅ Moved 12 documents to /home/user/documents
✅ Moved 23 images to /home/user/pictures
✅ Moved 5 archives to /home/user/archives
✅ Moved 5 code files to /home/user/projects

Organization complete!
```

---

## Code Assistance

### Generate Code

```bash
# Generate a function
> code-assist generate "function to validate email addresses"
📝 Generated code:

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

# Example usage:
// console.log(validateEmail("user@example.com")); // true
// console.log(validateEmail("invalid.email")); // false
```

### Explain Code

```bash
# Explain code in a file
> code-assist explain /home/user/app.js
📖 Explanation of /home/user/app.js:

This file implements a simple Express.js web server with the following features:

1. **Dependencies**: Imports Express and other required modules
2. **Configuration**: Sets up middleware for parsing JSON and serving static files
3. **Routes**:
   - GET /: Serves the homepage
   - POST /api/users: Creates a new user
   - GET /api/users/:id: Retrieves user by ID
4. **Error Handling**: Custom error handler middleware
5. **Server**: Listens on port 3000

Key functions:
- createUser(): Validates and creates user in database
- getUserById(): Retrieves user information
- handleError(): Centralized error handling
```

### Find Bugs

```bash
# Analyze code for bugs
> code-assist bugs /home/user/script.js
🐛 Bug Analysis for /home/user/script.js:

1. 🔴 Line 15: Variable 'result' used before initialization
   Suggestion: Initialize 'result' before the if statement

2. 🟡 Line 23: Possible null reference error
   Suggestion: Add null check before accessing data.value

3. 🟢 Line 45: Missing error handling for async function
   Suggestion: Add try-catch block or .catch() handler
```

### Optimize Code

```bash
# Get optimization suggestions
> code-assist optimize /home/user/slow-function.js
⚡ Optimization Suggestions for /home/user/slow-function.js:

1. 🔥 Replace nested loops with hash map lookup (O(n²) → O(n))
   Impact: High performance improvement

2. ⚡ Cache expensive calculations outside the loop
   Impact: Medium performance improvement

3. 💡 Use array methods instead of manual loops for readability
   Impact: Code quality improvement
```

---

## AI Chat Assistant

### General Help

```
User: How do I create a new directory in WebOS?

AI: To create a new directory in WebOS, you can use the `mkdir` command:

    mkdir directory_name

For example, to create a directory called "projects":

    mkdir projects

You can also create nested directories using the -p flag:

    mkdir -p parent/child/grandchild

This creates all necessary parent directories automatically.
```

### Code Help

```
User: Help me write a function to sort an array of objects by date

AI: Here's a function to sort an array of objects by date:

    function sortByDate(array, dateProperty = 'date', ascending = true) {
      return array.sort((a, b) => {
        const dateA = new Date(a[dateProperty]);
        const dateB = new Date(b[dateProperty]);

        if (ascending) {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

Usage example:

    const events = [
      { name: 'Event 1', date: '2025-11-20' },
      { name: 'Event 2', date: '2025-11-18' },
      { name: 'Event 3', date: '2025-11-22' }
    ];

    // Sort ascending (oldest first)
    sortByDate(events);

    // Sort descending (newest first)
    sortByDate(events, 'date', false);

The function:
1. Takes an array of objects
2. Accepts an optional date property name (defaults to 'date')
3. Accepts an optional ascending parameter (defaults to true)
4. Converts the property values to Date objects for comparison
5. Returns the sorted array
```

### System Information

```
User: Explain how the WebOS file system works

AI: The WebOS Virtual File System (VFS) is a sophisticated abstraction layer that
provides a unified interface to multiple storage backends. Here's how it works:

**Architecture:**
The VFS uses a mount-point based system similar to Unix/Linux, where different
storage drivers can be mounted at various paths.

**Storage Backends:**
1. **OPFS (Origin Private File System)**: High-performance persistent storage for files
2. **IndexedDB**: Structured data and metadata storage
3. **Memory**: Temporary in-memory storage for cache and temp files

**How It Works:**
When you access a file like `/home/user/file.txt`:
1. VFS parses the path
2. Identifies which driver handles that mount point
3. Routes the operation to the appropriate driver
4. Returns the result to you

**Features:**
- File watching for change detection
- Encryption support for sensitive files
- Compression for efficient storage
- Cloud sync integration
- Permission system for security

All of this happens transparently - you just use normal file operations and
the VFS handles the complexity behind the scenes!

Would you like me to explain any specific aspect in more detail?
```

---

## Complete Workflow Example

Here's a complete workflow showing multiple AI features working together:

```bash
# 1. Ask for help organizing your downloads
> ai "how can I organize my messy downloads folder?"
💡 Suggested command:
  smart-organize /home/user/downloads --dry-run

This will show you an organization plan without actually moving files.

# 2. Run the suggested command
> smart-organize /home/user/downloads --dry-run
📊 Organization Plan...
(shows plan)

# 3. Apply the organization
> smart-organize /home/user/downloads
✅ Files organized successfully!

# 4. Search for a specific file
> smart-search "my tax documents from 2024"
📊 Found 1 matching file:
  /home/user/documents/taxes_2024.pdf

# 5. Summarize the file
> smart-summarize /home/user/documents/taxes_2024.pdf
📝 Summary:
Tax return documentation for 2024 fiscal year. Includes
income statements, deductions, and final tax calculation.

# 6. Get help writing code for a task
> code-assist generate "function to parse dates from filenames"
📝 Generated code:
function parseDateFromFilename(filename) {
  const datePattern = /(\d{4})[_-](\d{2})[_-](\d{2})/;
  const match = filename.match(datePattern);

  if (match) {
    const [_, year, month, day] = match;
    return new Date(year, month - 1, day);
  }

  return null;
}

# 7. Open AI Assistant for a longer conversation
> # Open AI Assistant app from desktop
> # Ask complex questions and get detailed help
```

---

## Best Practices

### 1. Be Specific in Your Queries

❌ Bad: "help me with files"
✅ Good: "how do I find all PDF files larger than 10MB created this week?"

### 2. Review AI Suggestions Before Running

Always review suggested commands before executing them, especially
commands that modify or delete files.

### 3. Use Natural Language

The AI understands natural language, so ask questions naturally:
- "show me my recent documents"
- "help me back up my projects"
- "explain this code to me"

### 4. Leverage Context

The AI understands context from your conversation:
```
> ai "find javascript files"
> ai "now filter to only the large ones"
(AI understands "large ones" refers to the javascript files)
```

### 5. Combine AI Tools

Use multiple AI tools together for powerful workflows:
1. Use `ai` to get command suggestions
2. Use `smart-search` to find files
3. Use `smart-organize` to clean up
4. Use `code-assist` for development
5. Use AI Assistant app for complex questions

---

## Troubleshooting

### AI Not Responding

If AI commands aren't working:
1. Check that AI service initialized: Open AI Assistant app
2. Refresh the browser
3. Check browser console for errors

### Slow Responses

AI responses may take a few seconds depending on:
- Complexity of the query
- Browser performance
- Model size

### Inaccurate Suggestions

If suggestions aren't accurate:
- Be more specific in your query
- Provide more context
- Try rephrasing your question
- Use the AI Assistant app for clarifications

---

**Happy AI-Powered Computing! 🤖✨**
