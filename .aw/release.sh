#!/usr/bin/env bash
set -e

git switch dev
git pull

git switch main
git pull

git switch dev
git rebase main

git switch main
git merge --ff-only dev

