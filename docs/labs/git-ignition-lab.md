---
sidebar_position: 10
---

# Hands-On Lab

## Purpose

A _Getting Started_ tutorial for those new to Git version control with Ignition. By the end, you'll have a basic understanding of how to set up Git with Ignition and the workflow to start tracking your codebase.

## Before Getting Started

Ensure the following are set up:

- [Workstation Setup](../guides/version-control/workstation-setup.md) complete (Git, GitHub CLI, VS Code)
- [Ignition](https://inductiveautomation.com/downloads/) installed (Docker container or host install)

---

## Set Up the Ignition Gateway

1. Commission and start the Ignition Gateway
2. Select **Yes, Enable Quick Start**

![Gateway Startup Page](/img/lab/ignition-quickstart.png)

---

## Initialize Repository

### Open the Project in VS Code

1. Select **File → Open Folder** and open the Ignition project from the `data/projects` folder
   - Example: `<ignition-install-path>/data/projects/quickstart`
2. Right-click the project in the Explorer and select **Open in Integrated Terminal**

![Integrated Terminal](/img/lab/integrated-terminal.png)

Verify you're in the correct directory:

```shell
pwd
```

- Mac: `/usr/local/ignition/data/projects/samplequickstart`
- Windows: `C:\Program Files\Inductive Automation\Ignition\data\projects\samplequickstart`

### Configure Git Identity

```shell
git config --global user.name "YourUserName"
git config --global user.email "your@email.addr"
```

### Add .gitignore

Create a `.gitignore` file at the top level of your project:

```
# Ignition Vision Content
com.inductiveautomation.vision
```

![gitignore](/img/lab/gitignore.png)

This ignores Ignition's resource files that change frequently and don't need to be tracked.

:::note
`.gitignore` files are very useful. You may also want to exclude:
- `com.inductiveautomation.vision/` - if your project doesn't use Vision
- `.DS_Store` - macOS viewing preferences
- `*.code-workspace` - VS Code workspace files
- `.vscode/` - VS Code config files
- `__pycache__/`, `.jython_cache`, `*.pyc` - Python caches
:::

### Create a Remote Repository

1. On GitHub, create a new repository. See the [Style Guide](../reference/git-style-guide.md) for naming conventions.
2. Copy the repository link.

### Initialize and Push

```shell
git init .
git remote add origin <your-repository-link>
git add .
git commit -m "Initial commit"
git push -u origin main
```

What each command does:
- `git init` - initializes the repository
- `git remote add origin <link>` - links local repo to GitHub
- `git add .` - stages all files
- `git commit -m "Initial commit"` - creates the first commit
- `git push -u origin main` - pushes to remote and sets upstream tracking

![Initial Commit on Repo](/img/lab/initial-commit.png)

---

## Develop a New Feature

1. Create a new branch:

    ```shell
    git checkout -b feature/change-background-color
    ```

2. Open the Ignition Designer and create a new view called `example_view`.

![Creating a New View](/img/lab/new-view-ignition.png)

3. Edit the background color (e.g., change it to red).

![Edited View](/img/lab/edited-view.png)

4. Save in the Ignition Designer, then return to the terminal.

5. Check what changed:

    ```shell
    git status
    ```

![Results from git status](/img/lab/git-status.png)

:::tip Unexpected files in git status?
Ignition's `resource.json` files can update when a view is opened even without changes. To stash a file you don't want to commit:

```shell
git stash push path/to/file
```
:::

6. Stage and commit:

    ```shell
    git add .
    git commit -m "Feature: Changed background color"
    ```

7. Push to remote:

    ```shell
    git push -u origin HEAD
    ```

![Results from git push](/img/lab/new-branch-push.png)

---

## Submit a Pull Request

1. Find the PR link in the terminal output after pushing:

![Pull request link](/img/lab/new-branch-push-link.png)

   Or navigate to the **Pull Requests** tab on GitHub and use the orange banner for your recent push.

![New Feature to Main](/img/lab/feature-to-main.png)

![Pull Request Page](/img/lab/pull-request-page.png)

2. Add a short description of the changes.
3. Select **Create Draft Pull Request** to review first.
4. Select **Ready for review**, then **Merge pull request**.

---

## Update Your Local Repository

After merging, bring `main` up to date locally:

```shell
git checkout main
git pull origin main
```

![Pull Remote Changes](/img/lab/pull-remote-changes.png)

Your local `main` now matches the remote. Start the next feature with a new branch.

:::tip This feels like a lot. Is it always this involved?
With repetition it becomes second nature and takes only seconds. A "feature" in practice could encompass many related changes - the overhead is worthwhile once you've had to recover from a merge gone wrong.
:::

---

## Common Errors

- **Unneeded file in commit**: `git rm --cached file_name` removes it from staging without deleting the file
- **Merge conflict**: Pull the destination branch into your branch (`git pull origin main`), resolve `>>` markers, commit, and push
- **Accidentally deleted file**: `git checkout origin/main path/to/deleted/file`
- **Need to reset to a previous commit**: `git reset <commit-id>` (find the ID with `git reflog`)

---

## Additional Resources

- [Inductive Automation Deployment Best Practices](https://www.inductiveautomation.com/resources/article/ignition-8-deployment-best-practices#gitlab-example)
- [Version Control Guide](../guides/version-control/intro.md)
