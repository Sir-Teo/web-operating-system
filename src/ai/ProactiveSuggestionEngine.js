/**
 * ProactiveSuggestionEngine - Intelligent suggestion system
 *
 * Proactively suggests actions, commands, and optimizations based on:
 * - User activity patterns
 * - Current OS state
 * - Common workflows
 * - Best practices
 * - Error prevention
 */

export class ProactiveSuggestionEngine {
  constructor() {
    this.suggestionRules = this._buildSuggestionRules();
    this.suggestionHistory = [];
    this.acceptedSuggestions = [];
    this.dismissedSuggestions = [];
    this.learningRate = 0.1;
  }

  /**
   * Generate proactive suggestions based on context
   */
  async generateSuggestions(context) {
    const suggestions = [];

    // Analyze current state
    const analysis = this._analyzeContext(context);

    // Apply all suggestion rules
    for (const rule of this.suggestionRules) {
      if (rule.condition(analysis, context)) {
        const suggestion = rule.generate(analysis, context);
        if (suggestion) {
          suggestions.push({
            ...suggestion,
            ruleId: rule.id,
            confidence: this._calculateConfidence(rule, analysis, context),
            timestamp: Date.now()
          });
        }
      }
    }

    // Sort by confidence and relevance
    const rankedSuggestions = this._rankSuggestions(suggestions, context);

    // Store suggestions for learning
    this.suggestionHistory.push(...rankedSuggestions);

    return rankedSuggestions.slice(0, 5); // Return top 5
  }

