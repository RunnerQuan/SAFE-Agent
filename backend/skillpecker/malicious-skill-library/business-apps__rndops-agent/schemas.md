# Canonical Data Schemas

All data follows JSON Schema format. These are the authoritative definitions.

## Vendor

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "legalName", "status", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "legalName": { "type": "string" },
    "tradingName": { "type": "string" },
    "status": { "enum": ["draft", "pending_approval", "active", "suspended", "terminated"] },
    "taxId": { "type": "string" },
    "jurisdiction": { "type": "string" },
    "primaryContact": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" }
      }
    },
    "contracts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "enum": ["MSA", "NDA", "DPA", "SoW"] },
          "documentHash": { "type": "string" },
          "effectiveDate": { "type": "string", "format": "date" },
          "expirationDate": { "type": "string", "format": "date" },
          "status": { "enum": ["draft", "pending_signature", "executed", "expired"] }
        }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "duplicateRate": { "type": "number", "minimum": 0, "maximum": 1 },
        "shortlistConversionRate": { "type": "number", "minimum": 0, "maximum": 1 },
        "interviewPassRate": { "type": "number", "minimum": 0, "maximum": 1 },
        "repeatResubmissionRate": { "type": "number", "minimum": 0, "maximum": 1 },
        "totalSubmissions": { "type": "integer" },
        "totalHires": { "type": "integer" }
      }
    },
    "riskFlags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "enum": ["duplicate_spam", "quality_degradation", "compliance_issue", "payment_dispute"] },
          "severity": { "enum": ["low", "medium", "high", "critical"] },
          "evidence": { "type": "array", "items": { "type": "string" } },
          "raisedAt": { "type": "string", "format": "date-time" },
          "resolvedAt": { "type": "string", "format": "date-time" }
        }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "version": { "type": "integer" }
  }
}
```

## Role / Requisition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "title", "status", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "requisitionCode": { "type": "string" },
    "title": { "type": "string" },
    "department": { "type": "string" },
    "hiringManager": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" }
      }
    },
    "status": { "enum": ["draft", "open", "on_hold", "filled", "cancelled"] },
    "jobDescription": { "type": "string" },
    "requiredSkills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "skill": { "type": "string" },
          "level": { "enum": ["basic", "intermediate", "advanced", "expert"] },
          "required": { "type": "boolean" },
          "weight": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "preferredSkills": {
      "type": "array",
      "items": { "type": "string" }
    },
    "experienceRange": {
      "type": "object",
      "properties": {
        "minYears": { "type": "integer" },
        "maxYears": { "type": "integer" }
      }
    },
    "budget": {
      "type": "object",
      "properties": {
        "currency": { "type": "string" },
        "minRate": { "type": "number" },
        "maxRate": { "type": "number" },
        "rateType": { "enum": ["hourly", "daily", "monthly", "annual"] }
      }
    },
    "interviewPlan": {
      "type": "object",
      "properties": {
        "stages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "type": { "enum": ["screening", "technical", "behavioral", "culture_fit", "final"] },
              "duration": { "type": "integer", "description": "Duration in minutes" },
              "interviewers": { "type": "array", "items": { "type": "string" } },
              "rubricId": { "type": "string" }
            }
          }
        }
      }
    },
    "scoringRubric": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "criteria": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": "string" },
              "weight": { "type": "number" },
              "scoreRange": {
                "type": "object",
                "properties": {
                  "min": { "type": "integer" },
                  "max": { "type": "integer" }
                }
              }
            }
          }
        }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "version": { "type": "integer" }
  }
}
```

