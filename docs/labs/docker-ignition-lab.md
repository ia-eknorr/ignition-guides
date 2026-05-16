---
sidebar_position: 2
---

# Docker Lab

## Purpose

By the end of this lab, you will have started an Ignition gateway from the project-template, understand what each Docker service does during startup, made changes through the Designer and observed what Git tracks, and practiced the most common day-two operations.

## Before Getting Started

Prerequisites:

- [Version Control Lab](./version-control-lab.md) completed - you should have a repository created from project-template cloned locally and understand the git workflow
- [Workstation Setup](../getting-started/workstation-setup.md) complete (Docker Desktop running)
- [Traefik Reverse Proxy](../getting-started/traefik.md) set up and running
- `.env` file created from `.env.example` in your repository, with `GATEWAY_ADMIN_PASSWORD` (and optionally `GATEWAY_ADMIN_USERNAME`) set before bringing up the stack

If you do not have a repository created from project-template yet, complete the [Version Control Lab](./version-control-lab.md) first.

---

## Step 1: Start the Stack

From the root of your project-template repository, bring up all three services:

```shell
docker compose up -d
```

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose up -d",
  "[+] Running 4/4",
  " ✔ Network my-ignition-project_default  Created",
  " ✔ Container my-ignition-project-db-1              Started",
  " ✔ Container my-ignition-project-bootstrap-1       Started",
  " ✔ Container my-ignition-project-gateway-1         Started"
]} />

**The startup order is not random - it is enforced by `depends_on` conditions in the compose file.** Here is what happens in sequence:

1. `db` starts and begins its healthcheck loop (PostgreSQL is initializing)
2. `bootstrap` starts, seeds the `ignition-data` volume with Ignition's base files, writes the `.ignition-seed-complete` sentinel file, and exits with code 0
3. Once `bootstrap` exits successfully and `db` passes its healthcheck, `gateway` starts

:::tip Bootstrap runs only once
The sentinel file at `.ignition-seed-complete` inside the named volume is the key. On every subsequent `docker compose up`, bootstrap checks for that file, finds it, and exits immediately without re-seeding. The volume is only seeded on the very first start, or after a `docker compose down -v` wipes the volume.
:::

---

## Step 2: Watch the Gateway Start

Stream the gateway logs:

```shell
docker compose logs -f gateway
```

Scan the output for these milestones:

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose logs -f gateway",
  "gateway-1  | wrapper  | --> Wrapper Started as Console",
  "gateway-1  | wrapper  | Launching a JVM...",
  "gateway-1  | INFO   | jvm 1    | 2026-05-11 10:00:12 | Ignition Platform starting...",
  "gateway-1  | INFO   | jvm 1    | 2026-05-11 10:00:45 | Loading modules...",
  "gateway-1  | INFO   | jvm 1    | 2026-05-11 10:01:30 | Module 'com.inductiveautomation.perspective' loaded.",
  "gateway-1  | INFO   | jvm 1    | 2026-05-11 10:01:58 | Gateway successfully started."
]} />

Press `Ctrl+C` to stop following the logs once you see `Gateway successfully started`.

:::note Startup takes 60-120 seconds
This is normal. Ignition loads every module (Vision, Perspective, Reporting, Alarm Notification, and more) during startup, and each module initializes against the database. A fresh start on modest hardware commonly takes 90 seconds. **Do not assume the gateway is broken if it has not appeared after 30 seconds.**
:::

Once the logs settle, confirm all three services are running:

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose ps",
  "NAME                                   IMAGE                            COMMAND                  SERVICE          CREATED          STATUS                    PORTS",
  "my-ignition-project-bootstrap-1        ghcr.io/ia-eknorr/bootstrap      \"/bootstrap.sh\"          bootstrap        2 minutes ago    Exited (0) 2 minutes ago",
  "my-ignition-project-db-1               postgres:15                      \"docker-entrypoint.s…\"   db               2 minutes ago    Up 2 minutes (healthy)",
  "my-ignition-project-gateway-1          inductiveautomation/ignition      \"/usr/local/bin/igni…\"   gateway          2 minutes ago    Up 2 minutes (healthy)"
]} />

**`bootstrap` showing `Exited (0)` is correct and expected.** It is a one-shot service that exits after completing its work. Every other service should show `Up`.

