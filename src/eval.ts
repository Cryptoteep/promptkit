/**
 * promptkit — eval suite runner
 */

import type {
  EvalCase,
  EvalCaseResult,
  EvalResult,
  LLMCall,
  PromptDefinition,
  PromptInput,
  RunResult,
} from './types.js'
import { runPrompt } from './runner.js'

/**
 * Run a prompt against a suite of {@link EvalCase}s and collect pass/fail
 * results. Each case's `assert` callback receives a {@link RunResult}; use
 * {@link expect} (or any throw) to fail a case.
 *
 * @example
 * ```ts
 * const result = await evalPrompt(summarize, [
 *   {
 *     name: 'short input',
 *     input: { text: 'Tiny.' },
 *     assert: (r) => expect(r.output).toHaveLength(0), // whatever you want
 *   },
 * ], { call: mockCall })
 *
 * console.log(`${result.passed}/${result.total} passed`)
 * ```
 */
export async function evalPrompt<TInput extends PromptInput>(
  prompt: PromptDefinition<TInput>,
  cases: ReadonlyArray<EvalCase<TInput>>,
  options: { call: LLMCall; metadata?: Record<string, unknown> },
): Promise<EvalResult> {
  const caseResults: EvalCaseResult[] = []
  const suiteStart = Date.now()

  for (const c of cases) {
    const caseStart = Date.now()
    let passed = true
    let error: string | undefined

    try {
      const result: RunResult<TInput> = await runPrompt(prompt, c.input, {
        call: options.call,
        metadata: options.metadata,
      })
      await c.assert(result)
    } catch (e) {
      passed = false
      error = e instanceof Error ? e.message : String(e)
    }

    caseResults.push({
      name: c.name,
      passed,
      error,
      durationMs: Date.now() - caseStart,
    })
  }

  const passed = caseResults.filter((c) => c.passed).length
  return {
    promptName: prompt.name,
    total: caseResults.length,
    passed,
    failed: caseResults.length - passed,
    durationMs: Date.now() - suiteStart,
    cases: caseResults,
  }
}
