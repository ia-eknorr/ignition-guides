---
sidebar_position: 7
---

# Create a Pull Request

## Overview

Pull requests let others know about changes you've pushed to a branch. Once open, collaborators can discuss and review changes before they're merged into the base branch.

:::tip Pull Request vs. Merge Request
These are different terms for the same thing. GitHub uses "Pull Request"; GitLab uses "Merge Request." Git itself has no concept of either - they're features of the hosting platform.
:::

## Procedure

1. On GitHub, navigate to the main page of your repository.

2. Select the **Pull Requests** tab.
   - If you recently pushed a branch, GitHub may show a banner prompting you to create a PR. Click it.

     ![GitHub banner prompting to create a pull request](/img/version-control/new-pull-request.png)

   - Otherwise, select **New pull request**, choose your branch, and confirm the direction (feature branch → `main`).

3. Fill in the PR details:
   - **Title**: Summarize the feature in a few words
   - **Description**: Add context, a bullet list of changes, or testing notes if helpful

4. Select **Create Pull Request**.

Once created, the code needs to be reviewed before merging. On solo projects, you can review and merge yourself - but the habit of going through a PR is good practice even when working alone.

---

**Next**: [Merge a Pull Request](./merge-a-pull-request.md)
