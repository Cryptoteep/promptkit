# CLI

```bash
promptkit <command> [options]
```

## Commands

### `list <dir>`

Discover and list prompts in a directory.

```bash
promptkit list ./prompts
```

```
Found 3 prompts:

  • greet@1.0.0  [demo, i18n]
      Greet a user by name in a given language.
  • classify-sentiment@1.1.0  [classification, nlp]
      Classify the sentiment of a short text into one of N labels.
  • extract-entities@0.2.0  [extraction, json]
      Extract structured fields from free text as strict JSON.
```

### `run <file> [input]`

Render a prompt and print it. **No model call is made** unless you set
`PROMPTKIT_CALL`.

```bash
# JSON string input
promptkit run ./prompts/greet.ts '{"name":"Ada","language":"es"}'

# JSON file input
promptkit run ./prompts/greet.ts ./input.json

# Plain string -> { text: "..." }
promptkit run ./prompts/greet.ts 'hello'
```

To actually call a model:

```bash
PROMPTKIT_CALL=./my-call.ts promptkit run ./prompts/greet.ts '{"name":"Ada"}'
```

`my-call.ts` should default-export an `LLMCall`:

```ts
export default async (prompt: string) => {
  // … call your model …
  return output
}
```

### `eval <file>`

Run an eval file.

```bash
promptkit eval ./evals/sentiment.eval.ts
```

Set `PROMPTKIT_CALL` if the eval file doesn't export `call`.

### `version`

Print the installed version.

### `help`

Show help.

## Global options

| Flag          | Description                          |
| ------------- | ------------------------------------ |
| `--no-color`  | Disable colored output.              |
| `--log-level` | `debug\|info\|warn\|error\|silent`    |

## Exit codes

- `0` — success
- `1` — an error occurred, or one or more eval cases failed
