# SendGrid API Endpoints Reference

Complete reference for SendGrid v3 API endpoints used by this CLI.

## Table of Contents

- [Mail Send](#mail-send)
- [Templates](#templates)
- [Contacts](#contacts)
- [Lists](#lists)
- [Segments](#segments)
- [Suppressions](#suppressions)
- [Statistics](#statistics)
- [Senders](#senders)
- [Domain Authentication](#domain-authentication)
- [Webhooks](#webhooks)
- [API Keys](#api-keys)
- [Email Validation](#email-validation)

## Mail Send

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v3/mail/send` | Send email |
| POST | `/v3/mail/batch` | Create batch ID for scheduling |
| GET | `/v3/mail/batch/{batch_id}` | Validate batch ID |
| POST | `/v3/user/scheduled_sends` | Cancel/pause scheduled sends |

### Key Fields for `/v3/mail/send`

```json
{
  "personalizations": [{
    "to": [{"email": "recipient@example.com", "name": "Recipient"}],
    "cc": [],
    "bcc": [],
    "subject": "Subject override",
    "dynamic_template_data": {"key": "value"}
  }],
  "from": {"email": "sender@example.com", "name": "Sender"},
  "reply_to": {"email": "reply@example.com"},
  "subject": "Default subject",
  "content": [
    {"type": "text/plain", "value": "Plain text"},
    {"type": "text/html", "value": "<p>HTML</p>"}
  ],
  "template_id": "d-xxxx",
  "attachments": [{
    "content": "base64-encoded",
    "filename": "file.pdf",
    "type": "application/pdf"
  }],
  "categories": ["category1"],
  "send_at": 1609459200,
  "batch_id": "batch-id"
}
```

## Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/templates` | List templates |
| POST | `/v3/templates` | Create template |
| GET | `/v3/templates/{id}` | Get template |
| PATCH | `/v3/templates/{id}` | Update template |
| DELETE | `/v3/templates/{id}` | Delete template |
| POST | `/v3/templates/{id}/versions` | Create version |
| PATCH | `/v3/templates/{id}/versions/{vid}` | Update version |
| DELETE | `/v3/templates/{id}/versions/{vid}` | Delete version |
| POST | `/v3/templates/{id}/versions/{vid}/activate` | Activate version |

### Template Generation Types

- `legacy`: Uses substitution tags like `{{name}}`
- `dynamic`: Uses Handlebars syntax with `{{name}}`, conditionals, loops

## Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/v3/marketing/contacts` | Add/update contacts (async) |
| POST | `/v3/marketing/contacts/search` | Search contacts |
| POST | `/v3/marketing/contacts/search/emails` | Get by email |
| GET | `/v3/marketing/contacts/{id}` | Get contact |
| GET | `/v3/marketing/contacts/count` | Get count |
| DELETE | `/v3/marketing/contacts` | Delete contacts |
| POST | `/v3/marketing/contacts/exports` | Start export |
| GET | `/v3/marketing/contacts/exports/{id}` | Export status |
| PUT | `/v3/marketing/contacts/imports` | Start import |

### Contact Fields

- `email` (required)
- `first_name`, `last_name`
- `alternate_emails` (array)
- `address_line_1`, `address_line_2`
- `city`, `state_province_region`, `postal_code`, `country`
- `phone_number`, `whatsapp`, `line`, `facebook`
- `custom_fields` (object)

## Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/marketing/lists` | List all lists |
| POST | `/v3/marketing/lists` | Create list |
| GET | `/v3/marketing/lists/{id}` | Get list |
| PATCH | `/v3/marketing/lists/{id}` | Update list |
| DELETE | `/v3/marketing/lists/{id}` | Delete list |
| GET | `/v3/marketing/lists/{id}/contacts/count` | Contact count |
| DELETE | `/v3/marketing/lists/{id}/contacts` | Remove contacts |

## Segments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/marketing/segments/2.0` | List segments |
| POST | `/v3/marketing/segments/2.0` | Create segment |
| GET | `/v3/marketing/segments/2.0/{id}` | Get segment |
| PATCH | `/v3/marketing/segments/2.0/{id}` | Update segment |
| DELETE | `/v3/marketing/segments/2.0/{id}` | Delete segment |

### Segment Query DSL

```sql
email LIKE '%@example.com'
AND created_at > '2024-01-01'
AND list_ids CONTAINS 'list-id'
```

## Suppressions

### Bounces

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/suppression/bounces` | List bounces |
| DELETE | `/v3/suppression/bounces/{email}` | Delete bounce |
| DELETE | `/v3/suppression/bounces` | Delete all |

### Blocks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/suppression/blocks` | List blocks |
| DELETE | `/v3/suppression/blocks/{email}` | Delete block |

### Spam Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/suppression/spam_reports` | List spam reports |
| DELETE | `/v3/suppression/spam_reports/{email}` | Delete spam report |

### Global Unsubscribes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/suppression/unsubscribes` | List unsubscribes |
| POST | `/v3/asm/suppressions/global` | Add to global unsub |

### Invalid Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/suppression/invalid_emails` | List invalid emails |
| DELETE | `/v3/suppression/invalid_emails/{email}` | Delete invalid |

### Suppression Groups (ASM)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/asm/groups` | List groups |
| POST | `/v3/asm/groups` | Create group |
| GET | `/v3/asm/groups/{id}/suppressions` | Get suppressions |

## Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/stats` | Global stats |
| GET | `/v3/categories/stats` | Category stats |
| GET | `/v3/mailbox_providers/stats` | Mailbox provider stats |
| GET | `/v3/browsers/stats` | Browser stats |
| GET | `/v3/devices/stats` | Device stats |
| GET | `/v3/geo/stats` | Geographic stats |

### Query Parameters

- `start_date` (required): YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `aggregated_by`: day, week, month

### Metrics Returned

- `requests`, `delivered`, `opens`, `unique_opens`
- `clicks`, `unique_clicks`, `bounces`, `deferred`
- `spam_reports`, `unsubscribes`, `invalid_emails`
- `blocks`, `bounce_drops`, `spam_report_drops`

## Senders

### Verified Senders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/verified_senders` | List verified senders |
| POST | `/v3/verified_senders` | Create sender |
| PATCH | `/v3/verified_senders/{id}` | Update sender |
| DELETE | `/v3/verified_senders/{id}` | Delete sender |
| POST | `/v3/verified_senders/resend/{id}` | Resend verification |

### Marketing Senders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/marketing/senders` | List senders |
| POST | `/v3/marketing/senders` | Create sender |
| GET | `/v3/marketing/senders/{id}` | Get sender |
| PATCH | `/v3/marketing/senders/{id}` | Update sender |
| DELETE | `/v3/marketing/senders/{id}` | Delete sender |

## Domain Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/whitelabel/domains` | List domains |
| POST | `/v3/whitelabel/domains` | Authenticate domain |
| GET | `/v3/whitelabel/domains/{id}` | Get domain |
| PATCH | `/v3/whitelabel/domains/{id}` | Update domain |
| DELETE | `/v3/whitelabel/domains/{id}` | Delete domain |
| POST | `/v3/whitelabel/domains/{id}/validate` | Validate domain |

### Link Branding

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/whitelabel/links` | List branded links |
| POST | `/v3/whitelabel/links` | Create branded link |
| POST | `/v3/whitelabel/links/{id}/validate` | Validate link |
| DELETE | `/v3/whitelabel/links/{id}` | Delete link |

## Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/user/webhooks/event/settings/all` | List webhooks |
| POST | `/v3/user/webhooks/event/settings` | Create webhook |
| GET | `/v3/user/webhooks/event/settings/{id}` | Get webhook |
| PATCH | `/v3/user/webhooks/event/settings/{id}` | Update webhook |
| DELETE | `/v3/user/webhooks/event/settings/{id}` | Delete webhook |
| POST | `/v3/user/webhooks/event/test` | Test webhook |

### Event Types

- `processed`, `dropped`, `delivered`, `deferred`, `bounce`
- `open`, `click`, `spam_report`, `unsubscribe`
- `group_unsubscribe`, `group_resubscribe`

## API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v3/api_keys` | List API keys |
| POST | `/v3/api_keys` | Create API key |
| GET | `/v3/api_keys/{id}` | Get API key |
| PATCH | `/v3/api_keys/{id}` | Update name |
| PUT | `/v3/api_keys/{id}` | Update name + scopes |
| DELETE | `/v3/api_keys/{id}` | Delete API key |
| GET | `/v3/scopes` | List available scopes |

## Email Validation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v3/validations/email` | Validate email |

**Note**: Requires Pro or Premier plan with Email Validation enabled.

### Response Fields

- `verdict`: Valid, Risky, Invalid
- `score`: 0.0 to 1.0
- `suggestion`: Suggested correction
- `checks.domain`: has_valid_address_syntax, has_mx_or_a_record, is_suspected_disposable_address
- `checks.local_part`: is_suspected_role_address
- `checks.additional`: has_known_bounces, has_suspected_bounces

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Mail Send | 600 requests/min (varies by plan) |
| Contacts PUT | 3 requests/2 seconds |
| Templates | 50 requests/min |
| Stats | 100 requests/min |
| General | Varies by endpoint |

Always check `X-RateLimit-Remaining` header and implement exponential backoff on 429 responses.
