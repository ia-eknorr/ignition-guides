---
sidebar_position: 4
---

# Initialize a Local Repository

:::tip Using Docker?
If you are using the `ia-eknorr/project-template` Docker setup, skip this page. The template already includes a pre-initialized repository structure. Fork the template on GitHub and clone it instead of following the steps below.
:::

## Procedure

1. Navigate to the project directory (create it if needed):

    ```shell
    cd /Your/File/Path
    mkdir Repository-Folder
    cd Repository-Folder
    ```

2. Initialize the repository:

    ```shell
    git init -b main
    ```

    :::note
    This names the default branch `main`. Historically `master` was used, but `main` is now the convention.
    :::

3. Create a remote repository on [GitHub](https://github.com) if one doesn't exist yet.
   - See: [GitHub - Creating a Repo](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories)

4. Link the local repository to the remote:
   1. Navigate to the remote repository page and copy the repository link.

      ![Repository link location on GitHub](/img/version-control/repository-link.png)

   2. Run:

        ```shell
        git remote add origin <repository-link>
        ```

      :::note
      The convention is to name the remote `origin`. A local repository can have multiple remotes - `upstream` is conventionally used for the original repo when working with forks.
      :::

The local repository is now linked with the remote and ready to accept changes.

## Ignition 8.3 Directory Structure

In Ignition 8.3, project and configuration files are stored on the filesystem (not in a SQLite database), making them directly trackable with Git.

When using Docker with the `ia-eknorr/project-template`:

| Directory | What it Contains |
| --- | --- |
| `services/ignition/projects/` | Ignition projects (tracked) |
| `services/ignition/config/` | Gateway configuration (tracked) |
| `data/` (Docker volume) | Runtime data - not tracked |

### Recommended .gitignore

Add this to your `.gitignore` for an Ignition 8.3 project:

```text
# Runtime and database files
**/db/
**/metricsdb/
**/valueStore.idb
**/jar-cache/

# Local config and secrets
**/config/local
**/config/resources/local
**/certificates/
**/keystore/

# Logs and temp files
*.log
*.tmp
*.bak

# Project artifacts
conversion-report.txt
.resources/

# Vision (if not using Vision)
com.inductiveautomation.vision/
```

For a host install (non-Docker), track the `data/projects/` directory directly and apply the same ignore patterns.
