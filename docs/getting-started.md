# Getting started

This guide walks you from zero to your first tested prompt in ~5 minutes.

## Install

```bash
npm install promptkit
```

promptkit has **zero runtime dependencies** and ships ESM + CJS + types.

## Your first prompt

```ts
// prompts/greet.ts
import { definePrompt } from 'promptkit'

export default definePrompt<{ name: string; language?: string }>({
  name: 'greet',
  version: '1.0.0',
  validate: (input) => {
    if (!input.name?.trim()) throw new Error('name is required')
    return { ...input, language: input.language ?? 'en' }
  },
  template: ({ name, language }) => {
    const g = language === 'es' ? 'Hola' : language === 'fr' ? 'Bonjour' : 'Hello'
    return `${g}, ${name}!`
  },
})
```

TypeScript prompt files require a runtime that supports them, such as `tsx`,
`bun`, or `ts-node`. Plain Node cannot import `.ts` files directly, so use one
of those runtimes or pre-compile the files to `.js`.

Render it without a model:

```ts
import greet from './prompts/greet'
console.log(greet.render({ name: 'Ada', language: 'es' }))
// => "Hola, Ada!"
```

## Wire up a model

promptkit never calls a model. You provide a `call` function:

```ts
import OpenAI from 'openai'
import { runPrompt } from 'promptkit'
import greet from './prompts/greet'

const openai = new OpenAI()

const call = async (prompt: string) => {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  return res.choices[0]?.message?.content ?? ''
}

const result = await runPrompt(greet, { name: 'Ada' }, { call })
console.log(result.output)
```

## Test it

```ts
import { evalPrompt, expect } from 'promptkit'
import greet from './prompts/greet'

const mockCall = async (prompt: string) =>
  prompt.includes('Hola') ? 'Hola, Ada!' : 'Hello, Ada!'

const result = await evalPrompt(
  greet,
  [
    {
      name: 'greets in Spanish',
      input: { name: 'Ada', language: 'es' },
      assert: (r) => expect(r.output).toContain('Hola'),
    },
  ],
  { call: mockCall },
)

console.log(`${result.passed}/${result.total} passed`)
```

## Next steps

- [API reference](./api.md)
- [Testing & eval](./testing.md)
- [CLI](./cli.md)
