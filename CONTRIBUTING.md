# Contributing to BrewLite

## Branch strategy

- `main`: production-ready
- `develop`: active development
- `feature/*`: feature work
- `hotfix/*`: urgent production fixes

## Pull request checklist

- Branch is rebased on latest `develop` or `main`
- CI is green
- Tests covering changed behavior are added or updated
- Documentation is updated when user-facing behavior changes
- No secrets are committed

## Commit conventions

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation update
- `chore:` maintenance
- `test:` tests
- `ci:` CI/CD pipeline change

## Definition of Done

A task is complete when:

- code is implemented and reviewed
- tests pass
- lint/build succeed
- deployment-safe environment variables are documented
- relevant docs are updated
