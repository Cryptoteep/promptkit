/**
 * A sentiment-classification prompt. Demonstrates:
 *   - constraining the model to a fixed set of labels
 *   - few-shot examples in the template
 *   - a validator that guards against empty input
 *
 * Pair with examples/sentiment.eval.ts to see evalPrompt in action.
 */

import { definePrompt } from '../src/index.js'

export interface SentimentInput {
  text: string
  /** Allowed labels. Defaults to ['positive','negative','neutral']. */
  labels?: string[]
}

const DEFAULT_LABELS = ['positive', 'negative', 'neutral'] as const

export default definePrompt<SentimentInput>({
  name: 'classify-sentiment',
  version: '1.1.0',
  description: 'Classify the sentiment of a short text into one of N labels.',
  tags: ['classification', 'nlp'],
  validate: (input) => {
    if (!input.text?.trim()) throw new Error('`text` is required')
    const labels = input.labels?.length ? input.labels : [...DEFAULT_LABELS]
    return { ...input, labels }
  },
  template: ({ text, labels }) => `You are a sentiment classifier.

Respond with EXACTLY one of these labels: ${labels!.join(', ')}.
Do not add any other text.

Examples:
"I love this!" -> positive
"This is awful." -> negative
"It is a book." -> neutral

Now classify:
"""
${text}
"""
->`,
})
