# aw — Automated Workflow 🚀

[![npm version](https://img.shields.io/npm/v/@7oby/aw.svg)](https://www.npmjs.com/package/@7oby/aw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`aw` is a powerful CLI tool designed to find and execute scripts across your projects. It unifies your workflow by automatically discovering scripts from multiple sources — including NPM, Python, .NET, and CI pipelines — providing a single, beautiful interface to run them all.

---

## 📦 Installation

Get up and running with a single command:

```bash
npm install -g @7oby/aw
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
3. **Run** a script:
   ```bash
   aw run <script-name>
   ```

---

## ✨ Features

- 🔍 **Auto-Discovery**: Instantly finds scripts in `package.json`, `.sh`, `.bat`, `.ps1`, `pyproject.toml`, and more.
- 🌍 **Smart Environment**: Automatically loads `.env` files from your project root to CWD, merging variables
  intelligently.
- 🛠️ **Unified Interface**: One command to rule them all. No more switching between `npm run`, `poetry run`, or manual `./script.sh`.
- 🤖 **Local CI Runner**: Run your GitHub Actions or GitLab CI jobs locally using `act` or `gitlab-ci-local`.
- 📋 **Command Recording**: Record your terminal sequences and save them as reusable scripts with `aw record`.
- 🔗 **JSON Support**: Pipeline-friendly output for every command with the `--json` flag.
- 🎨 **Beautiful UI**: Uses modern interactive prompts for a clean and efficient experience.

---

## 📖 Script Sources

`aw` intelligently scans your working directory for the following:

| Source | Description |
| :--- | :--- |
| **Local `.aw`** | Project-specific scripts and manual overrides (scans up the directory tree). |
| **NPM** | Automatically pulls all scripts defined in `package.json`. |
| **Python** | Support for `poetry` and `uv` scripts defined in `pyproject.toml`. |
| **.NET** | Discovers standard tasks (`build`, `test`, `watch`, etc.) in `.csproj` and `.sln` files. |
| **Shell Scripts** | Finds standalone `.sh` (Unix), `.bat`/`.cmd` (Windows), and `.ps1` (PowerShell). |
| **CI Pipelines** | Discovers GitHub Actions (via `act`) and GitLab CI (via `gitlab-ci-local`) jobs. |

---

## ⌨️ Command Reference

| Command | Description |
| :--- | :--- |
| `aw list scripts` | Show all runnable scripts discovered in the current directory. |
| `aw run <name>` | Execute a script by name. |
| `aw find <query>` | Search for scripts by name, source, or description. |
| `aw exec <cmd>` | Run an arbitrary shell command through the `aw` runner. |
| `aw init` | Initialize a new `.aw` directory for project-specific scripts. |
| `aw record` | Interactively record a sequence of commands and save them. |
| `aw add source <path>` | Add a new directory to the script search path. |
| `aw add script <name> <path>` | Manually add a specific script to your configuration. |
| `aw list sources` | Show all configured script sources. |
| `aw env` | Show environment variables available to scripts. |
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
