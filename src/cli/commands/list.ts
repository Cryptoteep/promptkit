/**
 * `promptkit list <dir>` — discover and list prompts in a directory.
 */

import { resolve } from 'node:path'
import type { Logger } from '../../logger.js'
import { loadPromptsFromDir, relPath } from '../../loader.js'
import type { PromptDefinition } from '../../types.js'

export async function listCommand(dir: string, logger: Logger): Promise<void> {
  const absDir = resolve(dir)
  logger.info(`Loading prompts from ${absDir} …`)
  const prompts: PromptDefinition[] = await loadPromptsFromDir(absDir)

  if (prompts.length === 0) {
    logger.warn('No prompts found.')
    return
  }

  // eslint-disable-next-line no-console
  console.log(`\nFound ${prompts.length} prompt${prompts.length === 1 ? '' : 's'}:\n`)
  for (const p of prompts) {
    const tags = p.tags.length ? `  [${p.tags.join(', ')}]` : ''
    const version = p.version ? `@${p.version}` : ''
    // eslint-disable-next-line no-console
    console.log(`  • ${p.name}${version}${tags}`)
    if (p.description) {
      // eslint-disable-next-line no-console
      console.log(`      ${p.description}`)
    }
  }
  // Reference to keep import meaningful for tooling that scans relPath usage.
  void relPath
}
