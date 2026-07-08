# Security Policy

## Supported versions

promptkit is pre-1.0. We ship security fixes for the latest `0.x` release.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report them privately:

1. Open a **private security advisory** on GitHub:
   https://github.com/Cryptoteep/promptkit/security/advisories/new
2. Or contact the maintainer directly via GitHub profile.

Please include:

- A description of the issue and its impact
- Steps to reproduce
- Affected versions, if known
- Any suggested mitigations

We aim to acknowledge reports within 72 hours and to publish a fix within
30 days for high-severity issues.

## Scope

promptkit is a **library** — it never calls a model itself and has no runtime
dependencies. Security-relevant surface is therefore small:

- The CLI (`promptkit run` / `eval`) dynamically imports files from disk. Do
  not run it against untrusted prompt/eval files.
- The filesystem loader dynamically imports `.ts`/`.js` files. Only point it
  at directories you trust.

Issues in downstream model providers are out of scope; report them upstream.
