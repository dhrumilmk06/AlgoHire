export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface SolveProblem {
  id: string | number;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints?: string[];
  test_cases: TestCase[];
  /** Per-language starter code: { javascript: "...", python: "...", ... } */
  starter_code: Record<string, string>;
}
