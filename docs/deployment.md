# Deployment guide

## Target platform

Render is the selected platform for this repository because it offers easy deploys for Dockerized Node.js services, straightforward env-vars management, and a quick release pipeline for monorepo apps.

## Environment variables

Set these values in Render service configuration or GitHub Secrets:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `OTP_SECRET`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`

## Deployment flow

1. Merge to `main`
2. CI workflow runs
3. Docker images are built and published to GHCR
4. Render deploy hook triggers
5. App smoke tests call `/health`

## Rollback

- revert to previous image tag in Render
- redeploy previous release
- verify `/health` and key public endpoint

## Production URL

Set placeholder: `https://<your-render-service>.onrender.com`
