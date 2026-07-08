# Changelog

All notable changes to **promptkit** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Roadmap published in README.

## [0.1.0] — 2025-01-15

### Added
- `definePrompt` for typed, validated, versioned prompts. (`#1`)
- `runPrompt` for provider-agnostic execution via a user-supplied `LLMCall`. (`#1`)
- `renderTemplate` mustache-style helper with dot-path interpolation. (`#2`)
- `expect` assertion library: `toEqual`, `toContain`, `toMatch`, `toHaveLength`,
  `toBeOneOf`, `toBeGreaterThan`, `toBeLessThan`, `toMatchJSON`, `.not`. (`#3`)
- `evalPrompt` for running prompt test suites. (`#4`)
- `loadPromptsFromDir` filesystem loader. (`#5`)
- `promptkit` CLI with `list`, `run`, `eval`, `version`, `help` commands. (`#6`)
- Examples: `basic`, `classify-sentiment`, `extract-entities`, `sentiment.eval`.
- Docs: getting-started, api, testing, cli.
- CI workflow (typecheck + test on Node 18/20/22).
- Issue templates, PR template, Code of Conduct, Security policy.

[Unreleased]: https://github.com/Cryptoteep/promptkit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Cryptoteep/promptkit/releases/tag/v0.1.0
