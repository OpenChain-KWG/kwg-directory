# Contributing Guide

🌐 **한국어:** [CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)

Thanks for your interest in contributing to KWG Directory. This document covers our branch strategy, commit conventions, and pull-request rules.

## Before You Start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.
- For new features or large changes, open an issue to discuss first.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of filing a public issue.

## Development Setup

```bash
git clone https://github.com/OpenChain-KWG/kwg-directory.git
cd kwg-directory
npm install
cp .env.example .env.local
# Fill in .env.local (see README.md)
npm run dev
```

## Branch Strategy

`main` is always deployable. Use **lowercase + hyphen** branch names.

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation |
| `refactor/` | Code change with no behavior change |
| `test/` | Adding or updating tests |
| `chore/` | Build, dependencies, CI |

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>

[body]

[footer]
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `revert`
- **scope** (optional): `auth`, `members`, `admin`, `ui`, `db`, `ci`, `docs`, …
- Use the imperative mood; lowercase subject, no trailing period.
- The body should explain **why**, not just **what**.
- One commit = one logical change.

Examples:

```
feat(auth): create session after GitHub OAuth callback
fix(members): apply missing 300ms search debounce
test(api): add integration test for GET /api/members
```

## Pull Request Rules

Use the same format as commit messages for the PR title.

Checklist before opening a PR:

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run lint` reports no warnings
- [ ] Tests added for changed code (new components / API routes)
- [ ] `npm run test:coverage` stays at or above 70%
- [ ] `npm run test:rls` passes for DB schema changes
- [ ] Related docs under `docs/` updated
- [ ] No secrets (keys, tokens, personal data) included

Review process:

1. Open PR → CI runs automatically
2. At least one approving review is required
3. Resolve all conversations before merging
4. Merge method: **Squash and merge**

Size guideline: one PR, one purpose. Aim for ≤ 10 files and ≤ 400 changed lines.

## Code Style

- TypeScript strict mode
- Compose Tailwind classes with the `cn()` helper
- Clearly separate Server / Client Components (mark with `'use client'`)
- API routes always check authentication before processing
- Access environment variables only via `process.env.*` (no hardcoding)

## Writing Tests

Always add tests for new features.

```bash
npm test               # unit + integration
npm run test:coverage  # coverage (keep ≥ 70%)
npm run test:e2e       # end-to-end
```

- Unit tests: `src/tests/unit/`
- Integration tests: `src/tests/integration/`
- E2E tests: `e2e/`

## Filing Issues

- **Bug**: use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature request**: use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Check for duplicates before filing.

---

Questions? Use the Discussions tab or comment on an existing issue.
