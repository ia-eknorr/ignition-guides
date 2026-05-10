---
sidebar_position: 4
---

# Initialize a Local Repository

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
   2. Run:

        ```shell
        git remote add origin <repository-link>
        ```

      :::note
      The convention is to name the remote `origin`. A local repository can have multiple remotes - `upstream` is conventionally used for the original repo when working with forks.
      :::

The local repository is now linked with the remote and ready to accept changes.

---

**Next**: [Branching Strategy](./branching-strategy.md)
