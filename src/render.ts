/**
 * promptkit — template rendering helpers
 */

import { RenderError } from './errors.js'

/**
 * Simple, dependency-free mustache-style template renderer.
 *
 * Supports `{{ key }}` and `{{key}}` interpolation with optional dot-path
 * access into nested objects. Designed for the common case — for anything
 * fancier, pass a `template` function to {@link definePrompt} instead.
 *
 * @example
 * ```ts
 * renderTemplate('Hello {{ name }}!', { name: 'world' }) // 'Hello world!'
 * renderTemplate('{{ user.name }}', { user: { name: 'Ada' } }) // 'Ada'
 * ```
 */
export function renderTemplate(
  template: string,
  vars: Record<string, unknown>,
): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expr: string) => {
    const value = resolvePath(vars, expr.trim())
    if (value === undefined || value === null) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  })
}

/** Resolve a dot-path like `user.name` against an object. */
export function resolvePath(obj: unknown, path: string): unknown {
  const parts = path.split('.').filter(Boolean)
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/** Coerce a template result into a string, throwing helpfully if it isn't one. */
export function coerceTemplateResult(value: unknown, promptName: string): string {
  if (typeof value === 'string') return value
  if (value == null) {
    throw new RenderError(
      `Prompt "${promptName}" template returned ${String(value)}. Templates must return a string.`,
    )
  }
  throw new RenderError(
    `Prompt "${promptName}" template returned a ${typeof value}. Templates must return a string.`,
  )
}
