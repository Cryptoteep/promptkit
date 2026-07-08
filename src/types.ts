/**
 * promptkit — shared types
 *
 * @packageDocumentation
 */

/**
 * A function that the user provides to actually call an LLM.
 *
 * promptkit is intentionally model-agnostic: you bring your own model
 * (OpenAI, Anthropic, a local model, a mock, etc.) and promptkit handles
 * templating, validation, evaluation, and reporting.
 *
 * The function receives the fully-rendered prompt string and an optional
 * context object, and must return the model's output as a string.
 *
 * @example
 * ```ts
 * const call: LLMCall = async (prompt) => {
 *   const res = await openai.chat.completions.create({
 *     model: 'gpt-4o-mini',
 *     messages: [{ role: 'user', content: prompt }],
 *   })
 *   return res.choices[0]?.message?.content ?? ''
 * }
 * ```
 */
export type LLMCall = (prompt: string, context: LLCallContext) => Promise<string>

/** Extra context passed to an {@link LLMCall}. */
export interface LLCallContext {
  /** The name of the prompt being run, if known. */
  promptName?: string
  /** The version of the prompt being run, if known. */
  promptVersion?: string
  /** Arbitrary user-supplied metadata. */
  metadata?: Record<string, unknown>
}

/**
 * The input to a prompt. Typically an object of variables, but promptkit
 * leaves the shape up to you so you can use any serialisable value.
 */
export type PromptInput = Record<string, unknown>

/** Options accepted by {@link definePrompt}. */
export interface DefinePromptOptions<TInput extends PromptInput> {
  /** A stable, human-readable name for the prompt. Used in reports and logs. */
  name: string
  /** Optional semantic version. Helps track prompt drift over time. */
  version?: string
  /** A short human-readable description of what the prompt does. */
  description?: string
  /**
   * The template function. Receives the validated input and returns the
   * rendered prompt string. Keep it pure — no side effects, no I/O.
   */
  template: (input: TInput) => string
  /**
   * Optional validator. Run before {@link DefinePromptOptions.template}.
   * Throw a {@link ValidationError} (or any Error) to reject the input.
   * May also return a transformed/cleaned input.
   */
  validate?: (input: TInput) => TInput | void | Promise<TInput | void>
  /** Optional tags for grouping/filtering in reports. */
  tags?: string[]
  /** Optional arbitrary metadata, e.g. author, model hints, etc. */
  metadata?: Record<string, unknown>
}

/** A prompt definition produced by {@link definePrompt}. */
export interface PromptDefinition<TInput extends PromptInput = PromptInput> {
  readonly name: string
  readonly version?: string
  readonly description?: string
  readonly tags: readonly string[]
  readonly metadata: Readonly<Record<string, unknown>>
  /** Render the prompt to a string from raw (unvalidated) input. */
  render: (input: TInput) => string
  /** Validate input without rendering. Throws on invalid input. */
  validate: (input: TInput) => Promise<TInput>
  /** The original options, frozen. Useful for tooling. */
  readonly options: Readonly<DefinePromptOptions<TInput>>
}

/** Result of running a prompt through an LLM. */
export interface RunResult<TInput extends PromptInput = PromptInput> {
  /** The prompt name. */
  name: string
  /** The prompt version, if any. */
  version?: string
  /** The input that was used. */
  input: TInput
  /** The rendered prompt string that was sent to the model. */
  prompt: string
  /** The raw model output. */
  output: string
  /** Wall-clock duration of the LLM call, in milliseconds. */
  durationMs: number
}

/** Options for {@link runPrompt}. */
export interface RunOptions {
  /** The LLM call implementation. Required — promptkit never calls a model itself. */
  call: LLMCall
  /** Extra metadata forwarded to {@link LLMCall}. */
  metadata?: Record<string, unknown>
}

/** A single test case inside an eval suite. */
export interface EvalCase<TInput extends PromptInput = PromptInput> {
  /** A short label for the case, shown in reports. */
  name: string
  /** The input to feed to the prompt. */
  input: TInput
  /**
   * An assertion against the {@link RunResult}. Throw (or use {@link expect})
   * to fail the case. Returning a value is ignored.
   */
  assert: (result: RunResult<TInput>) => void | Promise<void>
}

/** Result of a single eval case. */
export interface EvalCaseResult {
  name: string
  passed: boolean
  error?: string
  durationMs: number
}

/** Result of running an eval suite. */
export interface EvalResult {
  promptName: string
  total: number
  passed: number
  failed: number
  durationMs: number
  cases: EvalCaseResult[]
}
