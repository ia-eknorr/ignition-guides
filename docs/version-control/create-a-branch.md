---
sidebar_position: 6
---

# Create a Branch and Push Changes

## Overview

Git allows multiple features to be developed simultaneously across multiple branches. This guide covers creating branches, staging, committing, and pushing changes to the remote repository.

This loosely follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow). See [Branching Strategy](./branching-strategy.md) for more context.

## Procedure

1. Check available branches and your current branch:

    ```shell
    git branch
    ```

2. Create and switch to a new branch:

    ```shell
    # Create and checkout in one command
    git checkout -b branch-name
    ```

    :::tip
    Per the [Style Guide](./style-guide.md), avoid developing directly on `main`. Create a feature branch with a descriptive name.
    :::

3. Make edits in VS Code or the Ignition Designer.

4. Check what changed:

    ```shell
    git status
    ```

5. Stage files for commit:

    ```shell
    # Single file
    git add file-name.ext

    # All changed files
    git add .
    ```

    :::note
    This adds files to the staging area but does not commit yet. You can run `git add` multiple times before committing.
    :::

    :::tip Which files should I add?
    Commit one feature or sub-feature at a time. If `git status` shows changes you didn't intentionally make (common with Ignition `resource.json` files), stash or skip them.
    :::

6. Commit with a message:

    ```shell
    git commit -m "Brief description of change"
    ```

7. Verify a clean working tree:

    ```shell
    git status
    ```

8. Push to the remote repository:

    ```shell
    git push origin HEAD
    ```

    - `origin` — the name of the remote (set during [repo initialization](./initialize-repository.md))
    - `HEAD` — the current branch's latest commit

    :::tip Forgot the remote name?
    Run `git remote -v` to list all configured remotes.
    :::

---

**Next**: [Create a Pull Request](./create-a-pull-request.md)
