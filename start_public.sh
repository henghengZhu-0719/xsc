#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo "正在停止服务..."
  kill "$BACKEND_PID" "$NGROK_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "构建前端..."
(cd "$ROOT_DIR/frontend" && npm run build)

echo "启动后端（含前端静态文件）..."
(cd "$ROOT_DIR" && uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

sleep 2

echo "启动 ngrok 公网穿透..."
ngrok http 8000 &
NGROK_PID=$!

echo ""
echo "✅ 服务已启动，公网地址请查看 ngrok 控制台：http://127.0.0.1:4040"
echo ""

wait "$BACKEND_PID"
