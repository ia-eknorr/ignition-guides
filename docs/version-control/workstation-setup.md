---
sidebar_position: 2
---

# Workstation Setup

Before getting started with version control, set up your workstation with the necessary software. The tools below are tried and true in the industry and will serve as a solid starting point.

## Visual Studio Code

One of the most widely used Integrated Development Environments (IDEs).

- [Downloads Page](https://code.visualstudio.com/download)

**Installation**: Run the installation wizard.

**Recommended Extensions:**

- [Git Extension Pack](https://marketplace.visualstudio.com/items?itemName=donjayamanne.git-extension-pack)
- [Markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)
- [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)

## Git

IA's preferred version control system.

**Download:**

- macOS (Homebrew)

  ```shell
  brew install git
  ```

- Windows (Winget)

  ```shell
  winget install --id Git.Git --override ""
  ```

- [Direct Download](https://git-scm.com/download/win)

:::tip What is Homebrew / Winget?
Winget is the official package manager for Windows. Homebrew is a package manager for macOS and Linux. Both simplify installing and managing software from the command line.
:::

**Installation**: Run the installation wizard. Override the default branch name to `main` — the historically used `master` has fallen out of favor.

**Configuration:**

1. Verify git installed correctly:

    ```shell
    git -v
    ```

2. Configure username and email (shown on commits and pull requests):

    ```shell
    git config --global user.name "your username"
    git config --global user.email "your email"
    ```

3. Verify:

    ```shell
    git config --global user.name
    git config --global user.email
    ```

## GitHub CLI

**Download:**

- macOS (Homebrew)

  ```shell
  brew install gh
  ```

- Windows (Winget)

  ```shell
  winget install -e --id GitHub.cli
  ```

- [Direct Download](https://cli.github.com)

**Configuration:**

1. Verify installation:

    ```shell
    gh status
    ```

2. Authenticate:

    ```shell
    gh auth login
    ```

    Follow the prompts to log in to GitHub.

More information: [GitHub Quickstart](https://docs.github.com/en/get-started/quickstart/set-up-git)

---

**Next**: [WSL Setup](./wsl-setup.md) (Windows only) or [Initialize a Repository](./initialize-repository.md)
