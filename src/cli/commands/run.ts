/**
 * `promptkit run <file> [input]` — render a prompt and print it.
 *
 * If `--call` is not provided, only the rendered prompt is printed (no LLM
 * call is made). This is handy for inspecting what your template produces.
 */

import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { Logger } from '../../logger.js'
import { loadPromptFile } from '../../loader.js'
import { runPrompt } from '../../runner.js'
import type { LLMCall, PromptDefinition, PromptInput } from '../../types.js'

async function parseInput(input?: string): Promise<PromptInput> {
  if (!input) return {}
  // Try as a JSON path first, then as a JSON string.
  if (input.endsWith('.json')) {
    const text = await readFile(input, 'utf8')
    return JSON.parse(text) as PromptInput
  }
  try {
    return JSON.parse(input) as PromptInput
  } catch {
    // Treat as a plain string under the key `text`.
    return { text: input }
  }
}

export async function runCommand(
  file: string,
  input: string | undefined,
  logger: Logger,
): Promise<void> {
  const absFile = resolve(file)
  const prompts = await loadPromptFile(absFile)
  if (prompts.length === 0) {
    logger.error(`No prompts found in ${absFile}.`)
    process.exitCode = 1
    return
  }

  const parsedInput = await parseInput(input)
  const prompt = prompts[0] as PromptDefinition<PromptInput>

  // Render-only path: print the template output and exit.
  const rendered = prompt.render(parsedInput)
  // eslint-disable-next-line no-console
  console.log(rendered)

  // If the caller wired up a `PROMPTKIT_CALL` module, run the prompt too.
  const callModule = process.env.PROMPTKIT_CALL
  if (callModule) {
    let call: LLMCall
    try {
      const mod = (await import(callModule)) as { default?: LLMCall; call?: LLMCall }
      call = mod.default ?? mod.call ?? null!
      if (!call) throw new Error('Module has no `default` or `call` export.')
    } catch (e) {
      logger.error(
        `Could not load call module "${callModule}": ${e instanceof Error ? e.message : String(e)}`,
      )
      return
    }
    const result = await runPrompt(prompt, parsedInput, { call })
    // eslint-disable-next-line no-console
    console.log('\n--- output ---')
    // eslint-disable-next-line no-console
    console.log(result.output)
    // eslint-disable-next-line no-console
    console.log(`\n(${result.durationMs}ms)`)
  }
}
