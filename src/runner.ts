/**
 * promptkit — runPrompt
 */

import type {
  LLMCall,
  PromptDefinition,
  PromptInput,
  RunOptions,
  RunResult,
} from './types.js'

/**
 * Render a prompt, send it to an LLM via the user-supplied {@link LLMCall},
 * and return a {@link RunResult}.
 *
 * promptkit never calls a model itself — you always pass `call`. This keeps
 * the library dependency-free and lets you swap providers, use mocks in
 * tests, or run fully offline.
 *
 * @example
 * ```ts
 * const result = await runPrompt(
 *   summarize,
 *   { text: '...' },
 *   { call: myOpenAiCall },
 * )
 * console.log(result.output)
 * ```
 */
export async function runPrompt<TInput extends PromptInput>(
  prompt: PromptDefinition<TInput>,
  input: TInput,
  options: RunOptions,
): Promise<RunResult<TInput>> {
  const validated = await prompt.validate(input)
  const rendered = prompt.options.template(validated)
  if (typeof rendered !== 'string') {
    throw new TypeError(
      `Prompt "${prompt.name}" template returned a non-string (${typeof rendered}).`,
    )
  }

  const start = Date.now()
  const output = await options.call(rendered, {
    promptName: prompt.name,
    promptVersion: prompt.version,
    metadata: options.metadata,
  })
  const durationMs = Date.now() - start

  return {
    name: prompt.name,
    version: prompt.version,
    input: validated,
    prompt: rendered,
    output,
    durationMs,
  }
}
