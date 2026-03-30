# Ledger Event Taxonomy

All state changes are recorded as immutable ledger events. This is the authoritative list of event types.

## Event Naming Convention

Format: `{OBJECT}_{ACTION}` in SCREAMING_SNAKE_CASE

## Intake & Coordination Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `REQUEST_CREATED` | New intake request received from Slack/email | Ops Intake Agent |
| `REQUEST_ASSIGNED` | Request assigned to handler | Stakeholder Router Agent |
| `REQUEST_ESCALATED` | Request escalated due to SLA breach or complexity | Stakeholder Router Agent |
| `REVIEW_TASK_CREATED` | Review task created and routed to stakeholder | Stakeholder Router Agent |
| `REVIEW_TASK_COMPLETED` | Stakeholder completed review | System |

## Vendor Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `VENDOR_DRAFTED` | New vendor record created in draft state | Vendor Onboarding Agent |
| `VENDOR_VALIDATION_PASSED` | Vendor passed all required field validations | Risk & Compliance Sentinel |
| `VENDOR_VALIDATION_FAILED` | Vendor failed validation, missing required fields | Risk & Compliance Sentinel |
| `VENDOR_SUBMITTED_FOR_APPROVAL` | Vendor submitted for human approval | Vendor Onboarding Agent |
| `VENDOR_APPROVED` | Vendor approved by human | Commit Gatekeeper Agent |
| `VENDOR_REJECTED` | Vendor rejected by human | Commit Gatekeeper Agent |
| `VENDOR_ACTIVATED` | Vendor activated and ready for submissions | Commit Gatekeeper Agent |
| `VENDOR_SUSPENDED` | Vendor suspended due to risk flags | Vendor Performance & Risk Agent |
| `VENDOR_TERMINATED` | Vendor relationship terminated | Commit Gatekeeper Agent |
| `VENDOR_RISK_FLAGGED` | Risk flag raised against vendor | Vendor Performance & Risk Agent |
| `VENDOR_RISK_RESOLVED` | Risk flag resolved | Human / Commit Gatekeeper Agent |
| `VENDOR_METRICS_UPDATED` | Performance metrics recalculated | Vendor Performance & Risk Agent |
| `VENDOR_CONTRACT_ATTACHED` | Contract document attached to vendor | Vendor Onboarding Agent |

## Role & Requisition Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `ROLE_CREATED` | New role/requisition created | Role & Requisition Agent |
| `ROLE_UPDATED` | Role details updated | Role & Requisition Agent |
| `ROLE_OPENED` | Role opened for submissions | Role & Requisition Agent |
| `ROLE_CLOSED` | Role closed (filled or cancelled) | Role & Requisition Agent |
| `ROLE_ON_HOLD` | Role put on hold | Role & Requisition Agent |
| `RUBRIC_CREATED` | Scoring rubric created for role | Role & Requisition Agent |
| `RUBRIC_UPDATED` | Scoring rubric updated | Role & Requisition Agent |
| `INTERVIEW_PLAN_CREATED` | Interview plan defined for role | Role & Requisition Agent |

## Candidate Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `CANDIDATE_INGESTED` | New candidate record created from CV | CV Ingestion Agent |
| `CANDIDATE_PROFILE_EXTRACTED` | Structured profile extracted from CV | CV Ingestion Agent |
| `CANDIDATE_PROFILE_UPDATED` | Profile updated with new information | CV Ingestion Agent |
| `CANDIDATE_MERGED` | Two candidate records merged (dedup resolution) | Commit Gatekeeper Agent |
| `CANDIDATE_IDENTITY_RESOLVED` | Canonical identity assigned after dedup | Deduplication Agent |

## Submission Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `SUBMISSION_CREATED` | New candidate submission from vendor | CV Ingestion Agent |
| `SUBMISSION_DUPLICATE_DETECTED` | Submission flagged as potential duplicate | Deduplication Agent |
| `SUBMISSION_SCREENING_STARTED` | Automated screening initiated | Candidate Scoring Agent |
| `SUBMISSION_SCREENED` | Screening completed with scores | Candidate Scoring Agent |
| `SUBMISSION_SHORTLISTED` | Candidate added to shortlist | Commit Gatekeeper Agent |
| `SUBMISSION_REJECTED` | Submission rejected | Commit Gatekeeper Agent |
| `SUBMISSION_WITHDRAWN` | Candidate/vendor withdrew submission | System |
| `SUBMISSION_STATUS_CHANGED` | General status change | Various |

## Screening Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `SCREENING_COMPLETED` | Full screening result generated | Candidate Scoring Agent |
| `SCREENING_LOW_CONFIDENCE` | Screening flagged for human review due to low confidence | Candidate Scoring Agent |
| `SCREENING_MANUAL_OVERRIDE` | Human overrode automated screening result | Commit Gatekeeper Agent |

## Duplicate Detection Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `DUPLICATE_SUSPECTED` | Potential duplicate candidate detected | Deduplication Agent |
| `DUPLICATE_EVIDENCE_ADDED` | Additional evidence added to duplicate case | Deduplication Agent |
| `DUPLICATE_CONFIRMED` | Human confirmed duplicate | Commit Gatekeeper Agent |
| `DUPLICATE_REJECTED` | Human determined not a duplicate | Commit Gatekeeper Agent |
| `DUPLICATE_MERGED` | Duplicate records merged | Commit Gatekeeper Agent |
| `OBFUSCATION_DETECTED` | Deliberate obfuscation attempt detected | Deduplication Agent |

