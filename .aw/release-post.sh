#!/usr/bin/env bash
set -e

git switch main
git pull
git fetch --tags --force

# Sync the latest version tag to main's HEAD
# This ensures that if dev was squash-merged, the tag moves to the new commit on main
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
if [ -n "$VERSION" ] && [ "$VERSION" != "0.0.0" ]; then
    TAG="v$VERSION"
    if git rev-parse "$TAG" >/dev/null 2>&1; then
        echo "Syncing tag $TAG to main HEAD..."
        git tag -f "$TAG" HEAD
        git push origin "$TAG" --force
    fi
fi

git branch -f dev main
git push origin dev --force-with-lease

git switch dev