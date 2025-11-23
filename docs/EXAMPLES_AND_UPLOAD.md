# Example Files & File Upload Guide

This guide explains how to use the example file system and file upload functionality in WebOS.

## 📁 Example Files

WebOS comes with a comprehensive set of example files to help you get started and explore the system's capabilities.

### What's Included

The example files are organized into several categories:

#### **Code Examples** (`/examples/code/`)
- `hello-world.js` - Basic JavaScript examples
- `calculator.py` - Python calculator with classes
- `todo-app.html` - Complete HTML todo application
- `styles.css` - Modern CSS with flexbox/grid
- `server.js` - Express.js REST API server
- `data-processor.js` - Advanced JavaScript patterns

#### **Documents** (`/examples/documents/`)
- `README.md` - Project documentation template
- `tutorial.md` - WebOS tutorial and guide
- `notes.txt` - Plain text notes
- `project-plan.md` - Project roadmap template

#### **Configuration Files** (`/examples/config/`)
- `package.json` - NPM package configuration
- `.gitignore` - Git ignore patterns
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variables template
- `webpack.config.js` - Webpack build configuration

#### **Data Files** (`/examples/data/`)
- `users.json` - Sample user data
- `products.json` - Sample product catalog
- `sample.xml` - XML data example
- `data.csv` - CSV spreadsheet data

#### **Scripts** (`/examples/scripts/`)
- `backup.sh` - Backup automation script
- `deploy.sh` - Deployment script
- `setup.sh` - Development setup script

#### **Templates** (`/templates/`)
- `react-component.jsx` - React component template
- `express-api.js` - REST API template
- `python-class.py` - Python class template

#### **Sample Projects** (`/projects/`)
- Complete Todo List application (HTML + CSS + JS)
- Demonstrates full application structure

#### **Documentation** (`/docs/`)
- API reference template
- Contributing guidelines
- Changelog template

### Generating Example Files

#### Automatic Generation on First Boot

Example files are automatically generated when WebOS first boots:

```javascript
// In your main.js or initialization code
import { initializeWebOS } from './utils/InitializeOS.js';

// During OS boot
await initializeWebOS({
  vfs,
  aiService,
  processManager
}, {
  generateExamples: true  // Auto-generate examples
});
```

#### Manual Generation

```javascript
import ExampleFileGenerator from './utils/ExampleFileGenerator.js';

// Create generator
const generator = new ExampleFileGenerator(vfs);

// Generate all examples
const results = await generator.generateAll({
  baseDir: '/home/user'
});

console.log(`Created ${results.created.length} files`);
```

#### Generate Specific Categories

```javascript
// Generate only code examples
await generator.generateCategory('code');

// Generate only documents
await generator.generateCategory('documents');

// Generate only data files
await generator.generateCategory('data');
```

#### List Available Examples

```javascript
// Get all examples
const examples = generator.listExamples();
console.log(examples);
// [{ path: '/examples/code/hello-world.js', category: 'code', name: 'hello-world.js' }, ...]

// Get categories
const categories = generator.getCategories();
console.log(categories);
// ['code', 'documents', 'config', 'data', 'scripts']
```

## 📤 File Upload

Upload files from your local machine into WebOS's virtual file system.

### Features

- ✅ **Drag & Drop** - Drag files directly onto the upload area
- ✅ **Multiple Files** - Upload multiple files at once
- ✅ **Progress Tracking** - See upload progress for each file
- ✅ **File Validation** - Size and type validation
- ✅ **Image Preview** - Preview images before upload
- ✅ **Custom Target** - Upload to any directory

### Quick Start

#### Method 1: Using UI Component

```javascript
import FileUploader from './components/FileUploader.js';

// Create uploader
const uploader = new FileUploader(vfs, {
  targetDirectory: '/home/user/uploads',
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  multiple: true
});

// Create UI and add to page
const container = document.getElementById('upload-container');
uploader.createUI(container);
```

#### Method 2: Programmatic Upload

```javascript
import { uploadFiles } from './components/FileUploader.js';

// Upload files programmatically
const input = document.createElement('input');
input.type = 'file';
input.multiple = true;

input.onchange = async (e) => {
  await uploadFiles(vfs, e.target.files, '/home/user/documents');
};

input.click();
```

