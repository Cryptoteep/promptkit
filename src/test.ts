/**
 * promptkit/test — testing helpers
 *
 * Re-exports the core API plus a tiny `describe`/`it` shim so you can write
 * prompt tests without pulling in a full test runner. Designed to also work
 * inside Vitest/Jest/node:test — if those globals are present, the shim
 * delegates to them.
 */

export {
  definePrompt,
  runPrompt,
  evalPrompt,
  expect,
  matchers,
  renderTemplate,
  loadPromptsFromDir,
} from './index.js'

export type {
  PromptDefinition,
  RunResult,
  EvalCase,
  EvalResult,
  LLMCall,
} from './types.js'

/**
 * A test callback. Receives helpers for registering sub-tests.
 * Works with the built-in shim and with Vitest/Jest/node:test.
 */
export interface TestContext {
  /** Register a child test. */
  test(name: string, fn: () => void | Promise<void>): void
}

/**
 * Register a test suite. If a global `describe` exists (Vitest/Jest), it is
 * used; otherwise promptkit's built-in shim is used.
 */
export const describe: (
  name: string,
  fn: (t: TestContext) => void | Promise<void>,
) => void = (globalThis as { describe?: unknown }).describe
  ? ((name: string, fn: (t: TestContext) => void | Promise<void>) => {
      const g = globalThis as {
        describe: (n: string, f: () => void) => void
        it: (n: string, f: () => void | Promise<void>) => void
      }
      g.describe(name, () => {
        fn({
          test: (n, f) => g.it(n, f),
        })
      })
    })
  : (name, fn) => {
      const results: { name: string; ok: boolean; error?: string }[] = []
      const ctx: TestContext = {
        test: (n, f) => {
          try {
            const r = f()
            if (r && typeof (r as Promise<void>).then === 'function') {
              ;(r as Promise<void>).then(
                () => results.push({ name: n, ok: true }),
                (e) =>
                  results.push({
                    name: n,
                    ok: false,
                    error: e instanceof Error ? e.message : String(e),
                  }),
              )
            } else {
              results.push({ name: n, ok: true })
            }
          } catch (e) {
            results.push({
              name: n,
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            })
          }
        },
      }
      fn(ctx)
      // Print results on next tick so async tests have a chance to settle.
      queueMicrotask(() => {
        for (const r of results) {
          const mark = r.ok ? '\u2713' : '\u2717'
          // eslint-disable-next-line no-console
          console.log(`${mark} ${name} > ${r.name}${r.error ? ` — ${r.error}` : ''}`)
        }
      })
    }

/** Register a single test (shim only; inside a runner, use its `it`). */
export const it: (
  name: string,
  fn: () => void | Promise<void>,
) => void = (globalThis as { it?: unknown }).it
  ? (name, fn) => (globalThis as { it: (n: string, f: () => void | Promise<void>) => void }).it(name, fn)
  : (name, fn) => {
      describe(name, (t) => t.test(name, fn))
    }