## Interview Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `INTERVIEW_SCHEDULED` | Interview scheduled with candidate | Interview Orchestrator Agent |
| `INTERVIEW_RESCHEDULED` | Interview time changed | Interview Orchestrator Agent |
| `INTERVIEW_CANCELLED` | Interview cancelled | Interview Orchestrator Agent |
| `INTERVIEW_COMPLETED` | Interview took place | System |
| `INTERVIEW_NO_SHOW` | Candidate did not attend | System |
| `INTERVIEW_FEEDBACK_REQUESTED` | Feedback request sent to interviewers | Interview Orchestrator Agent |
| `INTERVIEW_FEEDBACK_RECORDED` | Interviewer submitted feedback | Interview Orchestrator Agent |
| `INTERVIEW_DECISION_MADE` | Advance/reject decision made | Commit Gatekeeper Agent |
| `QUESTION_PACK_GENERATED` | Interview questions generated | Interview Orchestrator Agent |

## Legal & SoW Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `SOW_DRAFTED` | SoW draft generated from template | SoW Drafting Agent |
| `SOW_CLAUSE_DEVIATION_DETECTED` | Non-standard clause detected | SoW Drafting Agent |
| `SOW_SUBMITTED_FOR_LEGAL_REVIEW` | SoW sent to legal for review | SoW Drafting Agent |
| `SOW_LEGAL_APPROVED` | Legal approved the SoW | Commit Gatekeeper Agent |
| `SOW_LEGAL_REJECTED` | Legal rejected with requested changes | Commit Gatekeeper Agent |
| `SOW_REVISED` | SoW revised based on feedback | SoW Drafting Agent |
| `SOW_SUBMITTED_FOR_SIGNATURE` | SoW sent for signatures | Commit Gatekeeper Agent |
| `SOW_EXECUTED` | SoW fully signed and executed | System |

## Finance Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `FINANCE_PACKET_DRAFTED` | Finance evidence packet created | Finance Evidence Pack Agent |
| `FINANCE_PACKET_SUBMITTED` | Packet submitted for approval | Finance Evidence Pack Agent |
| `FINANCE_PACKET_APPROVED` | Finance approved the packet | Commit Gatekeeper Agent |
| `FINANCE_PACKET_REJECTED` | Finance rejected with issues | Commit Gatekeeper Agent |
| `PO_CREATED` | Purchase order created | System |
| `BUDGET_VALIDATED` | Budget codes validated | Finance Evidence Pack Agent |
| `BUDGET_VALIDATION_FAILED` | Budget validation failed | Finance Evidence Pack Agent |

## Validation & Approval Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `VALIDATION_PASSED` | Object passed all validators | Risk & Compliance Sentinel |
| `VALIDATION_FAILED` | Object failed validation | Risk & Compliance Sentinel |
| `APPROVAL_REQUESTED` | Human approval requested | Commit Gatekeeper Agent |
| `APPROVAL_GRANTED` | Human approved the change | Commit Gatekeeper Agent |
| `APPROVAL_DENIED` | Human denied the change | Commit Gatekeeper Agent |
| `APPROVAL_EXPIRED` | Approval request expired (SLA breach) | System |
| `OBJECT_COMMITTED` | Change committed to canonical store | Commit Gatekeeper Agent |

## System Events

| Event Type | Description | Triggering Agent |
|------------|-------------|------------------|
| `AGENT_RUN_STARTED` | Agent pipeline run initiated | Orchestrator |
| `AGENT_RUN_COMPLETED` | Agent pipeline run completed | Orchestrator |
| `AGENT_RUN_FAILED` | Agent pipeline run failed | Orchestrator |
| `SLA_BREACH_WARNING` | SLA approaching breach threshold | Orchestrator |
| `SLA_BREACH_OCCURRED` | SLA breached | Orchestrator |
| `ARTIFACT_STORED` | File artifact stored in artifact store | System |
| `REPORT_GENERATED` | Excel/PDF report generated | Render Layer |
| `AUDIT_EXPORT_CREATED` | Audit export package created | System |

## Event Payload Structure

Every event includes:

```json
{
  "id": "uuid",
  "eventType": "EVENT_TYPE",
  "timestamp": "ISO-8601",
  "actor": {
    "type": "agent|user|system",
    "id": "identifier",
    "name": "display name"
  },
  "objectType": "vendor|candidate|...",
  "objectId": "uuid",
  "beforeHash": "sha256 (null for creates)",
  "afterHash": "sha256",
  "changes": { "json patch or diff" },
  "sourceReferences": [
    { "type": "slack_message", "reference": "C123/p456" }
  ],
  "metadata": {
    "confidence": 0.95,
    "requiresApproval": true,
    "agentVersion": "1.0.0"
  }
}
```

## Event Sequencing Rules

1. **Immutability**: Events are never modified or deleted
2. **Ordering**: Events are ordered by timestamp within each object
3. **Causality**: Each event may reference causing events via `sourceReferences`
4. **Idempotency**: Event IDs ensure no duplicate processing
5. **Compaction**: State can be reconstructed by replaying events from any checkpoint
