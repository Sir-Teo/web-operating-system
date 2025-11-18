# Advanced Terminal Features Guide

## Overview

WebOS Terminal v2.0 includes powerful advanced features that bring it closer to a real Unix shell experience. This guide covers shell scripting, background jobs, process control, themes, and productivity enhancements.

---

## 🔄 Job Control & Background Execution

### Background Jobs

Run commands in the background using the `&` operator:

```bash
# Run a command in background
find / -name "*.txt" &

# Multiple background jobs
ls -R /home &
cat large_file.txt | grep "pattern" &
```

### Job Management Commands

| Command | Description | Example |
|---------|-------------|---------|
| `jobs` | List all background jobs | `jobs` |
| `fg <id>` | Bring job to foreground | `fg 1` |
| `bg <id>` | Resume job in background | `bg 2` |
| `wait <id>` | Wait for job to complete | `wait 3` |
| `kill <id>` | Terminate a job | `kill 1` |

### Example Workflow

```bash
# Start a long-running command in background
$ find /home -name "*.log" &
✅ Job [1] started in background: find /home -name "*.log"

# Check job status
$ jobs
┌──────┬──────────────┬────────────────────────────────────┐
│ ID   │ STATUS       │ COMMAND                            │
├──────┼──────────────┼────────────────────────────────────┤
│ [1]  │ 🟢 Running   │ find /home -name "*.log"           │
└──────┴──────────────┴────────────────────────────────────┘

# Wait for job to finish
$ wait 1
[1] done
📄 /home/user/app.log
📄 /home/user/system.log
```

---

## ⌨️ Keyboard Shortcuts & Process Control

### Signal Handling

| Shortcut | Function | Description |
|----------|----------|-------------|
| `Ctrl+C` | SIGINT | Interrupt/kill foreground job |
| `Ctrl+Z` | SIGTSTP | Suspend foreground job |
| `Ctrl+D` | EOF | Exit/logout |
| `Ctrl+R` | Search | Fuzzy search command history |
| `Ctrl+L` | Clear | Clear screen |

### Example: Process Control

```bash
# Start a command
$ cat very_large_file.txt

# Press Ctrl+Z to suspend it
^Z
🟡 Job [1] stopped
💡 Use 'fg 1' to resume or 'bg 1' to run in background

# Resume in background
$ bg 1
✅ Job [1] resumed in background

# Or kill it
$ kill 1
✅ Job [1] killed
```

---

## 📜 Shell Scripting

### Overview

WebOS supports shell scripting with:
- ✅ Variables and parameter expansion
- ✅ Conditionals (if/else)
- ✅ Loops (for, while)
- ✅ Functions
- ✅ Command substitution

### Variables

```bash
# Simple assignment
name="WebOS"
version=2.0

# Variable expansion
echo "Welcome to $name version $version"
echo "Home directory: ${HOME}"

# Command substitution
current_date=$(date)
echo "Today is: $current_date"
```

### Conditionals

```bash
# If statement
if [ -f "file.txt" ]; then
  echo "File exists"
else
  echo "File not found"
fi

# String comparison
if [ "$USER" = "admin" ]; then
  echo "Admin user"
fi

# Numeric comparison
count=10
if [ $count -gt 5 ]; then
  echo "Count is greater than 5"
fi
```

### Loops

**For Loop:**

```bash
# Iterate over list
for file in *.txt; do
  echo "Processing: $file"
  cat "$file"
done

# Iterate over values
for i in 1 2 3 4 5; do
  echo "Number: $i"
done
```

**While Loop:**

```bash
counter=0
while [ $counter -lt 10 ]; do
  echo "Counter: $counter"
  counter=$((counter + 1))
done
```

### Functions

```bash
# Define a function
greet() {
  echo "Hello, $1!"
  echo "You passed $# arguments"
}

# Call the function
greet "WebOS"
greet "User" "Extra"
```

### Complete Script Example

Create a file `backup.sh`:

```bash
#!/bin/webos

# Backup script for WebOS
backup_dir="/home/user/backup"
date_str=$(date)

echo "Starting backup at: $date_str"

# Create backup directory if it doesn't exist
if [ ! -d "$backup_dir" ]; then
  mkdir -p "$backup_dir"
  echo "Created backup directory: $backup_dir"
fi

# Backup all text files
file_count=0
for file in *.txt; do
  cp "$file" "$backup_dir/$file"
  file_count=$((file_count + 1))
  echo "Backed up: $file"
done

echo "Backup complete! $file_count files backed up."
```

Execute the script:

```bash
$ script backup.sh
Starting backup at: Mon Nov 18 2025 14:30:00 GMT+0000
Created backup directory: /home/user/backup
Backed up: notes.txt
Backed up: todo.txt
Backed up: readme.txt
Backup complete! 3 files backed up.
```

---

## 🎨 Terminal Themes

### Available Themes

WebOS includes 8 professional terminal themes:

1. **matrix** - Classic green-on-black Matrix style (default)
2. **dracula** - Popular dark theme with purple accents
3. **solarized** - Solarized Dark color scheme
4. **nord** - Nordic-inspired cool color palette
5. **monokai** - Sublime Text's famous theme
6. **one-dark** - Atom's One Dark theme
7. **gruvbox** - Retro groove color scheme
8. **tokyo-night** - Modern dark theme

### Theme Commands

```bash
# List available themes
$ theme
🎨 Available Themes:

  [✓] matrix          - Matrix (Default)
  [ ] dracula         - Dracula
  [ ] solarized       - Solarized Dark
  [ ] nord            - Nord
  [ ] monokai         - Monokai
  [ ] one-dark        - One Dark
  [ ] gruvbox         - Gruvbox Dark
  [ ] tokyo-night     - Tokyo Night

💡 Usage: theme <name>

# Change theme
$ theme dracula
✅ Theme changed to: dracula

# Switch to Tokyo Night
$ theme tokyo-night
✅ Theme changed to: tokyo-night
```

### Theme Persistence

Your theme preference is automatically saved to localStorage and persists across sessions.

---

## 🔍 Fuzzy Search (Ctrl+R)

### Overview

Quickly find and re-execute commands from your history using fuzzy search.

### Usage

1. Press `Ctrl+R` to enter search mode
2. Press `Ctrl+R` again to cycle through matches
3. Press `Enter` to execute the selected command
4. Press `Esc` to cancel

### Example

```bash
# You have these commands in history:
# 1. ls -la /home/user
# 2. cat /home/user/notes.txt
# 3. grep "error" /var/log/system.log
# 4. find /home -name "*.js"

# Press Ctrl+R
🔍 Fuzzy Search (Ctrl+R again for next, Esc to cancel):
find /home -name "*.js"

# Press Ctrl+R again to cycle
grep "error" /var/log/system.log

# Press Enter to execute
```

---

## 💡 Auto-Suggestions

### Overview

As you type, WebOS automatically suggests commands from your history.

### Features

- Real-time suggestions appear as you type
- Suggestions are shown in transparent text
- Based on your command history
- Most recent matches are prioritized

### Example

```bash
# You previously ran: ls -la /home/user/Documents
# Now when you type: ls -la /h
# Suggestion appears: ls -la /h[ome/user/Documents]  <- transparent gray
```

---

## 🌍 Environment Variables

### Managing Variables

```bash
# View all environment variables
$ env
🌍 Environment Variables:

PATH=/bin:/usr/bin
HOME=/home/user
USER=user

# Export a new variable
$ export PROJECT_NAME="WebOS Terminal"
✅ Exported: PROJECT_NAME=WebOS Terminal

# Use the variable
$ echo $PROJECT_NAME
WebOS Terminal

# Variables persist in scripts
$ script my_script.sh
# my_script.sh can access $PROJECT_NAME
```

---

## 📝 Command Aliases

### Creating Aliases

```bash
# Create an alias
$ alias ll='ls -la'
✅ Alias created: ll='ls -la'

# Use the alias
$ ll
total 10
drwxrwxr--     4096 📁 Documents
drwxrwxr--     4096 📁 Downloads

# List all aliases
$ alias
📝 Aliases:

ll='ls -la'
grep='grep --color=auto'
```

---

## 📚 Command History

### Viewing History

```bash
# Show all commands
$ history
📜 Command History:

   1  ls -la
   2  cd /home/user
   3  cat notes.txt
   4  grep "error" system.log
   5  theme dracula
```

### Navigating History

- `↑` (Up Arrow) - Previous command
- `↓` (Down Arrow) - Next command
- `Ctrl+R` - Fuzzy search history

---

## 🔧 Advanced Examples

### Example 1: Automated File Processing

```bash
#!/bin/webos

# Process all log files
log_dir="/var/log"
output_file="/home/user/error_summary.txt"

echo "Analyzing logs..." > "$output_file"

for log in $log_dir/*.log; do
  error_count=$(cat "$log" | grep -i "error" | wc -l)
  if [ $error_count -gt 0 ]; then
    echo "$log: $error_count errors" >> "$output_file"
  fi
done

cat "$output_file"
```

