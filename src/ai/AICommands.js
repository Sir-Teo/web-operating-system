/**
 * AICommands - Terminal commands for AI features
 *
 * Provides terminal commands for interacting with AI services.
 */

import AITerminalAssistant from './AITerminalAssistant.js';
import SmartFileAssistant from './SmartFileAssistant.js';
import SmartCodeAssistant from './SmartCodeAssistant.js';
import AIService from './AIService.js';

/**
 * ai - Main AI assistant command
 */
export async function ai(args, context) {
  if (!AIService.isReady()) {
    await AIService.init();
  }

  if (args.length === 0) {
    return `AI Assistant - Get intelligent help with terminal commands

Usage:
  ai <query>                Ask for command suggestions
  ai explain <command>      Explain a command
  ai script <description>   Generate a script
  ai help <error>           Get help with an error

Examples:
  ai "how do I list all PDF files?"
  ai explain "tar -czf archive.tar.gz folder"
  ai script "backup my documents to /backup"
  ai help "command not found: xyz"`;
  }

  const subcommand = args[0].toLowerCase();

  // Initialize assistant if needed
  if (!AITerminalAssistant.aiService.isReady()) {
    await AITerminalAssistant.init();
  }

  try {
    if (subcommand === 'explain') {
      const command = args.slice(1).join(' ');
      if (!command) {
        return 'Usage: ai explain <command>';
      }

      const explanation = await AITerminalAssistant.explainCommand(command);
      return `📖 Explanation:\n\n${explanation}`;
    } else if (subcommand === 'script') {
      const description = args.slice(1).join(' ');
      if (!description) {
        return 'Usage: ai script <description>';
      }

      const script = await AITerminalAssistant.generateScript(description);
      return `📝 Generated script:\n\n${script}`;
    } else if (subcommand === 'help') {
      const error = args.slice(1).join(' ');
      if (!error) {
        return 'Usage: ai help <error message>';
      }

      const fix = await AITerminalAssistant.fixError(context.lastCommand || '', error);
      return `🔧 Suggestion:\n\nCommand: ${fix.fixedCommand}\n\n${fix.explanation}`;
    } else {
      // Default: suggest command
      const query = args.join(' ');
      const suggestion = await AITerminalAssistant.suggestCommand(query, {
        cwd: context.cwd,
      });

      if (!suggestion.command) {
        return '❌ Could not generate a suggestion for that query.';
      }

      return `💡 Suggested command:\n\n  ${suggestion.command}\n\n${suggestion.explanation}`;
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * smart-search - Natural language file search
 */
export async function smartSearch(args, context) {
  if (args.length === 0) {
    return `Smart Search - Find files using natural language

Usage:
  smart-search <query>

Examples:
  smart-search "my presentation from last week"
  smart-search "javascript files larger than 1MB"
  smart-search "documents containing budget data"`;
  }

  const query = args.join(' ');

  try {
    const smartFileAssistant = new SmartFileAssistant(context.fs);
    await smartFileAssistant.init();

    const results = await smartFileAssistant.search(query, {
      maxResults: 10,
      minScore: 0.3,
    });

    if (results.length === 0) {
      return `No files found matching "${query}"`;
    }

    let output = `📊 Found ${results.length} matching files:\n\n`;

    for (const result of results) {
      const score = Math.round(result.score * 100);
      const size = context.fs.formatBytes ? context.fs.formatBytes(result.size) : `${result.size} bytes`;
      const date = new Date(result.mtime).toLocaleString();

      output += `  ${score}% - ${result.path}\n`;
      output += `        ${size}, modified ${date}\n\n`;
    }

    return output;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * smart-organize - Intelligent file organization
 */
export async function smartOrganize(args, context) {
  const path = args[0] || context.cwd;
  const isDryRun = args.includes('--dry-run');

  try {
    const smartFileAssistant = new SmartFileAssistant(context.fs);
    await smartFileAssistant.init();

    const result = await smartFileAssistant.organize(path);

    if (!result.success) {
      return `Error: ${result.message}`;
    }

    const plan = result.plan;

    let output = `📊 Organization Plan for ${path}:\n\n`;
    output += `Total files: ${result.fileCount}\n\n`;

    for (const [category, files] of Object.entries(plan.categories)) {
      if (files.length > 0) {
        output += `${category.charAt(0).toUpperCase() + category.slice(1)} (${files.length} files):\n`;
        output += `  → ${plan.directories[category]}\n`;

        // Show first few files
        const preview = files.slice(0, 3);
        for (const file of preview) {
          output += `    - ${file.split('/').pop()}\n`;
        }
        if (files.length > 3) {
          output += `    ... and ${files.length - 3} more\n`;
        }
        output += '\n';
      }
    }

    if (isDryRun) {
      output += '(Dry run - no files were moved)\n';
      output += 'Run without --dry-run to apply changes.';
    } else {
      output += 'Apply this organization? [y/n]';
      // In a real implementation, this would wait for user confirmation
      // For now, we'll just show the plan
    }

    return output;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * smart-summarize - Summarize file contents
 */
export async function smartSummarize(args, context) {
  if (args.length === 0) {
    return `Smart Summarize - Summarize file contents using AI

Usage:
  smart-summarize <file>

Examples:
  smart-summarize /home/user/document.txt
  smart-summarize /home/user/project/app.js`;
  }

  const filePath = args[0];

  try {
    const smartFileAssistant = new SmartFileAssistant(context.fs);
    await smartFileAssistant.init();

    const summary = await smartFileAssistant.summarize(filePath);

    return `📝 Summary of ${filePath}:\n\n${summary}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * code-assist - AI-powered code assistance
 */
export async function codeAssist(args, context) {
  if (args.length === 0) {
    return `Code Assist - AI-powered code assistance

Usage:
  code-assist generate <description>   Generate code from description
  code-assist complete <code>           Complete partial code
  code-assist explain <file>            Explain code in file
  code-assist bugs <file>               Find potential bugs
  code-assist optimize <file>           Get optimization suggestions

Examples:
  code-assist generate "function to validate email"
  code-assist explain /home/user/app.js
  code-assist bugs /home/user/script.js`;
  }

  const subcommand = args[0].toLowerCase();
  const codeAssistant = new SmartCodeAssistant();

  if (!AIService.isReady()) {
    await AIService.init();
  }
  await codeAssistant.init();

  try {
    if (subcommand === 'generate') {
      const description = args.slice(1).join(' ');
      if (!description) {
        return 'Usage: code-assist generate <description>';
      }

      const code = await codeAssistant.generateFunction(description, 'javascript');
      return `📝 Generated code:\n\n${code}`;
    } else if (subcommand === 'complete') {
      const code = args.slice(1).join(' ');
      if (!code) {
        return 'Usage: code-assist complete <partial code>';
      }

      const completion = await codeAssistant.complete(code);
      return `✨ Completion:\n\n${code}${completion}`;
    } else if (subcommand === 'explain') {
      const filePath = args[1];
      if (!filePath) {
        return 'Usage: code-assist explain <file>';
      }

      const code = await context.fs.readFile(filePath, { encoding: 'utf8' });
      const explanation = await codeAssistant.explain(code);

      return `📖 Explanation of ${filePath}:\n\n${explanation}`;
    } else if (subcommand === 'bugs') {
      const filePath = args[1];
      if (!filePath) {
        return 'Usage: code-assist bugs <file>';
      }

      const code = await context.fs.readFile(filePath, { encoding: 'utf8' });
      const bugs = await codeAssistant.analyzeBugs(code);

      let output = `🐛 Bug Analysis for ${filePath}:\n\n`;

      for (let i = 0; i < bugs.length; i++) {
        const bug = bugs[i];
        const icon = bug.severity === 'high' ? '🔴' : bug.severity === 'medium' ? '🟡' : '🟢';
        output += `${i + 1}. ${icon} ${bug.description}\n`;
      }

      return output;
    } else if (subcommand === 'optimize') {
      const filePath = args[1];
      if (!filePath) {
        return 'Usage: code-assist optimize <file>';
      }

      const code = await context.fs.readFile(filePath, { encoding: 'utf8' });
      const optimizations = await codeAssistant.optimize(code);

      let output = `⚡ Optimization Suggestions for ${filePath}:\n\n`;

      for (let i = 0; i < optimizations.length; i++) {
        const opt = optimizations[i];
        const icon = opt.impact === 'high' ? '🔥' : opt.impact === 'medium' ? '⚡' : '💡';
        output += `${i + 1}. ${icon} ${opt.suggestion}\n`;
      }

      return output;
    } else {
      return 'Unknown subcommand. Use: generate, complete, explain, bugs, or optimize';
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Export all commands
export default {
  ai,
  'smart-search': smartSearch,
  'smart-organize': smartOrganize,
  'smart-summarize': smartSummarize,
  'code-assist': codeAssist,
};
