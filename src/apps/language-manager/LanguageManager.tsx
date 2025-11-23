/**
 * Language Manager Application
 * Manage programming language runtimes, install packages, and test execution
 */

import React, { useState, useEffect } from 'react';
import {
  RuntimeManager,
  getLanguageInfo,
  SUPPORTED_LANGUAGES,
  type LanguageInfo,
  type ExecutionResult,
} from '../../system/runtime';

interface LanguageManagerProps {
  windowId: string;
}

const LanguageManager: React.FC<LanguageManagerProps> = ({ windowId }) => {
  const [runtimeManager] = useState(() => RuntimeManager.getInstance());
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [languageInfo, setLanguageInfo] = useState<LanguageInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [packageName, setPackageName] = useState('');
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'packages'>('overview');

  // Sample code templates
  const CODE_TEMPLATES: Record<string, string> = {
    javascript: `// JavaScript Example
console.log('Hello from JavaScript!');

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Async/await
async function fetchData() {
  return 'Async data loaded!';
}
fetchData().then(console.log);`,

    typescript: `// TypeScript Example
interface Person {
  name: string;
  age: number;
}

const greet = (person: Person): string => {
  return \`Hello, \${person.name}! You are \${person.age} years old.\`;
};

const user: Person = { name: 'Alice', age: 30 };
console.log(greet(user));

// Generics
function identity<T>(arg: T): T {
  return arg;
}
console.log(identity<number>(42));`,

    python: `# Python Example
print('Hello from Python!')

# List comprehension
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print('Doubled:', doubled)

# Function
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print('Fibonacci(10):', fibonacci(10))

# Dictionary
person = {'name': 'Alice', 'age': 30}
print(f"Hello, {person['name']}!")`,

    ruby: `# Ruby Example
puts 'Hello from Ruby!'

# Array operations
numbers = [1, 2, 3, 4, 5]
doubled = numbers.map { |n| n * 2 }
puts "Doubled: #{doubled.inspect}"

# Block iteration
5.times do |i|
  puts "Iteration #{i + 1}"
end

# Hash
person = { name: 'Alice', age: 30 }
puts "Hello, #{person[:name]}!"`,

    php: `<?php
// PHP Example
echo "Hello from PHP!\\n";

// Array operations
$numbers = [1, 2, 3, 4, 5];
$doubled = array_map(fn($n) => $n * 2, $numbers);
echo "Doubled: " . json_encode($doubled) . "\\n";

// Function
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

echo "Fibonacci(10): " . fibonacci(10) . "\\n";

// Associative array
$person = ['name' => 'Alice', 'age' => 30];
echo "Hello, {$person['name']}!\\n";
?>`,

    sql: `-- SQLite Example
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER
);

INSERT INTO users (name, email, age) VALUES
  ('Alice', 'alice@example.com', 30),
  ('Bob', 'bob@example.com', 25),
  ('Charlie', 'charlie@example.com', 35);

SELECT * FROM users WHERE age >= 30;`,
  };

  useEffect(() => {
    const info = getLanguageInfo(selectedLanguage);
    setLanguageInfo(info);
    setTestCode(CODE_TEMPLATES[selectedLanguage] || '');
    setIsInitialized(false);
    setExecutionResult(null);
    loadPackages();
  }, [selectedLanguage]);

  const loadPackages = async () => {
    try {
      const runtime = runtimeManager.getRuntime(selectedLanguage);
      if (runtime?.loaded) {
        const packages = await runtimeManager.listPackages(selectedLanguage);
        setInstalledPackages(packages);
      } else {
        setInstalledPackages([]);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      setInstalledPackages([]);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      await runtimeManager.initializeRuntime(selectedLanguage);
      setIsInitialized(true);
      await loadPackages();
    } catch (error) {
      console.error('Failed to initialize runtime:', error);
      alert(`Failed to initialize ${languageInfo?.name}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!isInitialized) {
      await handleInitialize();
    }

    setIsLoading(true);
    setExecutionResult(null);

    try {
      const result = await runtimeManager.execute(selectedLanguage, testCode);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallPackage = async () => {
    if (!packageName.trim()) return;

    setIsLoading(true);
    try {
      const success = await runtimeManager.installPackage(selectedLanguage, packageName.trim());
      if (success) {
        alert(`Package '${packageName}' installed successfully!`);
        setPackageName('');
        await loadPackages();
      } else {
        alert(`Failed to install package '${packageName}'`);
      }
    } catch (error) {
      alert(`Error installing package: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="language-manager">
      <style>{`
        .language-manager {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .lm-header {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lm-header h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .lm-header p {
          margin: 0;
          opacity: 0.7;
          font-size: 14px;
        }

        .lm-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .lm-sidebar {
          width: 250px;
          background: rgba(0, 0, 0, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          padding: 20px;
        }

        .lm-sidebar h3 {
          margin: 0 0 15px 0;
          font-size: 14px;
          text-transform: uppercase;
          opacity: 0.7;
          letter-spacing: 1px;
        }

        .lm-language-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lm-language-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .lm-language-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .lm-language-item.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .lm-language-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .lm-language-icon {
          font-size: 20px;
        }

        .lm-language-version {
          font-size: 12px;
          opacity: 0.6;
          margin-top: 4px;
        }

        .lm-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .lm-tabs {
          display: flex;
          gap: 2px;
          padding: 20px 20px 0 20px;
          background: rgba(0, 0, 0, 0.1);
        }

        .lm-tab {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px 8px 0 0;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .lm-tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .lm-tab.active {
          background: rgba(99, 102, 241, 0.3);
        }

        .lm-tab-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .lm-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .lm-info-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lm-info-card h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.7;
          letter-spacing: 1px;
        }

        .lm-info-card p {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .lm-features {
          margin-top: 20px;
        }

        .lm-features h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
        }

        .lm-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lm-features li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
        }

        .lm-features li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #4ade80;
          font-weight: bold;
        }

        .lm-button-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .lm-button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .lm-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .lm-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lm-button.secondary {
          background: rgba(255, 255, 255, 0.1);
        }

        .lm-code-editor {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lm-code-editor textarea {
          width: 100%;
          min-height: 300px;
          background: transparent;
          border: none;
          color: #fff;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          resize: vertical;
          outline: none;
        }

        .lm-result {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .lm-result.success {
          border-color: rgba(74, 222, 128, 0.3);
          background: rgba(74, 222, 128, 0.1);
        }

        .lm-result.error {
          border-color: rgba(248, 113, 113, 0.3);
          background: rgba(248, 113, 113, 0.1);
        }

        .lm-result h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lm-result pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
        }

        .lm-package-manager {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .lm-package-input {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .lm-package-input input {
          flex: 1;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
        }

        .lm-package-input input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .lm-package-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .lm-package-list li {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lm-package-list li:before {
          content: '📦';
        }

        .lm-loading {
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

        .lm-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .lm-status-badge.initialized {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
        }

        .lm-status-badge.not-initialized {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .lm-exec-time {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 8px;
        }
      `}</style>

      <div className="lm-header">
        <h1>🚀 Language Manager</h1>
        <p>Manage programming language runtimes and execute code</p>
      </div>

      <div className="lm-content">
        <div className="lm-sidebar">
          <h3>Available Languages</h3>
          <div className="lm-language-list">
            {SUPPORTED_LANGUAGES.map(lang => (
              <div
                key={lang.id}
                className={`lm-language-item ${selectedLanguage === lang.id ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang.id)}
              >
                <div className="lm-language-name">
                  <span className="lm-language-icon">{lang.icon}</span>
                  {lang.name}
                </div>
                <div className="lm-language-version">v{lang.version}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lm-main">
          <div className="lm-tabs">
            <button
              className={`lm-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`lm-tab ${activeTab === 'test' ? 'active' : ''}`}
              onClick={() => setActiveTab('test')}
            >
              Test Execution
            </button>
            <button
              className={`lm-tab ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              Packages
            </button>
          </div>

          <div className="lm-tab-content">
            {activeTab === 'overview' && languageInfo && (
              <>
                <div className="lm-info-grid">
                  <div className="lm-info-card">
                    <h4>Language</h4>
                    <p>{languageInfo.icon} {languageInfo.name}</p>
                  </div>
                  <div className="lm-info-card">
                    <h4>Version</h4>
                    <p>{languageInfo.version}</p>
                  </div>
                  <div className="lm-info-card">
                    <h4>Status</h4>
                    <p>
                      <span className={`lm-status-badge ${isInitialized ? 'initialized' : 'not-initialized'}`}>
                        {isInitialized ? '● Initialized' : '○ Not Initialized'}
                      </span>
                    </p>
                  </div>
                  {languageInfo.packageManager && (
                    <div className="lm-info-card">
                      <h4>Package Manager</h4>
                      <p>{languageInfo.packageManager}</p>
                    </div>
                  )}
                </div>

                <div className="lm-button-group">
                  <button
                    className="lm-button"
                    onClick={handleInitialize}
                    disabled={isLoading || isInitialized}
                  >
                    {isLoading ? <span className="lm-loading" /> : 'Initialize Runtime'}
                  </button>
                </div>

                <div className="lm-info-card">
                  <h4>Description</h4>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>{languageInfo.description}</p>
                </div>

                <div className="lm-features">
                  <h3>Features</h3>
                  <ul>
                    {languageInfo.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'test' && (
              <>
                <div className="lm-button-group">
                  <button
                    className="lm-button"
                    onClick={handleRunCode}
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="lm-loading" /> : '▶ Run Code'}
                  </button>
                  <button
                    className="lm-button secondary"
                    onClick={() => setTestCode(CODE_TEMPLATES[selectedLanguage] || '')}
                    disabled={isLoading}
                  >
                    Reset to Template
                  </button>
                </div>

                <div className="lm-code-editor">
                  <textarea
                    value={testCode}
                    onChange={e => setTestCode(e.target.value)}
                    placeholder="Write your code here..."
                    spellCheck={false}
                  />
                </div>

                {executionResult && (
                  <div className={`lm-result ${executionResult.success ? 'success' : 'error'}`}>
                    <h4>
                      {executionResult.success ? '✓ Success' : '✗ Error'}
                    </h4>
                    {executionResult.output && (
                      <>
                        <strong>Output:</strong>
                        <pre>{executionResult.output}</pre>
                      </>
                    )}
                    {executionResult.error && (
                      <>
                        <strong>Error:</strong>
                        <pre>{executionResult.error}</pre>
                      </>
                    )}
                    <div className="lm-exec-time">
                      Execution time: {executionResult.executionTime.toFixed(2)}ms
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'packages' && (
              <>
                <div className="lm-package-manager">
                  <h3>Install Package</h3>
                  {languageInfo?.packageManager ? (
                    <>
                      <div className="lm-package-input">
                        <input
                          type="text"
                          value={packageName}
                          onChange={e => setPackageName(e.target.value)}
                          placeholder={`Package name (e.g., ${
                            selectedLanguage === 'python' ? 'numpy' :
                            selectedLanguage === 'ruby' ? 'json' :
                            'package-name'
                          })`}
                          onKeyPress={e => e.key === 'Enter' && handleInstallPackage()}
                        />
                        <button
                          className="lm-button"
                          onClick={handleInstallPackage}
                          disabled={isLoading || !packageName.trim()}
                        >
                          {isLoading ? <span className="lm-loading" /> : 'Install'}
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', opacity: 0.7 }}>
                        Package manager: {languageInfo.packageManager}
                      </p>
                    </>
                  ) : (
                    <p style={{ opacity: 0.7 }}>No package manager available for this language.</p>
                  )}
                </div>

                <h3>Installed Packages</h3>
                {installedPackages.length > 0 ? (
                  <ul className="lm-package-list">
                    {installedPackages.map((pkg, index) => (
                      <li key={index}>{pkg}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ opacity: 0.7 }}>
                    {isInitialized
                      ? 'No packages installed yet.'
                      : 'Initialize the runtime to see installed packages.'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageManager;
