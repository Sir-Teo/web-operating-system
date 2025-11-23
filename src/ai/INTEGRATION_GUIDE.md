# Integration Guide: Deterministic AI System

This guide shows how to integrate the new deterministic AI system into WebOS applications.

## Quick Start

### 1. Basic Integration

The AI system is already integrated into the main WebOS. To use it in your application:

```javascript
// Import the AI service
import AIService from './ai/AIService.js';

// In your application initialization
async function initApp() {
  // Initialize AI service (if not already done)
  if (!AIService.isReady()) {
    await AIService.init();
  }

  // Use the AI
  const response = await AIService.generate("How do I list all files?");
  console.log(response);
}
```

### 2. Adding OS Context (Recommended)

For better, context-aware responses, provide OS context:

```javascript
import AIService from './ai/AIService.js';
import OSContextProvider from './ai/OSContextProvider.js';

// In main.js or OS initialization
async function setupAI(osServices) {
  // Create context provider
  const contextProvider = new OSContextProvider({
    vfs: osServices.vfs,
    processManager: osServices.processManager,
    windowManager: osServices.windowManager,
    terminal: osServices.terminal,
    appRegistry: osServices.appRegistry
  });

  // Update AI with OS context
  const context = await contextProvider.getContext();
  AIService.updateOSContext(context);

  // Refresh context periodically (every 5 seconds)
  setInterval(async () => {
    const context = await contextProvider.getContext();
    AIService.updateOSContext(context);
  }, 5000);
}
```

### 3. In the AI Assistant Application

Update `src/apps/ai-assistant/AIAssistant.js` to ensure it uses the new system:

```javascript
// The AI Assistant already uses AIService
// Just ensure it's initialized

async sendMessage() {
  if (this.inputValue.trim()) {
    const userMessage = this.inputValue.trim();

    // Add user message to chat
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    this.inputValue = '';
    this.isProcessing = true;

    try {
      // Use the AI service (now powered by DeterministicAIEngine)
      const response = await this.aiService.generate(userMessage, {
        useRAG: true
      });

      // Add AI response
      this.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('AI Error:', error);
      this.messages.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now()
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
```

### 4. In the Terminal

The terminal already uses `AITerminalAssistant`, which leverages `AIService`:

```javascript
// In terminal, when user types "ai <query>"
async handleAICommand(query) {
  const assistant = new AITerminalAssistant();
  await assistant.init();

  const suggestion = await assistant.suggestCommand(query, {
    cwd: this.currentDirectory,
    env: this.environment
  });

  console.log(suggestion.command);
  console.log(suggestion.explanation);
}
```

## Advanced Integration Patterns

### Pattern 1: Custom Intent Handlers

If you need custom AI behaviors for your application:

```javascript
import AIService from './ai/AIService.js';

class MyCustomApp {
  async init() {
    const engine = AIService.getEngine();

    // Add custom intent
    engine.intentPatterns.push({
      type: 'myapp.custom',
      patterns: [/do my custom thing/i],
      priority: 90
    });

    // Add custom handler
    const originalHandlers = engine._generateResponse;
    engine._handleMyAppCustom = (entities, context) => {
      return {
        text: 'Handling your custom request!',
        contextUsed: []
      };
    };
  }
}
```

### Pattern 2: Context-Aware Features

Make your app provide its own context:

```javascript
class MyApp {
  async updateAIContext() {
    const appContext = {
      myAppData: this.getAppSpecificData(),
      currentView: this.currentView,
      userSettings: this.settings
    };

    AIService.updateOSContext({
      ...AIService.deterministicEngine.osContext,
      myApp: appContext
    });
  }

  async askAI(question) {
    // Update context first
    await this.updateAIContext();

    // Then ask
    return await AIService.generate(question);
  }
}
```

### Pattern 3: Streaming Responses

For chat interfaces, use streaming:

```javascript
async function streamChat(userMessage, onToken) {
  const messages = [
    { role: 'user', content: userMessage }
  ];

  await AIService.chat(messages, {
    useRAG: true,
    onToken: (token) => {
      onToken(token);  // Update UI with each token
    }
  });
}
```

### Pattern 4: Plugin Integration

Create AI plugins for specialized tasks:

```javascript
// Register a custom plugin
AIService.registerPlugin('my-analyzer', {
  name: 'My Custom Analyzer',
  description: 'Analyzes custom data',
  handler: async (data, options) => {
    // Your custom logic here
    return {
      analysis: 'Custom analysis result',
      confidence: 0.95
    };
  }
});

// Use the plugin
const result = await AIService.executePlugin('my-analyzer', myData);
```

## Integration Checklist

