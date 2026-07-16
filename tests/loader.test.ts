import { describe, it, expect, vi } from 'vitest'
import { loadPromptFile } from '../src/loader.js'

vi.mock('node:url', () => ({
  pathToFileURL(path: string) {
    if (path === 'unsupported-prompt.ts') {
      const source = `
          const error = new Error('Unknown file extension ".ts"')
          error.code = 'ERR_UNKNOWN_FILE_EXTENSION'
          throw error
        `
      return new URL(`data:text/javascript,${encodeURIComponent(source)}`)
    }

    throw new Error(`Unexpected test path: ${path}`)
  },
}))

describe('loadPromptFile', () => {
  it('explains how to load TypeScript files without a loader', async () => {
    await expect(loadPromptFile('unsupported-prompt.ts')).rejects.toThrow(
      "Node can't import `.ts` files directly. Run with `tsx`, `bun`, or `ts-node`, or pre-compile to `.js`.",
    )
  })
})
