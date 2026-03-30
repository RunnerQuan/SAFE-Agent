# Excel Workbook Specifications

All Excel exports are generated from canonical JSON data. Each workbook serves a specific operational or audit purpose.

## General Principles

1. **Traceability**: Every row includes canonical ID, version, and ledger event reference
2. **Tamper Evidence**: Artifact hashes included for verification
3. **Consistent Formatting**: Standard date/currency formats, frozen headers
4. **Hyperlinks**: IDs link to canonical store where applicable

---

## 1. Vendor Register Workbook

**Purpose**: Complete vendor master list with status, contracts, and performance

### Sheet: Vendors

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Vendor ID | `vendor.id` | UUID | Hyperlink to detail |
| B: Legal Name | `vendor.legalName` | Text | |
| C: Trading Name | `vendor.tradingName` | Text | |
| D: Status | `vendor.status` | Enum | Conditional formatting |
| E: Tax ID | `vendor.taxId` | Text | |
| F: Jurisdiction | `vendor.jurisdiction` | Text | |
| G: Primary Contact | `vendor.primaryContact.name` | Text | |
| H: Contact Email | `vendor.primaryContact.email` | Email | |
| I: Contact Phone | `vendor.primaryContact.phone` | Phone | |
| J: Active Contracts | Count of active contracts | Number | |
| K: Total Submissions | `vendor.performanceMetrics.totalSubmissions` | Number | |
| L: Total Hires | `vendor.performanceMetrics.totalHires` | Number | |
| M: Duplicate Rate | `vendor.performanceMetrics.duplicateRate` | Percentage | Red if > 10% |
| N: Shortlist Rate | `vendor.performanceMetrics.shortlistConversionRate` | Percentage | |
| O: Interview Pass Rate | `vendor.performanceMetrics.interviewPassRate` | Percentage | |
| P: Active Risk Flags | Count of unresolved flags | Number | Red if > 0 |
| Q: Created Date | `vendor.createdAt` | Date | |
| R: Last Updated | `vendor.updatedAt` | DateTime | |
| S: Version | `vendor.version` | Number | |
| T: Ledger Ref | Last event ID | UUID | |

### Sheet: Vendor Contracts

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Vendor ID | Parent vendor ID | UUID | |
| B: Vendor Name | `vendor.legalName` | Text | |
| C: Contract Type | `contract.type` | Enum | MSA/NDA/DPA/SoW |
| D: Status | `contract.status` | Enum | |
| E: Effective Date | `contract.effectiveDate` | Date | |
| F: Expiration Date | `contract.expirationDate` | Date | Red if < 30 days |
| G: Document Hash | `contract.documentHash` | Text | Truncated |
| H: Artifact Path | `contract.artifactPath` | Text | Hyperlink |

### Sheet: Vendor Risk Flags

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Vendor ID | Parent vendor ID | UUID | |
| B: Vendor Name | `vendor.legalName` | Text | |
| C: Flag Type | `riskFlag.type` | Enum | |
| D: Severity | `riskFlag.severity` | Enum | Conditional formatting |
| E: Raised Date | `riskFlag.raisedAt` | DateTime | |
| F: Resolved Date | `riskFlag.resolvedAt` | DateTime | |
| G: Status | Derived | Text | Open/Resolved |
| H: Evidence | `riskFlag.evidence` | Text | Comma-separated |

---

## 2. Open Roles & Pipeline Workbook

**Purpose**: Active requisitions with pipeline health metrics

### Sheet: Open Roles

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Role ID | `role.id` | UUID | |
| B: Requisition Code | `role.requisitionCode` | Text | |
| C: Title | `role.title` | Text | |
| D: Department | `role.department` | Text | |
| E: Hiring Manager | `role.hiringManager.name` | Text | |
| F: HM Email | `role.hiringManager.email` | Email | |
| G: Status | `role.status` | Enum | |
| H: Min Experience | `role.experienceRange.minYears` | Number | |
| I: Max Experience | `role.experienceRange.maxYears` | Number | |
| J: Budget Min | `role.budget.minRate` | Currency | |
| K: Budget Max | `role.budget.maxRate` | Currency | |
| L: Rate Type | `role.budget.rateType` | Enum | |
| M: Total Submissions | Aggregated count | Number | |
| N: In Screening | Count by status | Number | |
| O: Shortlisted | Count by status | Number | |
| P: Interviewing | Count by status | Number | |
| Q: Offers | Count by status | Number | |
| R: Created Date | `role.createdAt` | Date | |
| S: Days Open | Calculated | Number | Yellow > 30, Red > 60 |
| T: Version | `role.version` | Number | |

### Sheet: Pipeline Summary

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Role ID | `role.id` | UUID | |
| B: Role Title | `role.title` | Text | |
| C: Stage | Pipeline stage | Text | |
| D: Count | Candidates in stage | Number | |
| E: Avg Days in Stage | Calculated | Number | |
| F: Conversion Rate | To next stage | Percentage | |

