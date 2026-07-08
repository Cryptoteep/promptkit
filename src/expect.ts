/**
 * promptkit — assertion helpers
 *
 * A small, dependency-free assertion library designed for evaluating LLM
 * output. Works standalone or inside any test runner (Vitest, Jest, Node's
 * built-in `node:test`).
 *
 * The design mirrors a tiny subset of Jest's `expect` so it feels familiar,
 * but it is intentionally minimal and focused on the kinds of checks that
 * matter for prompts: substring, regex, JSON shape, length, set membership.
 */

import { AssertionError } from './errors.js'

/** A chainable assertion object. */
export interface Expect<T> {
  /** Negate the next assertion. */
  not: Expect<T>
  /** Assert strict equality (===). */
  toEqual(expected: T): void
  /** Assert the value is truthy. */
  toBeTruthy(): void
  /** Assert the value is falsy. */
  toBeFalsy(): void
  /** Assert the value is a string containing `substring`. */
  toContain(substring: string): void
  /** Assert the value matches a regex. */
  toMatch(pattern: RegExp): void
  /** Assert the value has the given length (string/array). */
  toHaveLength(length: number): void
  /** Assert the value is one of the provided options. */
  toBeOneOf(options: readonly T[]): void
  /** Assert the value is greater than `n`. */
  toBeGreaterThan(n: number): void
  /** Assert the value is less than `n`. */
  toBeLessThan(n: number): void
  /** Assert the value parses as JSON and (optionally) matches a shape. */
  toMatchJSON(check?: (parsed: unknown) => void): void
}

function fail(message: string): never {
  throw new AssertionError(message)
}

function format(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function createExpect<T>(value: T, negated = false): Expect<T> {
  const check = (cond: boolean, msg: string) => {
    if (negated ? cond : !cond) fail(msg)
  }

  const self: Expect<T> = {
    get not() {
      return createExpect(value, !negated)
    },
    toEqual(expected: T) {
      check(
        value === expected,
        `Expected ${format(value)} ${negated ? 'not ' : ''}to equal ${format(expected)}`,
      )
    },
    toBeTruthy() {
      check(!!value, `Expected ${format(value)} ${negated ? 'not ' : ''}to be truthy`)
    },
    toBeFalsy() {
      check(!value, `Expected ${format(value)} ${negated ? 'not ' : ''}to be falsy`)
    },
    toContain(substring: string) {
      if (typeof value !== 'string') {
        throw new AssertionError(`toContain expects a string, got ${typeof value}`)
      }
      check(
        value.includes(substring),
        `Expected ${format(value)} ${negated ? 'not ' : ''}to contain ${format(substring)}`,
      )
    },
    toMatch(pattern: RegExp) {
      if (typeof value !== 'string') {
        throw new AssertionError(`toMatch expects a string, got ${typeof value}`)
      }
      check(
        pattern.test(value),
        `Expected ${format(value)} ${negated ? 'not ' : ''}to match ${pattern}`,
      )
    },
    toHaveLength(length: number) {
      const v = value as unknown as { length?: number }
      if (v == null || typeof v.length !== 'number') {
        throw new AssertionError(`toHaveLength expects an array/string, got ${typeof value}`)
      }
      check(
        v.length === length,
        `Expected length ${v.length} ${negated ? 'not ' : ''}to be ${length}`,
      )
    },
    toBeOneOf(options: readonly T[]) {
      check(
        options.includes(value),
        `Expected ${format(value)} ${negated ? 'not ' : ''}to be one of ${format(options)}`,
      )
    },
    toBeGreaterThan(n: number) {
      if (typeof value !== 'number') {
        throw new AssertionError(`toBeGreaterThan expects a number, got ${typeof value}`)
      }
      check(value > n, `Expected ${value} ${negated ? 'not ' : ''}to be > ${n}`)
    },
    toBeLessThan(n: number) {
      if (typeof value !== 'number') {
        throw new AssertionError(`toBeLessThan expects a number, got ${typeof value}`)
      }
      check(value < n, `Expected ${value} ${negated ? 'not ' : ''}to be < ${n}`)
    },
    toMatchJSON(checkFn?: (parsed: unknown) => void) {
      if (typeof value !== 'string') {
        throw new AssertionError(`toMatchJSON expects a string, got ${typeof value}`)
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(value)
      } catch {
        throw new AssertionError(`Expected ${format(value)} to be valid JSON`)
      }
      if (checkFn) {
        try {
          checkFn(parsed)
        } catch (e) {
          throw new AssertionError(
            `JSON shape check failed: ${e instanceof Error ? e.message : String(e)}`,
          )
        }
      }
    },
  }

  return self
}

/**
 * Start an assertion. Throws an {@link AssertionError} on failure.
 *
 * @example
 * ```ts
 * expect(result.output).toContain('positive')
 * expect(result.output).toMatchJSON((p) => {
 *   if (!(p as any)?.sentiment) throw new Error('missing sentiment')
 * })
 * ```
 */
export function expect<T>(value: T): Expect<T> {
  return createExpect(value)
}

/** Collection of matcher functions for use without the chainable API. */
export const matchers = {
  contains: (value: string, substring: string) => value.includes(substring),
  matches: (value: string, pattern: RegExp) => pattern.test(value),
  isJSON: (value: string) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  },
  oneOf: <T>(value: T, options: readonly T[]) => options.includes(value),
}
