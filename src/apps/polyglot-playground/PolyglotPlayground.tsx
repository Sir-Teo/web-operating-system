/**
 * Polyglot Code Playground
 * Multi-language code editor with real-time execution
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  RuntimeManager,
  getLanguageInfo,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  type ExecutionResult,
} from '../../system/runtime';

interface PlaygroundProps {
  windowId: string;
}

const PolyglotPlayground: React.FC<PlaygroundProps> = ({ windowId }) => {
  const [runtimeManager] = useState(() => RuntimeManager.getInstance());
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const autoRunTimeoutRef = useRef<NodeJS.Timeout>();

  const EXAMPLE_CODE: Record<string, string> = {
    javascript: `// JavaScript Playground
console.log('Welcome to Polyglot Playground!');

// Calculate factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log('Factorial of 5:', factorial(5));

// Async example
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('Waiting...');
  await delay(100);
  console.log('Done!');
})();`,

    typescript: `// TypeScript Playground
interface Calculator {
  add(a: number, b: number): number;
  multiply(a: number, b: number): number;
}

const calc: Calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
};

console.log('2 + 3 =', calc.add(2, 3));
console.log('4 × 5 =', calc.multiply(4, 5));

// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

console.log('First:', first([10, 20, 30]));`,

    python: `# Python Playground
print('Welcome to Python!')

# List operations
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]
print('Squares:', squares)

# Dictionary
person = {
    'name': 'Alice',
    'age': 30,
    'city': 'New York'
}
print(f"{person['name']} is {person['age']} years old")

# Function
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = [n for n in range(2, 20) if is_prime(n)]
print('Primes:', primes)`,

    ruby: `# Ruby Playground
puts 'Welcome to Ruby!'

# Array operations
numbers = (1..5).to_a
squares = numbers.map { |n| n**2 }
puts "Squares: #{squares.inspect}"

# Hash
person = {
  name: 'Alice',
  age: 30,
  city: 'New York'
}
puts "#{person[:name]} is #{person[:age]} years old"

# Block iteration
3.times do |i|
  puts "Iteration #{i + 1}"
end

# Method
def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

puts "Fibonacci(10): #{fibonacci(10)}"`,

    php: `<?php
// PHP Playground
echo "Welcome to PHP!\\n\\n";

// Array operations
$numbers = range(1, 5);
$squares = array_map(fn($n) => $n ** 2, $numbers);
echo "Squares: " . json_encode($squares) . "\\n";

// Associative array
$person = [
    'name' => 'Alice',
    'age' => 30,
    'city' => 'New York'
];
echo "{$person['name']} is {$person['age']} years old\\n";

// Function
function isPrime($n) {
    if ($n < 2) return false;
    for ($i = 2; $i <= sqrt($n); $i++) {
        if ($n % $i == 0) return false;
    }
    return true;
}

$primes = array_filter(range(2, 20), 'isPrime');
echo "Primes: " . json_encode(array_values($primes)) . "\\n";
?>`,

    sql: `-- SQL Playground
-- Create a sample database
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    stock INTEGER
);

-- Insert sample data
INSERT INTO products (name, category, price, stock) VALUES
    ('Laptop', 'Electronics', 999.99, 15),
    ('Mouse', 'Electronics', 29.99, 50),
    ('Desk', 'Furniture', 299.99, 8),
    ('Chair', 'Furniture', 199.99, 12),
    ('Monitor', 'Electronics', 349.99, 20);

-- Query data
SELECT category, COUNT(*) as count, AVG(price) as avg_price
FROM products
GROUP BY category;

-- Find expensive items
SELECT name, price FROM products WHERE price > 200 ORDER BY price DESC;`,
  };

  useEffect(() => {
    setCode(EXAMPLE_CODE[language] || '');
    setOutput('');
  }, [language]);

  useEffect(() => {
    if (autoRun && code) {
      if (autoRunTimeoutRef.current) {
        clearTimeout(autoRunTimeoutRef.current);
      }
      autoRunTimeoutRef.current = setTimeout(() => {
        handleRun();
      }, 1000);
    }
    return () => {
      if (autoRunTimeoutRef.current) {
        clearTimeout(autoRunTimeoutRef.current);
      }
    };
  }, [code, autoRun]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      const result: ExecutionResult = await runtimeManager.execute(language, code);

      setIsSuccess(result.success);
      setExecutionTime(result.executionTime);

      let outputText = '';
      if (result.output) {
        outputText += result.output + '\n';
      }
      if (result.error) {
        outputText += '\n❌ Error:\n' + result.error + '\n';
      }
      if (!result.output && !result.error) {
        outputText = '(No output)';
      }

      outputText += `\n⏱️  Execution time: ${result.executionTime.toFixed(2)}ms`;

      setOutput(outputText);
    } catch (error) {
      setIsSuccess(false);
      setOutput(`❌ Execution failed:\n${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
    setExecutionTime(0);
  };

  const handleReset = () => {
    setCode(EXAMPLE_CODE[language] || '');
    setOutput('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="polyglot-playground">
      <style>{`
        .polyglot-playground {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .pp-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #252526;
          border-bottom: 1px solid #3e3e42;
        }

        .pp-toolbar select {
          padding: 6px 12px;
          background: #3c3c3c;
          border: 1px solid #5a5a5a;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 13px;
          cursor: pointer;
        }

        .pp-toolbar select:hover {
          background: #454545;
        }

        .pp-toolbar button {
          padding: 6px 16px;
          background: #0e639c;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pp-toolbar button:hover:not(:disabled) {
          background: #1177bb;
        }

        .pp-toolbar button:disabled {
          background: #3e3e42;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .pp-toolbar button.secondary {
          background: #3c3c3c;
        }

        .pp-toolbar button.secondary:hover:not(:disabled) {
          background: #454545;
        }

        .pp-toolbar button.run {
          background: #16a34a;
        }

        .pp-toolbar button.run:hover:not(:disabled) {
          background: #15803d;
        }

        .pp-toolbar .spacer {
          flex: 1;
        }

        .pp-toolbar label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .pp-toolbar input[type="checkbox"] {
          cursor: pointer;
        }

        .pp-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #3e3e42;
          overflow: hidden;
        }

        .pp-panel {
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
          overflow: hidden;
        }

        .pp-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #252526;
          border-bottom: 1px solid #3e3e42;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pp-panel-actions {
          display: flex;
          gap: 8px;
        }

        .pp-icon-button {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: #d4d4d4;
          cursor: pointer;
          border-radius: 3px;
          font-size: 12px;
        }

        .pp-icon-button:hover {
          background: #3c3c3c;
        }

        .pp-editor {
          flex: 1;
          padding: 12px;
          overflow: auto;
        }

        .pp-editor textarea {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: ${fontSize}px;
          line-height: 1.6;
          resize: none;
          outline: none;
          tab-size: 2;
        }

        .pp-output {
          flex: 1;
          padding: 12px;
          overflow: auto;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: ${fontSize}px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .pp-output.success {
          color: #d4d4d4;
        }

        .pp-output.error {
          color: #f48771;
        }

        .pp-language-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(14, 99, 156, 0.2);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .pp-loading {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pp-font-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .pp-font-controls button {
          padding: 4px 8px;
          background: #3c3c3c;
          border: none;
          border-radius: 3px;
          color: #d4d4d4;
          font-size: 11px;
          cursor: pointer;
        }

        .pp-font-controls button:hover {
          background: #454545;
        }

        .pp-font-size-display {
          min-width: 30px;
          text-align: center;
        }
      `}</style>

      <div className="pp-toolbar">
        <div className="pp-language-info">
          <span>{getLanguageInfo(language)?.icon}</span>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.version})
              </option>
            ))}
          </select>
        </div>

        <button className="run" onClick={handleRun} disabled={isRunning || !code}>
          {isRunning ? (
            <>
              <span className="pp-loading" /> Running...
            </>
          ) : (
            '▶ Run'
          )}
        </button>

        <button className="secondary" onClick={handleClear}>
          Clear Output
        </button>

        <button className="secondary" onClick={handleReset}>
          Reset Code
        </button>

        <div className="spacer" />

        <div className="pp-font-controls">
          <button onClick={() => setFontSize(Math.max(10, fontSize - 1))}>A-</button>
          <span className="pp-font-size-display">{fontSize}</span>
          <button onClick={() => setFontSize(Math.min(24, fontSize + 1))}>A+</button>
        </div>

        <label>
          <input
            type="checkbox"
            checked={autoRun}
            onChange={e => setAutoRun(e.target.checked)}
          />
          Auto-run
        </label>
      </div>

      <div className="pp-content">
        <div className="pp-panel">
          <div className="pp-panel-header">
            <span>Code Editor</span>
            <div className="pp-panel-actions">
              <button className="pp-icon-button" onClick={handleCopyCode} title="Copy code">
                📋 Copy
              </button>
            </div>
          </div>
          <div className="pp-editor">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`Write your ${getLanguageInfo(language)?.name} code here...`}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <div className="pp-panel">
          <div className="pp-panel-header">
            <span>Output</span>
            <div className="pp-panel-actions">
              <button className="pp-icon-button" onClick={handleCopyOutput} title="Copy output">
                📋 Copy
              </button>
            </div>
          </div>
          <div className={`pp-output ${isSuccess ? 'success' : 'error'}`}>
            {output || 'Run your code to see the output here...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolyglotPlayground;
