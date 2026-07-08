import { describe, it, expect } from 'vitest'
import { definePrompt } from '../src/index.js'
import { ValidationError } from '../src/errors.js'

describe('definePrompt', () => {
  it('defines a prompt with a name and template', () => {
    const p = definePrompt<{ name: string }>({
      name: 'hi',
      template: ({ name }) => `Hi ${name}`,
    })
    expect(p.name).toBe('hi')
    expect(p.render({ name: 'Ada' })).toBe('Hi Ada')
  })

  it('freezes the definition', () => {
    const p = definePrompt<{ name: string }>({
      name: 'hi',
      template: ({ name }) => name,
    })
    expect(Object.isFrozen(p)).toBe(true)
  })

  it('throws on missing name', () => {
    expect(() =>
      // @ts-expect-error intentional bad input
      definePrompt({ template: () => '' }),
    ).toThrow(ValidationError)
  })

  it('throws on missing template', () => {
    expect(() =>
      // @ts-expect-error intentional bad input
      definePrompt({ name: 'x' }),
    ).toThrow(ValidationError)
  })

  it('runs sync validators and uses the cleaned input', () => {
    const p = definePrompt<{ n?: number }>({
      name: 'double',
      validate: (input) => ({ n: (input.n ?? 1) * 2 }),
      template: ({ n }) => `n=${n}`,
    })
    expect(p.render({})).toBe('n=2')
  })

  it('runs async validators via validate()', async () => {
    const p = definePrompt<{ x: number }>({
      name: 'async',
      validate: async (input) => ({ x: input.x + 1 }),
      template: ({ x }) => String(x),
    })
    const cleaned = await p.validate({ x: 1 })
    expect(cleaned.x).toBe(2)
  })

  it('preserves tags and metadata', () => {
    const p = definePrompt({
      name: 'tagged',
      tags: ['a', 'b'],
      metadata: { author: 'me' },
      template: () => '',
    })
    expect(p.tags).toEqual(['a', 'b'])
    expect(p.metadata.author).toBe('me')
  })
})
