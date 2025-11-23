/**
 * WorkflowAutomation - Intelligent workflow and task chaining system
 *
 * Features:
 * - Convert natural language to multi-step workflows
 * - Task chaining and dependencies
 * - Workflow templates and reusable patterns
 * - Error handling and recovery
 * - Progress tracking and reporting
 * - Conditional execution
 */

export class WorkflowAutomation {
  constructor() {
    this.workflows = new Map();
    this.workflowTemplates = this._buildWorkflowTemplates();
    this.executionHistory = [];
    this.activeWorkflows = new Map();
  }

  /**
   * Create a workflow from natural language description
   */
  async createWorkflowFromDescription(description) {
    const intent = this._analyzeWorkflowIntent(description);
    const steps = this._extractWorkflowSteps(description, intent);

    const workflow = {
      id: this._generateWorkflowId(),
      name: intent.name,
      description,
      steps,
      createdAt: Date.now(),
      estimatedDuration: this._estimateDuration(steps)
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, options = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution = {
      workflowId,
      startTime: Date.now(),
      status: 'running',
      currentStep: 0,
      results: [],
      errors: []
    };

    this.activeWorkflows.set(workflowId, execution);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        execution.currentStep = i;
        const step = workflow.steps[i];

        // Check if step should be executed (conditional)
        if (step.condition && !this._evaluateCondition(step.condition, execution)) {
          execution.results.push({
            step: i,
            skipped: true,
            reason: 'Condition not met'
          });
          continue;
        }

        // Execute step
        try {
          const result = await this._executeStep(step, execution, options);
          execution.results.push({
            step: i,
            success: true,
            result
          });

          // Call progress callback if provided
          if (options.onProgress) {
            options.onProgress({
              current: i + 1,
              total: workflow.steps.length,
              step: step.name,
              result
            });
          }
        } catch (error) {
          execution.errors.push({
            step: i,
            error: error.message,
            timestamp: Date.now()
          });

          // Handle error based on step configuration
          if (step.continueOnError) {
            execution.results.push({
              step: i,
              success: false,
              error: error.message
            });
            continue;
          } else {
            throw error;
          }
        }
      }

      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error.message;
    } finally {
      this.activeWorkflows.delete(workflowId);
      this.executionHistory.push(execution);
    }