  /**
   * Build suggestion rules
   */
  _buildSuggestionRules() {
    return [
      // File management suggestions
      {
        id: 'organize_downloads',
        category: 'file-management',
        condition: (analysis, context) => {
          return analysis.hasMessyDirectory &&
                 context.currentDirectory?.includes('downloads');
        },
        generate: (analysis) => ({
          type: 'action',
          title: 'Organize Downloads',
          description: `Found ${analysis.fileCount} files in downloads. Would you like me to organize them?`,
          action: 'organize_files',
          params: { directory: 'downloads', strategy: 'by-type' },
          benefit: 'Improve file organization and easier file discovery',
          icon: '📁'
        }),
        priority: 8
      },

      {
        id: 'large_files_cleanup',
        category: 'optimization',
        condition: (analysis, context) => {
          return analysis.largeFiles && analysis.largeFiles.length > 0;
        },
        generate: (analysis) => ({
          type: 'action',
          title: 'Clean Up Large Files',
          description: `Found ${analysis.largeFiles.length} files larger than 100MB`,
          action: 'review_large_files',
          params: { files: analysis.largeFiles },
          benefit: `Could free up ${analysis.potentialSavings}MB of space`,
          icon: '🧹'
        }),
        priority: 7
      },

      {
        id: 'duplicate_files',
        category: 'optimization',
        condition: (analysis) => analysis.duplicateFiles?.length > 0,
        generate: (analysis) => ({
          type: 'action',
          title: 'Remove Duplicate Files',
          description: `Found ${analysis.duplicateFiles.length} duplicate files`,
          action: 'remove_duplicates',
          params: { duplicates: analysis.duplicateFiles },
          benefit: `Save ${analysis.duplicateSize}MB of storage`,
          icon: '📋'
        }),
        priority: 6
      },

      // Code quality suggestions
      {
        id: 'run_tests',
        category: 'code-quality',
        condition: (analysis, context) => {
          return analysis.hasTestFiles && !analysis.recentTestRun;
        },
        generate: () => ({
          type: 'action',
          title: 'Run Tests',
          description: 'Test files found but no recent test runs detected',
          action: 'run_tests',
          params: {},
          benefit: 'Ensure code quality and catch bugs early',
          icon: '🧪'
        }),
        priority: 9
      },

      {
        id: 'missing_tests',
        category: 'code-quality',
        condition: (analysis) => {
          return analysis.codeFiles > 0 && !analysis.hasTestFiles;
        },
        generate: (analysis) => ({
          type: 'suggestion',
          title: 'Add Tests',
          description: `Found ${analysis.codeFiles} code files without tests`,
          action: 'generate_tests',
          params: {},
          benefit: 'Improve code reliability and maintainability',
          icon: '✅'
        }),
        priority: 7
      },

      {
        id: 'code_complexity',
        category: 'code-quality',
        condition: (analysis) => analysis.complexFunctions?.length > 0,
        generate: (analysis) => ({
          type: 'warning',
          title: 'High Complexity Detected',
          description: `${analysis.complexFunctions.length} functions have high cyclomatic complexity`,
          action: 'refactor_code',
          params: { functions: analysis.complexFunctions },
          benefit: 'Improve code maintainability and reduce bugs',
          icon: '⚠️'
        }),
        priority: 6
      },

      // Security suggestions
      {
        id: 'security_vulnerabilities',
        category: 'security',
        condition: (analysis) => analysis.securityIssues?.length > 0,
        generate: (analysis) => ({
          type: 'alert',
          title: 'Security Issues Found',
          description: `${analysis.securityIssues.length} potential security vulnerabilities detected`,
          action: 'fix_security',
          params: { issues: analysis.securityIssues },
          benefit: 'Protect your application from security threats',
          icon: '🔒',
          urgency: 'high'
        }),
        priority: 10
      },

      {
        id: 'exposed_secrets',
        category: 'security',
        condition: (analysis) => analysis.potentialSecrets?.length > 0,
        generate: (analysis) => ({
          type: 'alert',
          title: 'Potential Secrets Exposed',
          description: `Found ${analysis.potentialSecrets.length} files that might contain sensitive data`,
          action: 'review_secrets',
          params: { files: analysis.potentialSecrets },
          benefit: 'Prevent credential leaks and security breaches',
          icon: '🔐',
          urgency: 'critical'
        }),
        priority: 10
      },

      // Performance suggestions
      {
        id: 'memory_usage_high',
        category: 'performance',
        condition: (analysis, context) => {
          return context.systemInfo?.memory?.used >
                 context.systemInfo?.memory?.total * 0.8;
        },
        generate: (analysis, context) => ({
          type: 'warning',
          title: 'High Memory Usage',
          description: `Memory usage at ${Math.round(analysis.memoryPercent)}%`,
          action: 'optimize_memory',
          params: {},
          benefit: 'Improve system performance and prevent crashes',
          icon: '💾'
        }),
        priority: 8
      },

      {
        id: 'many_processes',
        category: 'performance',
        condition: (analysis, context) => {
          return context.processes?.length > 20;
        },
        generate: (analysis, context) => ({
          type: 'suggestion',
          title: 'Too Many Processes',
          description: `${context.processes.length} processes running`,
          action: 'review_processes',
          params: {},
          benefit: 'Close unnecessary processes to improve performance',
          icon: '⚡'
        }),
        priority: 7
      },

      // Workflow automation suggestions
      {
        id: 'repetitive_commands',
        category: 'automation',
        condition: (analysis) => analysis.repetitiveCommands?.length > 0,
        generate: (analysis) => ({
          type: 'suggestion',
          title: 'Automate Repetitive Tasks',
          description: `Detected ${analysis.repetitiveCommands.length} repeated command patterns`,
          action: 'create_script',
          params: { commands: analysis.repetitiveCommands },
          benefit: 'Save time by automating common tasks',
          icon: '🤖'
        }),
        priority: 7
      },

      {
        id: 'common_workflow',
        category: 'automation',
        condition: (analysis) => analysis.workflowPattern,
        generate: (analysis) => ({
          type: 'suggestion',
          title: 'Create Workflow Template',
          description: `Detected a common workflow: ${analysis.workflowPattern.name}`,
          action: 'save_workflow',
          params: { pattern: analysis.workflowPattern },
          benefit: 'Quickly repeat this workflow in the future',
          icon: '📋'
        }),
        priority: 6
      },

      // Learning and help suggestions
      {
        id: 'error_prone_command',
        category: 'learning',
        condition: (analysis) => analysis.frequentErrors?.length > 0,
        generate: (analysis) => ({
          type: 'tip',
          title: 'Common Error Detected',
          description: `You frequently make errors with: ${analysis.frequentErrors[0]}`,
          action: 'learn_command',
          params: { command: analysis.frequentErrors[0] },
          benefit: 'Learn the correct usage to avoid future mistakes',
          icon: '💡'
        }),
        priority: 5
      },

      {
        id: 'advanced_feature',
        category: 'learning',
        condition: (analysis, context) => {
          return context.memory?.skillLevel === 'intermediate' &&
                 analysis.advancedFeatureAvailable;
        },
        generate: (analysis) => ({
          type: 'tip',
          title: 'Try Advanced Feature',
          description: `Did you know you can ${analysis.advancedFeature}?`,
          action: 'show_tutorial',
          params: { feature: analysis.advancedFeature },
          benefit: 'Level up your productivity',
          icon: '🎓'
        }),
        priority: 4
      },

      // Best practices
      {
        id: 'git_commit_needed',
        category: 'best-practice',
        condition: (analysis) => {
          return analysis.uncommittedChanges &&
                 analysis.uncommittedFiles > 10;
        },
        generate: (analysis) => ({
          type: 'reminder',
          title: 'Commit Your Changes',
          description: `${analysis.uncommittedFiles} files changed`,
          action: 'git_commit',
          params: {},
          benefit: 'Preserve your work and maintain version history',
          icon: '📝'
        }),
        priority: 6
      },

      {
        id: 'backup_reminder',
        category: 'best-practice',
        condition: (analysis, context) => {
          const lastBackup = context.memory?.lastBackup;
          const daysSinceBackup = lastBackup ?
            (Date.now() - lastBackup) / (1000 * 60 * 60 * 24) : 999;
          return daysSinceBackup > 7;
        },
        generate: () => ({
          type: 'reminder',
          title: 'Backup Recommended',
          description: 'No recent backup detected',
          action: 'create_backup',
          params: {},
          benefit: 'Protect your work from data loss',
          icon: '💾'
        }),
        priority: 7
      },

      // Context-aware suggestions
      {
        id: 'follow_up_question',
        category: 'contextual',
        condition: (analysis, context) => {
          return context.memory?.currentTopic &&
                 analysis.hasFollowUpOpportunity;
        },
        generate: (analysis, context) => ({
          type: 'question',
          title: 'Related Question',
          description: `Would you like to ${analysis.followUpAction}?`,
          action: 'suggest_followup',
          params: { topic: context.memory.currentTopic },
          benefit: 'Complete your workflow',
          icon: '❓'
        }),
        priority: 5
      },

      // Time-based suggestions
      {
        id: 'end_of_day',
        category: 'time-based',
        condition: () => {
          const hour = new Date().getHours();
          return hour >= 17 && hour < 19; // 5-7 PM
        },
        generate: () => ({
          type: 'reminder',
          title: 'End of Day Checklist',
          description: 'Review and save your work',
          action: 'eod_checklist',
          params: {},
          benefit: 'Ensure work is saved and organized',
          icon: '🌅'
        }),
        priority: 5
      }
    ];
  }