### Sheet: Required Skills

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Role ID | Parent role ID | UUID | |
| B: Role Title | `role.title` | Text | |
| C: Skill | `skill.skill` | Text | |
| D: Level | `skill.level` | Enum | |
| E: Required | `skill.required` | Boolean | |
| F: Weight | `skill.weight` | Percentage | |

---

## 3. Candidate Master Workbook

**Purpose**: All candidates with screening results and history

### Sheet: Candidates

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Candidate ID | `candidate.id` | UUID | |
| B: Canonical ID | `candidate.canonicalId` | UUID | For dedup |
| C: Full Name | `candidate.identity.fullName` | Text | |
| D: Email | `candidate.identity.email` | Email | |
| E: Phone | `candidate.identity.phone` | Phone | |
| F: LinkedIn | `candidate.identity.linkedIn` | URL | |
| G: Location | `candidate.identity.location` | Text | |
| H: Total Experience | `candidate.structuredProfile.totalYearsExperience` | Number | |
| I: Resume Versions | Count | Number | |
| J: Total Submissions | Count | Number | |
| K: Vendors Submitted | Distinct vendor count | Number | Red if > 1 |
| L: Duplicate Cases | Count | Number | Red if > 0 |
| M: Latest Parse Confidence | Most recent | Percentage | Yellow < 80% |
| N: Created Date | `candidate.createdAt` | Date | |
| O: Last Updated | `candidate.updatedAt` | DateTime | |
| P: Version | `candidate.version` | Number | |

### Sheet: Submissions

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Submission ID | `submission.id` | UUID | |
| B: Candidate ID | `submission.candidateId` | UUID | |
| C: Candidate Name | Joined | Text | |
| D: Vendor ID | `submission.vendorId` | UUID | |
| E: Vendor Name | Joined | Text | |
| F: Role ID | `submission.roleId` | UUID | |
| G: Role Title | Joined | Text | |
| H: Status | `submission.status` | Enum | |
| I: Submitted Date | `submission.submittedAt` | DateTime | |
| J: Proposed Rate | `submission.proposedRate.amount` | Currency | |
| K: Rate Type | `submission.proposedRate.rateType` | Enum | |
| L: Overall Score | Joined from screening | Number | |
| M: Recommendation | Joined from screening | Enum | |
| N: Days in Pipeline | Calculated | Number | |
| O: Resume Hash | `submission.resumeHash` | Text | Truncated |

### Sheet: Screening Results

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Screening ID | `screeningResult.id` | UUID | |
| B: Submission ID | `screeningResult.submissionId` | UUID | |
| C: Candidate Name | Joined | Text | |
| D: Role Title | Joined | Text | |
| E: Overall Score | `screeningResult.overallScore` | Number | Color scale |
| F: Overall Confidence | `screeningResult.overallConfidence` | Percentage | |
| G: Recommendation | `screeningResult.recommendation` | Enum | |
| H: Flags | Comma-separated flag types | Text | |
| I: Created Date | `screeningResult.createdAt` | DateTime | |

### Sheet: Candidate Skills

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Candidate ID | Parent | UUID | |
| B: Candidate Name | Joined | Text | |
| C: Skill | `skill.name` | Text | |
| D: Years Experience | `skill.yearsExperience` | Number | |
| E: Level | `skill.level` | Enum | |
| F: Confidence | `skill.confidence` | Percentage | |

---

## 4. Duplicate & Risk Log Workbook

**Purpose**: All duplicate cases and vendor risk events

### Sheet: Duplicate Cases

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Case ID | `duplicateCase.id` | UUID | |
| B: Status | `duplicateCase.status` | Enum | |
| C: Candidate 1 ID | First candidate | UUID | |
| D: Candidate 1 Name | Joined | Text | |
| E: Candidate 1 Vendor | Joined | Text | |
| F: Candidate 2 ID | Second candidate | UUID | |
| G: Candidate 2 Name | Joined | Text | |
| H: Candidate 2 Vendor | Joined | Text | |
| I: Email Match | `similarityEvidence.emailMatch` | Boolean | |
| J: Phone Match | `similarityEvidence.phoneMatch` | Boolean | |
| K: LinkedIn Match | `similarityEvidence.linkedInMatch` | Boolean | |
| L: Name Similarity | `similarityEvidence.nameSimularity` | Percentage | |
| M: Timeline Overlap | `similarityEvidence.timelineOverlap` | Percentage | |
| N: Resume Similarity | `similarityEvidence.resumeEmbeddingSimilarity` | Percentage | |
| O: Obfuscation Signals | Comma-separated | Text | Red if present |
| P: Resolution | `resolution.decision` | Enum | |
| Q: Canonical ID | `resolution.canonicalCandidateId` | UUID | |
| R: Resolved By | `resolution.resolvedBy` | Text | |
| S: Resolved Date | `resolution.resolvedAt` | DateTime | |
| T: Created Date | `duplicateCase.createdAt` | DateTime | |

