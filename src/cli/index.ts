/**
 * promptkit CLI
 *
 * Usage:
 *   promptkit <command> [options]
 *
 * Commands:
 *   list   <dir>          List prompts found in a directory.
 *   run    <file>         Render a prompt from a file and print it.
 *   eval   <file>         Run an eval file (default-exports an eval config).
 *   version               Print the installed promptkit version.
 *
 * The CLI is intentionally minimal and dependency-free (uses Node's built-in
 * `util.parseArgs`). For richer UX, wrap it in your own script.
 */

import { parseArgs } from 'node:util'
import { createLogger } from '../logger.js'
import { listCommand } from './commands/list.js'
import { runCommand } from './commands/run.js'
import { evalCommand } from './commands/eval.js'

export const VERSION = '0.1.0'

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`
promptkit v${VERSION} — LLM prompt engineering toolkit

USAGE
  promptkit <command> [options]

COMMANDS
  list   <dir>            List prompts found in a directory.
  run    <file> [input]   Render a prompt file. If [input] is a JSON string
                          or a path to a .json file, it is used as input.
  eval   <file>           Run an eval file. The file should default-export an
                          object with { prompt, cases, call }.
  version                Print the installed promptkit version.
  help                   Show this help.

EXAMPLES
  promptkit list ./prompts
  promptkit run ./prompts/summarize.ts '{"text":"hello"}'
  promptkit eval ./evals/summarize.eval.ts

OPTIONS
  --no-color    Disable colored output.
  --log-level   debug | info | warn | error | silent  (default: info)
`)
}

export async function main(argv: string[]): Promise<void> {
  const args = argv.slice(2)
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp()
    return
  }

  const command = args[0]
  const rest = args.slice(1)

  const { values } = parseArgs({
    args: rest,
    options: {
      'no-color': { type: 'boolean', default: false },
      'log-level': { type: 'string', default: 'info' },
    },
    allowPositionals: true,
  })

  const logger = createLogger(
    values['log-level'] as 'debug' | 'info' | 'warn' | 'error' | 'silent',
    !values['no-color'],
  )

  try {
    switch (command) {
      case 'list': {
        const dir = values.positionals[0] ?? './prompts'
        await listCommand(dir, logger)
        break
      }
      case 'run': {
        const file = values.positionals[0]
        const input = values.positionals[1]
        if (!file) {
          logger.error('Missing <file> argument. See `promptkit help`.')
          process.exitCode = 1
          return
        }
        await runCommand(file, input, logger)
        break
      }
      case 'eval': {
        const file = values.positionals[0]
        if (!file) {
          logger.error('Missing <file> argument. See `promptkit help`.')
          process.exitCode = 1
          return
        }
        await evalCommand(file, logger)
        break
      }
      case 'version':
      case '--version':
      case '-v':
        // eslint-disable-next-line no-console
        console.log(VERSION)
        break
      default:
        logger.error(`Unknown command "${command}". See \`promptkit help\`.`)
        process.exitCode = 1
    }
  } catch (e) {
    logger.error(e instanceof Error ? e.message : String(e))
    process.exitCode = 1
  }
}
