# WebOS Deterministic AI System

A sophisticated, deterministic AI assistant for WebOS that provides intelligent, OS-aware responses without requiring external APIs.

## Overview

The WebOS AI system has been enhanced with a **DeterministicAIEngine** that uses advanced pattern recognition, intent detection, and OS context awareness to provide smart, consistent responses for all operating system operations.

### Key Features

- **Intent Recognition** - Automatically detects user intent from natural language queries
- **OS-Aware Context** - Understands current system state (files, processes, applications)
- **Comprehensive Knowledge Base** - Built-in knowledge of all OS commands, applications, and operations
- **Deterministic Responses** - Consistent, predictable responses based on patterns and rules
- **No External APIs Required** - Fully self-contained, works offline
- **Multi-Domain Support** - Handles files, processes, code, commands, and system queries

## Architecture

```
┌─────────────────────────────────────────────────┐
│           AI Assistant Application              │
│         (Chat UI, Voice Input, Files)           │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │    AIService       │
         │  (Orchestration)   │
         └─────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│Terminal │  │Deterministic│ │Context  │
│Assistant│  │AI Engine   │ │Provider │
└─────────┘  └──────────┘  └──────────┘
                   │              │
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
                   │  OS Services │
                   │ (VFS, PM...) │
                   └──────────────┘
```

## Components

### 1. DeterministicAIEngine (`DeterministicAIEngine.js`)

The core intelligence engine that processes queries and generates responses.

**Key Capabilities:**

- **Intent Detection** - Recognizes 30+ intent types across multiple domains
- **Entity Extraction** - Extracts relevant information (file names, paths, process IDs, etc.)
- **Context Gathering** - Collects OS state based on query intent
- **Response Generation** - Creates intelligent, contextual responses

**Supported Intent Types:**

| Domain | Intent Types |
|--------|-------------|
| **File Operations** | search, create, read, write, delete, organize |
| **Process Management** | list, kill, start |
| **Applications** | list, info |
| **Code** | analyze, generate, explain, fix |
| **Commands** | suggest, explain |
| **System** | status, disk usage |
| **Help** | general, specific topics |

### 2. OSContextProvider (`OSContextProvider.js`)

Provides real-time OS state to the AI system.

**Context Types:**

- **File System** - Current directory, file listings, file metadata
- **Processes** - Running processes, PIDs, status
- **Applications** - Available apps, descriptions, capabilities
- **Windows** - Open windows, states
- **Terminal** - Command history, current directory
- **System Info** - Platform, memory, uptime

### 3. AIService (`AIService.js`)

Main AI service that orchestrates all AI operations.

**Enhanced Features:**

- Uses DeterministicAIEngine for intelligent responses
- Falls back to legacy pattern matching if needed
- Manages conversation history
- Provides RAG capabilities
- Plugin system support

## Usage Examples

### Basic Query

```javascript
import AIService from './ai/AIService.js';

// Initialize
await AIService.init();

// Ask a question
const response = await AIService.generate("How do I find all JavaScript files?");
console.log(response);
// Output: "To search for files, use: `find . -name "*.js"`
//          This will search for all .js files in the current directory..."
```

### With OS Context

```javascript
import AIService from './ai/AIService.js';
import OSContextProvider from './ai/OSContextProvider.js';

// Setup context provider
const contextProvider = new OSContextProvider({
  vfs: virtualFileSystem,
  processManager: processManager,
  windowManager: windowManager,
  terminal: terminal,
  appRegistry: appRegistry
});

// Update AI with OS context
const context = await contextProvider.getContext();
AIService.updateOSContext(context);

// Now queries are context-aware
const response = await AIService.generate("What processes are running?");
// Response includes actual running processes from the system
```

### Direct Engine Access

```javascript
import AIService from './ai/AIService.js';

const engine = AIService.getEngine();

// Process with detailed metadata
const result = await engine.process("create a new folder called projects", {
  includeMetadata: true
});

console.log(result);
// {
//   response: "To create a folder, use: `mkdir -p \"projects\"`...",
//   intent: "file.create",
//   confidence: 0.95,
//   metadata: {
//     processingTime: 15,
//     entities: { name: "projects", type: "directory" },
//     context: ["currentDirectory"]
//   }
// }
```

### Terminal Integration

```javascript
import { AITerminalAssistant } from './ai/AITerminalAssistant.js';

const assistant = new AITerminalAssistant();
await assistant.init();

// Get command suggestion
const suggestion = await assistant.suggestCommand(
  "delete all log files",
  { cwd: '/var/logs' }
);