  /**
   * Analyze context to generate insights
   */
  _analyzeContext(context) {
    const analysis = {};

    // File system analysis
    if (context.fileSystem) {
      analysis.fileCount = context.fileSystem.files?.length || 0;
      analysis.hasMessyDirectory = analysis.fileCount > 50;

      // Count code files
      analysis.codeFiles = context.fileSystem.files?.filter(f =>
        /\.(js|py|java|cpp|rs|go)$/i.test(f.name)
      ).length || 0;

      // Check for test files
      analysis.hasTestFiles = context.fileSystem.files?.some(f =>
        /test|spec/i.test(f.name)
      ) || false;

      // Find large files
      analysis.largeFiles = context.fileSystem.files?.filter(f =>
        f.size > 100 * 1024 * 1024 // > 100MB
      ) || [];

      analysis.potentialSavings = analysis.largeFiles.reduce((sum, f) =>
        sum + (f.size / (1024 * 1024)), 0
      );
    }

    // Process analysis
    if (context.processes) {
      analysis.processCount = context.processes.length;
      analysis.highProcessCount = analysis.processCount > 20;
    }

    // Memory analysis
    if (context.systemInfo?.memory) {
      const mem = context.systemInfo.memory;
      analysis.memoryPercent = (mem.used / mem.total) * 100;
      analysis.highMemoryUsage = analysis.memoryPercent > 80;
    }

    // Command history analysis
    if (context.terminal?.recentCommands) {
      const commands = context.terminal.recentCommands;

      // Find repetitive patterns
      const commandCounts = {};
      for (const cmd of commands) {
        const base = cmd.split(' ')[0];
        commandCounts[base] = (commandCounts[base] || 0) + 1;
      }

      analysis.repetitiveCommands = Object.entries(commandCounts)
        .filter(([_, count]) => count >= 3)
        .map(([cmd]) => cmd);

      // Detect workflows
      analysis.workflowPattern = this._detectWorkflow(commands);
    }

    // Conversation analysis
    if (context.memory) {
      analysis.currentTopic = context.memory.currentTopic;
      analysis.skillLevel = context.memory.skillLevel;
      analysis.hasFollowUpOpportunity = this._hasFollowUpOpportunity(context.memory);
    }

    return analysis;
  }

