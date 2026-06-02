#!/usr/bin/env bash
set -e

git switch main
git pull
git branch -f dev main
git push origin dev --force-with-lease

git switch dev