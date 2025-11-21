/**
 * ScriptExecutor - Executes parsed shell scripts (AST)
 * Handles: variables, conditionals, loops, functions, command substitution
 */
export class ScriptExecutor {
  constructor(terminal) {
    this.terminal = terminal;
    this.variables = { ...terminal.env };
    this.functions = {};
    this.exitCode = 0;
  }

  /**
   * Execute an AST
   * @param {Object} ast - Abstract Syntax Tree from ScriptParser
   * @returns {string} - Output of the script
   */
  async execute(ast) {
    const outputs = [];

    for (const node of ast.body) {
      const result = await this.executeNode(node);
      if (result && result.trim()) {
        outputs.push(result);
      }

      // Check for early exit
      if (this.exitCode !== 0 && this.exitCode !== null) {
        break;
      }
    }

    return outputs.join('\n');
  }

  /**
   * Execute a single AST node
   */
  async executeNode(node) {
    switch (node.type) {
      case 'Assignment':
        return await this.executeAssignment(node);

      case 'Command':
        return await this.executeCommand(node);

      case 'Conditional':
        return await this.executeConditional(node);

      case 'ForLoop':
        return await this.executeForLoop(node);

      case 'WhileLoop':
        return await this.executeWhileLoop(node);

      case 'FunctionDefinition':
        return await this.executeFunctionDefinition(node);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute a variable assignment
   */
  async executeAssignment(node) {
    const value = await this.evaluateValue(node.value);
    this.variables[node.variable] = value;
    return '';
  }

  /**
   * Evaluate a value (literal, variable, or command substitution)
   */
  async evaluateValue(valueNode) {
    switch (valueNode.type) {
      case 'Literal':
        return this.expandVariables(valueNode.value);

      case 'VariableReference':
        return this.variables[valueNode.name] || '';

      case 'CommandSubstitution':
        const output = await this.terminal.executeCommand(
          this.expandVariables(valueNode.command)
        );
        return output.replace(/^❌.*\n?/, '').trim(); // Remove error prefix

      default:
        return String(valueNode.value || '');
    }
  }

  /**
   * Expand variables in a string ($VAR or ${VAR})
   */
  expandVariables(str) {
    if (typeof str !== 'string') return str;

    // Handle ${VAR} syntax
    str = str.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return this.variables[varName] || '';
    });

    // Handle $VAR syntax
    str = str.replace(/\$(\w+)/g, (match, varName) => {
      return this.variables[varName] || '';
    });

    return str;
  }

  /**
   * Execute a command
   */
  async executeCommand(node) {
    const command = this.expandVariables(node.raw);

    // Check if it's a function call
    const funcName = command.split(/\s+/)[0];
    if (this.functions[funcName]) {
      return await this.executeFunction(funcName, command.split(/\s+/).slice(1));
    }

    // Execute as terminal command
    const result = await this.terminal.executeCommand(command);
    this.exitCode = result.startsWith('❌') ? 1 : 0;
    return result;
  }

  /**
   * Execute a conditional (if/else)
   */
  async executeConditional(node) {
    const conditionResult = await this.evaluateCondition(node.condition);
    const outputs = [];

    if (conditionResult) {
      // Execute consequent (then block)
      for (const stmt of node.consequent) {
        const result = await this.executeNode(stmt);
        if (result && result.trim()) {
          outputs.push(result);
        }
      }
    } else if (node.alternate.length > 0) {
      // Execute alternate (else block)
      for (const stmt of node.alternate) {
        const result = await this.executeNode(stmt);
        if (result && result.trim()) {
          outputs.push(result);
        }
      }
    }

    return outputs.join('\n');
  }

  /**
   * Evaluate a condition
   */
  async evaluateCondition(condition) {
    switch (condition.type) {
      case 'UnaryCondition':
        return await this.evaluateUnaryCondition(condition);

      case 'BinaryCondition':
        return await this.evaluateBinaryCondition(condition);

      case 'CommandCondition':
        const result = await this.terminal.executeCommand(
          this.expandVariables(condition.command)
        );
        return !result.startsWith('❌');

      default:
        return false;
    }
  }

