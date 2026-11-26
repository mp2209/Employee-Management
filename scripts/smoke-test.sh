#!/usr/bin/env bash
# End-to-end smoke test of the main flows, run through the API gateway against a running
# stack (`make up`). Uses the demo accounts and creates one throwaway employee per run.
#
#   scripts/smoke-test.sh [gateway-url]      (default: http://localhost:8080)
#
# Requires: bash, curl, python3.
set -o pipefail

GATEWAY="${1:-http://localhost:8080}"
ORIGIN="http://localhost:3000"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
passed=0
failed=0

# call METHOD PATH TOKEN [curl args...]  -> sets $STATUS, response body in $TMP/body
call() {
  local method="$1" path="$2" token="$3"
  shift 3
  if [[ -n "$token" ]]; then
    set -- -H "Authorization: Bearer $token" "$@"
  fi
  STATUS=$(curl -s -o "$TMP/body" -D "$TMP/headers" -w '%{http_code}' -X "$method" "$@" "$GATEWAY$path")
}

# json EXPR -> evaluates a Python expression over the last response body, bound to `d`
json() {
  python3 - "$1" "$TMP/body" <<'PY'
import json, sys
with open(sys.argv[2]) as f:
    d = json.load(f)
print(eval(sys.argv[1], {"d": d, "json": json}))
PY
}

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; passed=$((passed + 1)); }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; failed=$((failed + 1)); }

expect_status() { # expect_status DESCRIPTION EXPECTED
  if [[ "$STATUS" == "$2" ]]; then ok "$1"; else fail "$1 (expected HTTP $2, got $STATUS: $(head -c 200 "$TMP/body"))"; fi
}

expect_true() { # expect_true DESCRIPTION PYTHON_EXPR
  if [[ "$(json "$2" 2>/dev/null)" == "True" ]]; then ok "$1"; else fail "$1 (got: $(head -c 200 "$TMP/body"))"; fi
}

login() { # login USERNAME PASSWORD -> sets $STATUS; token/id via json
  call POST /api/users/login "" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}"
}

section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# --------------------------------------------------------------------------------------
section "Waiting for $GATEWAY (services register with Eureka on startup)"
for _ in $(seq 1 60); do
  login admin admin123
  if [[ "$STATUS" == "200" ]]; then
    ADMIN_TOKEN=$(json 'd["token"]'); ADMIN_ID=$(json 'd["id"]')
    call GET "/api/points/$ADMIN_ID" "$ADMIN_TOKEN"
    [[ "$STATUS" == "200" ]] && break
  fi
  sleep 3
done
expect_status "gateway, user-service and rewardPoint-service are up" 200

# --------------------------------------------------------------------------------------
section "Authentication"
login admin wrong-password
expect_status "wrong password is rejected" 401
login employee employee123
expect_status "employee can log in" 200
EMP_TOKEN=$(json 'd["token"]'); EMP_ID=$(json 'd["id"]')
call GET "/api/points/$EMP_ID" ""
expect_status "API call without a token is rejected by the gateway" 401
call GET "/api/points/$EMP_ID" "not.a.jwt"
expect_status "API call with a forged token is rejected" 401

# --------------------------------------------------------------------------------------
section "Authorization"
call GET /api/users "$EMP_TOKEN"
expect_status "employee cannot list user accounts (Manager only)" 403
call POST /api/points/send "$EMP_TOKEN" --data "managerId=$EMP_ID&employeeId=$ADMIN_ID&points=1"
expect_status "employee cannot give points (Manager only)" 403
call GET "/api/points/$ADMIN_ID" "$EMP_TOKEN" -H "X-User-Id: $ADMIN_ID" -H "X-User-Role: Manager"
expect_status "spoofed identity headers are ignored (cannot read another wallet)" 403
call POST "/api/employees/checkin?userId=$ADMIN_ID" "$EMP_TOKEN"
expect_status "employee cannot check in on behalf of someone else" 403
call GET /api/users "$ADMIN_TOKEN"
expect_status "manager can list user accounts" 200
expect_true "password hashes are never returned" '"password" not in json.dumps(d)'

# --------------------------------------------------------------------------------------
section "Account creation -> RabbitMQ -> wallet"
SUFFIX=$(date +%s)
call POST /api/users "$ADMIN_TOKEN" -H 'Content-Type: application/json' -d "{
  \"user\": {\"username\": \"smoke$SUFFIX\", \"role\": \"Employee\", \"status\": \"Active\"},
  \"employee\": {\"identifyId\": \"9$SUFFIX\", \"name\": \"Smoke Test\", \"status\": \"Active\"}}"
