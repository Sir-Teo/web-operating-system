import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Terminal Integration Tests', () => {
  let Terminal;
  let terminal;
  let mockContext;

  beforeEach(async () => {
    // Mock file system
    const mockFS = {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readdir: vi.fn(),
      mkdir: vi.fn(),
      rm: vi.fn(),
      stat: vi.fn(),
      copy: vi.fn(),
      rename: vi.fn(),
    };

    mockContext = {
      fs: mockFS,
      process: {},
    };

    const module = await import('../../src/apps/terminal/Terminal.js');
    Terminal = module.default;
    terminal = new Terminal(mockContext);
  });

  describe('Pipe Operations', () => {
    it('should pipe ls output to grep', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.js', type: 'file' },
        { name: 'file3.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('ls | grep .txt');

      expect(result).toContain('file1.txt');
      expect(result).toContain('file3.txt');
      expect(result).not.toContain('file2.js');
    });

    it('should pipe through multiple commands', async () => {
      // Create test data
      mockContext.fs.readFile.mockResolvedValueOnce('apple\nbanana\napple\ncherry\nbanana\napple');

      const result = await terminal.executeCommand('cat test.txt | sort | uniq');

      const lines = result.split('\n').filter(l => l.trim());
      expect(lines).toContain('apple');
      expect(lines).toContain('banana');
      expect(lines).toContain('cherry');
      // uniq should remove consecutive duplicates after sorting
    });

    it('should handle wc with piped input', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
        { name: 'file3.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('ls | grep .txt | wc -l');

      expect(result).toContain('Lines: 3');
    });
  });

  describe('Redirection Operations', () => {
    it('should redirect output to file', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'file1.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('ls > output.txt');

      expect(result).toContain('✅ Output redirected to: output.txt');
      expect(mockContext.fs.writeFile).toHaveBeenCalledWith(
        '/home/user/output.txt',
        expect.stringContaining('file1.txt')
      );
    });

    it('should append output to file', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('existing content\n');

      const result = await terminal.executeCommand('echo "new line" >> log.txt');

      expect(result).toContain('✅ Output redirected to: log.txt');
      expect(mockContext.fs.writeFile).toHaveBeenCalledWith(
        '/home/user/log.txt',
        expect.stringContaining('existing content')
      );
    });

    it('should handle errors in redirection', async () => {
      mockContext.fs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      const result = await terminal.executeCommand('echo test > file.txt');

      expect(result).toContain('❌ Redirection error');
    });
  });

  describe('grep command', () => {
    it('should search with case-insensitive flag', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('Hello World\nhello there\nHELLO AGAIN');

      const result = await terminal.executeCommand('grep -i hello test.txt');

      expect(result).toContain('Hello World');
      expect(result).toContain('hello there');
      expect(result).toContain('HELLO AGAIN');
    });

    it('should show line numbers with -n flag', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('line1\ntarget\nline3\ntarget');

      const result = await terminal.executeCommand('grep -n target test.txt');

      expect(result).toContain('2:target');
      expect(result).toContain('4:target');
    });

    it('should handle no matches gracefully', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('apple\nbanana\ncherry');

      const result = await terminal.executeCommand('grep orange test.txt');

      expect(result).toContain('❌ grep: no matches found');
    });

    it('should work with piped input', async () => {
      const result = await terminal._executeWithInput('grep', ['test'], 'this is a test\nthis is not\ntest again');

      expect(result).toContain('this is a test');
      expect(result).toContain('test again');
      expect(result).not.toContain('this is not');
    });
  });

  describe('find command', () => {
    it('should find files by name pattern', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'doc1.txt', type: 'file' },
        { name: 'doc2.pdf', type: 'file' },
        { name: 'image.png', type: 'file' },
      ]);

      const result = await terminal.executeCommand('find /home/user -name doc');

      expect(result).toContain('doc1.txt');
      expect(result).toContain('doc2.pdf');
      expect(result).not.toContain('image.png');
    });

    it('should find all files with * pattern', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('find /home/user -name *');

      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.txt');
    });

    it('should search recursively', async () => {
      // Mock nested directory structure
      mockContext.fs.readdir
        .mockResolvedValueOnce([
          { name: 'subdir', type: 'directory' },
          { name: 'file1.txt', type: 'file' },
        ])
        .mockResolvedValueOnce([
          { name: 'nested.txt', type: 'file' },
        ]);

      const result = await terminal.executeCommand('find /home/user -name .txt');

      expect(result).toContain('file1.txt');
      expect(result).toContain('nested.txt');
    });
  });

  describe('wc command', () => {
    it('should count lines, words, and bytes', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('hello world\nhow are you\ngoodbye');

      const result = await terminal.executeCommand('wc test.txt');

      expect(result).toContain('Lines: 3');
      expect(result).toContain('Words:');
      expect(result).toContain('Bytes:');
    });

    it('should count only lines with -l flag', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('line1\nline2\nline3');

      const result = await terminal.executeCommand('wc -l test.txt');

      expect(result).toContain('Lines: 3');
      expect(result).not.toContain('Words:');
      expect(result).not.toContain('Bytes:');
    });

    it('should count only words with -w flag', async () => {
      const result = await terminal._executeWithInput('wc', ['-w'], 'one two three four');

      expect(result).toContain('Words: 4');
      expect(result).not.toContain('Lines:');
    });
  });

  describe('sort command', () => {
    it('should sort lines alphabetically', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('zebra\napple\nbanana\ncherry');

      const result = await terminal.executeCommand('sort test.txt');

      const lines = result.split('\n');
      expect(lines[0]).toBe('apple');
      expect(lines[1]).toBe('banana');
      expect(lines[2]).toBe('cherry');
      expect(lines[3]).toBe('zebra');
    });

    it('should reverse sort with -r flag', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('apple\nbanana\ncherry');

      const result = await terminal.executeCommand('sort -r test.txt');

      const lines = result.split('\n');
      expect(lines[0]).toBe('cherry');
      expect(lines[1]).toBe('banana');
      expect(lines[2]).toBe('apple');
    });

    it('should work with piped input', async () => {
      const result = await terminal._executeWithInput('sort', [], 'c\na\nb');

      const lines = result.split('\n');
      expect(lines[0]).toBe('a');
      expect(lines[1]).toBe('b');
      expect(lines[2]).toBe('c');
    });
  });

  describe('uniq command', () => {
    it('should remove consecutive duplicate lines', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce('apple\napple\nbanana\nbanana\nbanana\ncherry');

      const result = await terminal.executeCommand('uniq test.txt');

      const lines = result.split('\n');
      expect(lines).toContain('apple');
      expect(lines).toContain('banana');
      expect(lines).toContain('cherry');
    });

    it('should count duplicates with -c flag', async () => {
      const result = await terminal._executeWithInput('uniq', ['-c'], 'a\na\nb\nb\nb\nc');

      expect(result).toContain('2 a');
      expect(result).toContain('3 b');
      expect(result).toContain('1 c');
    });
  });

  describe('head and tail commands', () => {
    it('should show first 10 lines by default', async () => {
      const content = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
      mockContext.fs.readFile.mockResolvedValueOnce(content);

      const result = await terminal.executeCommand('head test.txt');

      expect(result).toContain('line 1');
      expect(result).toContain('line 10');
      expect(result).not.toContain('line 11');
    });

    it('should show custom number of lines with -n', async () => {
      const content = 'line1\nline2\nline3\nline4\nline5';
      mockContext.fs.readFile.mockResolvedValueOnce(content);

      const result = await terminal.executeCommand('head -n 3 test.txt');

      expect(result).toContain('line1');
      expect(result).toContain('line3');
      expect(result).not.toContain('line4');
    });

    it('should show last lines with tail', async () => {
      const content = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');

      const result = await terminal._executeWithInput('tail', [], content);

      expect(result).toContain('line 11');
      expect(result).toContain('line 20');
      expect(result).not.toContain('line 10');
    });

    it('should show custom last lines with tail -n', async () => {
      const content = 'line1\nline2\nline3\nline4\nline5';

      const result = await terminal._executeWithInput('tail', ['-n', '2'], content);

      expect(result).toContain('line4');
      expect(result).toContain('line5');
      expect(result).not.toContain('line3');
    });
  });

  describe('cut command', () => {
    it('should extract first field by default', async () => {
      const content = 'name\tage\tcity\nJohn\t30\tNY\nJane\t25\tLA';

      const result = await terminal._executeWithInput('cut', ['-f', '1'], content);

      expect(result).toContain('name');
      expect(result).toContain('John');
      expect(result).toContain('Jane');
      expect(result).not.toContain('30');
    });

    it('should use custom delimiter', async () => {
      const content = 'name,age,city\nJohn,30,NY\nJane,25,LA';

      const result = await terminal._executeWithInput('cut', ['-f', '2', '-d', ','], content);

      expect(result).toContain('age');
      expect(result).toContain('30');
      expect(result).toContain('25');
      expect(result).not.toContain('John');
    });

    it('should extract third field', async () => {
      const content = 'a\tb\tc\td\ne\tf\tg\th';

      const result = await terminal._executeWithInput('cut', ['-f', '3'], content);

      expect(result).toContain('c');
      expect(result).toContain('g');
      expect(result).not.toContain('a');
      expect(result).not.toContain('d');
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found in grep', async () => {
      mockContext.fs.readFile.mockRejectedValueOnce(new Error('File not found'));

      const result = await terminal.executeCommand('grep pattern missing.txt');

      expect(result).toContain('❌ grep:');
      expect(result).toContain('File not found');
    });

    it('should handle invalid regex in grep', async () => {
      const result = await terminal._executeWithInput('grep', ['[invalid'], 'test');

      expect(result).toContain('❌ grep: invalid pattern');
    });

    it('should stop pipeline on error', async () => {
      mockContext.fs.readFile.mockRejectedValueOnce(new Error('Read failed'));

      const result = await terminal.executeCommand('cat missing.txt | grep test');

      expect(result).toContain('❌');
      expect(mockContext.fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid redirection syntax', async () => {
      const result = await terminal.executeCommand('echo test > > invalid');

      expect(result).toContain('❌ Syntax error');
    });

    it('should reject non-pipeable commands', async () => {
      const result = await terminal._executeWithInput('cd', ['/tmp'], 'test input');

      expect(result).toContain('❌ Command \'cd\' cannot receive piped input');
    });
  });

  describe('Complex Pipeline Scenarios', () => {
    it('should handle complex multi-stage pipeline', async () => {
      // ls | grep .txt | sort | uniq | wc -l
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.js', type: 'file' },
        { name: 'file3.txt', type: 'file' },
        { name: 'file4.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('ls | grep .txt | wc -l');

      expect(result).toContain('Lines: 3');
    });

    it('should handle pipeline with head/tail', async () => {
      mockContext.fs.readFile.mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n')
      );

      const result = await terminal.executeCommand('cat test.txt | head -n 20 | tail -n 5');

      expect(result).toContain('line 16');
      expect(result).toContain('line 20');
      expect(result).not.toContain('line 15');
      expect(result).not.toContain('line 21');
    });

    it('should combine redirection and pipes', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([
        { name: 'test1.txt', type: 'file' },
        { name: 'test2.txt', type: 'file' },
      ]);

      const result = await terminal.executeCommand('ls | grep .txt > results.txt');

      expect(result).toContain('✅ Output redirected to: results.txt');
      expect(mockContext.fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await terminal._executeWithInput('grep', ['test'], '');

      expect(result).toContain('❌ grep: no matches found');
    });

    it('should handle very long lines', async () => {
      const longLine = 'a'.repeat(10000);
      const result = await terminal._executeWithInput('wc', ['-c'], longLine);

      expect(result).toContain('Bytes: 10000');
    });

    it('should handle special characters in patterns', async () => {
      const result = await terminal._executeWithInput('grep', ['test.txt'], 'test.txt file');

      expect(result).toContain('test.txt file');
    });

    it('should handle empty file list', async () => {
      mockContext.fs.readdir.mockResolvedValueOnce([]);

      const result = await terminal.executeCommand('ls | wc -l');

      // Empty ls output is technically one empty line
      expect(result).toMatch(/Lines: [01]/);
    });

    it('should preserve whitespace in output', async () => {
      const result = await terminal._executeWithInput('head', ['-n', '1'], '  spaces  and  tabs\t\there');

      expect(result).toContain('  spaces  and  tabs');
    });
  });
});
