---
sidebar_position: 4
---

# Windows Setup Notes

This page covers Windows-specific setup steps and common gotchas for engineers using Git
and Ignition on Windows.

## Docker Desktop

Docker Desktop for Windows handles Docker natively - WSL is not required to run the
Ignition Docker stack. If you installed Docker Desktop per the
[Workstation Setup](./workstation-setup.md) guide, you are ready to go.

:::tip WSL 2 Backend
Docker Desktop uses the WSL 2 backend by default on Windows, which improves performance.
You can verify this in Docker Desktop → Settings → General → "Use the WSL 2 based engine."
:::

## Git Line Endings

Windows and macOS/Linux use different line endings. Git can convert them automatically.

Run this after installing Git:

```shell
git config --global core.autocrlf true
```

This converts LF → CRLF on checkout and CRLF → LF on commit, preventing line-ending
noise in diffs when collaborating with Mac/Linux users.

:::note
If your project has a `.gitattributes` file that explicitly sets line endings, that takes
precedence over this setting.
:::

## Long File Paths

Windows limits file paths to 260 characters by default. Enable long path support to
avoid errors with deeply nested Ignition project structures:

```shell
git config --global core.longpaths true
```

Also enable long paths in Windows:

1. Open **Group Policy Editor** (`gpedit.msc`)
2. Navigate to: Local Computer Policy → Computer Configuration → Administrative Templates → System → Filesystem
3. Enable **"Enable Win32 long paths"**

Or via PowerShell (run as Administrator):

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## Optional: WSL for a Linux Shell

If you prefer working in a Linux environment on Windows (bash, Linux CLI tools), WSL is still
a good option. Install it from PowerShell:

<Terminal title="PowerShell" lines={[
  "$ wsl --install",
  "Installing: Windows Subsystem for Linux",
  "Windows Subsystem for Linux has been installed.",
  "Installing: Ubuntu",
  "Ubuntu has been installed.",
  "The requested operation is successful. Changes will not be effective until the system is rebooted.",
]} />

Then install Git inside WSL and use it from VS Code's integrated terminal (with the
[Remote - SSH extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)).
Docker commands from WSL will reach Docker Desktop automatically if WSL integration is
enabled in Docker Desktop settings.