#### Method 3: Quick Setup

```javascript
import { setupFileUpload } from './utils/InitializeOS.js';

// Simple setup with container
const uploader = setupFileUpload(vfs, document.getElementById('upload-area'));
```

### Configuration Options

```javascript
const uploader = new FileUploader(vfs, {
  // Maximum file size (default: 10MB)
  maxFileSize: 20 * 1024 * 1024,

  // Allowed file types (null = all types)
  allowedTypes: ['.jpg', '.png', '.pdf', '.txt'],
  // or
  allowedTypes: ['image/*', 'text/*'],

  // Target directory (default: /home/user/uploads)
  targetDirectory: '/home/user/documents',

  // Allow multiple files (default: true)
  multiple: true,

  // Show image previews (default: true)
  showPreview: true,

  // Callbacks
  onUploadStart: (file) => {
    console.log('Starting upload:', file.name);
  },

  onUploadProgress: (file, progress) => {
    console.log('Progress:', progress);
  },

  onUploadComplete: () => {
    console.log('All uploads complete!');
  },

  onUploadError: (file, error) => {
    console.error('Upload failed:', error);
  }
});
```

### Usage Examples

#### Example 1: Image Upload

```javascript
const imageUploader = new FileUploader(vfs, {
  targetDirectory: '/home/user/pictures',
  allowedTypes: ['image/*'],
  maxFileSize: 5 * 1024 * 1024,  // 5MB
  showPreview: true
});

const container = document.getElementById('image-upload');
imageUploader.createUI(container);
```

#### Example 2: Document Upload

```javascript
const docUploader = new FileUploader(vfs, {
  targetDirectory: '/home/user/documents',
  allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  maxFileSize: 20 * 1024 * 1024,  // 20MB
  multiple: true,

  onUploadComplete: () => {
    alert('Documents uploaded successfully!');
    refreshFileList();
  }
});

docUploader.createUI(document.getElementById('doc-upload'));
```

#### Example 3: Drag & Drop Only

```html
<div id="dropzone"></div>

<script>
const dropzone = document.getElementById('dropzone');
const uploader = new FileUploader(vfs);

// Custom drag & drop handling
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.style.background = '#eee';
});

dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropzone.style.background = '';

  const files = Array.from(e.dataTransfer.files);
  await uploader.uploadFiles(files);
});
</script>
```

### File Types Supported

The uploader automatically handles different file types:

**Text Files** (stored as text):
- `.txt`, `.md`, `.json`, `.xml`, `.csv`
- `.html`, `.css`, `.js`, `.jsx`, `.ts`, `.tsx`
- `.py`, `.java`, `.cpp`, `.c`, `.sh`
- `.yml`, `.yaml`, `.ini`, `.conf`

**Binary Files** (stored as base64):
- Images: `.jpg`, `.png`, `.gif`, `.svg`
- Documents: `.pdf`
- Archives: `.zip`, `.tar`, `.gz`
- All other types

### Integration with File Explorer

To add upload to File Explorer:

```javascript
// In your File Explorer app
import FileUploader from '../components/FileUploader.js';

class FileExplorer {
  constructor() {
    this.uploader = new FileUploader(this.vfs, {
      targetDirectory: this.currentDirectory,

      onUploadComplete: () => {
        this.refresh();  // Refresh file list
      }
    });
  }

  addUploadButton() {
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '📤 Upload Files';
    uploadBtn.onclick = () => {
      this.uploader.ui.fileInput.click();
    };

    this.toolbar.appendChild(uploadBtn);
  }
}
```

## 🚀 Initialization on Boot

Set up everything automatically when WebOS starts:

```javascript
// In main.js
import { initializeWebOS } from './utils/InitializeOS.js';

async function bootOS() {
  // Initialize core services
  const vfs = await initVFS();
  const aiService = await initAI();
  const processManager = await initProcessManager();

  // Initialize WebOS with examples and upload
  const result = await initializeWebOS({
    vfs,
    aiService,
    processManager
  }, {
    generateExamples: true,       // Generate example files
    setupUploader: true,           // Setup file uploader
    initializeAI: true,            // Initialize AI with context

    uploaderOptions: {
      maxFileSize: 10 * 1024 * 1024,
      targetDirectory: '/home/user/uploads'
    }
  });

  if (result.success) {
    console.log('✅ OS initialized successfully');
    console.log('Examples:', result.results.examples);
    console.log('Uploader:', result.results.uploader);
  }

  // File uploader is now globally accessible
  // window.fileUploader
}
```

## 📝 Sample User Data

In addition to examples, create personalized sample data:

```javascript
import OSInitializer from './utils/InitializeOS.js';

const initializer = new OSInitializer({ vfs, aiService, processManager });

// Create sample user files
await initializer.createSampleData();

// This creates:
// - /home/user/Documents/my-notes.txt
// - /home/user/Documents/shopping-list.txt
// - /home/user/projects/my-first-script.js
// - /home/user/Downloads/README.txt
```

## 🔧 Advanced Usage

### Check Initialization Status

```javascript
const initializer = new OSInitializer(osServices);

// Check if already initialized
const isInit = await initializer.isInitialized();

if (!isInit) {
  await initializer.initialize();
}

// Get status
const status = initializer.getStatus();
console.log(status);
// { initialized: true, vfsReady: true, aiReady: true }
```

### Reset OS

```javascript
// Reset user files (keep examples)
await initializer.reset({
  keepFolders: ['examples', 'templates', 'docs']
});
```

### Custom File Generation

```javascript
import ExampleFileGenerator from './utils/ExampleFileGenerator.js';

class CustomFileGenerator extends ExampleFileGenerator {
  _buildExampleFiles() {
    return {
      ...super._buildExampleFiles(),

      // Add your custom files
      '/custom/my-file.txt': 'Custom content here',
      '/custom/my-script.js': 'console.log("Custom!");'
    };
  }
}

const generator = new CustomFileGenerator(vfs);
await generator.generateAll();
```

## 💡 Tips

1. **Example Files** - Great for testing AI assistant, terminal commands, and file operations
2. **File Upload** - Perfect for importing projects, documents, and personal files
3. **Drag & Drop** - Fastest way to get files into WebOS
4. **Organization** - Use different target directories for different file types
5. **Validation** - Set appropriate size limits and allowed types for security

## 🐛 Troubleshooting

### Files Not Appearing

```javascript
// Check if files were created
const files = await vfs.readdir('/home/user/examples');
console.log(files);

// Regenerate if needed
const generator = new ExampleFileGenerator(vfs);
await generator.generateAll();
```

### Upload Fails

```javascript
// Check file size
console.log('Max size:', uploader.options.maxFileSize);

// Check file type
console.log('Allowed types:', uploader.options.allowedTypes);

// Enable error logging
const uploader = new FileUploader(vfs, {
  onUploadError: (file, error) => {
    console.error(`Failed to upload ${file.name}:`, error);
  }
});
```

### Directory Doesn't Exist

```javascript
// Uploader automatically creates directories
// But you can ensure manually:
await vfs.mkdir('/home/user/my-folder');
```

## 📚 API Reference

### ExampleFileGenerator

```javascript
constructor(vfs)
generateAll(options)                    // Generate all examples
generateCategory(category, options)    // Generate specific category
listExamples()                         // List all examples
getCategories()                        // Get all categories
```

### FileUploader

```javascript
constructor(vfs, options)
createUI(container)                    // Create upload UI
uploadFiles(files)                     // Upload programmatically
clearQueue()                           // Clear upload queue
getStats()                             // Get upload statistics
```

### OSInitializer

```javascript
constructor(osServices)
initialize(options)                    // Full initialization
generateExampleFiles()                 // Generate examples only
setupFileUploader(options)             // Setup uploader only
createSampleData()                     // Create sample user data
isInitialized()                        // Check if initialized
reset(options)                         // Reset OS
getStatus()                            // Get initialization status
```

---

**Ready to explore!** Check out `/home/user/examples/` for all example files, and use the file uploader to bring your own files into WebOS! 🚀