  /**
   * Evaluate a unary condition (-f, -d, -z, -n, etc.)
   */
  async evaluateUnaryCondition(condition) {
    const op = condition.operator;
    const operand = this.expandVariables(condition.operand);

    switch (op) {
      case '-z': // String is empty
        return operand.length === 0;

      case '-n': // String is not empty
        return operand.length > 0;

      case '-f': // File exists (check in VFS)
        try {
          const path = this.terminal._resolvePath(operand);
          const stats = await this.terminal.context.fs.stat(path);
          return stats.isFile();
        } catch (e) {
          return false;
        }

      case '-d': // Directory exists (check in VFS)
        try {
          const path = this.terminal._resolvePath(operand);
          const stats = await this.terminal.context.fs.stat(path);
          return stats.isDirectory();
        } catch (e) {
          return false;
        }

      case '-e': // Path exists (file or directory)
        try {
          const path = this.terminal._resolvePath(operand);
          await this.terminal.context.fs.stat(path);
          return true;
        } catch (e) {
          return false;
        }

      case '-r': // File is readable (assume true if exists)
        try {
          const path = this.terminal._resolvePath(operand);
          await this.terminal.context.fs.stat(path);
          return true;
        } catch (e) {
          return false;
        }

      case '-w': // File is writable (assume true if exists)
        try {
          const path = this.terminal._resolvePath(operand);
          await this.terminal.context.fs.stat(path);
          return true;
        } catch (e) {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Evaluate a binary condition (=, !=, -eq, -ne, -lt, -gt, etc.)
   */
  async evaluateBinaryCondition(condition) {
    const left = this.expandVariables(condition.left);
    const right = this.expandVariables(condition.right);
    const op = condition.operator;

    switch (op) {
      case '=':
      case '==':
        return left === right;

      case '!=':
        return left !== right;

      case '-eq': // Equal (numeric)
        return parseInt(left) === parseInt(right);

      case '-ne': // Not equal (numeric)
        return parseInt(left) !== parseInt(right);

      case '-lt': // Less than
        return parseInt(left) < parseInt(right);

      case '-le': // Less than or equal
        return parseInt(left) <= parseInt(right);

      case '-gt': // Greater than
        return parseInt(left) > parseInt(right);

      case '-ge': // Greater than or equal
        return parseInt(left) >= parseInt(right);

      default:
        return false;
    }
  }

  /**
   * Execute a for loop
   */
  async executeForLoop(node) {
    const outputs = [];

    // Expand the list
    const list = node.list.map(item => this.expandVariables(item));

    // Iterate over the list
    for (const item of list) {
      // Set loop variable
      this.variables[node.variable] = item;

      // Execute loop body
      for (const stmt of node.body) {
        const result = await this.executeNode(stmt);
        if (result && result.trim()) {
          outputs.push(result);
        }
      }
    }

    return outputs.join('\n');
  }

  /**
   * Execute a while loop
   */
  async executeWhileLoop(node) {
    const outputs = [];
    const MAX_ITERATIONS = 1000; // Prevent infinite loops
    let iterations = 0;

    while (await this.evaluateCondition(node.condition)) {
      if (iterations++ > MAX_ITERATIONS) {
        return '❌ Error: Maximum loop iterations exceeded (1000)';
      }

      // Execute loop body
      for (const stmt of node.body) {
        const result = await this.executeNode(stmt);
        if (result && result.trim()) {
          outputs.push(result);
        }
      }
    }

    return outputs.join('\n');
  }

  /**
   * Define a function
   */
  async executeFunctionDefinition(node) {
    this.functions[node.name] = node;
    return '';
  }

  /**
   * Execute a function call
   */
  async executeFunction(name, args) {
    const func = this.functions[name];
    if (!func) {
      return `❌ Function not found: ${name}`;
    }

    // Save current variables
    const savedVars = { ...this.variables };

    // Set function arguments as $1, $2, etc.
    args.forEach((arg, i) => {
      this.variables[(i + 1).toString()] = this.expandVariables(arg);
    });
    this.variables['@'] = args.join(' ');
    this.variables['#'] = args.length.toString();

    // Execute function body
    const outputs = [];
    for (const stmt of func.body) {
      const result = await this.executeNode(stmt);
      if (result && result.trim()) {
        outputs.push(result);
      }
    }

    // Restore variables
    this.variables = savedVars;

    return outputs.join('\n');
  }

  /**
   * Set environment variables (merge with existing)
   */
  setEnvironment(env) {
    this.variables = { ...this.variables, ...env };
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return { ...this.variables };
  }
}
