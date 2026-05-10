---
sidebar_position: 9
---

# Git Style Guide

## Purpose

Define a style guide for using version control with Git in Ignition projects - naming for repositories, branches, commits, and pull requests.

## Quick Reference

### Repository Setup

| Item | Style |
| :---: | :---: |
| Name | `my-repository-name` |
| Description | `A brief description of the repository` (required) |

### Branches

| Branch | Style |
| :---: | :---: |
| Default | `main` |
| Development | `dev` |
| Release | `release` |
| Feature | `username/my-new-feature` |
| Bug Fix | `username/my-bug-fix` |

### Commits

| Item | Style |
| :---: | :---: |
| Message | `Brief Commit Description` |

### Merges

| Item | Style |
| :---: | :---: |
| Merge Type | Merge commit or Squash |

---

## Repository Setup

### Name

`my-repository-name`

Lowercase with dashes separating words. Should clearly communicate the repo's purpose.

- ✅ `ignition-database-frontend`, `this-client-test-env`
- ❌ `test`, `test-2`, `repothatneedsdelimiters`

### Description

Required. Should expand on the name and give a high-level purpose. Another engineer reading it should understand what to expect in the codebase.

### Public vs. Private

Both are acceptable depending on intent.

**Good public repos**: quickstart projects, collaborative work, team resources  
**Good private repos**: learning repos, testing, anything unfinished

### README

Recommended. Can be added in the initial commit if not created on GitHub.

### .gitignore

`None` by default - add from VS Code during the initial commit.

---

## Branches

All branches should be lowercase with dashes separating words.

### Default Branches

- `main` - production/stable. No direct commits.
- `dev` - active development (GitFlow)
- `release` - release candidate staging (GitFlow)

### Feature Branches

`username/my-new-feature`

Start with your username to differentiate from teammates, followed by a short (1–4 word) description.

- ✅ `eknorr/add-test-script`, `jsmith/fix-readme-typos`

### Delete After Merging

Feature branches should be deleted after merging. Enable **automatic branch deletion** in GitHub repository settings.

---

## Commits

Each commit must have a message (`git commit -m "<message>"`).

Some teams prepend a category: `Feature:`, `Chore:`, `Bugfix:`. This helps visually scan history.

An alternative is [Conventional Commits](https://www.conventionalcommits.org/), a formal
specification for commit messages:

- `feat: add motor faceplate component`
- `fix: broken binding on Main Views/plant`
- `chore: clean up myScripts/general`
- `docs: update README with setup instructions`

Both styles work. Pick one and be consistent within a project. Conventional Commits pairs
well with automated changelog tools.

:::note
If it's hard to summarize your work in one line, that's often a sign the commit is too large. Break it into smaller, focused commits.
:::

### Good Commit Messages

- `Feature: Developed motor faceplate`
- `Chore: Cleaned up myScripts/general`
- `Fixed broken binding on Main Views/plant`

### Bad Commit Messages

- `Added style class and applied it to my view and added docstrings to myScripts/general` - too many things
- `Built screens` - not descriptive enough

---

## Merges

- All merges must be done via Pull Request
- Recommended strategies:
  - **Merge Commit**: branches with few commits
  - **Squash and Merge**: branches with many commits (cleaner history)

## Ignition .gitignore Reference

When using the additive approach (bind-mounted `services/ignition/` directories), the `.gitignore`
stays short because only mounted directories are visible to Git.

Recommended patterns for an Ignition 8.3 Docker project:

```text
# Local config - environment-specific, should not be shared
**/config/local
**/config/resources/local

# Conversion artifacts
**/conversion-report.txt
**/.resources/

# Vision (if not using Vision)
com.inductiveautomation.vision/
```

For host installs or full data directory mounts, additional patterns may be needed. See the
[Ignition 8.3 Version Control Guide](https://docs.inductiveautomation.com/docs/8.3/tutorials/version-control-guide)
for the full reference.

See the [Hands-On Lab](../labs/git-ignition-lab.md) for a walkthrough of this structure in practice.
