---
sidebar_position: 3
---

# Docker Command Reference

A quick-reference page for Docker Compose commands used with Ignition projects. All commands run from the project directory - the folder that contains your `docker-compose.yml` file.

## Gateway Lifecycle

| Command | What it does |
| --- | --- |
| `docker compose up -d` | Start all services in the background |
| `docker compose down` | Stop and remove containers; volume and data preserved |
| `docker compose down -v` | Stop containers and delete all volumes (full reset - destroys gateway data) |
| `docker compose restart gateway` | Restart the gateway service only; volume preserved |
| `docker compose restart` | Restart all services |
| `docker compose stop` | Stop containers without removing them |
| `docker compose start` | Start previously stopped containers |
| `docker compose down && docker compose up -d` | Full stack restart; volume preserved |

## Logs and Inspection

| Command | What it does |
| --- | --- |
| `docker compose logs -f gateway` | Stream gateway logs live (Ctrl+C to stop) |
| `docker compose logs -f config-cleanup` | Stream config-cleanup logs live |
| `docker compose logs gateway` | Print all gateway logs to stdout |
| `docker compose logs gateway \| grep -i error` | Filter gateway logs for errors |
| `docker compose logs --tail=100 gateway` | Print last 100 lines of gateway logs |
| `docker compose ps` | Show all services, their status, and exposed ports |
| `docker compose exec gateway bash` | Open a shell inside the running gateway container |
| `docker compose exec db psql -U ignition ignition` | Open a psql session in the Ignition database |
| `docker inspect ignition-data` | Inspect the `ignition-data` volume (path, driver, labels) |

## Image Management

| Command | What it does |
| --- | --- |
| `docker compose pull` | Pull the latest version of all images (does not restart services) |
| `docker compose pull gateway` | Pull only the Ignition gateway image |
| `docker images \| grep ignition` | List locally cached Ignition images and their tags |
| `docker rmi inductiveautomation/ignition:8.3.6` | Remove a specific image version from local cache |
| `docker compose build` | Build any services with a local `build:` context (not applicable to the stock template) |

## Troubleshooting Quick-Reference

| Symptom | Command to run |
| --- | --- |
| Gateway not starting | `docker compose logs gateway` |
| config-cleanup not reverting files | `docker compose logs config-cleanup` |
| Port conflict on startup | `docker compose ps` to see what is running and which ports are bound |
| Traefik route not working | `docker compose ps` - verify the `proxy` network is up and `gateway` is healthy |
| Gateway stuck in trial mode after reset | Volume was deleted with `-v`; reactivate the license from **Config > Licensing** |
| Database connection errors in gateway logs | `docker compose logs db` - check if PostgreSQL passed its healthcheck |
| Bootstrap runs on every start | Sentinel file missing from volume; check bootstrap service logs |
| Designer cannot connect | Confirm gateway is fully started - look for `Gateway successfully started` in logs |
