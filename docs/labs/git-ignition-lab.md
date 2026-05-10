---
sidebar_position: 10
---

# Hands-On Lab

## Purpose

A getting-started tutorial for those new to Git version control with Ignition 8.3. By the
end, you'll have a working Docker-based Ignition project tracked in Git, with a full
commit-and-PR workflow under your belt.

:::tip Official Reference
This lab follows the [Additive Approach](https://docs.inductiveautomation.com/docs/8.3/tutorials/version-control-guide#curated-configuration-mounts-additive-approach)
described in the Ignition 8.3 Version Control Guide. The key idea: instead of tracking the
entire Ignition data directory and ignoring what you don't want, you selectively mount only
the directories you care about into the container. Git only sees those directories.
:::

## Before Getting Started

Ensure the following are set up:

- [Workstation Setup](../getting-started/workstation-setup.md) complete (Git, GitHub CLI, VS Code, Docker Desktop)
- GitHub account with SSH or HTTPS access configured

---

## Step 1: Fork and Clone the Template

The `ia-eknorr/project-template` gives you a pre-configured Ignition 8.3 Docker project
with the right bind mounts already in place.

1. Go to [github.com/ia-eknorr/project-template](https://github.com/ia-eknorr/project-template)
2. Click **Use this template** → **Create a new repository**
3. Name it (e.g., `my-ignition-project`), choose a visibility, and create it
4. Clone your new repo and open it in VS Code:

   ```shell
   git clone <your-repo-url>
   code <repo-folder>
   ```

:::tip Why not just clone the template?
Using "Use this template" creates a fresh repository on your GitHub account with no fork
relationship and a clean commit history. If you cloned directly you would not be able to
push to GitHub without changing the remote.
:::

---

## Step 2: Configure the Environment

The template uses a `.env` file for per-machine configuration.

1. Copy the example file:

   ```shell
   cp .env.example .env
   ```

2. Open `.env` in VS Code and set `GATEWAY_NAME` to something short and meaningful
   (e.g., `dev-gw`). This becomes the Docker container name.

3. Review `docker-compose.yml`. The two key volume mounts are:

   ```yaml
   volumes:
     - ./services/ignition/projects:/usr/local/bin/ignition/data/projects
     - ./services/ignition/config:/usr/local/bin/ignition/data/config
   ```

   These two directories in your repo are bind-mounted directly into the container. Changes
   you make in the Designer appear instantly in `services/ignition/projects/` - no export
   step needed. This is the additive approach in action.

:::note
The `.env` file is in `.gitignore` by default. Environment-specific values (gateway name,
credentials, ports) should never be committed. Share configuration through `.env.example`
instead.
:::

---

## Step 3: Start the Gateway

```shell
docker compose up -d
```

Watch the logs until the gateway is healthy:

```shell
docker compose logs -f gateway
```

You'll see `Gateway started successfully` when it's ready. Then open
[http://localhost:8088](http://localhost:8088) in your browser.

If this is the first startup, complete the commissioning wizard:

1. Accept the license agreement
2. Set an admin username and password
3. Select **Standard Edition** (or your licensed edition)

![Gateway Homepage](/img/lab/ignition-quickstart.png)

:::tip Common startup issues

- Port 8088 in use: stop any other running Ignition instances, or change `GATEWAY_HTTP_PORT` in `.env`
- Gateway not healthy after 2-3 minutes: run `docker compose logs gateway` to see what's wrong
- On Windows: make sure Docker Desktop is running before running `docker compose up`

:::

---

## Step 4: Create a Project in the Designer

1. On the gateway homepage, click **Launch Designer**
2. Log in with the admin credentials you set during commissioning
3. Click **New Project**, give it a name (e.g., `my_project`), and open it
4. In the Project Browser, right-click **Views** and add a new view
5. Drag a **Label** component onto the view and change its text to something recognizable
6. Save: **File → Save and Publish** (or `Ctrl+S`)

![Creating a New View](/img/lab/new-view-ignition.png)

---

## Step 5: See the Changes in Git

Back in VS Code, open the integrated terminal and run:

```shell
git status
```

The new project files appear under `services/ignition/projects/my_project/`. This is the
bind mount at work - no export or copy was needed.

![git status showing new project files](/img/lab/git-status.png)

Run `git diff` on one of the files to see what changed:

```shell
git diff HEAD services/ignition/projects/my_project/
```

:::tip What are all these files?
Ignition stores each resource as a pair of files:

- `resource.json` - metadata (resource type, scope, documentation)
- A content file - `view.json` for Perspective views, `.py` for scripts, etc.

These are human-readable JSON/text files, which is what makes them useful to track in Git.
You can diff them, review them in a PR, and see exactly what changed and why.
:::

---

## Step 6: Review the .gitignore

Open `.gitignore` in VS Code. The template pre-configures these exclusions:

```text
# Local config - environment-specific, do not share
**/config/local
**/config/resources/local

# Conversion artifacts
**/conversion-report.txt
**/.resources/
```

Because the additive approach only mounts specific directories into the container, Git never
sees runtime artifacts, database files, logs, or certificates - they live inside the Docker
volume, completely outside the repo. This keeps the `.gitignore` short.

See the [Git Style Guide](../reference/git-style-guide.md#ignition-gitignore-reference)
for the full pattern reference including host install patterns.

---

## Step 7: Stage, Commit, and Push

Create a feature branch for your changes (do not commit directly to `main`):

```shell
git checkout -b feature/add-initial-view
```

Stage the project directory and commit:

```shell
git add services/ignition/projects/
git commit -m "feat: add initial perspective view"
```

Push to GitHub:

```shell
git push -u origin HEAD
```

![git push output with PR link](/img/lab/new-branch-push.png)

:::tip Commit message style
Using prefixes like `feat:`, `fix:`, and `chore:` (Conventional Commits) makes it easy to
scan history at a glance. See the [Style Guide](../reference/git-style-guide.md) for conventions.
:::

---

## Step 8: Create a Pull Request

After pushing, Git prints a URL to create a pull request. Open it, or navigate to the
**Pull Requests** tab on GitHub.

![New PR banner on GitHub](/img/lab/feature-to-main.png)

1. Review the file diff - you should see the view JSON you just created
2. Add a title and a short description
3. Select **Create Pull Request**

   On a solo project, you can review and merge it yourself. Building this habit now makes
   collaboration on a team seamless.

   ![Pull Request Page](/img/lab/pull-request-page.png)

4. Select **Squash and merge** to keep a clean commit history on `main`

---

## Step 9: Pull Changes Locally

After merging, bring `main` up to date:

```shell
git checkout main
git pull origin main
```

![git pull output](/img/lab/pull-remote-changes.png)

Your local `main` now matches the remote. Start the next feature with a new branch off `main`.

---

## Common Docker Operations

| Command | What It Does |
| --- | --- |
| `docker compose up -d` | Start the stack (background) |
| `docker compose down` | Stop the stack |
| `docker compose down -v` | Stop and remove volumes (full reset) |
| `docker compose ps` | View running services and health |
| `docker compose logs -f gateway` | Stream gateway logs |
| `docker compose exec gateway bash` | Open a shell inside the gateway container |
| `docker compose restart gateway` | Restart the gateway |

---

## Common Git Errors

- **Untracked file you don't want to commit**: `git rm --cached path/to/file` removes it from
  staging without deleting the file, then add it to `.gitignore`
- **Merge conflict**: Pull the destination branch into your branch
  (`git pull origin main`), resolve `>>>` markers in VS Code, commit, and push
- **Accidentally committed to `main`**: Create a branch from `main` with your changes
  (`git checkout -b my-branch`), then reset `main` to the previous commit
  (`git reset --hard HEAD~1`)
- **Need to find a lost commit**: `git reflog` shows the full history of where HEAD has been

---

## Additional Resources

- [Ignition 8.3 Version Control Guide](https://docs.inductiveautomation.com/docs/8.3/tutorials/version-control-guide) - Official IA reference
- [Additive Approach](https://docs.inductiveautomation.com/docs/8.3/tutorials/version-control-guide#curated-configuration-mounts-additive-approach) - The bind-mount strategy used in this lab
- [Version Control Guide](../guides/version-control/intro.md) - Git basics and branching strategies
- [Git Style Guide](../reference/git-style-guide.md) - Naming conventions and commit standards
