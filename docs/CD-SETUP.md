# Continuous Delivery — NAS Runner Setup

## Overview

A self-hosted GitHub Actions runner runs in Docker on the Synology DS918+. When CI builds and pushes a new image to GHCR, the deploy workflow dispatches to this runner, which pulls the new image and restarts the container.

```
GitHub CI → push to GHCR → deploy workflow → NAS runner → docker compose pull && up -d
```

The runner makes outbound HTTPS connections only — no inbound ports needed.

## Step 1: Create the runner container

SSH into the Synology NAS and run:

```bash
# Pull the official runner image
docker pull ghcr.io/actions/actions-runner:latest

# Create the runner (replace REGISTRATION_TOKEN below)
docker run -d \
  --restart unless-stopped \
  --name actions-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /volume1/docker:/volume1/docker \
  -e RUNNER_NAME=synology-ds918 \
  -e RUNNER_ORG=DanWangDev \
  -e RUNNER_TOKEN=<REGISTRATION_TOKEN> \
  -e RUNNER_LABELS=nas,deploy \
  ghcr.io/actions/actions-runner:latest
```

**Where to get REGISTRATION_TOKEN:**
1. Go to https://github.com/organizations/DanWangDev/settings/actions/runners
2. Click "New runner" → "New organization runner"
3. Copy the token from the setup instructions

> **Note:** The registration token expires after 1 hour. It's only needed for initial registration — once the runner connects, it stays connected. If you recreate the container, you'll need a new token.

## Step 2: Verify the runner

Check the runner appears in GitHub:

```bash
# Local check — runner should show "Running job" or idle
docker logs actions-runner
```

Then go to https://github.com/organizations/DanWangDev/settings/actions/runners — you should see `synology-ds918` with status "Idle".

## Step 3: Repository layout on the NAS

The runner expects repos at these paths:

| Repo | NAS path |
|------|----------|
| 11plus-hub | `/volume1/docker/11plus-hub` |
| writing-buddy | `/volume1/docker/writing-buddy` |
| vocab-master | `/volume1/docker/vocab-master` |
| story-sleuth | `/volume1/docker/story-sleuth` |

Each directory must contain the repo's `docker-compose.prod.yml` and `.env` file.

If your paths differ, update the `deploy.yml` workflow in each repo to match.

## How it works

1. You merge a PR to `main`
2. CI runs: lint → typecheck → test → build → push Docker images to GHCR
3. CI completes successfully
4. `deploy.yml` triggers, dispatches to `runs-on: nas`
5. Runner picks up the job, `cd`s to the repo directory, runs:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```
6. App is updated with the new image

## Troubleshooting

### Runner is offline
```bash
docker logs actions-runner  # check for errors
docker restart actions-runner  # usually fixes it
```

### Deploy job fails
Check the workflow run log in GitHub Actions. Common issues:
- **"No such file"**: repo paths don't match. Check `/volume1/docker/` layout.
- **"Permission denied"**: Docker socket mount issue. Verify `-v /var/run/docker.sock:/var/run/docker.sock`.
- **"Cannot pull image"**: GHCR auth. The runner uses the repo's GITHUB_TOKEN for GHCR access.

### Need a new registration token
```bash
docker stop actions-runner && docker rm actions-runner
# Get a new token from GitHub, then re-run the docker run command above
```
