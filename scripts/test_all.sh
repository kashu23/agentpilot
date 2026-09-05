#!/usr/bin/env bash
# Run all tests across TypeScript and Python
set -e

echo "=== Running TypeScript Type Checks ==="
npx tsc --noEmit

echo "=== Running Python Unit Tests ==="
python -m unittest discover -s python/tests

echo "=== All Tests Passed Successfully ==="