---

## Step 3: Open the Gateway

Open your browser and navigate to:

```text
https://<GATEWAY_NAME>.localtest.me
```

Replace `<GATEWAY_NAME>` with the value you set in your `.env` file (for example, `https://my-ignition-project.localtest.me`).

:::note The self-signed certificate warning
Traefik generates a self-signed certificate for `*.localtest.me`. Your browser will show a security warning. This is expected for local development - click **Advanced** and then **Proceed** (the exact wording varies by browser). You will not see this warning in a production deployment that uses a real certificate.
:::

Log in with the username and password you set in `.env` (`GATEWAY_ADMIN_USERNAME` and `GATEWAY_ADMIN_PASSWORD`). On the gateway Status page, confirm that the gateway name at the top matches `GATEWAY_NAME` from your `.env` file.

{/* TODO: screenshot - gateway status page showing gateway name */}

**Traefik routes the `*.localtest.me` domain to the correct container based on the gateway name - no port numbers needed in the URL.** Without Traefik, you would need to expose host ports and use `http://localhost:8088`.

---

## Step 4: Observe the Bootstrap Volume Seeding

Now that the gateway is running, inspect what bootstrap did:

```shell
docker compose logs bootstrap
```

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose logs bootstrap",
  "bootstrap-1  | Checking for existing seed...",
  "bootstrap-1  | No seed found. Seeding ignition-data volume...",
  "bootstrap-1  | Copying base Ignition files...",
  "bootstrap-1  | Generating deterministic UUID from gateway name: my-ignition-project",
  "bootstrap-1  | UUID: a3f2c1d4-...",
  "bootstrap-1  | Writing sentinel file...",
  "bootstrap-1  | Seed complete. Exiting."
]} />

Peek inside the gateway container's data directory:

```shell
docker compose exec gateway ls /usr/local/bin/ignition/data/
```

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose exec gateway ls /usr/local/bin/ignition/data/",
  ".ignition-seed-complete  cache  config  db  logs  modules  projects  quarantine  temp  user-lib"
]} />

**The `.ignition-seed-complete` file is the sentinel that prevents bootstrap from re-seeding.** As long as this file exists inside the named volume, bootstrap will exit immediately on every subsequent start without touching anything.

:::tip Why deterministic UUIDs matter
Ignition's license activation is tied to the gateway's UUID. Deriving it from `GATEWAY_NAME` means a recreated volume gets the same UUID and the license can be restored without reactivation. See [The bootstrap Service](../guides/docker/compose-architecture.md#the-bootstrap-service) for full details.
:::

---

## Step 5: Open the Designer and Make a Change

Launch the Designer from the gateway homepage:

1. Click **Launch Designer** on the gateway homepage
2. Log in with your admin credentials
3. In the Tag Browser on the left, right-click on the tag provider and select **New Tag - Memory Tag**

   {/* TODO: screenshot - creating a new memory tag in the Tag Browser */}

4. Name the tag `DockerLabTest` and set the **Data Type** to `Float`
5. Click **OK** to create the tag
6. Save: **File - Save Project** (or `Ctrl+S`)

Back in your terminal, run:

```shell
git status
```

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ git status",
  "On branch main",
  "Changes not staged for commit:",
  "  (use \"git add <file>...\" to update what will be committed)",
  "  (use \"git restore <file>...\" to discard changes in working directory)",
  "        modified:   services/ignition/projects/<project-name>/com.inductiveautomation.taghistorian/allTagPaths/resource.json",
  "        modified:   services/ignition/projects/<project-name>/tags/DockerLabTest/tag.json",
  "",
  "no changes added to commit (use \"git add\" and/or \"git commit -a\")"
]} />

**The tag file appeared in `services/ignition/projects/` the moment you saved in the Designer - no export step, no manual copy.** The bind mount means the Designer writes directly to the files Git tracks.

:::tip What you are seeing
Ignition stores each tag definition as a file in the project directory. The `tag.json` file is the tag you just created. Git sees it immediately because the Designer wrote it to the bind-mounted directory on your machine's filesystem.
:::

---

## Step 6: Commit Your Tag

Stage only the projects directory:

```shell
git add services/ignition/projects/
```

