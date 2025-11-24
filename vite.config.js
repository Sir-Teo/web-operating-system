import { defineConfig } from 'vite';
import { resolve } from 'path';
import monacoEditorPluginModule from 'vite-plugin-monaco-editor';

const monacoEditorPlugin = monacoEditorPluginModule.default || monacoEditorPluginModule;

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
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
