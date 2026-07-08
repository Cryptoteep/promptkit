import { describe, it, expect } from 'vitest'
import { renderTemplate, resolvePath } from '../src/index.js'

describe('renderTemplate', () => {
  it('interpolates simple vars', () => {
    expect(renderTemplate('Hi {{name}}!', { name: 'Ada' })).toBe('Hi Ada!')
  })

  it('ignores whitespace inside braces', () => {
    expect(renderTemplate('{{  name  }}', { name: 'x' })).toBe('x')
  })

  it('resolves dot paths', () => {
    expect(
      renderTemplate('{{user.name}}', { user: { name: 'Ada' } }),
    ).toBe('Ada')
  })

  it('renders empty for missing keys', () => {
    expect(renderTemplate('[{{missing}}]', {})).toBe('[]')
  })

  it('JSON-stringifies object values', () => {
    expect(renderTemplate('{{obj}}', { obj: { a: 1 } })).toBe('{"a":1}')
  })
})

describe('resolvePath', () => {
  it('returns undefined for missing paths', () => {
    expect(resolvePath({ a: 1 }, 'b')).toBeUndefined()
  })

  it('stops at nullish intermediates', () => {
    expect(resolvePath({ a: null }, 'a.b')).toBeUndefined()
  })
})
