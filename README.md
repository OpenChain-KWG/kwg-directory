# OpenChain KWG Directory

> Member directory for the OpenChain Korea Work Group. Members sign in with GitHub, register a profile, and appear in the directory after admin approval.

🌐 **한국어 README:** [README.ko.md](README.ko.md)

[![CI](https://github.com/OpenChain-KWG/kwg-directory/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenChain-KWG/kwg-directory/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## Features

- GitHub / Google OAuth sign-in
- Profile registration with an admin approval workflow
- Real-time name/company search + category filters
- Member detail view (email shown to signed-in members only)
- Dark mode (manual toggle); Korean UI (English localization in progress)
- PIPA-compliant: `robots.txt` noindex + privacy policy

## Tech Stack

| Area | Tech |
|------|------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Row Level Security) |
| Auth | next-auth v5 (GitHub OAuth) |
| Deploy | Vercel |
| Testing | Vitest + React Testing Library + Playwright |
| Language | TypeScript |

## Quick Start

Requires Node.js 22+, npm 10+, a Supabase project, and a GitHub OAuth App.

```bash
git clone https://github.com/OpenChain-KWG/kwg-directory.git
cd kwg-directory
npm install
cp .env.example .env.local   # fill in values — see comments in .env.example
npm run dev                  # http://localhost:3000
```

Full setup (Supabase schema, OAuth apps, admin bootstrap) and production
deployment are documented in **[docs/deployment.md](docs/deployment.md)**.

## Documentation

| Topic | Document |
|-------|----------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Deployment & setup | [docs/deployment.md](docs/deployment.md) |
| Testing | [docs/testing.md](docs/testing.md) |
| Data & privacy | [docs/data-policy.md](docs/data-policy.md) |
| Internationalization | [docs/i18n.md](docs/i18n.md) |
| Design principles | [docs/design/principles.md](docs/design/principles.md) |

## Testing

```bash
npm test            # unit + integration (Vitest)
npm run test:e2e    # end-to-end (Playwright)
npm run test:rls    # Supabase RLS policy tests
```

## Security

- All DB writes go through server-side API routes only
- Supabase RLS: only `approved = true` records are publicly readable
- Email is exposed only to signed-in members and only when `email_public = true`
- Security headers (CSP, X-Frame-Options, HSTS) in `next.config.ts`
- The server refuses to start in production if `NEXTAUTH_SECRET` is shorter than 32 chars

Report vulnerabilities via [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome. Read **[CONTRIBUTING.md](CONTRIBUTING.md)** (English) /
**[CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)** (한국어) before opening a pull request.
Please also follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[Apache License 2.0](LICENSE) · Copyright OpenChain Korea Work Group
