# Commit Conventions (uppt)

This project uses **Conventional Commits** to automatically determine the next semantic version bump.

## Prefix → Bump mapping

| Prefix / Indicator | Bump | Example |
|---|---|---|
| `feat` | **minor** | `feat: add new endpoint` |
| `feat!` or `feat(scope)!` | **major** | `feat!: remove deprecated API` |
| Any commit with `BREAKING CHANGE:` in the body | **major** | `feat: ...` + `BREAKING CHANGE: ...` |
| `fix` | **patch** | `fix: correct null pointer` |
| `perf` | **patch** | `perf: speed up rendering` |
| `refactor` | **patch** | `refactor: extract helper` |
| `docs` | **patch** | `docs: update README` |
| `build` | **patch** | `build: bump dependencies` |
| `types` | **patch** | `types: expose public interface` |
| `chore` | **patch** | `chore: update lint config` |
| `examples` | **patch** | `examples: add basic usage` |
| `test` | **patch** | `test: add unit tests` |
| `style` | **patch** | `style: format code` |
| `ci` | **patch** | `ci: add release workflow` |
| Any other type | **patch** | `improve: tweak logging` |

### Breaking change detection (overrides any bump to **major**)

- A `!` immediately after the type/scope: `feat(scope)!: ...`
- The literal text `BREAKING CHANGE:` (or `BREAKING-CHANGE:`) anywhere in the commit body

### 0.x special handling

When the current major version is `0`, bumps are downgraded:
- major → minor
- minor → patch
- patch stays patch

---
