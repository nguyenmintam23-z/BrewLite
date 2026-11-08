# Engineering Guide

## Branch strategy

- `main`: production
- `develop`: integration branch
- `feature/*`: feature work

## PR rules

- PR must target `develop` or `main`
- One reviewer minimum
- CI must pass before merge
- Include release notes if deployment-facing

## Commit convention

- `feat:` feature
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `ci:` pipeline
- `chore:` maintenance

## Definition of Done

- code runs locally
- tests added or updated
- lint and build pass
- env vars documented
- no secrets committed
- changes reviewed and merged to the correct branch
