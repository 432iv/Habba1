#!/usr/bin/env bash
# ============================================================================
# HABBA — run every suite, report real numbers, fail loudly.
#
#   ./run_all_tests.sh
#
# Exits non-zero if any suite fails. Counts are read from the suites themselves,
# never hardcoded, so the summary cannot drift from reality.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8080}"
SERVER_PID=""
FAILED=0
SUMMARY=()

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  return 0
}
trap cleanup EXIT

hr() { printf '%s\n' "────────────────────────────────────────────────────────────"; }

# ---------------------------------------------------------------- database --
hr; echo "1/3  DATABASE — migrations, RLS, business rules"; hr
DB_OUT="$(./backend/run_tests.sh 2>&1)"; DB_RC=$?
printf '%s\n' "$DB_OUT" | tail -4
DB_LINE="$(printf '%s\n' "$DB_OUT" | grep -oE '[0-9]+ passed · [0-9]+ failed' | tail -1)"
DB_PASSED="$(printf '%s\n' "$DB_LINE" | grep -oE '^[0-9]+')"
DB_FAILED="$(printf '%s\n' "$DB_LINE" | sed -E 's/^[0-9]+ passed · ([0-9]+) failed.*/\1/')"
[ "$DB_RC" -ne 0 ] && FAILED=1
SUMMARY+=("Database (migrations + RLS + business rules)|${DB_PASSED:-?}|${DB_FAILED:-?}|$([ "$DB_RC" -eq 0 ] && echo PASS || echo FAIL)")

# --------------------------------------------------------------- adapter ----
hr; echo "2/3  INTEGRATION ADAPTER — storefront contract (no browser)"; hr
AD_OUT="$(node integration/test-adapter.js 2>&1)"; AD_RC=$?
printf '%s\n' "$AD_OUT" | tail -2
AD_LINE="$(printf '%s\n' "$AD_OUT" | grep -oE '[0-9]+/[0-9]+ passed' | tail -1)"
AD_PASSED="${AD_LINE%%/*}"
AD_TOTAL="${AD_LINE##*/}"; AD_TOTAL="${AD_TOTAL%% *}"
AD_FAILED=$(( ${AD_TOTAL:-0} - ${AD_PASSED:-0} ))
[ "$AD_RC" -ne 0 ] && FAILED=1
SUMMARY+=("Integration adapter|${AD_PASSED:-?}|${AD_FAILED:-?}|$([ "$AD_RC" -eq 0 ] && echo PASS || echo FAIL)")

# ----------------------------------------------------------------- admin ----
hr; echo "3/3  ADMIN DASHBOARD — browser regression"; hr
if ! curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/admin/"; then
  echo "  starting a temporary static server on :${PORT}"
  python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$PWD" >/dev/null 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 20); do
    curl -sf -o /dev/null --max-time 1 "http://127.0.0.1:${PORT}/admin/" && break
    sleep 0.3
  done
fi
UI_OUT="$(python3 admin/tests/admin_test.py 2>&1)"; UI_RC=$?
printf '%s\n' "$UI_OUT" | tail -3
UI_LINE="$(printf '%s\n' "$UI_OUT" | grep -oE '[0-9]+/[0-9]+ passed' | tail -1)"
UI_PASSED="${UI_LINE%%/*}"
UI_TOTAL="${UI_LINE##*/}"; UI_TOTAL="${UI_TOTAL%% *}"
UI_FAILED=$(( ${UI_TOTAL:-0} - ${UI_PASSED:-0} ))
[ "$UI_RC" -ne 0 ] && FAILED=1
SUMMARY+=("Admin dashboard (browser)|${UI_PASSED:-?}|${UI_FAILED:-?}|$([ "$UI_RC" -eq 0 ] && echo PASS || echo FAIL)")

# --------------------------------------------------------------- summary ----
echo; hr; echo "SUMMARY"
hr
printf "%-42s %7s %7s  %s\n" "SUITE" "PASSED" "FAILED" "STATUS"
for row in "${SUMMARY[@]}"; do
  IFS='|' read -r name p f st <<< "$row"
  printf "%-42s %7s %7s  %s\n" "$name" "$p" "$f" "$st"
done
hr
if [ "$FAILED" -eq 0 ]; then echo "ALL SUITES GREEN"; else echo "ONE OR MORE SUITES FAILED"; fi
exit "$FAILED"
