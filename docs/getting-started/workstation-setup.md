---
sidebar_position: 2
---

# Workstation Setup

These tools are used across all guides on this site. Set them up once here - individual guides will reference this page for prerequisites rather than repeating these steps.

## Visual Studio Code

One of the most widely used Integrated Development Environments (IDEs).

- [Downloads Page](https://code.visualstudio.com/download)

**Installation**: Run the installation wizard.

**Recommended Extensions:**

- [Git Extension Pack](https://marketplace.visualstudio.com/items?itemName=donjayamanne.git-extension-pack)
- [Markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)

## Docker Desktop

Required for running Ignition locally via Docker Compose.

- [Downloads Page](https://www.docker.com/products/docker-desktop/)

**Installation**: Run the installation wizard. On Windows, enable the WSL 2 backend when prompted.

:::tip Already using Docker?
If Docker Desktop is already installed, skip this step. Run `docker --version` to confirm.
:::

## Git

The version control system used across all guides.

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

**Installation**: Run the installation wizard. Override the default branch name to `main` - the historically used `master` has fallen out of favor.

**Configuration:**

1. Verify git installed correctly:

    <Terminal title="bash — ~" lines={[
      "$ git -v",
      "git version 2.47.1",
    ]} />

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

    ![GitHub CLI configuration](/img/version-control/gh-configuration.png)

2. Authenticate:

    ```shell
    gh auth login
    ```

    Follow the prompts to log in to GitHub.

    ![GitHub auth login](/img/version-control/gh-auth-login.png)

More information: [GitHub Quickstart](https://docs.github.com/en/get-started/quickstart/set-up-git)

## Windows Users

If you are on Windows, review [Windows Setup Notes](./windows-setup.md)
for Git line-ending configuration and long-path settings.
