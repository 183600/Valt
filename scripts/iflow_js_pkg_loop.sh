#!/usr/bin/env bash
set -euo pipefail

: "${PKG:?PKG is required (storage|schema|query|sync|security)}"

WORK_BRANCH="${WORK_BRANCH:-main}"
RUN_ONCE="${RUN_ONCE:-0}"
TEST_LOG="${TEST_LOG:-/tmp/iflow_pkg_last.log}"

# 允许改动的根文件（尽量少）
ALLOW_ROOT_FILES=(
  "pnpm-lock.yaml"
  "package.json"
  "pnpm-workspace.yaml"
)

pkg_path="packages/${PKG}"

detect_pm() {
  if [[ -f "pnpm-lock.yaml" ]]; then echo "pnpm"; return 0; fi
  if [[ -f "package-lock.json" ]]; then echo "npm"; return 0; fi
  echo "pnpm"
}

pm_install() {
  local pm="$1"
  if [[ "$pm" == "pnpm" ]]; then
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile=false
  else
    npm ci || npm install
  fi
}

pm_test_pkg() {
  local pm="$1"
  # 只测试该包 + 其被依赖者（通常包含 core），避免全仓库互相干扰
  if [[ "$pm" == "pnpm" ]]; then
    pnpm -r --filter "@lfde/${PKG}..." test
  else
    # npm workspaces 没有 pnpm filter 语法，这里退化为只跑该 workspace
    npm -w "@lfde/${PKG}" test
  fi
}

is_allowed_change() {
  local f="$1"
  if [[ "$f" == "$pkg_path/"* ]]; then return 0; fi
  for a in "${ALLOW_ROOT_FILES[@]}"; do
    [[ "$f" == "$a" ]] && return 0
  done
  return 1
}

enforce_one_pkg_diff() {
  local bad=0
  local files
  files="$(git diff --name-only)"
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    if ! is_allowed_change "$f"; then
      echo "❌ 发现越界改动: $f"
      bad=1
    fi
  done <<< "$files"

  if [[ "$bad" -eq 1 ]]; then
    echo "↩️ 回滚越界文件..."
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      if ! is_allowed_change "$f"; then
        git checkout -- "$f" || true
      fi
    done <<< "$files"
    return 1
  fi
  return 0
}

pm="$(detect_pm)"
pm_install "$pm"

while true; do
  : > "$TEST_LOG"
  set +e
  pm_test_pkg "$pm" 2>&1 | tee "$TEST_LOG"
  status="${PIPESTATUS[0]}"
  set -e

  if [[ "$status" -eq 0 ]]; then
    # ✅ 通过：只给该包加少量测试
    iflow "只在 ${pkg_path}/ 下新增或修改文件：为 @lfde/${PKG} 增加 vitest 测试用例（总新增不超过10个），不要改其它包；不要修改 core；确保测试仍通过。think:high" --yolo || true
    enforce_one_pkg_diff || true

    git add -A
    if ! git diff --cached --quiet; then
      git commit -m "ci(${PKG}): add tests (auto)" || true
    fi
  else
    echo "❌ 测试失败：只修复 ${PKG}"
    iflow "只在 ${pkg_path}/ 下修复 @lfde/${PKG} 导致的测试失败；不要修改其它包与根目录文件（除 pnpm-lock.yaml/package.json 必要变更）；不要删除测试。think:high" --yolo || true
    enforce_one_pkg_diff || true

    git add -A
    if ! git diff --cached --quiet; then
      git commit -m "fix(${PKG}): make tests pass (auto)" || true
    fi
  fi

  [[ "$RUN_ONCE" == "1" ]] && exit 0
  sleep 1
done
