import { describe, it, expect } from 'vitest'
import { expect as pkExpect, AssertionError } from '../src/index.js'

describe('expect', () => {
  it('passes toContain', () => {
    pkExpect('hello world').toContain('world')
  })

  it('fails toContain', () => {
    expect(() => pkExpect('hello').toContain('x')).toThrow(AssertionError)
  })

  it('supports .not', () => {
    pkExpect('hello').not.toContain('x')
  })

  it('matches regex', () => {
    pkExpect('abc123').toMatch(/^\w+$/)
  })

  it('checks length', () => {
    pkExpect('abc').toHaveLength(3)
    pkExpect([1, 2, 3]).toHaveLength(3)
  })

  it('checks oneOf', () => {
    pkExpect('positive').toBeOneOf(['positive', 'negative'])
  })

  it('compares numbers', () => {
    pkExpect(5).toBeGreaterThan(3)
    pkExpect(2).toBeLessThan(3)
  })

  it('validates JSON shape', () => {
    pkExpect('{"a":1}').toMatchJSON((p) => {
      if ((p as { a?: number }).a !== 1) throw new Error('bad')
    })
  })

  it('fails invalid JSON', () => {
    expect(() => pkExpect('not json').toMatchJSON()).toThrow(AssertionError)
  })

  it('toEqual uses strict equality', () => {
    pkExpect('x').toEqual('x')
    expect(() => pkExpect('x').toEqual('y')).toThrow(AssertionError)
  })
})
