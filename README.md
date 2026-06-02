# Automated Workflow 🚀

[![CI Status](https://github.com/7obyGit/aw/actions/workflows/pull-request.yml/badge.svg)](https://github.com/7obyGit/aw/actions)
[![npm version](https://img.shields.io/npm/v/@7obygit/aw.svg)](https://www.npmjs.com/package/@7obygit/aw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`aw` is a powerful CLI tool designed to find and execute scripts across your projects. It unifies your workflow by automatically discovering scripts from multiple sources, including NPM, Python, Java, .NET, and CI pipelines, providing a single beautiful interface to run them all.

---

## 📦 Installation

Get up and running with a single command:

```bash
npm install -g @7obygit/aw
```

### Other Options

- **From Source**:
  ```bash
  git clone https://github.com/7obyGit/aw.git
  cd aw
  npm install -g .
  ```
- **Local Development**:
  ```bash
  npm link
  ```

---

## ⚡ Quick Start

Simply run `aw` in any project directory to see a summary of available scripts:

```bash
aw
```

1. **List** all discovered scripts:
   ```bash
   aw list scripts
   ```
2. **Find** a specific script:
   ```bash
   aw find build
   ```
3. **Run** a script (optionally pass arguments):
   ```bash
   aw run <script-name> -- --port 3000
   ```

---

## ✨ Features

- 🔍 **Auto-Discovery**: Instantly finds scripts in `.aw`, `package.json`, `pyproject.toml`, `pom.xml`, `build.gradle`, `.csproj`, `Makefile`, `docker-compose.yml`, `Cargo.toml`, `go.mod`, `Taskfile.yml`, `Justfile`, and more.
- 🌍 **Smart Environment**: Automatically loads `.env` files from your project root to CWD, merging variables
  intelligently.
- 🛠️ **Unified Interface**: One command to rule them all. No more switching between `npm run`, `poetry run`, `make`, or `cargo`.
- 🚀 **Argument Passing**: Pass additional arguments directly to the underlying scripts using `aw run <name> -- <args>`.
- ⌨️ **Shell Completion**: Tab-completion support for Bash, Zsh, and Fish.
- 🤖 **Local CI Runner**: Run your GitHub Actions or GitLab CI jobs locally using `act` or `gitlab-ci-local`.
- 📋 **Command Recording**: Record your terminal sequences and save them as reusable scripts with `aw record`.
- 🔗 **JSON Support**: Pipeline-friendly output for every command with the `--json` flag.
- 🎨 **Beautiful UI**: Uses modern interactive prompts for a clean and efficient experience.

---

## 📖 Script Sources

`aw` intelligently scans your working directory for the following:

| Source | Description                                                                              |
| :--- |:-----------------------------------------------------------------------------------------|
| **Local `.aw`** | Project-specific scripts and manual overrides (scans up the directory tree).             |
| **NPM** | Automatically pulls all scripts defined in `package.json`.                               |
| **Makefile** | Automatically finds targets in `Makefile` or `makefile`.                                 |
| **Docker Compose** | Standard commands (`up`, `down`, `ps`, etc.) for `docker-compose.yml` or `compose.yaml`. |
| **Cargo (Rust)** | Common `cargo` commands (`build`, `run`, `test`, etc.) when `Cargo.toml` is present.     |
| **Go** | Common `go` commands (`build`, `run`, `test`, etc.) when `go.mod` is present.             |
| **Taskfile** | Discovers tasks in `Taskfile.yml` or `Task.yml`.                                         |
| **Justfile** | Discovers recipes in `Justfile`.                                                         |
| **Python** | Support for `poetry` and `uv` scripts defined in `pyproject.toml`.                       |
| **Java** | Support for standard Java Maven (`pom.xml`), and Gradle (`build.gradle`/`.kts`).         |
| **.NET** | Discovers standard tasks (`build`, `test`, `watch`, etc.) in `.csproj` and `.sln` files. |
| **Shell Scripts** | Finds standalone `.sh` (Unix), `.bat`/`.cmd` (Windows), and `.ps1` (PowerShell).         |
| **CI Pipelines** | Discovers GitHub Actions (via `act`) and GitLab CI (via `gitlab-ci-local`) jobs.         |

---

## 🌍 Environment Variables

`aw` provides several built-in environment variables to scripts it executes, allowing them to be aware of the `aw` context.

### Built-in Variables (Always Available)

| Variable | Description |
| :--- | :--- |
| `AW` | Always set to `true` when running under `aw`. |
| `AW_VERSION` | The current version of the `aw` CLI. |
| `AW_BIN` | The absolute path to the `aw` executable. |
| `AW_CWD` | The working directory where `aw` was invoked. |

### Script-Specific Variables (Available during `aw run`)

| Variable | Description |
| :--- | :--- |
| `AW_SCRIPT_NAME` | The name of the script being executed. |
| `AW_SCRIPT_PATH` | The full path to the script file. |
| `AW_SCRIPT_TYPE` | The type of script (e.g., `npm`, `shell`, `python`). |
| `AW_SCRIPT_SOURCE` | The source where the script was discovered. |

### Command-Specific Variables (Available during `aw exec`)

| Variable | Description |
| :--- | :--- |
| `AW_EXEC` | Set to `true` when running an arbitrary command via `aw exec`. |

---

## ⌨️ Command Reference

| Command | Description |
| :--- | :--- |
| `aw list scripts` | Show all runnable scripts discovered in the current directory. |
| `aw run <name>` | Execute a script by name. |
| `aw describe <name>` | Show detailed information about a script. |
| `aw find <query>` | Search for scripts by name, source, or description. |
| `aw exec <cmd>` | Run an arbitrary shell command through the `aw` runner. |
| `aw init` | Initialize a new `.aw` directory for project-specific scripts. |
| `aw record` | Interactively record a sequence of commands and save them. |
| `aw add source <path>` | Add a new directory to the script search path. |
| `aw add script <name> <path>` | Manually add a specific script to your configuration. |
| `aw list sources` | Show all configured script sources. |
| `aw env` | Show environment variables available to scripts. |
| `aw completion <shell>` | Generate shell completion script (bash, zsh, fish). |
| `aw remove <type> <id>` | Remove a `source` or `script` from the configuration. |

**Global Options:**
- `--json`: Output results in JSON format.
- `--help`: Display help information.
- `--version`: Show the current version.

---

## 🛠️ Development

We welcome contributions! To get started:

1. Clone the repo: `git clone https://github.com/7obyGit/aw.git`
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run dev -- <args>`
4. Run tests: `npm test`
5. Build: `npm run build`
6. Check [Coding Standards](CODING_STANDARDS.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

License: [MIT](./LICENSE)
