/**
 * ScriptParser - Parses shell scripts into an Abstract Syntax Tree (AST)
 * Supports: variables, conditionals, loops, functions, command substitution
 */
export class ScriptParser {
  constructor() {
    this.tokens = [];
    this.current = 0;
  }

  /**
   * Parse a shell script into an AST
   * @param {string} script - The shell script content
   * @returns {Object} - Abstract Syntax Tree
   */
  parse(script) {
    const lines = script.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('#!/'));

    const ast = {
      type: 'Program',
      body: []
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (!line) {
        i++;
        continue;
      }

      // Parse function definitions
      if (line.match(/^(\w+)\s*\(\s*\)\s*\{?$/)) {
        const result = this.parseFunction(lines, i);
        ast.body.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Parse conditionals (if statements)
      if (line.startsWith('if ')) {
        const result = this.parseConditional(lines, i);
        ast.body.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Parse for loops
      if (line.startsWith('for ')) {
        const result = this.parseForLoop(lines, i);
        ast.body.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Parse while loops
      if (line.startsWith('while ')) {
        const result = this.parseWhileLoop(lines, i);
        ast.body.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Parse variable assignment
      if (line.match(/^(\w+)=(.+)$/)) {
        ast.body.push(this.parseAssignment(line));
        i++;
        continue;
      }

      // Parse regular command
      ast.body.push(this.parseCommand(line));
      i++;
    }

    return ast;
  }

  /**
   * Parse a variable assignment
   */
  parseAssignment(line) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (!match) {
      throw new Error(`Invalid assignment: ${line}`);
    }

    return {
      type: 'Assignment',
      variable: match[1],
      value: this.parseValue(match[2])
    };
  }

  /**
   * Parse a value (string, variable reference, or command substitution)
   */
  parseValue(value) {
    value = value.trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return {
        type: 'Literal',
        value: value.slice(1, -1)
      };
    }

    // Variable reference
    if (value.startsWith('$')) {
      return {
        type: 'VariableReference',
        name: value.slice(1)
      };
    }

    // Command substitution $()
    if (value.startsWith('$(') && value.endsWith(')')) {
      return {
        type: 'CommandSubstitution',
        command: value.slice(2, -1)
      };
    }

    // Command substitution ``
    if (value.startsWith('`') && value.endsWith('`')) {
      return {
        type: 'CommandSubstitution',
        command: value.slice(1, -1)
      };
    }

    // Literal value
    return {
      type: 'Literal',
      value: value
    };
  }

  /**
   * Parse a command
   */
  parseCommand(line) {
    // Handle command substitution in arguments
    const expandedLine = line;

    return {
      type: 'Command',
      raw: expandedLine
    };
  }

  /**
   * Parse a conditional (if/elif/else)
   */
  parseConditional(lines, startIndex) {
    const ifLine = lines[startIndex];
    let i = startIndex + 1;

    // Parse condition from "if [ condition ]; then" or "if test condition; then"
    const conditionMatch = ifLine.match(/^if\s+(.+?)(?:;\s*then)?$/);
    if (!conditionMatch) {
      throw new Error(`Invalid if statement: ${ifLine}`);
    }

    const condition = this.parseCondition(conditionMatch[1]);

    const consequent = [];
    const alternate = [];
    let inElse = false;
    let depth = 1;

    // Find matching fi
    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();

      if (line === 'then') {
        i++;
        continue;
      }

      if (line.startsWith('if ')) {
        depth++;
      } else if (line === 'fi') {
        depth--;
        if (depth === 0) break;
      } else if (line === 'else' && depth === 1) {
        inElse = true;
        i++;
        continue;
      } else if (line.startsWith('elif ') && depth === 1) {
        // Handle elif as nested if-else
        const elifResult = this.parseConditional(lines, i);
        alternate.push(elifResult.node);
        i = elifResult.nextIndex;
        continue;
      }

      if (!inElse) {
        consequent.push(this.parseCommand(line));
      } else {
        alternate.push(this.parseCommand(line));
      }
      i++;
    }

    return {
      node: {
        type: 'Conditional',
        condition,
        consequent,
        alternate
      },
      nextIndex: i + 1
    };
  }

  /**
   * Parse a condition from test or [ ]
   */
  parseCondition(condStr) {
    condStr = condStr.trim();

    // Remove 'then' if present
    condStr = condStr.replace(/;\s*then\s*$/, '').trim();

    // Handle [ ... ] or [[ ... ]]
    if (condStr.startsWith('[[') && condStr.endsWith(']]')) {
      condStr = condStr.slice(2, -2).trim();
    } else if (condStr.startsWith('[') && condStr.endsWith(']')) {
      condStr = condStr.slice(1, -1).trim();
    } else if (condStr.startsWith('test ')) {
      condStr = condStr.slice(5).trim();
    }

    // Parse the condition
    // Support: -f file, -d dir, -z string, -n string, str1 = str2, etc.
    const parts = condStr.split(/\s+/);

    if (parts.length === 2) {
      // Unary operator: -f file, -z string
      return {
        type: 'UnaryCondition',
        operator: parts[0],
        operand: parts[1]
      };
    } else if (parts.length === 3) {
      // Binary operator: str1 = str2, num1 -eq num2
      return {
        type: 'BinaryCondition',
        left: parts[0],
        operator: parts[1],
        right: parts[2]
      };
    }

    // Fallback: treat as command
    return {
      type: 'CommandCondition',
      command: condStr
    };
  }

  /**
   * Parse a for loop
   */
  parseForLoop(lines, startIndex) {
    const forLine = lines[startIndex];
    let i = startIndex + 1;

    // Parse: for var in list; do
    const match = forLine.match(/^for\s+(\w+)\s+in\s+(.+?)(?:;\s*do)?$/);
    if (!match) {
      throw new Error(`Invalid for loop: ${forLine}`);
    }

    const variable = match[1];
    const list = match[2].split(/\s+/);

    const body = [];
    let depth = 1;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();

      if (line === 'do') {
        i++;
        continue;
      }

      if (line.startsWith('for ') || line.startsWith('while ')) {
        depth++;
      } else if (line === 'done') {
        depth--;
        if (depth === 0) break;
      }

      body.push(this.parseCommand(line));
      i++;
    }

    return {
      node: {
        type: 'ForLoop',
        variable,
        list,
        body
      },
      nextIndex: i + 1
    };
  }

