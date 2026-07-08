# promptkit

> A TypeScript-first toolkit for defining, rendering, testing, and evaluating LLM prompts. Make prompt engineering a disciplined, testable craft.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

`promptkit` gives you a small, focused set of primitives for treating prompts
the way you treat code: typed inputs, validators, versioning, rendering, and a
lightweight eval harness that runs against any LLM — or a mock.

It is **provider-agnostic** and **zero-dependency at runtime**. You bring your
own model; promptkit handles the rest.

---

## Why?

Prompts are the most fragile part of an LLM application. They live in string
templates, drift between environments, break silently when the model changes,
and are almost never tested. `promptkit` exists to fix that:

- **Typed inputs** — stop guessing what variables a prompt needs.
- **Validation** — reject bad inputs *before* they cost you a token.
- **Versioning** — track prompt changes like you track code changes.
- **Eval suites** — run a prompt against many cases and assert on the output.
- **Provider-agnostic** — swap OpenAI for Anthropic for a mock, without
  touching your prompts.

## Installation

```bash
npm install promptkit
# or
pnpm add promptkit
# or
bun add promptkit
```

> promptkit ships as ESM + CJS with full TypeScript types. It has **zero
> runtime dependencies**.

## Quick start

```ts
import { definePrompt, runPrompt } from 'promptkit'

interface SummarizeInput {
  text: string
  maxLength?: number
}

const summarize = definePrompt<SummarizeInput>({
  name: 'summarize',
  version: '1.0.0',
  description: 'Summarize a passage in a target word count.',
  validate: (input) => {
    if (!input.text?.trim()) throw new Error('text is required')
    return { ...input, maxLength: input.maxLength ?? 100 }
  },
  template: ({ text, maxLength }) =>
    `Summarize the following in at most ${maxLength} words:\n\n${text}`,
})

// Render synchronously, no model needed:
console.log(summarize.render({ text: 'Hello world.' }))

// Run against any LLM — promptkit never calls a model itself:
const result = await runPrompt(
  summarize,
  { text: 'A long passage…' },
  { call: async (prompt) => myOpenAiCall(prompt) },
)
console.log(result.output)
```

## Defining a prompt

`definePrompt` takes a single options object:

| Option        | Type                                  | Required | Description                                      |
| ------------- | ------------------------------------- | -------- | ------------------------------------------------ |
| `name`        | `string`                              | ✅       | Stable identifier used in reports and logs.      |
| `version`     | `string`                              |          | Semantic version for tracking prompt drift.      |
| `description` | `string`                              |          | Short human-readable summary.                    |
| `template`    | `(input) => string`                   | ✅       | Pure function from input to prompt string.       |
| `validate`    | `(input) => input \| void`            |          | Run before `template`; throw to reject.          |
| `tags`        | `string[]`                            |          | For grouping/filtering in reports.               |
| `metadata`    | `Record<string, unknown>`             |          | Arbitrary, e.g. author, model hints.             |

The returned `PromptDefinition` is **frozen** and exposes `render`,
`validate`, and the original `options`.

## Running a prompt

```ts
import { runPrompt } from 'promptkit'

const result = await runPrompt(
  summarize,
  { text: '…', maxLength: 50 },
  {
    call: async (prompt, ctx) => {
      // ctx.promptName === 'summarize'
      return await openai.chat.completions.create({ … })
    },
  },
)
// result: { name, version, input, prompt, output, durationMs }
```

The `call` function is the **only** place a model is invoked. This is what
makes promptkit trivial to test: pass a mock in unit tests, a real provider
in production.

## Evaluating prompts

```ts
import { evalPrompt, expect } from 'promptkit'

const result = await evalPrompt(
  summarize,
  [
    {
      name: 'respects max length',
      input: { text: 'A long passage…' },
      assert: (r) => {
        expect(r.output).toBeTruthy()
        expect(r.output.split(' ').length).toBeLessThan(60)
      },
    },
    {
      name: 'is non-empty',
      input: { text: 'Short.' },
      assert: (r) => expect(r.output).not.toEqual(''),
    },
  ],
  { call: myCall },
)

console.log(`${result.passed}/${result.total} passed`)
```

Each case's `assert` receives the full `RunResult`. Use the built-in `expect`
or throw manually — anything that throws fails the case.

### `expect` matchers

| Matcher              | Example                                            |
| -------------------- | -------------------------------------------------- |
| `toEqual`            | `expect(x).toEqual('positive')`                    |
| `toContain`          | `expect(s).toContain('hello')`                     |
| `toMatch`            | `expect(s).toMatch(/^\d+$/)`                       |
| `toHaveLength`       | `expect(arr).toHaveLength(3)`                       |
| `toBeOneOf`          | `expect(label).toBeOneOf(['a','b'])`               |
| `toBeGreaterThan`    | `expect(n).toBeGreaterThan(0)`                     |
| `toBeLessThan`       | `expect(n).toBeLessThan(100)`                      |
| `toMatchJSON`        | `expect(s).toMatchJSON((p) => { … })`              |
| `.not`               | `expect(s).not.toContain('error')`                 |

## CLI

```bash
# Discover prompts in a directory
promptkit list ./prompts

# Render a prompt (no model call)
promptkit run ./prompts/summarize.ts '{"text":"hello"}'

# Run an eval file
promptkit eval ./evals/summarize.eval.ts
```

To actually call a model from the CLI, set `PROMPTKIT_CALL` to a module that
default-exports an `LLMCall`:

```bash
PROMPTKIT_CALL=./my-call.ts promptkit eval ./evals/summarize.eval.ts
```

## Loading prompts from a directory

```ts
import { loadPromptsFromDir } from 'promptkit'

const prompts = await loadPromptsFromDir('./prompts')
for (const p of prompts) console.log(p.name, p.version)
```

Each file may default-export a `PromptDefinition` (or an array of them), or
export prompts as named exports. `.ts`, `.js`, `.mjs`, `.cjs` are supported.

## Project layout

```
promptkit/
├── src/
│   ├── index.ts          # public API
│   ├── test.ts           # testing helpers (promptkit/test)
│   ├── define.ts         # definePrompt
│   ├── render.ts         # template rendering
│   ├── runner.ts         # runPrompt
│   ├── eval.ts           # evalPrompt
│   ├── expect.ts         # assertion helpers
│   ├── loader.ts         # filesystem loader
│   ├── logger.ts         # tiny logger
│   ├── errors.ts         # error classes
│   └── cli/              # CLI entry + commands
├── examples/             # runnable examples
├── tests/                # vitest suite
└── docs/                 # deeper docs
```

## Mission & philosophy

promptkit is a **non-commercial, community-maintained** project. Its mission
is to make prompt engineering a first-class software-engineering discipline:

1. **Prompts are code.** They deserve types, tests, and version control.
2. **No lock-in.** promptkit never calls a model. Bring any provider.
3. **Small core.** The runtime surface is intentionally tiny. Prefer a few
   composable primitives over a framework.
4. **Open by default.** Every design decision is discussed in issues/PRs.

## Contributing

Contributions are very welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for
guidelines, the good-first-issue label for ideas, and our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Roadmap

- [ ] Schema adapters (Zod, Valibot, ArkType)
- [ ] Prompt diffing & changelog generation
- [ ] Cost & latency reporters (token counting adapters)
- [ ] Parallel eval execution
- [ ] HTML/JSON eval reporters
- [ ] Prompt registry & sharing format

See [issues](https://github.com/Cryptoteep/promptkit/issues) for the live list.

## License

[MIT](./LICENSE) © Cryptoteep and contributors.
