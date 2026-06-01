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

## Publishing Steps

The state of the `main` branch represents the source of truth. Once your MR is merged, follow these steps from the `main` branch to sync the `package.json` version and publish.

### 1. Update Local Main Branch
Switch to `main` and pull the newly merged changes:
```bash
git checkout main
git pull origin main
```

### 2. Build the Project
Verify the production build compiles successfully:
```bash
npm run build
```

### 3. Increment Version
Bump the version in `package.json` based on the changes introduced in the MR. This automatically creates a Git tag matching the version.
```bash
# For bug fixes (0.1.0 -> 0.1.1)
npm version patch

# For new features (0.1.0 -> 0.2.0)
npm version minor

# For breaking changes (0.1.0 -> 1.0.0)
npm version major
```

### 4. Publish to NPM
Authenticate and push the package to the registry.
```bash
# Login check (if needed)
npm login

# First time publication for scoped package
npm publish --access public

# Subsequent publications
npm publish
```

### 5. Push Version Tag to GitHub
Push the automated version bump commit and its tracking tag back up to GitHub:
```bash
git push origin main --follow-tags
```

### 6. Create GitHub Release
1. Navigate to the repository [Releases](https://github.com/7obyGit/aw/releases) page.
2. Click **Draft a new release**.
3. Select the Git tag created in Step 3.
4. Add a title (e.g., `v1.1.0`) and document the changes from the MR.
5. Click **Publish release**.

---

## Package Contents

The package is strictly optimized using the `files` field in `package.json` to only distribute:
- `dist/` (Compiled production files)
- `README.md`
- `LICENSE`
