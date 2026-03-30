#!/usr/bin/env bash
set -euo pipefail

# Mark a plan as approved in the plan-approvals file
# Usage: [--plan-id <id>] [--approve | --reject | --pending] bash approve-plan.sh

PLAN_ID=""
ACTION="approved"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan-id)
      PLAN_ID="$2"
      shift 2
      ;;
    --approve)
      ACTION="approved"
      shift
      ;;
    --reject|--rejected)
      ACTION="rejected"
      shift
      ;;
    --pending)
      ACTION="pending"
      shift
      ;;
    *)
      echo "ERROR: Unknown argument: $1"
      echo "Usage: [--plan-id <id>] [--approve|--reject|--pending] bash approve-plan.sh"
      exit 1
      ;;
  esac
done

# Validate plan ID
if [[ -z "$PLAN_ID" ]]; then
  echo "ERROR: --plan-id is required"
  exit 1
fi

# Plan approvals file
APPROVALS_DIR=".os-tk"
mkdir -p "$APPROVALS_DIR"
APPROVALS_FILE="$APPROVALS_DIR/plan-approvals.json"

# Initialize approvals file if not exists
if [[ ! -f "$APPROVALS_FILE" ]]; then
  echo '{"approvals":{}}' > "$APPROVALS_FILE"
fi

# Ensure jq exists
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found. Install jq to use plan approvals."
  exit 1
fi

# Update approval status
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S")
TMP_FILE="${APPROVALS_FILE}.tmp"

jq --arg planId "$PLAN_ID" \
   --arg status "$ACTION" \
   --arg reviewedBy "$(whoami)" \
   --arg reviewedAt "$TIMESTAMP" \
   --arg updatedAt "$TIMESTAMP" \
   '.approvals[$planId] = {
      planId: $planId,
      status: $status,
      reviewedBy: $reviewedBy,
      reviewedAt: $reviewedAt,
      updatedAt: $updatedAt
    }' "$APPROVALS_FILE" > "$TMP_FILE"

mv "$TMP_FILE" "$APPROVALS_FILE"

echo "✅ Plan '$PLAN_ID' marked as $ACTION"

# Show current status
CURRENT_STATUS=$(jq -r ".approvals[\"$PLAN_ID\"].status" "$APPROVALS_FILE" 2>/dev/null)
echo "   Status: $CURRENT_STATUS"
echo "   Reviewed by: $(whoami)"
echo "   Updated: $TIMESTAMP"

# Output summary
echo ""
echo "Plan approvals:"
jq -r '.approvals | to_entries[]' "$APPROVALS_FILE" 2>/dev/null