  /**
   * Detect workflow patterns
   */
  _detectWorkflow(commands) {
    const workflows = {
      'git-workflow': ['git add', 'git commit', 'git push'],
      'build-workflow': ['npm install', 'npm run build', 'npm test'],
      'deploy-workflow': ['npm run build', 'git add', 'git commit', 'git push']
    };

    for (const [name, pattern] of Object.entries(workflows)) {
      const cmdString = commands.join(' ');
      const matches = pattern.filter(cmd => cmdString.includes(cmd)).length;

      if (matches >= pattern.length - 1) {
        return { name, pattern, confidence: matches / pattern.length };
      }
    }

    return null;
  }

  /**
   * Check for follow-up opportunities
   */
  _hasFollowUpOpportunity(memory) {
    const topic = memory.currentTopic;
    const flow = memory.conversationFlow || [];

    if (!topic || flow.length === 0) return false;

    // Check if last exchange suggests follow-up
    const lastExchange = flow[flow.length - 1];

    const followUpTopics = {
      'file-management': lastExchange.hasCommand && !lastExchange.executed,
      'coding': lastExchange.hasCode && !lastExchange.tested,
      'troubleshooting': lastExchange.hasSolution && !lastExchange.applied
    };

    return followUpTopics[topic] || false;
  }

  /**
   * Calculate suggestion confidence
   */
  _calculateConfidence(rule, analysis, context) {
    let confidence = 0.5; // Base confidence

    // Adjust based on rule priority
    confidence += (rule.priority / 20);

    // Adjust based on user history
    const ruleHistory = this.suggestionHistory.filter(s => s.ruleId === rule.id);
    const accepted = this.acceptedSuggestions.filter(s => s.ruleId === rule.id).length;
    const dismissed = this.dismissedSuggestions.filter(s => s.ruleId === rule.id).length;

    if (ruleHistory.length > 0) {
      const acceptanceRate = accepted / (accepted + dismissed + 0.1);
      confidence = confidence * 0.7 + acceptanceRate * 0.3;
    }

    // Adjust based on context relevance
    if (context.memory?.currentTopic === rule.category) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Rank suggestions by relevance
   */
  _rankSuggestions(suggestions, context) {
    return suggestions.sort((a, b) => {
      // Urgency first
      if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
      if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (b.urgency === 'high' && a.urgency !== 'high') return 1;

      // Then confidence
      return b.confidence - a.confidence;
    });
  }

  /**
   * Record user feedback on suggestion
   */
  recordFeedback(suggestionId, action) {
    const suggestion = this.suggestionHistory.find(s =>
      s.ruleId === suggestionId || s.id === suggestionId
    );

    if (!suggestion) return;

    if (action === 'accepted') {
      this.acceptedSuggestions.push(suggestion);
    } else if (action === 'dismissed') {
      this.dismissedSuggestions.push(suggestion);
    }

    // Learn from feedback
    this._learn(suggestion, action);
  }

  /**
   * Learn from user feedback
   */
  _learn(suggestion, action) {
    // Adjust rule priorities based on feedback
    const rule = this.suggestionRules.find(r => r.id === suggestion.ruleId);

    if (rule) {
      if (action === 'accepted') {
        rule.priority = Math.min(10, rule.priority + this.learningRate);
      } else if (action === 'dismissed') {
        rule.priority = Math.max(1, rule.priority - this.learningRate);
      }
    }
  }

  /**
   * Get suggestion statistics
   */
  getStatistics() {
    return {
      totalSuggestions: this.suggestionHistory.length,
      accepted: this.acceptedSuggestions.length,
      dismissed: this.dismissedSuggestions.length,
      acceptanceRate: this.suggestionHistory.length > 0 ?
        (this.acceptedSuggestions.length / this.suggestionHistory.length) * 100 : 0,
      topRules: this._getTopRules()
    };
  }

  /**
   * Get most effective rules
   */
  _getTopRules() {
    const ruleStats = {};

    for (const suggestion of this.acceptedSuggestions) {
      if (!ruleStats[suggestion.ruleId]) {
        ruleStats[suggestion.ruleId] = { accepted: 0, total: 0 };
      }
      ruleStats[suggestion.ruleId].accepted++;
    }

    for (const suggestion of this.suggestionHistory) {
      if (!ruleStats[suggestion.ruleId]) {
        ruleStats[suggestion.ruleId] = { accepted: 0, total: 0 };
      }
      ruleStats[suggestion.ruleId].total++;
    }

    return Object.entries(ruleStats)
      .map(([ruleId, stats]) => ({
        ruleId,
        acceptanceRate: stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0,
        total: stats.total
      }))
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 5);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.suggestionHistory = [];
    this.acceptedSuggestions = [];
    this.dismissedSuggestions = [];
  }
}

export default ProactiveSuggestionEngine;