## Candidate

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "canonicalId": { "type": "string", "description": "Resolved identity after dedup" },
    "identity": {
      "type": "object",
      "properties": {
        "fullName": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "linkedIn": { "type": "string", "format": "uri" },
        "location": { "type": "string" }
      }
    },
    "resumeVersions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "hash": { "type": "string" },
          "uploadedAt": { "type": "string", "format": "date-time" },
          "vendorId": { "type": "string" },
          "artifactPath": { "type": "string" },
          "parseConfidence": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "structuredProfile": {
      "type": "object",
      "properties": {
        "summary": { "type": "string" },
        "skills": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "yearsExperience": { "type": "number" },
              "level": { "enum": ["basic", "intermediate", "advanced", "expert"] },
              "confidence": { "type": "number" }
            }
          }
        },
        "experience": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "company": { "type": "string" },
              "title": { "type": "string" },
              "startDate": { "type": "string", "format": "date" },
              "endDate": { "type": "string", "format": "date" },
              "description": { "type": "string" }
            }
          }
        },
        "education": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "institution": { "type": "string" },
              "degree": { "type": "string" },
              "field": { "type": "string" },
              "graduationYear": { "type": "integer" }
            }
          }
        },
        "totalYearsExperience": { "type": "number" }
      }
    },
    "submissionHistory": {
      "type": "array",
      "items": { "type": "string", "description": "Submission IDs" }
    },
    "interviewHistory": {
      "type": "array",
      "items": { "type": "string", "description": "InterviewEvent IDs" }
    },
    "duplicateCases": {
      "type": "array",
      "items": { "type": "string", "description": "DuplicateCase IDs" }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "version": { "type": "integer" }
  }
}
```

## Submission

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "vendorId", "roleId", "candidateId", "submittedAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "vendorId": { "type": "string", "format": "uuid" },
    "roleId": { "type": "string", "format": "uuid" },
    "candidateId": { "type": "string", "format": "uuid" },
    "resumeHash": { "type": "string" },
    "submittedAt": { "type": "string", "format": "date-time" },
    "status": { "enum": ["pending_review", "screening", "shortlisted", "interviewing", "offered", "hired", "rejected", "withdrawn"] },
    "vendorNotes": { "type": "string" },
    "proposedRate": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" },
        "rateType": { "enum": ["hourly", "daily", "monthly"] }
      }
    },
    "screeningResultId": { "type": "string" },
    "rejectionReason": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "version": { "type": "integer" }
  }
}
```

