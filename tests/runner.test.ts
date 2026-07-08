import { describe, it, expect } from 'vitest'
import { definePrompt, runPrompt, evalPrompt, type LLMCall } from '../src/index.js'

const echo: LLMCall = async (prompt) => `echo:${prompt}`

describe('runPrompt', () => {
  it('renders, calls, and returns a RunResult', async () => {
    const p = definePrompt<{ text: string }>({
      name: 'p',
      template: ({ text }) => `Q:${text}`,
    })
    const result = await runPrompt(p, { text: 'hi' }, { call: echo })
    expect(result.name).toBe('p')
    expect(result.prompt).toBe('Q:hi')
    expect(result.output).toBe('echo:Q:hi')
    expect(result.input.text).toBe('hi')
    expect(typeof result.durationMs).toBe('number')
  })

  it('runs the validator before calling', async () => {
    const p = definePrompt<{ n: number }>({
      name: 'p',
      validate: (input) => ({ n: input.n + 1 }),
      template: ({ n }) => String(n),
    })
    const result = await runPrompt(p, { n: 1 }, { call: echo })
    expect(result.prompt).toBe('2')
  })

  it('rejects when validation throws', async () => {
    const p = definePrompt<{ n: number }>({
      name: 'p',
      validate: (input) => {
        if (input.n < 0) throw new Error('no negatives')
        return input
      },
      template: ({ n }) => String(n),
    })
    await expect(runPrompt(p, { n: -1 }, { call: echo })).rejects.toThrow(
      'no negatives',
    )
  })
})

describe('evalPrompt', () => {
  it('reports pass/fail counts', async () => {
    const p = definePrompt<{ x: number }>({
      name: 'eval-p',
      template: ({ x }) => String(x),
    })
    const result = await evalPrompt(
      p,
      [
        {
          name: 'passes',
          input: { x: 1 },
          assert: (r) => {
            if (r.output !== '1') throw new Error('mismatch')
          },
        },
        {
          name: 'fails',
          input: { x: 2 },
          assert: (r) => {
            if (r.output !== '999') throw new Error('expected 999')
          },
        },
      ],
      { call: echo },
    )
    expect(result.total).toBe(2)
    expect(result.passed).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.cases[1]?.error).toBe('expected 999')
  })
})
