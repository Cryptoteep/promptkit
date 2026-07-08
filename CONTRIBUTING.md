# Contributing to promptkit

First off — thank you for taking the time to contribute! 🎉

This document describes how to set up the project, the conventions we follow,
and how to submit changes. It is short on purpose; when in doubt, open an
issue and ask.

## Project mission

promptkit is a **non-commercial, community-maintained** TypeScript toolkit
for prompt engineering. Our north star: **make prompts as testable and
versionable as the rest of your code**, without locking you into any model
provider.

If your contribution advances that mission and keeps the runtime surface
small, it is probably welcome.

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
Be kind. Be patient. Assume good intent.

## Getting set up

```bash
git clone https://github.com/Cryptoteep/promptkit
cd promptkit
npm install
npm test          # run the vitest suite
npm run build     # build dist/ with tsup
npm run typecheck # tsc --noEmit
npm run lint      # eslint
```

Requirements: Node 18+, npm/pnpm/bun.

## Project layout

```
src/         library source (the published package)
  index.ts   public entrypoint
  test.ts    promptkit/test entrypoint
  cli/       the `promptkit` CLI
tests/       vitest suite
examples/    runnable examples (also used as smoke tests)
docs/        longer-form documentation
```

## How to propose a change

1. **Open an issue first** for anything beyond a typo or obvious bug fix.
   A short discussion up front saves everyone time.
2. Fork the repo and create a branch off `main`.
3. Make your change. Keep commits focused; we favour small, reviewable PRs.
4. Add or update tests in `tests/`. We aim to keep coverage of the core
   modules high.
5. Run `npm run typecheck && npm test && npm run lint` locally.
6. Open a PR against `main` and fill in the template.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(eval): add parallel case execution
fix(loader): handle missing directory gracefully
docs: clarify LLMCall contract
```

### Code style

- TypeScript throughout, strict mode.
- No runtime dependencies in the published package. Dev dependencies are fine.
- Prefer pure functions in `src/`. Side effects belong in the CLI or the
  user's `call` function.
- Format with Prettier (config is committed). Lint with ESLint.

### Tests

We use Vitest. Tests live in `tests/` and mirror the `src/` layout. A test
file for `src/foo.ts` is `tests/foo.test.ts`. Aim for behaviour, not
implementation: assert on outputs and error messages, not internal state.

## Adding a new matcher

Matchers live in `src/expect.ts`. To add one:

1. Add the method to the `Expect<T>` interface.
2. Implement it in `createExpect`.
3. Add a test in `tests/expect.test.ts`.
4. Document it in `README.md` and `docs/api.md`.

## Adding a CLI command

1. Create `src/cli/commands/<name>.ts` exporting an async `<name>Command`.
2. Wire it into the `switch` in `src/cli/index.ts`.
3. Add a section to the `printHelp` output and `docs/cli.md`.
4. Add a smoke test if feasible.

## Releasing

Releases are cut by maintainers. We use semantic versioning:

- `patch`: bug fixes, docs
- `minor`: backwards-compatible features
- `major`: breaking changes (rare; coordinated in an issue first)

## Need help?

- Open a [discussion](https://github.com/Cryptoteep/promptkit/discussions) for
  questions.
- Open an [issue](https://github.com/Cryptoteep/promptkit/issues) for bugs.
- Ping a maintainer on your PR if it goes quiet for > 1 week.

Thanks again — and happy prompting! 💬
