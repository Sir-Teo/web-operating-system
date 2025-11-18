# Deploying WebOS to GitHub Pages

Complete guide for deploying your Web Operating System to GitHub Pages.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Configuration](#project-configuration)
3. [Build Setup](#build-setup)
4. [GitHub Configuration](#github-configuration)
5. [Automated Deployment](#automated-deployment)
6. [Custom Domain](#custom-domain)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- GitHub account
- Git installed locally
- Node.js and npm installed
- Your WebOS project ready

### Recommended

- Understanding of Git/GitHub
- Basic knowledge of GitHub Actions
- Familiarity with static site hosting

---

## Project Configuration

### 1. Repository Setup

Create a new GitHub repository or use an existing one:

```bash
# Initialize git if not already done
git init

# Add remote
git remote add origin https://github.com/username/web-os.git

# Create and switch to main branch
git checkout -b main

# Initial commit
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Package.json Configuration

```json
{
  "name": "webos",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "winbox": "^0.2.82",
    "idb": "^7.1.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "gh-pages": "^6.1.0"
  }
}
```

### 3. Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Set base to your repo name for GitHub Pages
  base: process.env.NODE_ENV === 'production'
    ? '/web-os/'  // Replace with your repo name
    : '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html')
      },
      output: {
        manualChunks: {
          // Code splitting for better caching
          vendor: ['winbox'],
          filesystem: [
            './src/filesystem/VFS.js',
            './src/filesystem/drivers/OPFSDriver.js'
          ],
          kernel: [
            './src/kernel/Kernel.js',
            './src/kernel/ProcessManager.js',
            './src/kernel/Scheduler.js'
          ]
        }
      }
    },

    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },

    // Generate sourcemaps for debugging
    sourcemap: process.env.NODE_ENV !== 'production'
  },

  server: {
    port: 3000,
    open: true,
    cors: true
  },

  preview: {
    port: 4173
  }
});
```

---

## Build Setup

### 1. Create Build Script

```bash
#!/bin/bash
# scripts/build.sh

echo "Building WebOS for production..."

# Clean previous build
rm -rf dist

# Build with Vite
npm run build

# Copy service worker
cp public/service-worker.js dist/

# Copy manifest
cp public/manifest.json dist/

# Copy icons
mkdir -p dist/icons
cp -r public/icons/* dist/icons/

# Generate .nojekyll to prevent GitHub Pages from processing with Jekyll
touch dist/.nojekyll

echo "Build complete! Output in dist/"
```

Make it executable:
```bash
chmod +x scripts/build.sh
```

### 2. Service Worker Configuration

Update service worker for production:

```javascript
// public/service-worker.js

const CACHE_NAME = 'webos-v1.0.0';
const BASE_PATH = '/web-os/'; // Update with your repo name

const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}assets/index.js`,
  `${BASE_PATH}assets/index.css`
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache if not a success
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});
```

### 3. Update Manifest

```json
{
  "name": "WebOS",
  "short_name": "WebOS",
  "description": "A web-based operating system running in your browser",
  "start_url": "/web-os/",
  "scope": "/web-os/",
  "display": "standalone",
  "background_color": "#1e1e1e",
  "theme_color": "#4285f4",
  "orientation": "any",
  "icons": [
    {
      "src": "/web-os/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/web-os/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/web-os/screenshots/desktop.png",
      "sizes": "1920x1080",
      "type": "image/png"
    }
  ]
}
```

---

## GitHub Configuration

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### 2. Create `.gitignore`

```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/

# Temporary files
tmp/
temp/
.cache/
```

---

## Automated Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy WebOS to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Manual Deployment

Alternatively, deploy manually:

```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

---

## Custom Domain

### 1. Configure DNS

Add these DNS records with your domain provider:

```
Type    Name    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     username.github.io
```

### 2. Configure GitHub

1. Go to repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Check **Enforce HTTPS**

### 3. Update Configuration

Update `vite.config.js`:

```javascript
export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com/'
    : '/',
  // ... rest of config
});
```

Update service worker and manifest URLs accordingly.

---

## Performance Optimization

### 1. Compression

Enable compression in your build:

```javascript
// vite.config.js
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

Install the plugin:
```bash
npm install --save-dev vite-plugin-compression
```

### 2. Asset Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.')[1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          if (/woff|woff2/.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  }
});
```

### 3. Caching Strategy

Configure caching headers via GitHub Pages (limited) or add to service worker:

```javascript
// Enhanced service worker caching
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: (request) => {
    return caches.match(request).then((response) => {
      return response || fetch(request);
    });
  },

  // Network first for dynamic content
  dynamic: (request) => {
    return fetch(request).catch(() => {
      return caches.match(request);
    });
  },

  // Stale while revalidate
  staleWhileRevalidate: (request) => {
    return caches.match(request).then((response) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      });

      return response || fetchPromise;
    });
  }
};
```

### 4. Image Optimization

```bash
# Install image optimization tools
npm install --save-dev vite-plugin-imagemin

# Use in vite.config.js
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      }
    })
  ]
});
```

---

## Troubleshooting

### Issue: 404 on Refresh

**Problem**: Refreshing a specific route returns 404.

**Solution**: Add a `404.html` that redirects to index:

```html
<!-- dist/404.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    sessionStorage.redirect = location.href;
    location.replace('/web-os/');
  </script>
</head>
<body></body>
</html>
```

Handle in your router:

```javascript
const redirect = sessionStorage.redirect;
if (redirect) {
  delete sessionStorage.redirect;
  history.replaceState(null, null, redirect);
}
```

### Issue: Service Worker Not Updating

**Problem**: Service worker caches old version.

**Solution**:
1. Increment `CACHE_NAME` version
2. Use cache busting with build hash
3. Implement update notification

```javascript
// Check for service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        }
      });
    });
  });
}
```

### Issue: CORS Errors

**Problem**: Cross-origin resource sharing errors.

**Solution**: Ensure all resources are loaded from the same origin or properly configured:

```javascript
// Load resources from relative paths
const imageUrl = './assets/images/logo.png';  // ✅ Good
const imageUrl = 'https://example.com/logo.png';  // ⚠️ May have CORS issues
```

### Issue: Assets Not Loading

**Problem**: CSS/JS files return 404.

**Solution**: Check base path configuration:

```javascript
// vite.config.js - ensure base matches your repo name
base: '/web-os/'  // Must match GitHub repo name
```

### Issue: Large Bundle Size

**Problem**: Initial bundle too large.

**Solution**: Implement code splitting:

```javascript
// Lazy load routes
const routes = {
  '/terminal': () => import('./apps/terminal/index.js'),
  '/files': () => import('./apps/file-manager/index.js'),
  '/editor': () => import('./apps/text-editor/index.js')
};

async function loadRoute(path) {
  const loader = routes[path];
  if (loader) {
    const module = await loader();
    return module.default;
  }
}
```

---

## Deployment Checklist

- [ ] Update `base` path in `vite.config.js`
- [ ] Update service worker cache name and paths
- [ ] Update manifest.json URLs
- [ ] Create `.nojekyll` file
- [ ] Configure GitHub Pages settings
- [ ] Set up GitHub Actions workflow
- [ ] Test build locally (`npm run build && npm run preview`)
- [ ] Check for console errors
- [ ] Verify service worker registration
- [ ] Test offline functionality
- [ ] Run Lighthouse audit
- [ ] Test on mobile devices
- [ ] Verify all assets load correctly
- [ ] Test PWA installation
- [ ] Check performance metrics
- [ ] Configure custom domain (optional)

---

## Post-Deployment

### Monitor with Lighthouse

```bash
npm install -g lighthouse

lighthouse https://username.github.io/web-os/ \
  --view \
  --output html \
  --output-path ./lighthouse-report.html
```

### Analytics (Optional)

Add analytics to track usage:

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Monitoring Service Worker

```javascript
// Log service worker events
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service worker updated');
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('SW message:', event.data);
  });
}
```

---

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Your WebOS is now live!** 🎉

Access it at: `https://username.github.io/web-os/`