console.log(suggestion.command);
// Output: "find . -name '*.log' -delete"
```

## Intent Recognition Patterns

### File Operations

| Query | Detected Intent | Generated Command |
|-------|----------------|-------------------|
| "find all JavaScript files" | `file.search` | `find . -name "*.js"` |
| "create a folder called docs" | `file.create` | `mkdir -p "docs"` |
| "read config.json" | `file.read` | `cat "config.json"` |
| "delete temp files" | `file.delete` | `rm temp*` |

### Process Management

| Query | Detected Intent | Response |
|-------|----------------|----------|
| "show running processes" | `process.list` | Lists all processes with details |
| "kill process 1234" | `process.kill` | `kill 1234` |
| "start the browser" | `process.start` | Instructions to launch browser |

### Code Assistance

| Query | Detected Intent | Response |
|-------|----------------|----------|
| "generate a sort function" | `code.generate` | Code template with explanation |
| "analyze this code" | `code.analyze` | Code analysis instructions |
| "explain what this does" | `code.explain` | Code explanation request |
| "fix this bug" | `code.fix` | Debugging assistance |

### Command Help

| Query | Detected Intent | Response |
|-------|----------------|----------|
| "how do I list files" | `command.suggest` | `ls -la` with explanation |
| "explain grep command" | `command.explain` | Detailed grep explanation |

## Knowledge Base

The AI engine includes comprehensive knowledge about:

### Applications (13 built-in apps)

- Terminal, File Explorer, Text Editor, Task Manager
- Settings, Browser, Email, Calendar
- Notes, Calculator, Media Player, Image Viewer, Chat

### File Types (20+ types)

- Code: js, py, java, cpp, html, css
- Data: json, xml, csv
- Documents: md, txt, pdf
- Media: jpg, png, mp3, mp4
- Archives: zip, tar

### Commands (20+ terminal commands)

- File operations: ls, cd, mkdir, rm, cp, mv, cat
- Search: grep, find
- Process: ps, kill, top
- System: df, pwd, chmod, history

## Customization

### Adding Custom Intents

```javascript
const engine = AIService.getEngine();

// Add a custom intent pattern
engine.intentPatterns.push({
  type: 'custom.backup',
  patterns: [
    /backup (.+)/i,
    /create backup of (.+)/i
  ],
  priority: 85
});

// Add corresponding handler
engine._handleCustomBackup = (entities, context) => {
  return {
    text: `To backup ${entities.target}, use:\n\`tar -czf backup.tar.gz ${entities.target}\``,
    contextUsed: ['fileSystem']
  };
};
```

### Extending Knowledge Base

```javascript
const engine = AIService.getEngine();

// Add custom application info
engine.knowledgeBase.applications.myapp = {
  name: 'My Custom App',
  description: 'Does amazing things',
  capabilities: ['feature1', 'feature2'],
  usage: 'Click to launch'
};

// Add custom command info
engine.knowledgeBase.commands.mycmd = {
  description: 'My custom command',
  usage: 'mycmd [options]',
  examples: ['mycmd --help', 'mycmd -v'],
  options: { '-v': 'verbose mode' }
};
```

## Performance

The deterministic AI engine is highly optimized:

- **Fast Response Times** - < 50ms average processing time
- **Low Memory Footprint** - No model loading required
- **Offline Capable** - Works without internet connection
- **Consistent** - Same query always produces same result
- **Scalable** - Can handle unlimited queries

## Testing

The AI system can be tested directly:

```javascript
// Test intent detection
const result = await engine.process("find all PDF files");
console.assert(result.intent === 'file.search');
console.assert(result.confidence > 0.8);

// Test with context
engine.updateOSContext({
  currentDirectory: '/home/user/documents',
  fileSystem: { /* ... */ }
});

const result2 = await engine.process("list files here");
// Response will reference /home/user/documents
```

## Troubleshooting

### AI not responding correctly

1. Check if AIService is initialized: `AIService.isReady()`
2. Verify OS context is provided: `AIService.updateOSContext(context)`
3. Check console for errors
4. Try more specific queries

### Performance issues

1. Clear cache: `AIService.clearCache()`
2. Clear history: `AIService.clearHistory()`
3. Reduce context size in OSContextProvider

### Unknown intents

The engine will always provide a response, even for unrecognized queries. It defaults to suggesting help if intent is unclear.

## Future Enhancements

Potential areas for expansion:

- **Learning System** - Track successful patterns and adapt
- **Multi-language Support** - Support queries in different languages
- **Voice Commands** - Enhanced voice recognition integration
- **Proactive Suggestions** - Suggest commands before asking
- **Advanced Analytics** - Track usage patterns and optimize

## API Reference

### DeterministicAIEngine

```javascript
// Main processing method
async process(query: string, options?: object): Promise<Result>

// Update OS context
updateOSContext(context: object): void

// Get conversation history
getHistory(): Array<HistoryEntry>

// Clear history
clearHistory(): void

// Set user preferences
setPreferences(preferences: object): void
```

### AIService

```javascript
// Initialize service
async init(config?: object): Promise<boolean>

// Generate response
async generate(prompt: string, options?: object): Promise<string>

// Chat with history
async chat(messages: Array<Message>, options?: object): Promise<string>

// Update OS context
updateOSContext(context: object): void

// Get engine instance
getEngine(): DeterministicAIEngine

// Check if ready
isReady(): boolean
```

### OSContextProvider

```javascript
// Get full context
async getContext(): Promise<object>

// Update service references
updateServices(services: object): void
```

## License

Part of WebOS - A browser-based operating system