## ScreeningResult

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "submissionId", "overallScore", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "submissionId": { "type": "string", "format": "uuid" },
    "rubricId": { "type": "string", "format": "uuid" },
    "overallScore": { "type": "number", "minimum": 0, "maximum": 100 },
    "overallConfidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "criteriaScores": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "criterionName": { "type": "string" },
          "score": { "type": "number" },
          "maxScore": { "type": "number" },
          "confidence": { "type": "number" },
          "evidence": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": { "enum": ["resume_text", "skill_match", "experience_match", "education_match"] },
                "source": { "type": "string" },
                "excerpt": { "type": "string" }
              }
            }
          },
          "explanation": { "type": "string" }
        }
      }
    },
    "recommendation": { "enum": ["strong_yes", "yes", "maybe", "no", "strong_no"] },
    "flags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "enum": ["skill_gap", "experience_mismatch", "overqualified", "underqualified", "low_confidence"] },
          "description": { "type": "string" }
        }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "createdBy": { "type": "string", "description": "Agent or user ID" }
  }
}
```

## InterviewEvent

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "submissionId", "stage", "status"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "submissionId": { "type": "string", "format": "uuid" },
    "stage": { "type": "string" },
    "status": { "enum": ["scheduled", "completed", "cancelled", "no_show"] },
    "scheduledAt": { "type": "string", "format": "date-time" },
    "duration": { "type": "integer", "description": "Minutes" },
    "panel": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "interviewerId": { "type": "string" },
          "name": { "type": "string" },
          "role": { "type": "string" }
        }
      }
    },
    "questionPack": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "category": { "type": "string" },
          "expectedAnswer": { "type": "string" }
        }
      }
    },
    "feedback": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "interviewerId": { "type": "string" },
          "rubricScores": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "criterion": { "type": "string" },
                "score": { "type": "integer" },
                "notes": { "type": "string" }
              }
            }
          },
          "overallRating": { "enum": ["strong_hire", "hire", "no_hire", "strong_no_hire"] },
          "strengths": { "type": "array", "items": { "type": "string" } },
          "concerns": { "type": "array", "items": { "type": "string" } },
          "submittedAt": { "type": "string", "format": "date-time" }
        }
      }
    },
    "decision": { "enum": ["advance", "reject", "hold", "pending"] },
    "decisionNotes": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

## SoW Draft

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "vendorId", "status", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "vendorId": { "type": "string", "format": "uuid" },
    "roleId": { "type": "string", "format": "uuid" },
    "candidateId": { "type": "string", "format": "uuid" },
    "templateId": { "type": "string" },
    "version": { "type": "integer" },
    "status": { "enum": ["draft", "pending_legal_review", "legal_approved", "pending_signature", "executed", "rejected"] },
    "content": {
      "type": "object",
      "properties": {
        "scopeOfWork": { "type": "string" },
        "deliverables": { "type": "array", "items": { "type": "string" } },
        "startDate": { "type": "string", "format": "date" },
        "endDate": { "type": "string", "format": "date" },
        "rate": {
          "type": "object",
          "properties": {
            "amount": { "type": "number" },
            "currency": { "type": "string" },
            "rateType": { "enum": ["hourly", "daily", "monthly", "fixed"] }
          }
        },
        "paymentTerms": { "type": "string" },
        "specialTerms": { "type": "array", "items": { "type": "string" } }
      }
    },
    "clauseDeviations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "clause": { "type": "string" },
          "standardText": { "type": "string" },
          "proposedText": { "type": "string" },
          "riskLevel": { "enum": ["low", "medium", "high"] },
          "justification": { "type": "string" },
          "legalApproved": { "type": "boolean" }
        }
      }
    },
    "approvalChain": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "approver": { "type": "string" },
          "role": { "enum": ["hiring_manager", "legal", "finance", "procurement"] },
          "status": { "enum": ["pending", "approved", "rejected"] },
          "timestamp": { "type": "string", "format": "date-time" },
          "notes": { "type": "string" }
        }
      }
    },
    "documentHash": { "type": "string" },
    "artifactPath": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

## Finance Packet

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "vendorId", "sowId", "status", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "vendorId": { "type": "string", "format": "uuid" },
    "sowId": { "type": "string", "format": "uuid" },
    "status": { "enum": ["draft", "pending_approval", "approved", "po_created", "rejected"] },
    "budgetCodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "description": { "type": "string" },
          "amount": { "type": "number" },
          "currency": { "type": "string" }
        }
      }
    },
    "totalValue": {
      "type": "object",
      "properties": {
        "amount": { "type": "number" },
        "currency": { "type": "string" }
      }
    },
    "evidenceBundle": {
      "type": "object",
      "properties": {
        "vendorApprovalRef": { "type": "string" },
        "sowRef": { "type": "string" },
        "budgetApprovalRef": { "type": "string" },
        "additionalDocs": { "type": "array", "items": { "type": "string" } }
      }
    },
    "approvalChain": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "approver": { "type": "string" },
          "role": { "enum": ["hiring_manager", "finance", "budget_owner", "procurement"] },
          "status": { "enum": ["pending", "approved", "rejected"] },
          "timestamp": { "type": "string", "format": "date-time" },
          "notes": { "type": "string" }
        }
      }
    },
    "poNumber": { "type": "string" },
    "artifactPath": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

## DuplicateCase

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "candidateIds", "status", "createdAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "candidateIds": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" },
      "minItems": 2
    },
    "status": { "enum": ["suspected", "confirmed", "rejected", "merged"] },
    "similarityEvidence": {
      "type": "object",
      "properties": {
        "emailMatch": { "type": "boolean" },
        "phoneMatch": { "type": "boolean" },
        "linkedInMatch": { "type": "boolean" },
        "nameSimularity": { "type": "number", "minimum": 0, "maximum": 1 },
        "timelineOverlap": { "type": "number", "minimum": 0, "maximum": 1 },
        "resumeEmbeddingSimilarity": { "type": "number", "minimum": 0, "maximum": 1 },
        "obfuscationSignals": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "vendorsInvolved": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" }
    },
    "resolution": {
      "type": "object",
      "properties": {
        "decision": { "enum": ["merge", "keep_separate", "flag_vendor"] },
        "canonicalCandidateId": { "type": "string" },
        "resolvedBy": { "type": "string" },
        "resolvedAt": { "type": "string", "format": "date-time" },
        "notes": { "type": "string" }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

## LedgerEvent

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "eventType", "actor", "objectType", "objectId", "timestamp"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "description": "See events.md for taxonomy" },
    "actor": {
      "type": "object",
      "properties": {
        "type": { "enum": ["agent", "user", "system"] },
        "id": { "type": "string" },
        "name": { "type": "string" }
      }
    },
    "objectType": { "enum": ["vendor", "role", "candidate", "submission", "screening_result", "interview_event", "sow_draft", "finance_packet", "duplicate_case"] },
    "objectId": { "type": "string", "format": "uuid" },
    "beforeHash": { "type": "string", "description": "SHA-256 of object state before" },
    "afterHash": { "type": "string", "description": "SHA-256 of object state after" },
    "changes": {
      "type": "object",
      "description": "JSON patch or diff of changes"
    },
    "sourceReferences": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "enum": ["slack_message", "email", "file_upload", "api_call", "manual_entry"] },
          "reference": { "type": "string" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "confidence": { "type": "number" },
        "requiresApproval": { "type": "boolean" },
        "approvalStatus": { "enum": ["pending", "approved", "rejected"] }
      }
    },
    "timestamp": { "type": "string", "format": "date-time" }
  }
}
```
