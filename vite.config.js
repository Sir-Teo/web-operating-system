import { defineConfig } from 'vite';
import { resolve } from 'path';
import monacoEditorPluginModule from 'vite-plugin-monaco-editor';

const monacoEditorPlugin = monacoEditorPluginModule.default || monacoEditorPluginModule;

export default defineConfig({
  base: './',
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Core kernel chunks
          'kernel-core': [
            './src/kernel/Kernel.js',
            './src/kernel/ProcessManager.js',
            './src/kernel/Scheduler.js'
          ],
          // Next-gen features (lazy loaded)
          'nextgen-microkernel': ['./src/kernel/MicrokernelCore.js'],
          'nextgen-gpu': ['./src/gpu/WebGPUCompute.js'],
          'nextgen-ai': ['./src/ai/LLMIntegration.js'],
          'nextgen-lsp': ['./src/lsp/LSPClient.js'],
          'nextgen-security': ['./src/security/AdvancedSandbox.js'],
          'nextgen-distributed': ['./src/distributed/MeshNetwork.js'],
          'nextgen-xr': ['./src/xr/WebXRManager.js'],
          'nextgen-containers': ['./src/containers/ContainerRuntime.js'],
          'nextgen-monitoring': ['./src/monitoring/AdvancedMonitor.js'],
          // External libraries
          'vendor-monaco': ['monaco-editor'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-collaboration': ['yjs', 'y-webrtc', 'simple-peer']
        }
      }
    },
    // Optimization settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true
  },
  plugins: [
    monacoEditorPlugin({
      languageWorkers: [
        'editorWorkerService',
        'css',
        'html',
        'json',
        'typescript'
      ]
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
});
