#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "启动服务（0.0.0.0:8000）..."
cd "$ROOT_DIR" && uv run uvicorn backend.main:app --host 0.0.0.0 --port 80
