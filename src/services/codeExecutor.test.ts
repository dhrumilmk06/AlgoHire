import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { runCode, fetchLanguages, _resetLanguagesCache } from './codeExecutor';

vi.mock('axios');

describe('codeExecutor Service', () => {
  const mockBaseUrl = 'https://ce.judge0.com';

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    _resetLanguagesCache();
  });

  afterEach(() => {
    // Reset global languagesPromise mock state
    // (In the actual service it is at module scope, so we can clean it by resetting module registry)
  });

  describe('fetchLanguages', () => {
    it('caches the languages promise and only calls axios once', async () => {
      const mockLanguages = [
        { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
        { id: 71, name: 'Python (3.8.1)' },
      ];

      vi.mocked(axios.get).mockResolvedValue({ data: mockLanguages });

      // First call
      const res1 = await fetchLanguages(mockBaseUrl);
      // Second call
      const res2 = await fetchLanguages(mockBaseUrl);

      expect(res1).toEqual(mockLanguages);
      expect(res2).toEqual(mockLanguages);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('runCode - Judge0 path', () => {
    it('successfully calls Judge0 with correct language ID and stdin', async () => {
      // Mock environment variable
      vi.stubEnv('VITE_CODE_EXECUTOR', 'judge0');
      vi.stubEnv('VITE_JUDGE0_BASE_URL', mockBaseUrl);

      const mockLanguages = [
        { id: 93, name: 'JavaScript (Node.js 18.15.0)' },
        { id: 100, name: 'Python (3.12.5)' },
        { id: 105, name: 'C++ (GCC 14.1.0)' },
        { id: 91, name: 'Java (JDK 17.0.6)' },
      ];

      // Mock dynamic languages fetching
      vi.mocked(axios.get).mockResolvedValue({ data: mockLanguages });

      // Mock submissions post
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          stdout: 'hello world\n',
          stderr: null,
          compile_output: null,
          message: null,
          time: '0.050',
          status: { id: 3, description: 'Accepted' },
        },
      });

      const result = await runCode({
        language: 'javascript',
        code: 'console.log("hello world");',
        stdin: 'test-input',
      });

      expect(axios.get).toHaveBeenCalledWith(`${mockBaseUrl}/languages`, expect.any(Object));
      expect(axios.post).toHaveBeenCalledWith(
        `${mockBaseUrl}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: 'console.log("hello world");',
          language_id: 93,
          stdin: 'test-input',
        },
        { timeout: 10000 }
      );

      expect(result).toEqual({
        stdout: 'hello world\n',
        stderr: '',
        status: 'Accepted',
        executionTime: 50,
      });
    });

    it('returns standardized timeout error on network timeout', async () => {
      vi.stubEnv('VITE_CODE_EXECUTOR', 'judge0');
      vi.stubEnv('VITE_JUDGE0_BASE_URL', mockBaseUrl);

      const mockLanguages = [{ id: 93, name: 'JavaScript (Node.js 18.15.0)' }];
      vi.mocked(axios.get).mockResolvedValue({ data: mockLanguages });

      const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' };
      vi.mocked(axios.post).mockRejectedValue(timeoutError);

      const result = await runCode({
        language: 'js',
        code: 'console.log(1);',
      });

      expect(result).toEqual({
        stdout: '',
        stderr: 'execution service is busy, try again',
        status: 'Timeout',
        executionTime: 0,
      });
    });

    it('handles unsupported languages gracefully', async () => {
      vi.stubEnv('VITE_CODE_EXECUTOR', 'judge0');
      vi.stubEnv('VITE_JUDGE0_BASE_URL', mockBaseUrl);

      const mockLanguages = [{ id: 93, name: 'JavaScript (Node.js 18.15.0)' }];
      vi.mocked(axios.get).mockResolvedValue({ data: mockLanguages });

      const result = await runCode({
        language: 'ruby',
        code: 'puts "hello"',
      });

      expect(result.status).toBe('Error');
      expect(result.stderr).toContain('Unsupported language');
    });
  });

  describe('runCode - Piston path', () => {
    it('executes via piston when configured', async () => {
      vi.stubEnv('VITE_CODE_EXECUTOR', 'piston');
      const mockPistonUrl = 'http://localhost:2000';
      vi.stubEnv('VITE_PISTON_BASE_URL', mockPistonUrl);

      vi.mocked(axios.post).mockResolvedValue({
        data: {
          run: {
            stdout: 'hello from piston',
            stderr: '',
            code: 0,
            signal: null,
            output: 'hello from piston',
          },
        },
      });

      const result = await runCode({
        language: 'python',
        code: 'print("hello from piston")',
        stdin: 'piston-stdin',
      });

      expect(axios.post).toHaveBeenCalledWith(
        `${mockPistonUrl}/api/v2/execute`,
        {
          language: 'python',
          version: '3.10.0',
          files: [{ name: 'solution.py', content: 'print("hello from piston")' }],
          stdin: 'piston-stdin',
        },
        { timeout: 10000 }
      );

      expect(result.stdout).toBe('hello from piston');
      expect(result.status).toBe('Accepted');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
