/**
 * An information-extraction prompt that asks the model for strict JSON.
 * Demonstrates pairing a prompt with JSON-shape assertions in an eval.
 */

import { definePrompt } from '../src/index.js'

export interface ExtractionInput {
  text: string
  /** The fields to extract, e.g. ["name", "email"]. */
  fields: string[]
}

export default definePrompt<ExtractionInput>({
  name: 'extract-entities',
  version: '0.2.0',
  description: 'Extract structured fields from free text as strict JSON.',
  tags: ['extraction', 'json'],
  validate: (input) => {
    if (!input.text?.trim()) throw new Error('`text` is required')
    if (!Array.isArray(input.fields) || input.fields.length === 0) {
      throw new Error('`fields` must be a non-empty array')
    }
    return input
  },
  template: ({ text, fields }) => `Extract the following fields from the text
and respond with ONLY a JSON object. Use null for missing fields.
Do not include any prose, code fences, or explanations.

Fields: ${fields.join(', ')}

Text:
"""
${text}
"""
`,
})
