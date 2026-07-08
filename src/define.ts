/**
 * promptkit — definePrompt
 */

import { ValidationError } from './errors.js'
import { coerceTemplateResult } from './render.js'
import type { DefinePromptOptions, PromptDefinition, PromptInput } from './types.js'

/**
 * Define a typed, validated, versioned prompt.
 *
 * This is the core primitive of promptkit. A prompt is a pure function from
 * input → string, optionally paired with a validator. Defining prompts this
 * way makes them:
 *
 * - **typed** — TypeScript infers the input shape from your `template`.
 * - **validated** — bad inputs are rejected before they reach the model.
 * - **versioned** — you can track prompt changes over time.
 * - **testable** — render and run against a mock or real LLM in unit tests.
 *
 * @example
 * ```ts
 * import { definePrompt } from 'promptkit'
 *
 * interface SummarizeInput {
 *   text: string
 *   maxLength?: number
 * }
 *
 * const summarize = definePrompt<SummarizeInput>({
 *   name: 'summarize',
 *   version: '1.0.0',
 *   description: 'Summarize a passage in a target word count.',
 *   validate: (input) => {
 *     if (!input.text?.trim()) throw new Error('text is required')
 *     return { ...input, maxLength: input.maxLength ?? 100 }
 *   },
 *   template: ({ text, maxLength }) =>
 *     `Summarize the following in at most ${maxLength} words:\n\n${text}`,
 * })
 *
 * summarize.render({ text: '...' }) // string
 * ```
 */
export function definePrompt<TInput extends PromptInput>(
  options: DefinePromptOptions<TInput>,
): PromptDefinition<TInput> {
  if (!options?.name || typeof options.name !== 'string') {
    throw new ValidationError(
      'definePrompt requires a non-empty string `name`.',
    )
  }
  if (typeof options.template !== 'function') {
    throw new ValidationError('definePrompt requires a `template` function.')
  }

  const frozenOptions = Object.freeze({ ...options })
  const tags = Object.freeze([...(options.tags ?? [])])
  const metadata = Object.freeze({ ...(options.metadata ?? {}) })

  const validate = async (rawInput: TInput): Promise<TInput> => {
    if (rawInput == null || typeof rawInput !== 'object') {
      throw new ValidationError(
        `Prompt "${options.name}" expected an object input, got ${typeof rawInput}.`,
        rawInput,
      )
    }
    if (!options.validate) return rawInput
    const result = await options.validate(rawInput)
    return result ?? rawInput
  }

  const render = (rawInput: TInput): string => {
    // Synchronous render path: validate is async, so for `render` we run a
    // best-effort sync validation when the user's validator is sync. If the
    // validator is async, callers should use `validate()` then `options.template`.
    if (!options.validate) {
      return coerceTemplateResult(options.template(rawInput), options.name)
    }
    // Run the validator; if it returns a promise we can't await synchronously,
    // so fall back to rendering the raw input. For strict async validation,
    // prefer `await prompt.validate(input)` then `prompt.options.template(input)`.
    const out = options.validate(rawInput)
    if (out && typeof (out as Promise<unknown>).then === 'function') {
      // Async validator: render raw input as a best effort.
      return coerceTemplateResult(options.template(rawInput), options.name)
    }
    const cleaned = (out as TInput | void) ?? rawInput
    return coerceTemplateResult(options.template(cleaned), options.name)
  }

  const def: PromptDefinition<TInput> = {
    name: frozenOptions.name,
    version: frozenOptions.version,
    description: frozenOptions.description,
    tags,
    metadata,
    options: frozenOptions,
    render,
    validate,
  }

  return Object.freeze(def)
}
