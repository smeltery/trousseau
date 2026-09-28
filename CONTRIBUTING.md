# Contributing

## Dev environment

Prefer Flox so Bun and pre-commit match CI:

```sh
flox activate
bun install
bun run check
```

## Local gates

`bun run check` mirrors the main CI app job:

- Typecheck
- Oxlint
- LOC file and flat-directory budgets
- Markdown + mermaid hygiene
- Production build

Pre-commit runs the same `bun run check`. Bypass only with `git commit --no-verify` when you intend to.

## Docs

User docs live in [`docs/`](docs/). Keep README slim and link here. Mermaid diagrams must use quoted labels without backticks so GitHub can render them.