### Sheet: Vendor Risk Events

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Event ID | Ledger event ID | UUID | |
| B: Event Type | `ledgerEvent.eventType` | Text | |
| C: Vendor ID | `ledgerEvent.objectId` | UUID | |
| D: Vendor Name | Joined | Text | |
| E: Risk Type | Extracted from changes | Enum | |
| F: Severity | Extracted | Enum | |
| G: Evidence | Extracted | Text | |
| H: Timestamp | `ledgerEvent.timestamp` | DateTime | |
| I: Actor | `ledgerEvent.actor.name` | Text | |

### Sheet: Obfuscation Attempts

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Case ID | `duplicateCase.id` | UUID | |
| B: Candidate ID | Involved candidate | UUID | |
| C: Candidate Name | Joined | Text | |
| D: Vendor ID | Submitting vendor | UUID | |
| E: Vendor Name | Joined | Text | |
| F: Signal Type | `obfuscationSignals` item | Text | |
| G: Detection Date | `duplicateCase.createdAt` | DateTime | |

---

## 5. Finance Evidence Index Workbook

**Purpose**: All finance packets with approval status and audit trail

### Sheet: Finance Packets

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Packet ID | `financePacket.id` | UUID | |
| B: Status | `financePacket.status` | Enum | |
| C: Vendor ID | `financePacket.vendorId` | UUID | |
| D: Vendor Name | Joined | Text | |
| E: SoW ID | `financePacket.sowId` | UUID | |
| F: SoW Status | Joined | Enum | |
| G: Total Value | `financePacket.totalValue.amount` | Currency | |
| H: Currency | `financePacket.totalValue.currency` | Text | |
| I: PO Number | `financePacket.poNumber` | Text | |
| J: HM Approved | Approval status | Boolean | |
| K: Finance Approved | Approval status | Boolean | |
| L: Budget Owner Approved | Approval status | Boolean | |
| M: Procurement Approved | Approval status | Boolean | |
| N: Artifact Path | `financePacket.artifactPath` | Text | Hyperlink |
| O: Created Date | `financePacket.createdAt` | DateTime | |
| P: Last Updated | `financePacket.updatedAt` | DateTime | |

### Sheet: Budget Allocations

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Packet ID | Parent | UUID | |
| B: Vendor Name | Joined | Text | |
| C: Budget Code | `budgetCode.code` | Text | |
| D: Description | `budgetCode.description` | Text | |
| E: Amount | `budgetCode.amount` | Currency | |
| F: Currency | `budgetCode.currency` | Text | |

### Sheet: SoW Summary

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: SoW ID | `sowDraft.id` | UUID | |
| B: Vendor ID | `sowDraft.vendorId` | UUID | |
| C: Vendor Name | Joined | Text | |
| D: Role ID | `sowDraft.roleId` | UUID | |
| E: Role Title | Joined | Text | |
| F: Candidate ID | `sowDraft.candidateId` | UUID | |
| G: Candidate Name | Joined | Text | |
| H: Version | `sowDraft.version` | Number | |
| I: Status | `sowDraft.status` | Enum | |
| J: Start Date | `sowDraft.content.startDate` | Date | |
| K: End Date | `sowDraft.content.endDate` | Date | |
| L: Rate | `sowDraft.content.rate.amount` | Currency | |
| M: Rate Type | `sowDraft.content.rate.rateType` | Enum | |
| N: Clause Deviations | Count | Number | Red if > 0 |
| O: Legal Approved | From approval chain | Boolean | |
| P: Document Hash | `sowDraft.documentHash` | Text | Truncated |
| Q: Artifact Path | `sowDraft.artifactPath` | Text | Hyperlink |

### Sheet: Approval Audit Trail

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| A: Object Type | SoW or Finance Packet | Text | |
| B: Object ID | UUID | UUID | |
| C: Approver | `approval.approver` | Text | |
| D: Role | `approval.role` | Enum | |
| E: Status | `approval.status` | Enum | |
| F: Timestamp | `approval.timestamp` | DateTime | |
| G: Notes | `approval.notes` | Text | |

---

## Formatting Standards

### Conditional Formatting Rules

| Condition | Format |
|-----------|--------|
| Status = "rejected" or "terminated" | Red background |
| Status = "pending_approval" | Yellow background |
| Status = "active" or "approved" | Green background |
| Risk severity = "critical" | Red text, bold |
| Confidence < 80% | Yellow background |
| Days > threshold | Red background |
| Count > expected (duplicates) | Red text |

### Number Formats

| Type | Format |
|------|--------|
| UUID | Truncated to 8 chars for display |
| Date | YYYY-MM-DD |
| DateTime | YYYY-MM-DD HH:MM:SS |
| Currency | #,##0.00 with currency symbol |
| Percentage | 0.0% |
| Hash | First 16 characters |

### Sheet Settings

- Freeze first row (headers)
- Auto-filter enabled on all columns
- Column widths auto-fit with max 50 chars
- Print area set to data range
- Header row bold with light gray background
