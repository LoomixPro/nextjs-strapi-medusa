# Contributing to Loomix Commerce

Thank you for your interest in contributing to **Loomix Commerce**! We welcome community contributions, bug fixes, feature proposals, and documentation improvements.

Please take a few moments to review these guidelines before submitting an issue or pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features & Enhancements](#suggesting-features--enhancements)
  - [Submitting Pull Requests (PRs)](#submitting-pull-requests-prs)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Monorepo Structure](#monorepo-structure)
  - [Local Development Workflow](#local-development-workflow)
- [Coding Standards & Conventions](#coding-standards--conventions)
  - [Branch Naming](#branch-naming)
  - [Commit Message Guidelines](#commit-message-guidelines)
  - [Code Style & Linting](#code-style--linting)
  - [Multi-Language & RTL Guidelines](#multi-language--rtl-guidelines)
- [Pull Request Checklist](#pull-request-checklist)
- [Security Disclosures](#security-disclosures)
- [License](#license)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and collaborative in all discussions and code reviews.

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing [Issues](https://github.com) to ensure the issue hasn't already been reported.

When opening an issue, provide:
1. **Clear and descriptive title**.
2. **Steps to reproduce** the issue step-by-step.
3. **Expected vs. Actual behavior**.
4. **Environment details**: OS, Node.js version, Docker version, browser (if storefront related).
5. **Logs and screenshots** (if applicable). Please redact any sensitive credentials or `.env` secrets!

### Suggesting Features & Enhancements

We love ideas! To suggest a feature:
1. Open an issue with the label `enhancement`.
2. Explain **why** this feature is needed and the use case it solves.
3. Outline proposed API, UI, or architectural changes.
4. Wait for feedback or discussion before opening a massive PR.

### Submitting Pull Requests (PRs)

1. **Fork** the repository and clone it to your local machine.
2. Create a new branch off `main` with a descriptive name (e.g., `feat/rtl-drawer-fix`).
3. Make your changes adhering to project conventions.
4. Run linters, type checks, and tests.
5. Push to your fork and submit a Pull Request to `main`.
6. Fill out the PR template with a summary of changes and test steps.

> [!IMPORTANT]
> **Do not include deployment keys, API secrets, or passwords** in your commits or PR descriptions. Pull requests must pass code reviews before merging.

---

## Development Setup

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Docker & Docker Compose v2**: For running backend services (PostgreSQL, Redis, Meilisearch)
- **Package Manager**: `npm` (v10+)
- **Git**

### Monorepo Structure

```text
├── store/                  # Next.js 16 Storefront (App Router, Tailwind CSS, shadcn/ui)
├── store-admin/            # Medusa v2 Backend & Commerce Admin
├── website-admin/          # Strapi CMS (Content, Blogs, Page Builder)
├── docs/                   # System & architecture documentation
├── docker-compose.yml      # Local orchestration for PostgreSQL, Redis, Caddy, etc.
└── scripts/                # Sync & utility scripts
```

### Local Development Workflow

1. **Clone your fork:**
   ```bash
   git clone https://github.com/<your-username>/next-strapi-medusa.git
   cd next-strapi-medusa
   ```

2. **Environment configuration:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Follow the instructions in `.env.example` to set local database credentials.

3. **Running the Storefront locally:**
   ```bash
   cd store
   npm install
   npm run dev
   ```
   The storefront will be available at `http://localhost:8000`.

4. **Running Medusa Backend:**
   ```bash
   cd store-admin
   npm install
   npm run dev
   ```

5. **Running Strapi CMS:**
   ```bash
   cd website-admin
   npm install
   npm run develop
   ```

---

## Coding Standards & Conventions

### Branch Naming

Follow the convention `<type>/<short-description>`:

| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New feature or capability | `feat/persian-font-loader` |
| `fix` | Bug fix | `fix/cart-quantity-selector` |
| `docs` | Documentation updates | `docs/update-payment-guide` |
| `refactor` | Code refactoring without behavior change | `refactor/checkout-steps` |
| `perf` | Performance improvement | `perf/image-lazy-loading` |
| `chore` | Build tools, packages, or config updates | `chore/upgrade-tailwind` |

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Examples:**
- `feat(store): add dynamic currency switcher in header`
- `fix(medusa): resolve tax calculation rounding issue`
- `docs(readme): fix port mapping table for portainer`
- `style(store): fix rtl spacing on checkout summary`

### Code Style & Linting

Before pushing your branch, ensure your code passes all lint and formatting checks:

```bash
# In the store directory:
cd store
npm run lint
npm run format:check
```

- Write clean, type-safe TypeScript code (`strict` mode).
- Do not suppress linter errors with `eslint-disable` without clear justification.
- Avoid committing unused imports or dead code.

### Multi-Language & RTL Guidelines

- Loomix supports both English (LTR) and Persian (RTL).
- Always use logical CSS properties (e.g., `ms-`, `me-`, `start-`, `end-` in Tailwind) instead of hardcoded `ml-` or `mr-`.
- Ensure all newly introduced UI strings are wrapped in the appropriate translation keys.

---

## Pull Request Checklist

Before submitting your PR, verify:

- [ ] My code adheres to the project's coding and formatting standards.
- [ ] I have tested my changes locally on both desktop and mobile views.
- [ ] For UI changes, both LTR (English) and RTL (Persian) modes render properly.
- [ ] No secrets, credentials, or private `.env` files are included.
- [ ] Commit history is clean and follows Conventional Commits.
- [ ] Relevant documentation has been updated if needed.

---

## Security Disclosures

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, report it privately to the maintainers via GitHub Private Vulnerability Reporting or via email.

---

## License

By contributing code to Loomix Commerce, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE).
