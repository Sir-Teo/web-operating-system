/**
 * Workflow Engine - Automated Task Execution
 * Create, save, and execute complex workflows with conditional logic
 */

import { eventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class WorkflowEngine {
  constructor(kernel) {
    this.kernel = kernel;
    this.logger = new Logger('WorkflowEngine');
    this.workflows = new Map();
    this.runningWorkflows = new Map();
    this.workflowHistory = [];
  }

  async initialize() {
    this.logger.info('Initializing Workflow Engine...');
    await this._loadWorkflows();
    this._registerBuiltinWorkflows();
    return true;
  }

  /**
   * Create a new workflow
   */
  createWorkflow(name, description) {
    const workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      steps: [],
      triggers: [],
      variables: new Map(),
      created: Date.now(),
      modified: Date.now()
    };

    this.workflows.set(workflow.id, workflow);
    this._saveWorkflows();

    this.logger.info(`Created workflow: ${name}`);
    return workflow;
  }

  /**
   * Add step to workflow
   */
  addStep(workflowId, step) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const stepObj = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: step.type,
      action: step.action,
      params: step.params || {},
      condition: step.condition || null,
      onSuccess: step.onSuccess || null,
      onError: step.onError || null,
      retry: step.retry || { maxAttempts: 0, delay: 1000 }
    };

    workflow.steps.push(stepObj);
    workflow.modified = Date.now();
    this._saveWorkflows();

    return stepObj;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, initialContext = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution = {
      id: executionId,
      workflowId,
      workflowName: workflow.name,
      startTime: Date.now(),
      endTime: null,
      status: 'running',
      currentStep: 0,
      context: { ...initialContext },
      results: [],
      errors: []
    };

    this.runningWorkflows.set(executionId, execution);

    this.logger.info(`Executing workflow: ${workflow.name} (${executionId})`);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        execution.currentStep = i;

        // Check condition
        if (step.condition && !this._evaluateCondition(step.condition, execution.context)) {
          this.logger.info(`Skipping step ${i} due to condition`);
          continue;
        }

        // Execute step with retry logic
        const result = await this._executeStepWithRetry(step, execution.context);
        execution.results.push(result);

        // Update context with result
        if (result.output) {
          Object.assign(execution.context, result.output);
        }

        // Handle step result
        if (result.success && step.onSuccess) {
          await this._handleCallback(step.onSuccess, execution.context);
        } else if (!result.success && step.onError) {
          await this._handleCallback(step.onError, execution.context);
        }

        // Stop if step failed and no error handler
        if (!result.success && !step.onError) {
          throw new Error(`Step ${i} failed: ${result.error}`);
        }
      }

      execution.status = 'completed';
      execution.endTime = Date.now();

      this.logger.info(`Workflow completed: ${workflow.name}`);

      this._recordExecution(execution);

      return {
        success: true,
        executionId,
        results: execution.results,
        context: execution.context
      };
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.errors.push(error.message);

      this.logger.error(`Workflow failed: ${workflow.name}`, error);

      this._recordExecution(execution);

      return {
        success: false,
        executionId,
        error: error.message,
        results: execution.results
      };
    } finally {
      this.runningWorkflows.delete(executionId);
    }
  }

  /**
   * Execute step with retry logic
   */
  async _executeStepWithRetry(step, context) {
    const maxAttempts = step.retry?.maxAttempts || 1;
    const delay = step.retry?.delay || 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this._executeStep(step, context);
        return result;
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: error.message
          };
        }

        this.logger.warn(`Step failed, retrying (${attempt + 1}/${maxAttempts})...`);
        await this._sleep(delay);
      }
    }
  }

  /**
   * Execute individual step
   */
  async _executeStep(step, context) {
    this.logger.info(`Executing step: ${step.type}:${step.action}`);

    const params = this._resolveParams(step.params, context);

    switch (step.type) {
      case 'app':
        return await this._executeAppAction(step.action, params);

      case 'file':
        return await this._executeFileAction(step.action, params);

      case 'system':
        return await this._executeSystemAction(step.action, params);

      case 'terminal':
        return await this._executeTerminalAction(step.action, params);

      case 'network':
        return await this._executeNetworkAction(step.action, params);

      case 'ai':
        return await this._executeAIAction(step.action, params);

      case 'wait':
        return await this._executeWaitAction(step.action, params);

      case 'condition':
        return await this._executeConditionAction(step.action, params, context);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Resolve parameters with context variables
   */
  _resolveParams(params, context) {
    const resolved = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        const varName = value.slice(1);
        resolved[key] = context[varName];
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * App actions
   */
  async _executeAppAction(action, params) {
    switch (action) {
      case 'launch':
        eventBus.emit('app-launch', { appName: params.appName, data: params.data });
        return { success: true, output: { launchedApp: params.appName } };

      case 'close':
        eventBus.emit('app-close', { appName: params.appName });
        return { success: true };

      default:
        throw new Error(`Unknown app action: ${action}`);
    }
  }

  /**
   * File actions
   */
  async _executeFileAction(action, params) {
    const vfs = this.kernel.vfs;

    switch (action) {
      case 'read':
        const content = await vfs.readFile(params.path);
        return { success: true, output: { fileContent: content, filePath: params.path } };

      case 'write':
        await vfs.writeFile(params.path, params.content);
        return { success: true, output: { filePath: params.path } };

      case 'delete':
        await vfs.deleteFile(params.path);
        return { success: true };

      case 'copy':
        const data = await vfs.readFile(params.source);
        await vfs.writeFile(params.dest, data);
        return { success: true };

      case 'list':
        const entries = await vfs.readDir(params.path);
        return { success: true, output: { entries } };

      default:
        throw new Error(`Unknown file action: ${action}`);
    }
  }

  /**
   * System actions
   */
  async _executeSystemAction(action, params) {
    switch (action) {
      case 'screenshot':
        eventBus.emit('app-launch', { appName: 'ScreenshotApp' });
        return { success: true };

      case 'notification':
        eventBus.emit('show-notification', {
          title: params.title,
          message: params.message,
          type: params.type || 'info'
        });
        return { success: true };

      case 'dialog':
        return new Promise((resolve) => {
          eventBus.emit('show-dialog', {
            title: params.title,
            message: params.message,
            type: params.type || 'info',
            callback: (result) => {
              resolve({ success: true, output: { dialogResult: result } });
            }
          });
        });

      default:
        throw new Error(`Unknown system action: ${action}`);
    }
  }

  /**
   * Terminal actions
   */
  async _executeTerminalAction(action, params) {
    switch (action) {
      case 'execute':
        return new Promise((resolve) => {
          const handler = (result) => {
            eventBus.off('terminal-command-result', handler);
            resolve({
              success: result.exitCode === 0,
              output: { commandOutput: result.output, exitCode: result.exitCode }
            });
          };

          eventBus.on('terminal-command-result', handler);
          eventBus.emit('terminal-execute-command', { command: params.command });

          // Timeout after 30 seconds
          setTimeout(() => {
            eventBus.off('terminal-command-result', handler);
            resolve({ success: false, error: 'Command timeout' });
          }, 30000);
        });

      default:
        throw new Error(`Unknown terminal action: ${action}`);
    }
  }

  /**
   * Network actions
   */
  async _executeNetworkAction(action, params) {
    switch (action) {
      case 'fetch':
        const response = await fetch(params.url, params.options || {});
        const data = await response.text();
        return {
          success: response.ok,
          output: {
            status: response.status,
            data,
            headers: Object.fromEntries(response.headers.entries())
          }
        };

      default:
        throw new Error(`Unknown network action: ${action}`);
    }
  }

  /**
   * AI actions
   */
  async _executeAIAction(action, params) {
    switch (action) {
      case 'analyze':
        // Would call AI service here
        return { success: true, output: { analysis: 'AI analysis result' } };

      case 'generate':
        return { success: true, output: { generated: 'AI generated content' } };

      default:
        throw new Error(`Unknown AI action: ${action}`);
    }
  }

  /**
   * Wait actions
   */
  async _executeWaitAction(action, params) {
    switch (action) {
      case 'delay':
        await this._sleep(params.ms);
        return { success: true };

      case 'until':
        // Wait until condition is true
        const maxWait = params.timeout || 30000;
        const checkInterval = params.interval || 100;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
          if (this._evaluateCondition(params.condition, params.context)) {
            return { success: true };
          }
          await this._sleep(checkInterval);
        }

        throw new Error('Wait timeout');

      default:
        throw new Error(`Unknown wait action: ${action}`);
    }
  }

  /**
   * Condition actions
   */
  async _executeConditionAction(action, params, context) {
    switch (action) {
      case 'if':
        const conditionMet = this._evaluateCondition(params.condition, context);
        return { success: true, output: { conditionMet } };

      default:
        throw new Error(`Unknown condition action: ${action}`);
    }
  }

  /**
   * Evaluate condition expression
   */
  _evaluateCondition(condition, context) {
    if (typeof condition === 'boolean') {
      return condition;
    }

    if (typeof condition === 'function') {
      return condition(context);
    }

    if (typeof condition === 'object') {
      // Simple condition object: { var: 'name', op: '===', value: 'test' }
      const varValue = context[condition.var];
      const expectedValue = condition.value;

      switch (condition.op) {
        case '===': return varValue === expectedValue;
        case '!==': return varValue !== expectedValue;
        case '>': return varValue > expectedValue;
        case '<': return varValue < expectedValue;
        case '>=': return varValue >= expectedValue;
        case '<=': return varValue <= expectedValue;
        case 'includes': return String(varValue).includes(expectedValue);
        case 'startsWith': return String(varValue).startsWith(expectedValue);
        case 'endsWith': return String(varValue).endsWith(expectedValue);
        default: return false;
      }
    }

    return false;
  }

  /**
   * Handle callback
   */
  async _handleCallback(callback, context) {
    if (typeof callback === 'function') {
      await callback(context);
    } else if (typeof callback === 'string') {
      // Execute another workflow
      await this.executeWorkflow(callback, context);
    }
  }

  /**
   * Register built-in workflows
   */
  _registerBuiltinWorkflows() {
    // Example: Daily backup workflow
    const backupWorkflow = this.createWorkflow(
      'Daily Backup',
      'Automatically backup important files'
    );

    this.addStep(backupWorkflow.id, {
      type: 'file',
      action: 'list',
      params: { path: '/documents' }
    });

    this.addStep(backupWorkflow.id, {
      type: 'system',
      action: 'notification',
      params: {
        title: 'Backup Complete',
        message: 'Your files have been backed up'
      }
    });

    // Example: Development environment setup
    const devSetupWorkflow = this.createWorkflow(
      'Dev Environment Setup',
      'Setup development environment'
    );

    this.addStep(devSetupWorkflow.id, {
      type: 'app',
      action: 'launch',
      params: { appName: 'Terminal' }
    });

    this.addStep(devSetupWorkflow.id, {
      type: 'wait',
      action: 'delay',
      params: { ms: 1000 }
    });

    this.addStep(devSetupWorkflow.id, {
      type: 'app',
      action: 'launch',
      params: { appName: 'CodeEditor' }
    });

    this.addStep(devSetupWorkflow.id, {
      type: 'app',
      action: 'launch',
      params: { appName: 'Browser' }
    });

    this.logger.info('Registered built-in workflows');
  }

  /**
   * Load workflows from storage
   */
  async _loadWorkflows() {
    try {
      const vfs = this.kernel.vfs;
      const workflowsPath = '/.workflows/workflows.json';

      const data = await vfs.readFile(workflowsPath);
      const workflows = JSON.parse(data);

      for (const workflow of workflows) {
        this.workflows.set(workflow.id, workflow);
      }

      this.logger.info(`Loaded ${workflows.length} workflows`);
    } catch (error) {
      this.logger.info('No saved workflows found');
    }
  }

  /**
   * Save workflows to storage
   */
  async _saveWorkflows() {
    try {
      const vfs = this.kernel.vfs;
      const workflowsPath = '/.workflows/workflows.json';

      await vfs.mkdir('/.workflows', { recursive: true });

      const workflows = Array.from(this.workflows.values());
      const data = JSON.stringify(workflows, null, 2);

      await vfs.writeFile(workflowsPath, data);
    } catch (error) {
      this.logger.error('Failed to save workflows:', error);
    }
  }

  /**
   * Record execution in history
   */
  _recordExecution(execution) {
    this.workflowHistory.push(execution);

    // Limit history
    if (this.workflowHistory.length > 100) {
      this.workflowHistory.shift();
    }
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId) {
    const deleted = this.workflows.delete(workflowId);
    if (deleted) {
      this._saveWorkflows();
    }
    return deleted;
  }

  /**
   * Get execution history
   */
  getHistory(limit = 10) {
    return this.workflowHistory.slice(-limit);
  }

  /**
   * Utility: sleep
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default WorkflowEngine;
