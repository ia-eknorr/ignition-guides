---
sidebar_position: 3
---

# WSL Setup (Windows Only)

This guide covers installing Windows Subsystem for Linux (WSL) and Docker inside WSL for Ignition development on Windows.

## Install WSL

:::note
If you already have Docker Desktop, WSL may already be installed. Follow the steps below to check.
:::

1. Launch Command Prompt (`Win+R`, then type `cmd`)
2. Check current WSL state:

    ```bash
    wsl -l -v
    ```

3. If WSL is already installed, skip to step 5. Otherwise:

    ```bash
    wsl --install
    ```

4. Install Ubuntu:

    ```bash
    wsl --install -d Ubuntu
    ```

5. Restart your computer.
6. Download the [WSL 2 Kernel Update Package](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi) and run it.
7. Set WSL 2 as default:

    ```bash
    wsl --set-version Ubuntu 2
    ```

8. Update the kernel:

    ```bash
    wsl --update
    ```

9. Set up Ubuntu credentials:

    ```bash
    wsl
    ```

    :::note
    The password entry prompt will not show characters as you type.
    :::

## Program Installation

Install the following:

1. [Visual Studio Code](https://code.visualstudio.com/Download) with these extensions:
   - [Remote Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
   - [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
   - [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)

2. [Git for Windows](https://gitforwindows.org/) — select "Use Visual Studio Code" as the default editor during installation.

## Install Docker Inside WSL Ubuntu

:::warning
All commands in this section must be run in WSL Ubuntu.
:::

In VS Code, open a terminal panel with `` CTRL+Shift+` `` and verify the `>` icon shows `wsl`.

1. Update package list:

    ```bash
    sudo apt update
    ```

2. Install Docker:

    ```bash
    sudo apt install docker.io -y
    ```

3. Verify:

    ```bash
    docker --version
    ```

### Configure Docker to Launch at Startup

1. Open the sudoers file: `sudo visudo`
2. Add to the end (replace `yourusername` with your Ubuntu username):

    ```bash
    yourusername ALL=(ALL) NOPASSWD: /usr/bin/dockerd
    ```

3. Save and exit (`CTRL+X`, `Y`, `ENTER`)
4. Open bash config: `code ~/.bashrc`
5. Add to the end:

    ```bash
    RUNNING=`ps aux | grep dockerd | grep -v grep`
    if [ -z "$RUNNING" ]; then
        sudo dockerd > /dev/null 2>&1 &
        disown
    fi
    ```

6. Add your user to the docker group:

    ```bash
    sudo usermod -aG docker $USER
    ```

7. Close and reopen VS Code.
8. Verify: `docker ps` should return a header row with no errors.

### Install Docker Compose

```bash
sudo curl -kL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

**Next**: [Initialize a Repository](./initialize-repository)