Confirm what is staged:

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ git status",
  "On branch main",
  "Changes to be committed:",
  "  (use \"git restore --staged <file>...\" to unstage)",
  "        modified:   services/ignition/projects/<project-name>/tags/DockerLabTest/tag.json",
  "",
  "nothing to commit, working tree clean"
]} />

**This is the intended workflow: changes inside `projects/` represent intentional work that should be committed.**

Commit:

```shell
git commit -m "add DockerLabTest memory tag"
```

---

## Step 7: Restart and Verify Persistence

Restart the gateway to confirm the tag survives a restart:

```shell
docker compose restart gateway
```

Follow the logs until the gateway is back up:

```shell
docker compose logs -f gateway
```

Wait for `Gateway successfully started`, then open the Designer again and check the Tag Browser. The `DockerLabTest` tag is still there.

{/* TODO: screenshot - DockerLabTest tag visible in Tag Browser after restart */}

**The tag persists because it lives in `services/ignition/projects/` on your machine's filesystem - not inside the Docker volume.** Restarting the container does not touch bind-mounted files. The named volume holds runtime state (module caches, the database WAL); your project files live in git.

:::tip Restart vs. down/up
`docker compose restart gateway` stops and restarts only the gateway container. The `ignition-data` volume and the database are untouched. Use this for day-to-day operations when you need the gateway to reload a changed module or pick up a gateway script change.
:::

---

## Step 8: Full Reset

Run a full teardown with volume removal:

```shell
docker compose down -v
```

<Terminal title="bash — ~/my-ignition-project" lines={[
  "$ docker compose down -v",
  "[+] Running 5/5",
  " ✔ Container my-ignition-project-gateway-1         Removed",
  " ✔ Container my-ignition-project-db-1              Removed",
  " ✔ Container my-ignition-project-bootstrap-1       Removed",
  " ✔ Volume my-ignition-project_ignition-data        Removed",
  " ✔ Volume my-ignition-project_db-data              Removed"
]} />

The `-v` flag removes named volumes. The `ignition-data` volume (which held the seeded Ignition installation, module cache, and license activation) and the `db-data` volume (PostgreSQL data) are both gone.

Start the stack again:

```shell
docker compose up -d
```

Wait for startup, then open the Designer. The `DockerLabTest` tag is still there.

**`down -v` deletes volumes but does not touch git-tracked files.** The bind-mounted `services/ignition/projects/` directory is on your machine's disk - Docker never owns it. When the gateway starts fresh, the bind mount re-applies your committed project files and the tag is back.

:::warning What `down -v` does delete
The named volume holds things that cannot be recovered from git: module license activations, alarm journal history stored in the volume, and any runtime data not bound to a git-tracked directory. After a `down -v`, the gateway starts as if it were a brand-new installation - you may need to re-activate your license. Use `down -v` only when you intentionally want a clean slate.
:::

:::danger Never run `down -v` on a production gateway
On a production system, the named volume holds your alarm journal, transaction group data, and other runtime state that is not tracked in git. A `docker compose down -v` on production is a destructive operation with no undo.
:::

---

## What You Built

You started a three-service Ignition stack from scratch, watched each service fulfill its role in the startup sequence, and made a change through the Designer and saw it appear immediately in git.

You also verified the core architectural guarantee: **git-tracked files survive a full volume reset**. The bind-mounted `projects/` directory is not inside Docker's storage - it is on your filesystem, in your repository. Docker volumes hold runtime state; git holds configuration.

### The workflow you practiced

| Action | Command |
| --- | --- |
| Start the stack | `docker compose up -d` |
| Stream gateway logs | `docker compose logs -f gateway` |
| Check all service states | `docker compose ps` |
| Restart the gateway | `docker compose restart gateway` |
| Full reset (delete volumes) | `docker compose down -v` |
| Stage only project changes | `git add services/ignition/projects/` |

### Next steps

- Read [The Compose Architecture](../guides/docker/compose-architecture.md) for a detailed walkthrough of every service, every flag, and why they are configured the way they are
- Read [Volume Strategy](../guides/docker/volume-strategy.md) to understand the full picture of what lives in named volumes versus bind mounts
- Continue to the Containerization lab for more advanced operations: custom module installation, gateway network setup, and multi-gateway compose stacks
