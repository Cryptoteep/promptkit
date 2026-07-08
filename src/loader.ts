/**
 * promptkit — filesystem loader
 *
 * Loads prompt modules from a directory. A prompt module is any TS/JS file
 * that default-exports a {@link PromptDefinition} (or an array of them), or
 * named-exports prompts under any key.
 */

import { readdir, stat, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { LoaderError } from './errors.js'
import type { PromptDefinition, PromptInput } from './types.js'

const SUPPORTED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'])

/** Options for {@link loadPromptsFromDir}. */
export interface LoadOptions {
  /** Recurse into subdirectories. Default: true. */
  recursive?: boolean
  /** Glob-style name filter applied to file basenames. */
  filter?: (filename: string) => boolean
}

/**
 * Load all prompt definitions from a directory.
 *
 * Each file is dynamically imported. promptkit collects:
 * - the default export, if it's a {@link PromptDefinition} or array of them
 * - any named export whose value is a {@link PromptDefinition}
 *
 * @example
 * ```ts
 * const prompts = await loadPromptsFromDir('./prompts')
 * for (const p of prompts) console.log(p.name)
 * ```
 */
export async function loadPromptsFromDir(
  dir: string,
  options: LoadOptions = {},
): Promise<PromptDefinition[]> {
  const recursive = options.recursive ?? true
  const found: PromptDefinition[] = []

  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (e) {
    throw new LoaderError(
      `Could not read directory "${dir}": ${e instanceof Error ? e.message : String(e)}`,
      dir,
    )
  }

  for (const entry of entries) {
    if (options.filter && !options.filter(entry)) continue
    const fullPath = join(dir, entry)
    let s
    try {
      s = await stat(fullPath)
    } catch {
      continue
    }

    if (s.isDirectory()) {
      if (recursive) {
        found.push(...(await loadPromptsFromDir(fullPath, options)))
      }
      continue
    }

    const ext = extname(entry)
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue

    const prompts = await loadPromptFile(fullPath)
    found.push(...prompts)
  }

  return found
}

/** Load prompt definitions from a single file. */
export async function loadPromptFile(
  filePath: string,
): Promise<PromptDefinition[]> {
  const found: PromptDefinition[] = []
  let mod: Record<string, unknown>

  try {
    // For .ts files we rely on a runtime that can import them (tsx, bun,
    // ts-node, etc.). In plain Node, pre-compile or use a loader.
    const url = pathToFileURL(filePath).href
    mod = (await import(url)) as Record<string, unknown>
  } catch (e) {
    throw new LoaderError(
      `Failed to import "${filePath}": ${e instanceof Error ? e.message : String(e)}`,
      filePath,
    )
  }

  const collect = (value: unknown) => {
    if (isPromptDefinition(value)) {
      found.push(value)
    } else if (Array.isArray(value)) {
      for (const v of value) collect(v)
    }
  }

  if ('default' in mod) collect(mod.default)
  for (const [key, value] of Object.entries(mod)) {
    if (key === 'default') continue
    collect(value)
  }

  return found
}

/** Best-effort duck-type check for a {@link PromptDefinition}. */
export function isPromptDefinition(value: unknown): value is PromptDefinition {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    typeof v.render === 'function' &&
    typeof v.validate === 'function' &&
    v.options != null
  )
}

/** Read a prompt file's raw text (useful for the CLI `list` command). */
export async function readPromptFileText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (e) {
    throw new LoaderError(
      `Could not read file "${filePath}": ${e instanceof Error ? e.message : String(e)}`,
      filePath,
    )
  }
}

/** Format a path relative to a base, for cleaner CLI output. */
export function relPath(base: string, target: string): string {
  return relative(base, target) || target
}

/** Minimal type guard re-export for callers that work with generic prompts. */
export type { PromptInput }
