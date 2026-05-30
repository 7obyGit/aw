#!/usr/bin/env bash

echo "Getting line count of code files in the src directory..."

total_lines=$(find src -type f -exec wc -l {} + 2>/dev/null | awk 'END {print $1}')

echo "Total lines: $total_lines"