expect_status "manager creates an account" 201
NEW_ID=$(json 'd["user"]["id"]'); TEMP_PASSWORD=$(json 'd["temporaryPassword"]')
login "smoke$SUFFIX" "$TEMP_PASSWORD"
expect_status "new employee logs in with the one-time temporary password" 200
for _ in $(seq 1 20); do
  call GET "/api/points/$NEW_ID" "$ADMIN_TOKEN"
  [[ "$STATUS" == "200" ]] && break
  sleep 0.5
done
expect_status "wallet was opened asynchronously from the employee-created event" 200
call POST /api/users "$ADMIN_TOKEN" -H 'Content-Type: application/json' -d "{
  \"user\": {\"username\": \"smoke$SUFFIX\"}, \"employee\": {\"identifyId\": \"8$SUFFIX\"}}"
expect_status "duplicate username is rejected" 400

# --------------------------------------------------------------------------------------
section "Reward points"
call GET "/api/points/$EMP_ID" "$EMP_TOKEN"
EMP_BALANCE=$(json 'd["totalPoint"]')
call GET "/api/points/$ADMIN_ID" "$ADMIN_TOKEN"
ADMIN_BALANCE=$(json 'd["totalPoint"]')
if [[ "$ADMIN_BALANCE" -ge 5 ]]; then
  call POST /api/points/send "$ADMIN_TOKEN" --data "managerId=$ADMIN_ID&employeeId=$EMP_ID&points=5&message=smoke"
  expect_status "manager sends 5 points" 200
  expect_true "employee balance increased by 5" "d['totalPoint'] == $EMP_BALANCE + 5"
  EMP_BALANCE=$((EMP_BALANCE + 5))
else
  fail "manager has fewer than 5 points left; reset with 'make clean-data'"
fi
call POST /api/points/redeem "$EMP_TOKEN" --data "employeeId=$EMP_ID&points=$((EMP_BALANCE + 1))&message=too-much"
expect_status "redeeming more than the balance is refused" 409
call POST /api/points/redeem "$EMP_TOKEN" --data "employeeId=$EMP_ID&points=-10&message=negative"
expect_status "negative amounts are refused" 400

# --------------------------------------------------------------------------------------
section "Leave request approval workflow"
call POST /api/requests "$EMP_TOKEN" -H 'Content-Type: application/json' -d "{
  \"employeeId\": \"$EMP_ID\", \"employeeName\": \"Demo Employee\", \"requestType\": \"Leave\",
  \"timeStart\": \"2030-01-02 00:00:00\", \"timeEnd\": \"2030-01-02 23:59:59\",
  \"reasonRequest\": \"smoke test\", \"status\": \"forged\"}"
expect_status "employee submits a leave request" 200
REQUEST_ID=$(json 'd["id"]')
expect_true "server forces the initial status to pending" "d['status'] == 'Pending'"
call GET /api/requests/not-approved "$ADMIN_TOKEN"
expect_true "request shows up in the manager's pending list" "any(r['id'] == '$REQUEST_ID' for r in d)"
call PUT "/api/requests/$REQUEST_ID/approve" "$EMP_TOKEN"
expect_status "employee cannot approve requests" 403
call PUT "/api/requests/$REQUEST_ID/approve" "$ADMIN_TOKEN"
expect_status "manager approves the request" 200
call PUT "/api/requests/$REQUEST_ID/approve" "$ADMIN_TOKEN"
expect_status "an already reviewed request cannot be approved again" 409

# --------------------------------------------------------------------------------------
section "Attendance and profiles"
call POST "/api/employees/checkin?userId=$EMP_ID" "$EMP_TOKEN"
expect_status "employee checks in" 200
call GET "/api/employees/$EMP_ID" "$EMP_TOKEN"
expect_status "employee reads their own profile" 200
call GET "/api/employees/$ADMIN_ID" "$EMP_TOKEN"
expect_status "employee cannot read someone else's profile" 403

# --------------------------------------------------------------------------------------
section "Edge concerns"
call OPTIONS /api/users/login "" -H "Origin: $ORIGIN" -H 'Access-Control-Request-Method: POST'
if [[ "$STATUS" == "200" ]] && grep -qi "access-control-allow-origin: $ORIGIN" "$TMP/headers"; then
  ok "CORS preflight is answered by the gateway"
else
  fail "CORS preflight (HTTP $STATUS)"
fi
call GET "/api/points/$EMP_ID" "" -H "Origin: $ORIGIN"
if grep -qi "access-control-allow-origin: $ORIGIN" "$TMP/headers"; then
  ok "401 responses carry CORS headers, so the browser can read them"
else
  fail "401 response is missing CORS headers"
fi
call POST /api/activities/strava/token "$ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"code":"x"}'
if [[ "$STATUS" == "503" || "$STATUS" == "502" ]]; then
  ok "Strava token exchange is routed to rewardPoint-service (HTTP $STATUS without real credentials)"
else
  fail "Strava token exchange (HTTP $STATUS)"
fi

# --------------------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$passed" "$failed"
[[ "$failed" -eq 0 ]]