    return execution;
  }

  /**
   * Build workflow templates
   */
  _buildWorkflowTemplates() {
    return {
      'project-setup': {
        name: 'Project Setup',
        description: 'Initialize a new project with best practices',
        steps: [
          {
            name: 'Create project directory',
            type: 'file-operation',
            action: 'mkdir',
            params: { path: '${projectName}' }
          },
          {
            name: 'Initialize Git repository',
            type: 'command',
            action: 'git init',
            params: {}
          },
          {
            name: 'Create README',
            type: 'file-operation',
            action: 'create',
            params: {
              path: 'README.md',
              content: '# ${projectName}\n\n${description}'
            }
          },
          {
            name: 'Create .gitignore',
            type: 'file-operation',
            action: 'create',
            params: {
              path: '.gitignore',
              content: 'node_modules/\n.env\ndist/'
            }
          },
          {
            name: 'Initialize package.json',
            type: 'command',
            action: 'npm init -y',
            params: {}
          }
        ]
      },

      'code-review': {
        name: 'Code Review',
        description: 'Comprehensive code review workflow',
        steps: [
          {
            name: 'Run linter',
            type: 'analysis',
            action: 'lint',
            params: {}
          },
          {
            name: 'Run tests',
            type: 'test',
            action: 'run-tests',
            params: {}
          },
          {
            name: 'Check security',
            type: 'analysis',
            action: 'security-scan',
            params: {}
          },
          {
            name: 'Analyze complexity',
            type: 'analysis',
            action: 'complexity-check',
            params: {}
          },
          {
            name: 'Generate report',
            type: 'output',
            action: 'generate-report',
            params: { format: 'markdown' }
          }
        ]
      },

      'deploy': {
        name: 'Deploy Application',
        description: 'Build and deploy application',
        steps: [
          {
            name: 'Run tests',
            type: 'test',
            action: 'run-tests',
            params: {}
          },
          {
            name: 'Build application',
            type: 'build',
            action: 'build',
            params: { mode: 'production' }
          },
          {
            name: 'Commit changes',
            type: 'git',
            action: 'commit',
            params: { message: 'Build for deployment' },
            condition: { hasUncommitted: true }
          },
          {
            name: 'Tag release',
            type: 'git',
            action: 'tag',
            params: { version: '${version}' }
          },
          {
            name: 'Push to remote',
            type: 'git',
            action: 'push',
            params: { tags: true }
          }
        ]
      },

      'cleanup': {
        name: 'System Cleanup',
        description: 'Clean up temporary files and optimize system',
        steps: [
          {
            name: 'Remove temp files',
            type: 'file-operation',
            action: 'remove-pattern',
            params: { pattern: '*.tmp' }
          },
          {
            name: 'Clear cache',
            type: 'system',
            action: 'clear-cache',
            params: {}
          },
          {
            name: 'Remove node_modules',
            type: 'file-operation',
            action: 'remove',
            params: { path: 'node_modules', confirm: true },
            continueOnError: true
          },
          {
            name: 'Optimize storage',
            type: 'system',
            action: 'optimize-storage',
            params: {}
          }
        ]
      },

      'backup': {
        name: 'Backup Project',
        description: 'Create a full backup of the current project',
        steps: [
          {
            name: 'Create backup directory',
            type: 'file-operation',
            action: 'mkdir',
            params: { path: 'backups/${date}' }
          },
          {
            name: 'Archive project files',
            type: 'archive',
            action: 'compress',
            params: {
              source: '.',
              destination: 'backups/${date}/project.tar.gz',
              exclude: ['node_modules', '.git']
            }
          },
          {
            name: 'Verify backup',
            type: 'validation',
            action: 'verify-archive',
            params: { path: 'backups/${date}/project.tar.gz' }
          },
          {
            name: 'Generate backup manifest',
            type: 'output',
            action: 'create-manifest',
            params: { path: 'backups/${date}/manifest.json' }
          }
        ]
      },

      'refactor': {
        name: 'Code Refactoring',
        description: 'Safe code refactoring with validation',
        steps: [
          {
            name: 'Backup current code',
            type: 'file-operation',
            action: 'backup',
            params: { path: '${file}' }
          },
          {
            name: 'Run tests (before)',
            type: 'test',
            action: 'run-tests',
            params: {}
          },
          {
            name: 'Apply refactoring',
            type: 'code-transform',
            action: 'refactor',
            params: { rules: '${rules}' }
          },
          {
            name: 'Run tests (after)',
            type: 'test',
            action: 'run-tests',
            params: {}
          },
          {
            name: 'Compare results',
            type: 'validation',
            action: 'compare-test-results',
            params: {}
          }
        ]
      },

      'organize-files': {
        name: 'Organize Files',
        description: 'Intelligently organize files by type and date',
        steps: [
          {
            name: 'Analyze files',
            type: 'analysis',
            action: 'analyze-files',
            params: { path: '${path}' }
          },
          {
            name: 'Create category folders',
            type: 'file-operation',
            action: 'create-folders',
            params: { categories: '${categories}' }
          },
          {
            name: 'Move files',
            type: 'file-operation',
            action: 'move-by-category',
            params: {}
          },
          {
            name: 'Remove empty folders',
            type: 'file-operation',
            action: 'remove-empty',
            params: {}
          },
          {
            name: 'Generate report',
            type: 'output',
            action: 'organization-report',
            params: {}
          }
        ]
      }
    };
  }

  /**
   * Analyze workflow intent from description
   */
  _analyzeWorkflowIntent(description) {
    const lower = description.toLowerCase();

    // Check for template matches
    for (const [id, template] of Object.entries(this.workflowTemplates)) {
      if (lower.includes(id.replace('-', ' ')) ||
          lower.includes(template.name.toLowerCase())) {
        return {
          type: 'template',
          templateId: id,
          name: template.name
        };
      }
    }

    // Detect workflow type from keywords
    const workflowTypes = {
      'setup': ['create', 'setup', 'initialize', 'start', 'new'],
      'build': ['build', 'compile', 'bundle'],
      'test': ['test', 'verify', 'validate'],
      'deploy': ['deploy', 'publish', 'release'],
      'cleanup': ['clean', 'remove', 'delete', 'clear'],
      'organize': ['organize', 'sort', 'arrange'],
      'backup': ['backup', 'save', 'archive'],
      'refactor': ['refactor', 'improve', 'restructure']
    };

    for (const [type, keywords] of Object.entries(workflowTypes)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return {
          type: 'custom',
          category: type,
          name: `Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Workflow`
        };
      }
    }

    return {
      type: 'custom',
      category: 'general',
      name: 'Custom Workflow'
    };
  }

  /**
   * Extract workflow steps from description
   */
  _extractWorkflowSteps(description, intent) {
    // If template, use template steps
    if (intent.type === 'template' && this.workflowTemplates[intent.templateId]) {
      return this.workflowTemplates[intent.templateId].steps;
    }

    // Parse custom workflow steps
    const steps = [];
    const sentences = description.split(/[.,;]/).filter(s => s.trim());

    for (const sentence of sentences) {
      const step = this._parseStepFromSentence(sentence);
      if (step) {
        steps.push(step);
      }
    }

    // If no steps parsed, create generic steps based on category
    if (steps.length === 0) {
      return this._generateDefaultSteps(intent.category);
    }

    return steps;
  }

  /**
   * Parse a single step from sentence
   */
  _parseStepFromSentence(sentence) {
    const lower = sentence.toLowerCase().trim();

    const patterns = [
      {
        pattern: /create|make|add/,
        type: 'file-operation',
        action: 'create'
      },
      {
        pattern: /delete|remove|clean/,
        type: 'file-operation',
        action: 'delete'
      },
      {
        pattern: /run|execute/,
        type: 'command',
        action: 'execute'
      },
      {
        pattern: /test/,
        type: 'test',
        action: 'run-tests'
      },
      {
        pattern: /build|compile/,
        type: 'build',
        action: 'build'
      },
      {
        pattern: /commit/,
        type: 'git',
        action: 'commit'
      },
      {
        pattern: /push/,
        type: 'git',
        action: 'push'
      }
    ];

    for (const { pattern, type, action } of patterns) {
      if (pattern.test(lower)) {
        return {
          name: sentence.trim(),
          type,
          action,
          params: this._extractParams(sentence)
        };
      }
    }

    return null;
  }

  /**
   * Extract parameters from sentence
   */
  _extractParams(sentence) {
    const params = {};

    // Extract quoted strings
    const quotes = sentence.match(/"([^"]+)"/g);
    if (quotes) {
      params.value = quotes[0].replace(/"/g, '');
    }

    // Extract file paths
    const paths = sentence.match(/[\w-]+\.[\w]+/);
    if (paths) {
      params.file = paths[0];
    }

    return params;
  }

  /**
   * Generate default steps for category
   */
  _generateDefaultSteps(category) {
    const defaultSteps = {
      'setup': [
        { name: 'Prepare environment', type: 'system', action: 'prepare', params: {} },
        { name: 'Install dependencies', type: 'command', action: 'install', params: {} },
        { name: 'Configure settings', type: 'config', action: 'configure', params: {} }
      ],
      'build': [
        { name: 'Clean previous build', type: 'file-operation', action: 'clean', params: {} },
        { name: 'Build project', type: 'build', action: 'build', params: {} },
        { name: 'Verify build', type: 'validation', action: 'verify', params: {} }
      ],
      'test': [
        { name: 'Run unit tests', type: 'test', action: 'unit', params: {} },
        { name: 'Run integration tests', type: 'test', action: 'integration', params: {} },
        { name: 'Generate coverage', type: 'test', action: 'coverage', params: {} }
      ],
      'general': [
        { name: 'Execute task', type: 'general', action: 'execute', params: {} }
      ]
    };

    return defaultSteps[category] || defaultSteps['general'];
  }

  /**
   * Execute a single step
   */
  async _executeStep(step, execution, options) {
    // Simulate step execution based on type
    const duration = Math.random() * 1000 + 500; // 0.5-1.5 seconds

    await new Promise(resolve => setTimeout(resolve, duration));

    // Step-specific execution logic
    const result = {
      step: step.name,
      type: step.type,
      action: step.action,
      duration,
      output: `Successfully executed: ${step.name}`
    };

    // If there's an actual executor, use it
    if (options.executor && typeof options.executor === 'function') {
      const customResult = await options.executor(step, execution);
      return { ...result, ...customResult };
    }

    return result;
  }

  /**
   * Evaluate condition
   */
  _evaluateCondition(condition, execution) {
    // Simple condition evaluation
    // In production, this would be more sophisticated
    if (typeof condition === 'function') {
      return condition(execution);
    }

    if (typeof condition === 'object') {
      for (const [key, value] of Object.entries(condition)) {
        if (execution[key] !== value) {
          return false;
        }
      }
      return true;
    }

    return true;
  }

  /**
   * Estimate workflow duration
   */
  _estimateDuration(steps) {
    const durations = {
      'file-operation': 1000,
      'command': 2000,
      'test': 5000,
      'build': 10000,
      'git': 1500,
      'analysis': 3000,
      'default': 1000
    };

    return steps.reduce((total, step) => {
      return total + (durations[step.type] || durations['default']);
    }, 0);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * Get workflow template
   */
  getTemplate(templateId) {
    return this.workflowTemplates[templateId];
  }

  /**
   * List all workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * List all templates
   */
  listTemplates() {
    return Object.entries(this.workflowTemplates).map(([id, template]) => ({
      id,
      ...template
    }));
  }

  /**
   * Get execution history
   */
  getHistory() {
    return this.executionHistory;
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId) {
    const execution = this.activeWorkflows.get(workflowId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = Date.now();
      this.activeWorkflows.delete(workflowId);
      this.executionHistory.push(execution);
      return true;
    }
    return false;
  }

  /**
   * Generate workflow ID
   */
  _generateWorkflowId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export workflow
   */
  exportWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Import workflow
   */
  importWorkflow(workflowJson) {
    const workflow = JSON.parse(workflowJson);
    workflow.id = this._generateWorkflowId(); // Generate new ID
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }
}

export default WorkflowAutomation;