### Example 2: Background Job Pipeline

```bash
# Start multiple analysis jobs in parallel
find /home -name "*.js" | wc -l &
find /home -name "*.txt" | wc -l &
find /home -name "*.md" | wc -l &

# Wait for all jobs
wait

# Check results
jobs
```

### Example 3: Interactive Menu Script

```bash
#!/bin/webos

echo "WebOS Utility Menu"
echo "=================="
echo "1. Show system info"
echo "2. List processes"
echo "3. Show disk usage"
echo "4. Exit"

choice=2  # In a real implementation, you'd read input

if [ $choice = 1 ]; then
  neofetch
elif [ $choice = 2 ]; then
  ps
elif [ $choice = 3 ]; then
  echo "Disk usage report"
  tree /home
else
  echo "Goodbye!"
fi
```

---

## 🚀 Performance Tips

### 1. Background Long-Running Commands

```bash
# Instead of waiting
find / -name "*.log"  # Blocks terminal

# Run in background
find / -name "*.log" &  # Returns immediately
```

### 2. Use Pipes Efficiently

```bash
# Efficient: single pipeline
cat large_file.txt | grep "error" | tail -n 20

# Less efficient: multiple commands
cat large_file.txt > temp.txt
grep "error" temp.txt > temp2.txt
tail -n 20 temp2.txt
rm temp.txt temp2.txt
```

### 3. Theme Performance

Themes without effects (Dracula, Nord, etc.) may render slightly faster than themes with scanlines and glow effects.

---

## 📖 Reference

### Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `-f file` | File exists | `if [ -f "data.txt" ]` |
| `-d dir` | Directory exists | `if [ -d "/home" ]` |
| `-z string` | String is empty | `if [ -z "$var" ]` |
| `-n string` | String is not empty | `if [ -n "$var" ]` |
| `str1 = str2` | Strings equal | `if [ "$a" = "$b" ]` |
| `str1 != str2` | Strings not equal | `if [ "$a" != "$b" ]` |
| `n1 -eq n2` | Numbers equal | `if [ $a -eq $b ]` |
| `n1 -ne n2` | Numbers not equal | `if [ $a -ne $b ]` |
| `n1 -lt n2` | Less than | `if [ $a -lt $b ]` |
| `n1 -le n2` | Less than or equal | `if [ $a -le $b ]` |
| `n1 -gt n2` | Greater than | `if [ $a -gt $b ]` |
| `n1 -ge n2` | Greater than or equal | `if [ $a -ge $b ]` |

### Special Variables

| Variable | Description |
|----------|-------------|
| `$1, $2, ...` | Function/script arguments |
| `$@` | All arguments as separate words |
| `$#` | Number of arguments |
| `$?` | Exit code of last command |
| `$HOME` | Home directory |
| `$USER` | Current user |
| `$PATH` | Command search path |

---

## 🐛 Troubleshooting

### Script Won't Execute

**Problem:** `❌ script: file not found`

**Solution:** Make sure the script file exists and use the correct path:
```bash
# Create the script first
touch my_script.sh

# Write content to it
echo "echo 'Hello World'" > my_script.sh

# Execute it
script my_script.sh
```

### Background Job Not Found

**Problem:** `❌ Job not found: 5`

**Solution:** Use `jobs` to list current jobs and their IDs:
```bash
$ jobs
┌──────┬──────────────┬────────────────┐
│ ID   │ STATUS       │ COMMAND        │
├──────┼──────────────┼────────────────┤
│ [1]  │ 🟢 Running   │ find /home     │
│ [3]  │ ✅ Done      │ ls -R /var     │
└──────┴──────────────┴────────────────┘

$ fg 1  # Use existing job ID
```

### Theme Not Changing

**Problem:** Theme command executes but display doesn't change

**Solution:** The theme applies to the terminal container. If it doesn't update, try:
```bash
# Clear and reapply
clear
theme matrix
```

---

## 🎓 Learning Path

1. **Beginner**: Start with basic commands and keyboard shortcuts
2. **Intermediate**: Learn variables, aliases, and history search
3. **Advanced**: Master scripting with loops, conditionals, and functions
4. **Expert**: Use background jobs, complex pipelines, and automation

---

## 📚 Additional Resources

- [Main Terminal Guide](./README.md)
- [API Reference](./API_REFERENCE.md)
- [WebOS Architecture](./WEB_OS_ARCHITECTURE.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)

---

**Version:** 2.0
**Last Updated:** 2025-11-18
**Compatibility:** WebOS v1.0.0+
