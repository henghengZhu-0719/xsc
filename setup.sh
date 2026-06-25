#!/usr/bin/env bash
# 一键准备运行环境：安装后端(uv)和前端(npm)依赖。
# 用法：
#   ./setup.sh          安装依赖
#   ./setup.sh --build  安装依赖并构建前端生产包(frontend/dist)
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> 检查 uv ..."
if ! command -v uv >/dev/null 2>&1; then
  echo "未找到 uv，正在安装..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
uv --version

echo "==> 安装后端依赖 ..."
cd "$ROOT_DIR"
uv sync

echo "==> 检查 Node.js / npm ..."
if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm，请先安装 Node.js (建议 18+): https://nodejs.org/"
  exit 1
fi
npm --version

echo "==> 安装前端依赖 ..."
cd "$ROOT_DIR/frontend"
npm install

if [ "$1" = "--build" ]; then
  echo "==> 构建前端生产包 ..."
  npm run build
fi

echo "==> 完成。使用 ./start.sh 启动前后端。"
