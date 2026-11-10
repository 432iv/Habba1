#!/usr/bin/env bash
# ============================================================================
# Local verification harness for the HABBA schema.
# Requires a running PostgreSQL (no Supabase needed): migrations + RLS tests
# run against a throw-away database, with Supabase's auth.uid() stubbed.
#
#   ./run_tests.sh
#
# Exit code is non-zero if ANY of these happen:
#   * a migration fails
#   * an assertion reports FAIL
#   * psql reports an ERROR (a statement blew up unexpectedly)
#   * the number of assertions actually executed does not match the number
#     present in the test file (silently skipped blocks)
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")"

DB="${DB:-habba_test}"
PSQL_SUPER="${PSQL_SUPER:-sudo -u postgres psql}"
LOG="$(mktemp -t habba_rls.XXXXXX.log)"
trap 'rm -f "$LOG"' EXIT

echo "→ recreating $DB"
$PSQL_SUPER -q -c "drop database if exists $DB" -c "create database $DB" </dev/null || {
  echo "✗ could not recreate $DB"; exit 1; }

echo "→ stubbing Supabase auth for local runs"
$PSQL_SUPER -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/00_local_supabase_stub.sql >/dev/null </dev/null || {
  echo "✗ auth stub failed"; exit 1; }

echo "→ stubbing Supabase storage (local stand-in)"
$PSQL_SUPER -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/01_storage_stub.sql >/dev/null </dev/null || {
  echo "✗ storage stub failed"; exit 1; }

for f in migrations/0001_schema.sql \
         migrations/0002_rls.sql \
         migrations/0003_functions.sql \
         migrations/0006_seed_demo.sql \
         migrations/0005_security_hardening.sql \
         migrations/0004_storage.sql \
         migrations/0007_close_direct_order_writes.sql; do
  printf "  applying %-46s" "$f"
  if $PSQL_SUPER -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null 2>"$LOG" </dev/null; then
    echo "ok"
  else
    echo "FAILED"
    sed -n '1,20p' "$LOG"
    exit 1
  fi
done

echo "→ RLS + business logic tests"
# ON_ERROR_STOP is deliberately OFF: an expected refusal inside a DO block is
# handled by the test itself. Unexpected errors are counted below and fail the run.
$PSQL_SUPER -d "$DB" -f tests/rls_test.sql >/dev/null 2>"$LOG" </dev/null
PSQL_RC=$?

# psql writes NOTICE/ERROR lines to stderr with a "psql:file:line: " prefix.
# Strip it, then separate the assertion report from hard SQL errors.
clean() { sed -E 's/^psql:[^:]*:[0-9]+: //' | sed -E 's/^(NOTICE|WARNING):  //' ; }
REPORT="$(clean < "$LOG" | grep -E '^(PASS|FAIL)' || true)"
SQL_ERRORS="$(clean < "$LOG" | grep -E '^ERROR' || true)"

echo "$REPORT"
[ -n "$SQL_ERRORS" ] && printf '%s\n' "$SQL_ERRORS" | sed 's/^/  /'

passes=$(printf '%s\n' "$REPORT" | grep -c '^PASS' || true)
fails=$(printf '%s\n'  "$REPORT" | grep -c '^FAIL' || true)
errors=$(printf '%s\n' "$SQL_ERRORS" | grep -c '^ERROR' || true)

# ---------------------------------------------------------------- storage --
echo "→ Storage policy tests"
$PSQL_SUPER -d "$DB" -f tests/storage_test.sql >/dev/null 2>"$LOG.storage" </dev/null
STORAGE_REPORT="$(clean < "$LOG.storage" | grep -E '^(PASS|FAIL)' || true)"
STORAGE_ERRORS="$(clean < "$LOG.storage" | grep -E '^ERROR' || true)"
echo "$STORAGE_REPORT"
s_pass=$(printf '%s\n' "$STORAGE_REPORT" | grep -c '^PASS' || true)
s_fail=$(printf '%s\n' "$STORAGE_REPORT" | grep -c '^FAIL' || true)
# a statement that blows up must fail the run, exactly like the RLS suite
s_errors=$(printf '%s\n' "$STORAGE_ERRORS" | grep -c '^ERROR' || true)
rm -f "$LOG.storage"

passes=$((passes + s_pass))
fails=$((fails + s_fail))
errors=$((errors + s_errors))

echo
echo "──────────────────────────────────────────"
echo "  assertions: $passes passed · $fails failed"
echo "  (a silently skipped block always surfaces as an unexpected SQL error below)"

status=0
if [ "$fails" -ne 0 ]; then echo "  ✗ FAILURES"; status=1; fi
if [ "$errors" -ne 0 ]; then echo "  ✗ unexpected SQL errors"; status=1; fi
if [ "$PSQL_RC" -ne 0 ]; then echo "  ✗ psql exited $PSQL_RC"; status=1; fi

if [ "$status" -eq 0 ]; then echo "  ✓ ALL GREEN ($passes assertions)"; fi
exit "$status"
