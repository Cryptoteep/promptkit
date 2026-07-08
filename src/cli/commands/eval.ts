/**
 * `promptkit eval <file>` — run an eval file.
 *
 * An eval file default-exports an object shaped like:
 *
 * ```ts
 * export default {
 *   prompt: summarize,
 *   cases: [ { name, input, assert } ],
 *   call: async (msg) => '…', // or set process.env.PROMPTKIT_CALL
 * }
 * ```
 */

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Logger } from '../../logger.js'
import { evalPrompt } from '../../eval.js'
import type {
  EvalCase,
  LLMCall,
  PromptDefinition,
  PromptInput,
} from '../../types.js'

interface EvalFile {
  prompt: PromptDefinition
  cases: ReadonlyArray<EvalCase<PromptInput>>
  call?: LLMCall
}

export async function evalCommand(file: string, logger: Logger): Promise<void> {
  const absFile = resolve(file)
  let mod: { default?: EvalFile }
  try {
    mod = (await import(pathToFileURL(absFile).href)) as { default?: EvalFile }
  } catch (e) {
    logger.error(
      `Could not import eval file "${absFile}": ${e instanceof Error ? e.message : String(e)}`,
    )
    process.exitCode = 1
    return
  }

  const config = mod.default
  if (!config || !config.prompt || !Array.isArray(config.cases)) {
    logger.error(
      'Eval file must default-export { prompt, cases } (and optionally `call`).',
    )
    process.exitCode = 1
    return
  }

  let call = config.call
  if (!call) {
    const callModule = process.env.PROMPTKIT_CALL
    if (!callModule) {
      logger.error(
        'No `call` provided. Set it in the eval file or via PROMPTKIT_CALL.',
      )
      process.exitCode = 1
      return
    }
    const c = (await import(callModule)) as { default?: LLMCall; call?: LLMCall }
    call = c.default ?? c.call ?? null!
    if (!call) {
      logger.error(`Call module "${callModule}" has no default/call export.`)
      process.exitCode = 1
      return
    }
  }

  const result = await evalPrompt(config.prompt, config.cases, { call })

  // eslint-disable-next-line no-console
  console.log(`\n${result.promptName}: ${result.passed}/${result.total} passed`)

  for (const c of result.cases) {
    const mark = c.passed ? '\u2713' : '\u2717'
    // eslint-disable-next-line no-console
    console.log(`  ${mark} ${c.name} (${c.durationMs}ms)${c.error ? ` — ${c.error}` : ''}`)
  }

  // eslint-disable-next-line no-console
  console.log(`\nTotal: ${result.durationMs}ms`)
  if (result.failed > 0) process.exitCode = 1
}
