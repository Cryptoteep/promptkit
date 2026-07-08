/**
 * An eval file for the sentiment prompt. Run with:
 *   promptkit eval ./examples/sentiment.eval.ts
 *
 * The default export wires up the prompt, the test cases, and a mock LLM
 * call. Swap the mock for a real provider call to run this against a model.
 */

import { definePrompt, expect, type LLMCall } from '../src/index.js'
import sentimentPrompt from './sentiment.js'

// A deterministic mock LLM that "classifies" by keyword. Replace with a real
// provider call to evaluate against an actual model.
const mockCall: LLMCall = async (prompt) => {
  if (/love|great|awesome/i.test(prompt)) return 'positive'
  if (/awful|terrible|hate/i.test(prompt)) return 'negative'
  return 'neutral'
}

// A second prompt just to show how multiple prompts can share a call.
const echo = definePrompt<{ text: string }>({
  name: 'echo',
  template: ({ text }) => text,
})

export default {
  prompt: sentimentPrompt,
  call: mockCall,
  cases: [
    {
      name: 'positive text',
      input: { text: 'I love this product!' },
      assert: (r) => {
        expect(r.output).toBeOneOf(['positive', 'negative', 'neutral'])
        expect(r.output).toEqual('positive')
      },
    },
    {
      name: 'negative text',
      input: { text: 'This is awful and terrible.' },
      assert: (r) => expect(r.output).toEqual('negative'),
    },
    {
      name: 'neutral text',
      input: { text: 'It is a book on the table.' },
      assert: (r) => expect(r.output).toEqual('neutral'),
    },
    {
      name: 'output is one of allowed labels',
      input: { text: 'Whatever.' },
      assert: (r) => expect(r.output).toBeOneOf(['positive', 'negative', 'neutral']),
    },
  ],
}

// Reference echo so it is not tree-shaken away in tooling that scans exports.
void echo
