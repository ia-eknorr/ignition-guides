---
sidebar_position: 1
---

# Basics of Git

## Purpose

Learn how to use version control with Git and Ignition.

## How to Use This Guide

This guide can be read from top to bottom to learn the basics of Git and gain intermediate strategies, or used as a reference for specific commands and workflows.

If you're new to Git with Ignition, start with the [Hands-On Lab](../../labs/git-ignition-lab.md) to get practical experience with the version control workflow.

## Overview

### What Is Git?

Git is a version control system that helps developers keep track of changes to their code over time.

### Why Use Version Control?

It allows multiple developers to work on the same project simultaneously, tracks changes to source code and other files, and provides tools for managing different versions of files, merging changes, and rolling back changes when necessary.

### Why Is Version Control Important?

Version control allows a team to:

- Track all of the changes made to the project
- View who made changes
- Merge changes without overwriting other features
- Revert accidentally deleted work
- Provide context into why a certain decision was made and who made it

## Terms

| **Keyword** | **Description** |
| --- | --- |
| `Branch` | Pointer to a commit |
| `Cache` | Local memory intended to temporarily store uncommitted changes |
| `CLI` | Command Line Interface |
| `Commit` | Stores the current contents of the index in a new commit along with a log message |
| `Directory` | Folder in file system |
| `HEAD` | Pointer to the most recent commit on the current branch |
| `Index` | The cache where changes are stored before they are committed |
| `Local Repository` | Where you keep your copy of a Git repository on your workstation |
| `Main` | Default name of the first branch |
| `Merge` | Joining two or more commit histories |
| `Pull Request` | GitHub-specific term to let others know about changes you've pushed to a branch |
| `Remote Repository` | A repository where you push changes for collaboration or backup |
| `Stash` | Another cache, acting as a stack, where changes can be stored without committing |
| `Working tree` | Current branch in your workspace |

## Common Git Commands

| **Command** | **Description** |
| --- | --- |
| `add` | Track files |
| `branch` | List branches |
| `checkout` | Create a new branch or switch to another |
| `clone` | Download a remote repository |
| `commit` | Save files to local branch |
| `config` | Configure Git settings |
| `remote` | Configure or list remote repositories |
| `merge` | Merge another branch into the current branch |
| `pull` | Fetch and merge changes from remote |
| `push` | Send committed changes to remote |
| `status` | List changed files |

```bash
git status
git checkout my-branch
git pull origin main
```

## Common Shell Commands

| **Command** | **Description** |
| --- | --- |
| `cd` | Change directory |
| `ls` | List files in current directory |
| `mkdir` | Make new directory |
| `pwd` | Print working directory |

---

**Next**: [Workstation Setup](./workstation-setup.md)
