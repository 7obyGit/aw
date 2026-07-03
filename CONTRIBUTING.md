---
# Contribution & Publishing Guide

This guide explains the branch-based workflow for contributing changes to `@7obygit/aw` and the process for releasing new versions.

## Branching & Contribution Workflow

All code changes must follow a formal Merge Request (MR) process. Do not commit directly to the `main` branch.

### 1. Create a Feature Branch
Always create a descriptive branch from the latest `main` branch:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Implement Changes & Test
Make your changes and ensure the codebase remains healthy:
```bash
# Run quality checks
npm run lint
npm run format
npm test
```

### 3. Commit and Push
Commit your work using clear, descriptive messages:
```bash
git add .
git commit -m "feat: add descriptive message here"
git push origin feature/your-feature-name
```

### 4. Create a Merge Request (MR)
1. Open your repository on GitHub.
2. Create a Merge Request from your feature branch into `main`.
3. Ensure CI pipeline checks pass.
4. Obtain a code review if required.
5. Merge the MR into `main`.
6. Delete the remote and local source branches to keep the repo clean.

---

## Automated Releases

This project uses **Semantic Release** to automate the versioning and publishing process.

### 1. Merge to Main
Once a Pull Request (PR) is merged into the `main` branch, a GitHub Action is triggered automatically.

### 2. Automatic Versioning
Semantic Release analyzes the commit messages since the last release to determine the next version bump (major, minor, or patch). It follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### 3. Automatic Publishing
The automation will:
1. Update `package.json` with the new version.
2. Generate a `CHANGELOG.md` entry.
3. Commit and tag the release in Git.
4. Publish the package to **NPM**.
5. Create a **GitHub Release** with the generated release notes.

### How to Trigger a Release
To ensure a release is triggered correctly, use the following commit prefixes in your PR:
- `fix:` triggers a **patch** release (e.g., 0.1.0 -> 0.1.1)
- `feat:` triggers a **minor** release (e.g., 0.1.0 -> 0.2.0)
- `perf:` triggers a **patch** release
- `BREAKING CHANGE:` in the footer triggers a **major** release (e.g., 0.1.0 -> 1.0.0)

---

## Package Contents

The package is strictly optimized using the `files` field in `package.json` to only distribute:
- `dist/` (Compiled production files)
- `README.md`
- `LICENSE`
