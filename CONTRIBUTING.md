# Contributing Guide

Thank you for contributing to University Peer-to-Peer Lending Platform.

## Contribution Scope

- Keep changes focused and small.
- Prefer one logical change per pull request.
- When a task is documentation-only, avoid code changes in backend or frontend.

## Branch and Commit Conventions

- Branch format: type/short-description
  - Examples: docs/readme-cleanup, fix/transaction-race, feat/request-filters
- Commit format: <type>: <summary>
  - Types: feat, fix, docs, refactor, test, chore
  - Example: docs: improve local setup instructions

## Pull Request Checklist

- Explain what changed and why.
- Link related issue or task if available.
- Include screenshots for UI-facing changes.
- Mention any migration, environment, or API impacts.
- Verify backend and frontend build/test status when relevant.

## Local Validation

Use the commands below before opening a PR when your change affects these modules.

### Backend

```bash
cd backend
./gradlew test
```

Windows:

```bash
cd backend
.\gradlew.bat test
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Documentation Updates

If your change modifies architecture, contracts, or behavior, update the relevant root documentation:

- 1_SYSTEM_ARCHITECTURE.md
- 2_DATABASE_SCHEMA.md
- 3_API_DESIGN.md
- 4_CORE_BACKEND_LOGIC.md
- 5_STARTUP_EVOLUTION.md
