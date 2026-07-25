import axios from 'axios';

export interface RunCodeArgs {
  language: string;
  code: string;
  stdin?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  status: string;
  executionTime: number; // in milliseconds
}

interface Judge0Language {
  id: number;
  name: string;
}

let languagesPromise: Promise<Judge0Language[]> | null = null;

/**
 * Fetch the list of supported languages from Judge0 and cache them.
 */
export async function fetchLanguages(baseUrl: string): Promise<Judge0Language[]> {
  if (!languagesPromise) {
    languagesPromise = axios
      .get<Judge0Language[]>(`${baseUrl}/languages`, { timeout: 10000 })
      .then((res) => res.data)
      .catch((err) => {
        languagesPromise = null; // Reset cache so next request retries
        throw err;
      });
  }
  return languagesPromise;
}

/**
 * Test-only utility to clear the cached languages promise.
 */
export function _resetLanguagesCache(): void {
  languagesPromise = null;
}

/**
 * Map standard language keys/names to Judge0 language IDs dynamically.
 */
function matchLanguageId(languages: Judge0Language[], targetLang: string): number | null {
  const normalized = targetLang.toLowerCase().trim();

  let searchTerms: string[] = [];
  if (normalized === 'js' || normalized === 'javascript') {
    searchTerms = ['javascript', 'node.js'];
  } else if (normalized === 'py' || normalized === 'python') {
    searchTerms = ['python'];
  } else if (normalized === 'ts' || normalized === 'typescript') {
    searchTerms = ['typescript'];
  } else if (normalized === 'java') {
    // Exclude Javascript when matching Java
    const found = languages.find((l) => {
      const name = l.name.toLowerCase();
      return name.includes('java') && !name.includes('javascript') && !name.includes('script');
    });
    if (found) return found.id;
  } else if (normalized === 'cpp' || normalized === 'c++') {
    searchTerms = ['c++'];
  } else if (normalized === 'c') {
    // Exclude C++ when matching C
    const found = languages.find((l) => {
      const name = l.name.toLowerCase();
      return (name.startsWith('c ') || name.includes('c (')) && !name.includes('c++');
    });
    if (found) return found.id;
  } else {
    searchTerms = [normalized];
  }

  for (const term of searchTerms) {
    const found = languages.find((l) => l.name.toLowerCase().includes(term));
    if (found) return found.id;
  }

  return null;
}

/**
 * Helper to normalize language names to standard keys for local mapping.
 */
function normalizedToStandardKey(lang: string): string {
  const normalized = lang.toLowerCase().trim();
  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  if (normalized === 'py') return 'python';
  if (normalized === 'c++') return 'cpp';
  return normalized;
}

// Language mapping for Piston runtime
const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string; fileName: string }> = {
  javascript: { language: 'javascript', version: '18.15.0', fileName: 'solution.js' },
  python:     { language: 'python',     version: '3.10.0',  fileName: 'solution.py' },
  java:       { language: 'java',       version: '15.0.2',  fileName: 'Solution.java' },
  cpp:        { language: 'c++',        version: '10.2.0',  fileName: 'solution.cpp' },
  c:          { language: 'c',          version: '10.2.0',  fileName: 'solution.c' },
  typescript: { language: 'typescript', version: '5.0.3',   fileName: 'solution.ts' },
};

/**
 * Executes code using Judge0.
 */
async function runViaJudge0(language: string, code: string, stdin: string): Promise<ExecutionResult> {
  const baseUrl = import.meta.env.VITE_JUDGE0_BASE_URL || 'https://ce.judge0.com';

  try {
    const languages = await fetchLanguages(baseUrl);
    const languageId = matchLanguageId(languages, language);

    if (!languageId) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        status: 'Error',
        executionTime: 0,
      };
    }

    const response = await axios.post<{
      stdout: string | null;
      stderr: string | null;
      compile_output: string | null;
      message: string | null;
      time: string | null;
      status: { id: number; description: string } | null;
    }>(
      `${baseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
      },
      {
        timeout: 10000, // 10s timeout
      }
    );

    const data = response.data;
    const timeInSeconds = parseFloat(data.time || '0');
    const executionTime = Math.round(timeInSeconds * 1000);

    const statusDesc = data.status?.description || 'Unknown';
    const isSuccess = data.status?.id === 3; // 3 is "Accepted"

    const stderr = data.stderr || data.compile_output || data.message || '';

    return {
      stdout: data.stdout || '',
      stderr: isSuccess ? '' : stderr,
      status: statusDesc,
      executionTime,
    };
  } catch (err: any) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    return {
      stdout: '',
      stderr: isTimeout
        ? 'execution service is busy, try again'
        : err.response?.data?.message || err.message || 'execution service is busy, try again',
      status: isTimeout ? 'Timeout' : 'Error',
      executionTime: 0,
    };
  }
}

/**
 * Executes code using Piston (ported from CodeHire).
 * Branch kept in code, inactive and uncalled by UI.
 */
async function runViaPiston(language: string, code: string, stdin: string): Promise<ExecutionResult> {
  const baseUrl = import.meta.env.VITE_PISTON_BASE_URL || 'http://localhost:2000';
  const langKey = normalizedToStandardKey(language);
  const runtime = PISTON_LANGUAGE_MAP[langKey];

  if (!runtime) {
    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      status: 'Error',
      executionTime: 0,
    };
  }

  const startTime = performance.now();
  try {
    const response = await axios.post<{
      run: {
        stdout: string | null;
        stderr: string | null;
        code: number | null;
        signal: string | null;
        output: string | null;
      };
    }>(
      `${baseUrl}/api/v2/execute`,
      {
        language: runtime.language,
        version: runtime.version,
        files: [{ name: runtime.fileName, content: code }],
        stdin,
      },
      {
        timeout: 10000, // 10s timeout
      }
    );

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const data = response.data;
    const run = data.run || {};
    const isSuccess = run.code === 0;

    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      status: isSuccess ? 'Accepted' : `Exit Code ${run.code ?? 1}`,
      executionTime: duration,
    };
  } catch (err: any) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    return {
      stdout: '',
      stderr: isTimeout
        ? 'execution service is busy, try again'
        : err.response?.data?.message || err.message || 'execution service is busy, try again',
      status: isTimeout ? 'Timeout' : 'Error',
      executionTime: 0,
    };
  }
}

/**
 * Exported shared code execution API.
 */
export async function runCode({ language, code, stdin = '' }: RunCodeArgs): Promise<ExecutionResult> {
  const executor = import.meta.env.VITE_CODE_EXECUTOR || 'judge0';

  try {
    if (executor === 'piston') {
      return await runViaPiston(language, code, stdin);
    } else {
      return await runViaJudge0(language, code, stdin);
    }
  } catch (err: any) {
    return {
      stdout: '',
      stderr: err.message || 'execution service is busy, try again',
      status: 'Error',
      executionTime: 0,
    };
  }
}
