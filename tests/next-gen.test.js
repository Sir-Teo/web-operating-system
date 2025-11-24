/**
 * Next-Gen OS Test Suite
 */

import { describe, it, expect } from 'vitest';
import { NextGenOS } from '../src/NextGenOS.js';

describe('NextGenOS', () => {
  it('should initialize successfully', async () => {
    const os = new NextGenOS();
    const result = await os.initialize({
      features: {
        microkernel: true,
        webgpu: true,
        llm: false, // Skip LLM for tests
        lsp: true,
        sandbox: true,
        mesh: false,
        xr: false,
        containers: true,
        monitoring: true
      }
    });
    
    expect(result).toBe(true);
    expect(os.initialized).toBe(true);
    
    await os.shutdown();
  });

  it('should report system status', async () => {
    const os = new NextGenOS();
    await os.initialize({ features: { monitoring: true } });
    
    const status = os.getStatus();
    expect(status.version).toBe('4.0.0');
    expect(status.initialized).toBe(true);
    
    await os.shutdown();
  });

  it('should run diagnostics', async () => {
    const os = new NextGenOS();
    await os.initialize();
    
    const results = await os.runDiagnostics();
    expect(results).toHaveProperty('passed');
    expect(results).toHaveProperty('failed');
    expect(results).toHaveProperty('warnings');
    
    await os.shutdown();
  });
});