- [ ] Import AIService in your application
- [ ] Initialize AIService (if not already done)
- [ ] Set up OSContextProvider with OS services
- [ ] Update AI context periodically
- [ ] Handle AI responses in your UI
- [ ] Add error handling for AI calls
- [ ] Test with various queries
- [ ] Optimize context updates based on your needs

## Common Integration Points

### 1. Main OS Initialization (`src/main.js`)

```javascript
import AIService from './ai/AIService.js';
import OSContextProvider from './ai/OSContextProvider.js';

// After initializing all OS services
const contextProvider = new OSContextProvider({
  vfs: this.vfs,
  processManager: this.processManager,
  windowManager: this.windowManager,
  appRegistry: this.appRegistry
});

// Initialize AI
await AIService.init({ backend: 'deterministic' });

// Update context
const updateContext = async () => {
  const context = await contextProvider.getContext();
  AIService.updateOSContext(context);
};

await updateContext();
setInterval(updateContext, 5000);
```

### 2. AI Assistant App (`src/apps/ai-assistant/AIAssistant.js`)

Already integrated! The app uses AIService which now includes the deterministic engine.

### 3. Terminal (`src/apps/terminal/Terminal.js`)

Already integrated via AITerminalAssistant!

### 4. File Explorer

Add AI suggestions for file operations:

```javascript
class FileExplorer {
  async getAISuggestion(action, files) {
    const query = `${action} ${files.join(', ')}`;
    const response = await AIService.generate(query);
    return response;
  }

  async organizeFiles() {
    const suggestion = await this.getAISuggestion(
      'organize files',
      this.selectedFiles
    );
    // Show suggestion to user
  }
}
```

### 5. Text Editor

Add code assistance:

```javascript
class TextEditor {
  async getCodeSuggestion(code, language) {
    const query = `analyze this ${language} code: ${code}`;
    const response = await AIService.generate(query);
    return response;
  }

  async explainCode(selectedCode) {
    const query = `explain this code: ${selectedCode}`;
    return await AIService.generate(query);
  }
}
```

## Performance Tips

1. **Lazy Initialize**: Only initialize AI when first needed
2. **Cache Responses**: AIService already caches, but you can add app-level caching
3. **Debounce Updates**: Don't update context on every keystroke
4. **Selective Context**: Only provide relevant context for queries
5. **Async Operations**: Always use AI calls asynchronously

## Error Handling

```javascript
async function safeAIQuery(query) {
  try {
    if (!AIService.isReady()) {
      await AIService.init();
    }

    const response = await AIService.generate(query);
    return response;
  } catch (error) {
    console.error('AI Error:', error);

    // Provide fallback
    return "I'm having trouble processing that request. Please try again.";
  }
}
```

## Testing Integration

```javascript
// Test file
import AIService from './ai/AIService.js';

async function testAIIntegration() {
  console.log('Testing AI Integration...');

  // Test 1: Basic query
  const response1 = await AIService.generate("how do I list files");
  console.assert(response1.includes('ls'), 'Should suggest ls command');

  // Test 2: File operations
  const response2 = await AIService.generate("find all JavaScript files");
  console.assert(response2.includes('find') || response2.includes('*.js'));

  // Test 3: Process management
  const response3 = await AIService.generate("show running processes");
  console.assert(response3.includes('ps') || response3.includes('process'));

  // Test 4: Code generation
  const response4 = await AIService.generate("write a function to sort an array");
  console.assert(response4.includes('function') || response4.includes('sort'));

  console.log('All tests passed! ✓');
}

testAIIntegration();
```

## Migration from Old System

If you were using the old simulated AI:

```javascript
// Old way (still works)
const response = await AIService.generate(prompt);

// New way (same interface, better results)
const response = await AIService.generate(prompt);

// Access new features
const engine = AIService.getEngine();
const result = await engine.process(query, { includeMetadata: true });
console.log(result.intent);      // Detected intent
console.log(result.confidence);  // Confidence score
console.log(result.metadata);    // Processing details
```

No breaking changes! The new system is backward compatible.

## Support

If you encounter issues:

1. Check that AIService is initialized
2. Verify OS context is being provided
3. Check browser console for errors
4. Review query format and intent patterns
5. Test with simpler queries first

## Examples Repository

See `src/ai/examples/` for complete integration examples:

- `basic-usage.js` - Simple AI queries
- `context-aware.js` - OS-aware queries
- `custom-intents.js` - Adding custom behaviors
- `streaming.js` - Streaming responses
- `file-operations.js` - File-specific AI helpers
- `code-assistance.js` - Code-related AI features

Happy integrating! 🤖
