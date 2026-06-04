#!/usr/bin/env bash
# scripts/check-testids.sh
#
# testIds.ts 상수값 ↔ src/ 컴포넌트 data-testid 일관성 검사
#
# STALE        : testIds.ts에 있지만 컴포넌트에서 쓰이지 않는 값 → CI 실패
# UNREGISTERED : 컴포넌트에 있지만 testIds.ts에 없는 정적 값 → 경고 (실패 아님)
#
# 인식하는 사용 형태:
#   data-testid="x" / data-testid='x'         정적 JSX 속성
#   testId="x" / testId='x'                    래퍼 컴포넌트 prop (Input 등)
#   testId: 'x' / testId: "x"                  객체 리터럴 prop (Navbar/Footer 링크 설정)
#   data-testid={`prefix-${...}`}              동적 생성 — prefix로 매칭 (privacy-section-, loading- 등)
#
# 동작 원리:
#   컴포넌트에서 testId 사용을 제거하면 → STALE 오류로 CI 실패
#   testIds.ts에서 상수를 제거하면 → TypeScript가 T.xxx 참조 오류를 잡음
#   두 레이어가 맞물려 testId 드리프트를 원천 차단

set -e

TESTIDS_FILE="e2e/helpers/testIds.ts"
SRC_DIR="src"
INCLUDES=(--include="*.tsx" --include="*.ts")

# testIds.ts의 값 목록 추출: "  key: 'some-value'," → some-value
DEFINED=$(grep -E "^\s+\w+\s*:" "$TESTIDS_FILE" \
  | grep -oE "'[^']+'" \
  | tr -d "'" \
  | sort -u)

# src/ 컴포넌트의 정적 testId 값 목록
#   data-testid / testId (JSX 속성, 큰/작은 따옴표) + testId: '...' (객체 속성)
STATIC=$(
  {
    grep -rohE 'data-testid="[^"]*"'        "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE '"[^"]+"' | tr -d '"'
    grep -rohE "data-testid='[^']*'"        "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE "'[^']+'" | tr -d "'"
    grep -rohE 'testId="[^"]*"'             "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE '"[^"]+"' | tr -d '"'
    grep -rohE "testId='[^']*'"             "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE "'[^']+'" | tr -d "'"
    grep -rohE "testId:[[:space:]]*'[^']*'" "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE "'[^']+'" | tr -d "'"
    grep -rohE 'testId:[[:space:]]*"[^"]*"' "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null | grep -oE '"[^"]+"' | tr -d '"'
  } | sort -u
)

# 동적 생성 testId의 prefix 목록: data-testid={...`prefix-${...}`...} → "prefix-"
# data-testid를 포함한 라인에서만 템플릿 리터럴 prefix를 추출한다.
PREFIXES=$(
  grep -rhE 'data-testid=\{' "$SRC_DIR" "${INCLUDES[@]}" 2>/dev/null \
    | grep -oE '`[a-zA-Z0-9_-]+\$\{' \
    | sed -E 's/^`//; s/\$\{$//' \
    | sort -u
)

FAIL=0

echo "=== testId 일관성 검사 ==="
echo ""

# STALE 검사: testIds.ts에 있지만 컴포넌트에서 쓰이지 않는 값
while IFS= read -r v; do
  [ -z "$v" ] && continue
  # 1) 정적 일치
  if printf '%s\n' "$STATIC" | grep -qx "$v"; then
    continue
  fi
  # 2) 동적 prefix 일치
  covered=0
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    case "$v" in
      "$p"*) covered=1; break ;;
    esac
  done <<< "$PREFIXES"
  [ $covered -eq 1 ] && continue

  echo "❌ stale: \"$v\" — testIds.ts에 있지만 src/ 컴포넌트에서 쓰이지 않음"
  FAIL=1
done <<< "$DEFINED"

# UNREGISTERED 검사: 컴포넌트(정적)에 있지만 testIds.ts에 없는 값 (경고만)
while IFS= read -r v; do
  [ -z "$v" ] && continue
  if ! printf '%s\n' "$DEFINED" | grep -qx "$v"; then
    echo "⚠️  unregistered: \"$v\" — src/에 있지만 testIds.ts에 미등록"
  fi
done <<< "$STATIC"

echo ""

DEFINED_COUNT=$(printf '%s\n' "$DEFINED" | grep -c . 2>/dev/null || echo 0)
STATIC_COUNT=$(printf '%s\n' "$STATIC" | grep -c . 2>/dev/null || echo 0)
PREFIX_COUNT=$(printf '%s\n' "$PREFIXES" | grep -c . 2>/dev/null || echo 0)

if [ $FAIL -eq 1 ]; then
  echo "❌ testId 검사 실패 — stale testId를 해결하거나 testIds.ts에서 제거하세요."
  exit 1
fi

echo "✅ testId 일관성 검사 통과 (testIds.ts: ${DEFINED_COUNT}개 / 정적 사용: ${STATIC_COUNT}개 / 동적 prefix: ${PREFIX_COUNT}개)"