  /**
   * Parse a while loop
   */
  parseWhileLoop(lines, startIndex) {
    const whileLine = lines[startIndex];
    let i = startIndex + 1;

    // Parse: while [ condition ]; do
    const match = whileLine.match(/^while\s+(.+?)(?:;\s*do)?$/);
    if (!match) {
      throw new Error(`Invalid while loop: ${whileLine}`);
    }

    const condition = this.parseCondition(match[1]);

    const body = [];
    let depth = 1;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();

      if (line === 'do') {
        i++;
        continue;
      }

      if (line.startsWith('for ') || line.startsWith('while ')) {
        depth++;
      } else if (line === 'done') {
        depth--;
        if (depth === 0) break;
      }

      body.push(this.parseCommand(line));
      i++;
    }

    return {
      node: {
        type: 'WhileLoop',
        condition,
        body
      },
      nextIndex: i + 1
    };
  }

  /**
   * Parse a function definition
   */
  parseFunction(lines, startIndex) {
    const funcLine = lines[startIndex];
    let i = startIndex + 1;

    const match = funcLine.match(/^(\w+)\s*\(\s*\)\s*\{?$/);
    if (!match) {
      throw new Error(`Invalid function definition: ${funcLine}`);
    }

    const name = match[1];
    const body = [];
    let depth = funcLine.includes('{') ? 1 : 0;
    let foundBrace = funcLine.includes('{');

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!foundBrace && line === '{') {
        foundBrace = true;
        depth = 1;
        i++;
        continue;
      }

      if (line === '{') {
        depth++;
      } else if (line === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }

      if (foundBrace && depth > 0) {
        body.push(this.parseCommand(line));
      }
      i++;
    }

    return {
      node: {
        type: 'FunctionDefinition',
        name,
        body
      },
      nextIndex: i
    };
  }
}
