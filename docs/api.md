# API reference

## `definePrompt(options)`

Create a `PromptDefinition`.

```ts
function definePrompt<TInput extends PromptInput>(
  options: DefinePromptOptions<TInput>,
): PromptDefinition<TInput>
```

### `DefinePromptOptions<TInput>`

| Field         | Type                                            | Required |
| ------------- | ----------------------------------------------- | -------- |
| `name`        | `string`                                        | ✅       |
| `version`     | `string`                                        |          |
| `description` | `string`                                        |          |
| `template`    | `(input: TInput) => string`                     | ✅       |
| `validate`    | `(input: TInput) => TInput \| void \| Promise`  |          |
| `tags`        | `string[]`                                      |          |
| `metadata`    | `Record<string, unknown>`                       |          |

### `PromptDefinition<TInput>`

A frozen object with:

- `name`, `version`, `description`, `tags`, `metadata`, `options`
- `render(input): string` — synchronously render the prompt
- `validate(input): Promise<TInput>` — validate (and clean) input

---

## `runPrompt(prompt, input, options)`

Render + call a model.

```ts
function runPrompt<TInput>(
  prompt: PromptDefinition<TInput>,
  input: TInput,
  options: { call: LLMCall; metadata?: Record<string, unknown> },
): Promise<RunResult<TInput>>
```

### `LLMCall`

```ts
type LLMCall = (
  prompt: string,
  context: { promptName?: string; promptVersion?: string; metadata?: Record<string, unknown> },
) => Promise<string>
```

### `RunResult`

```ts
interface RunResult<TInput> {
  name: string
  version?: string
  input: TInput
  prompt: string
  output: string
  durationMs: number
}
```

---

## `evalPrompt(prompt, cases, options)`

Run a prompt against many test cases.

```ts
function evalPrompt<TInput>(
  prompt: PromptDefinition<TInput>,
  cases: ReadonlyArray<EvalCase<TInput>>,
  options: { call: LLMCall; metadata?: Record<string, unknown> },
): Promise<EvalResult>
```

### `EvalCase<TInput>`

```ts
interface EvalCase<TInput> {
  name: string
  input: TInput
  assert: (result: RunResult<TInput>) => void | Promise<void>
}
```

### `EvalResult`

```ts
interface EvalResult {
  promptName: string
  total: number
  passed: number
  failed: number
  durationMs: number
  cases: EvalCaseResult[]
}
```

---

## `expect(value)`

Chainable assertion. Throws `AssertionError` on failure.

```ts
expect(s).toEqual('x')
expect(s).toContain('hello')
expect(s).toMatch(/^\d+$/)
expect(arr).toHaveLength(3)
expect(label).toBeOneOf(['a', 'b'])
expect(n).toBeGreaterThan(0)
expect(n).toBeLessThan(100)
expect(jsonString).toMatchJSON((parsed) => { … })
expect(x).not.toContain('error')
```

---

## `renderTemplate(template, vars)`

Mustache-style interpolation with dot paths.

```ts
renderTemplate('Hi {{user.name}}!', { user: { name: 'Ada' } })
// => 'Hi Ada!'
```

---

## `loadPromptsFromDir(dir, options?)`

Recursively load prompt modules from a directory.

```ts
function loadPromptsFromDir(
  dir: string,
  options?: { recursive?: boolean; filter?: (name: string) => boolean },
): Promise<PromptDefinition[]>
```

Each file may default-export a `PromptDefinition` (or array), or export
prompts as named exports. Supported extensions: `.js`, `.mjs`, `.cjs`,
`.ts`, `.mts`, `.cts`.

---

## Errors

All promptkit errors extend `PromptkitError`:

- `ValidationError` — bad prompt input
- `RenderError` — template returned non-string
- `AssertionError` — `expect` failure
- `LoaderError` — filesystem/dynamic-import failure
