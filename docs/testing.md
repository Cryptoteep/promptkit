# Testing & evaluation

promptkit is built around two ideas:

1. **Prompts should be unit-testable** with a mock, no network required.
2. **Prompts should be evaluable** against a suite of cases, with a real model.

This page covers both.

## Unit testing with a mock

```ts
import { describe, it, expect } from 'vitest'
import { runPrompt, definePrompt } from 'promptkit'
import { summarize } from './prompts'

const mockCall = async (prompt: string) => `MOCK(${prompt.length})`

describe('summarize', () => {
  it('renders with the default max length', () => {
    expect(summarize.render({ text: 'hi' })).toContain('100')
  })

  it('runs and returns mock output', async () => {
    const result = await runPrompt(summarize, { text: 'hi' }, { call: mockCall })
    expect(result.output).toContain('MOCK')
  })

  it('rejects empty input', async () => {
    await expect(runPrompt(summarize, { text: '' }, { call: mockCall }))
      .rejects.toThrow('text is required')
  })
})
```

You can use promptkit's own `expect` or your test runner's. They coexist fine.

## Eval suites

An eval runs a prompt against many cases and reports pass/fail. Write evals
as files that default-export a config object:

```ts
// evals/sentiment.eval.ts
import sentimentPrompt from '../prompts/sentiment'
import { expect, type LLMCall } from 'promptkit'

const call: LLMCall = async (prompt) => {
  // … call your model …
  return 'positive'
}

export default {
  prompt: sentimentPrompt,
  call,
  cases: [
    {
      name: 'positive text',
      input: { text: 'I love this!' },
      assert: (r) => {
        expect(r.output).toBeOneOf(['positive', 'negative', 'neutral'])
        expect(r.output).toEqual('positive')
      },
    },
    {
      name: 'negative text',
      input: { text: 'This is awful.' },
      assert: (r) => expect(r.output).toEqual('negative'),
    },
  ],
}
```

Run it:

```bash
promptkit eval ./evals/sentiment.eval.ts
```

Output:

```
classify-sentiment: 2/2 passed
  ✓ positive text (12ms)
  ✓ negative text (18ms)

Total: 34ms
```

## What to assert on

| Thing to check       | Matcher                                   |
| -------------------- | ----------------------------------------- |
| Output mentions X    | `expect(r.output).toContain('X')`         |
| Output matches regex | `expect(r.output).toMatch(/^\d+$/)`       |
| Output is one of N   | `expect(r.output).toBeOneOf([...])`       |
| Output is valid JSON | `expect(r.output).toMatchJSON()`          |
| JSON has a field     | `expect(r.output).toMatchJSON(p => { if (!p.foo) throw … })` |
| Output length        | `expect(r.output).toHaveLength(n)`        |
| Latency budget       | `expect(r.durationMs).toBeLessThan(2000)` |

## Programmatic eval

```ts
import { evalPrompt } from 'promptkit'

const result = await evalPrompt(myPrompt, cases, { call })
if (result.failed > 0) {
  for (const c of result.cases) if (!c.passed) console.error(c.name, c.error)
  process.exit(1)
}
```

## CI

Eval files are plain TS modules — run them in CI like any test:

```yaml
# .github/workflows/ci.yml
- run: npm ci
- run: npm test
- run: npx promptkit eval ./evals/*.eval.ts
```

For evals that call a real model, gate them behind a secret and run them on a
schedule rather than every push.
