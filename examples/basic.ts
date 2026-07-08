/**
 * A minimal "hello world" prompt, showing the three core pieces:
 *   1. define the input shape
 *   2. validate input
 *   3. render a template
 *
 * Run it:
 *   promptkit run ./examples/basic.ts '{"name":"Ada"}'
 */

import { definePrompt } from '../src/index.js'

interface BasicInput {
  name: string
  language?: string
}

export default definePrompt<BasicInput>({
  name: 'greet',
  version: '1.0.0',
  description: 'Greet a user by name in a given language.',
  tags: ['demo', 'i18n'],
  validate: (input) => {
    if (!input.name?.trim()) throw new Error('`name` is required')
    return { ...input, language: input.language ?? 'en' }
  },
  template: ({ name, language }) => {
    const greeting =
      language === 'es' ? 'Hola' : language === 'fr' ? 'Bonjour' : 'Hello'
    return `${greeting}, ${name}!`
  },
})
