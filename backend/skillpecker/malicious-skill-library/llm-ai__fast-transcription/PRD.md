# Product Requirements Document: Fast Transcription Skill

## Document Information
| Field | Value |
|-------|-------|
| Skill Name | Fast Transcription |
| Version | 1.0 |
| Last Updated | January 2026 |
| Status | Building Block |

---

## 1. Overview

### 1.1 Purpose
The Fast Transcription skill provides reusable building blocks for implementing synchronous, faster-than-real-time audio transcription using Azure AI Speech Fast Transcription API. This skill enables speaker identification through stereo channel separation or mono diarization, ideal for contact center call processing.

### 1.2 Scope
This skill covers:
- Azure AI Speech Fast Transcription API integration
- Stereo channel separation (agent/customer on separate channels)
- Mono diarization (speaker identification in single-channel audio)
- Contact center call processing pipeline
- Basic call analytics (word counts, talk ratios)

### 1.3 Building Block Nature
**This skill is a building block, not a complete product.** Integrators should:
- Design their own call processing workflows
- Implement business-specific analytics and scoring
- Build their own quality assurance logic
- Add application-specific compliance rules
- Handle their own storage and retrieval of transcripts

---

## 2. Functional Requirements

### 2.1 Core Capabilities

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-1 | Stereo Channel Transcription | P0 | Transcribe audio with pre-separated speaker channels |
| FR-2 | Mono Diarization | P0 | Identify speakers in single-channel mixed recordings |
| FR-3 | Basic Transcription | P0 | Simple transcription without speaker identification |
| FR-4 | Contact Center Pipeline | P1 | Full pipeline with speaker labeling and analytics |
| FR-5 | Conversation Flow Formatting | P1 | Format transcripts as chronological dialogue |
| FR-6 | Call Analytics | P1 | Calculate word counts, talk ratios, duration |
| FR-7 | Multi-language Support | P2 | Support multiple locale configurations |
| FR-8 | Single Channel Extraction | P2 | Transcribe only agent or customer channel |

### 2.2 Speaker Identification Strategies

| Strategy | Description | Use Case | Accuracy |
|----------|-------------|----------|----------|
| Stereo Channel Separation | Speakers on separate audio channels | Contact center with channel-separated recording | ~10% higher than diarization |
| Mono Diarization | Algorithm detects "who spoke when" | Single-channel recordings, meetings | Variable, depends on voice distinctiveness |

### 2.3 API Constraints

| Property | Value |
|----------|-------|
| **Max Audio Duration** | 2 hours |
| **Max File Size** | 300 MB |
| **Supported Formats** | WAV, MP3, FLAC, OGG, AAC |
| **API Version** | 2025-10-15 |
| **Response Type** | Synchronous (faster-than-real-time) |
| **Diarization Speakers** | 2-36 speakers |

### 2.4 Integration Points

| Integration Point | Description | Required By Integrator |
|-------------------|-------------|----------------------|
| Call Processing Workflow | How calls flow through the system | Yes - MUST design |
| Transcript Storage | Where/how transcripts are stored | Yes - MUST implement |
| Quality Scoring Logic | Business rules for call scoring | Yes - MUST implement |
| Compliance Rules | Industry-specific requirements | Yes - MUST implement |
| Agent Identification | Mapping speaker to agent/customer | Yes - MUST implement |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Requirement |
|--------|-------------|
| Transcription Speed | Faster than real-time |
| API Latency | Network-dependent + processing time |
| Max Audio Length | 2 hours per request |
| Recommended Format | 16-bit WAV, 16kHz for best compatibility |

### 3.2 Reliability

| Aspect | Recommendation |
|--------|----------------|
| Rate Limiting | Implement retry with backoff |
| Error Handling | Handle 401/403/429 HTTP errors gracefully |
| Quota Management | Free tier: 5 audio hours/month |
| Format Fallback | Convert to WAV if other formats rejected |

### 3.3 Security

- **API Key Protection**: Store AZURE_AI_SPEECH_KEY securely, never in code
- **Audio Handling**: Process PII-containing audio according to compliance requirements
- **Data Retention**: Implement appropriate transcript retention policies
- **Region Selection**: Choose regions compliant with data residency requirements

---

## 4. Technical Constraints

### 4.1 Azure Service Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| Azure AI Speech | Fast Transcription API | Yes |
| Azure OpenAI | Optional embedding for transcript search | No |

### 4.2 Authentication Requirements

| Component | Auth Method | Notes |
|-----------|-------------|-------|
| Fast Transcription API | API Key (Ocp-Apim-Subscription-Key) | Key must match region |

### 4.3 Regional Availability

Fast Transcription is available in limited regions:
- East US
- West Europe
- Southeast Asia
- Sweden Central

### 4.4 Package Requirements

```bash
requests>=2.31.0
python-dotenv>=1.0.0
pydub>=0.25.1  # Optional, for audio format conversion
```

---

## 5. User Stories (For Integrators)

### 5.1 Application Developer Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-1 | As a developer, I want to transcribe stereo call recordings | Agent and customer transcripts are separated |
| US-2 | As a developer, I want to process mono recordings | Speaker diarization identifies who spoke when |
| US-3 | As a developer, I want call analytics | Word counts, duration, talk ratios calculated |
| US-4 | As a developer, I want formatted conversation output | Chronological dialogue with timestamps |

### 5.2 End User Stories (When Integrated)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| EU-1 | As a QA manager, I want to review all calls | 100% call coverage vs. manual sampling |
| EU-2 | As a compliance officer, I want transcript search | Can find specific disclosures in transcripts |
| EU-3 | As a team lead, I want agent coaching data | Talk ratio and word count analytics available |

---

## 6. Available Building Blocks

### 6.1 Python Scripts

| Script | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `transcription_client.py` | Core API client | `TranscriptionClient`, `transcribe_stereo`, `transcribe_with_diarization` |
| `stereo_transcriber.py` | Stereo channel processing | `StereoTranscriber`, `StereoCallTranscript` |
| `diarization_transcriber.py` | Mono diarization | `DiarizationTranscriber`, `DiarizedTranscript` |
| `contact_center_processor.py` | Full pipeline | `ContactCenterProcessor`, `CallAnalysis` |

### 6.2 Key Code Patterns

#### Stereo Channel Transcription
```python
from scripts.stereo_transcriber import StereoTranscriber

transcriber = StereoTranscriber(agent_channel=0, customer_channel=1)
result = transcriber.transcribe("call.wav")
print(f"Agent: {result.agent_transcript}")
print(f"Customer: {result.customer_transcript}")
```

#### Mono Diarization
```python
from scripts.diarization_transcriber import DiarizationTranscriber

transcriber = DiarizationTranscriber(default_max_speakers=2)
result = transcriber.transcribe("mono_call.wav")
conversation = transcriber.get_conversation_flow(result)
```

#### Contact Center Pipeline
```python
from scripts.contact_center_processor import ContactCenterProcessor

processor = ContactCenterProcessor()
analysis = processor.process_call("call.wav", strategy="stereo")
summary = processor.get_summary(analysis)
```

---

## 7. Integration Checklist

### 7.1 Before Integration

- [ ] Azure subscription with AI Speech service access
- [ ] API key obtained from Azure portal
- [ ] Region selected from available Fast Transcription regions
- [ ] Audio format requirements understood (WAV recommended)
- [ ] Quota limits reviewed (5 hours/month free tier)

### 7.2 During Integration

- [ ] Environment variables configured (see `.env.sample`)
- [ ] Speaker identification strategy selected (stereo vs. diarization)
- [ ] Channel mapping configured for stereo recordings
- [ ] Max speakers configured for diarization
- [ ] Error handling for rate limiting implemented

### 7.3 Testing

- [ ] Stereo transcription separates channels correctly
- [ ] Diarization identifies correct number of speakers
- [ ] Call analytics calculate accurately
- [ ] Conversation flow formats chronologically
- [ ] Error handling works for invalid audio
- [ ] Rate limiting retry logic functions

---

## 8. Limitations & Constraints

### 8.1 Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Diarization accuracy | May struggle with similar voices | Use stereo when possible |
| Simultaneous speech | Diarization can't handle crosstalk well | Stereo channel separation |
| Regional availability | Limited to specific regions | Choose from available regions |
| File size limit | 300 MB max | Split long recordings |
| Format compatibility | Some formats may be rejected | Convert to 16-bit WAV |

### 8.2 Out of Scope

The following are NOT provided by this skill:
- Transcript storage/database
- Quality assurance scoring rules
- Compliance rule enforcement
- Agent performance dashboards
- Real-time streaming transcription
- Sentiment analysis
- PII detection/redaction

---

## 9. Contact Center Use Cases

### 9.1 Enabled Scenarios

| Use Case | Description | Benefit |
|----------|-------------|---------|
| Quality Assurance Automation | 100% call review vs. 2-4 per agent/month | 20-30% cost savings reported |
| Compliance Monitoring | Verify mandatory disclosures | HIPAA, PCI-DSS, GDPR compliance |
| Agent Coaching | Data-driven feedback | Specific, actionable improvements |
| Customer Sentiment | Detect dissatisfaction early | Proactive retention |
| Post-Call Summarization | Auto-generate summaries | Reduced wrap-up time |

### 9.2 Strategy Selection Guide

| Scenario | Recommended Strategy | Reason |
|----------|---------------------|--------|
| Contact center with stereo recording | Stereo | ~10% higher accuracy |
| Meeting recordings | Diarization | Multiple speakers, single channel |
| Interview recordings | Diarization | Two speakers, mono recording |
| Phone recordings (mono) | Diarization | Only option for single channel |

---

## 10. Production Readiness Guidelines

### 10.1 Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| HTTP 401/403 | API key doesn't match region | Verify key/region combination |
| HTTP 429 | Rate limited | Implement retry with backoff |
| Audio format rejected | Unsupported format | Convert to 16-bit WAV |
| Timeout | Large file/slow network | Increase timeout, check file size |

### 10.2 Audio Optimization

| Recommendation | Details |
|----------------|---------|
| Format | 16-bit WAV, 16kHz for best compatibility |
| Duration | Use 30-60 second samples for testing |
| Quality | Ensure clear audio with minimal background noise |
| Channels | Verify stereo files have correct channel mapping |

### 10.3 Quota Management

| Tier | Monthly Limit | Recommendation |
|------|---------------|----------------|
| Free | 5 audio hours | Use short samples for development |
| Paid | Per-usage | Implement usage tracking |

---

## 11. Success Metrics (For Integrators to Define)

Suggested metrics for integrated applications:

| Metric | Description | Target (Example) |
|--------|-------------|------------------|
| Transcription Accuracy | Word error rate | < 10% WER |
| Speaker Attribution | Correct speaker identification | > 95% |
| Processing Success Rate | % calls processed without error | > 99% |
| API Response Time | Average transcription latency | < 30s for 5-min audio |
| Diarization Accuracy | Correct speaker segmentation | > 90% |

---

## 12. Free Audio Resources for Testing

| Source | Type | License | Best For |
|--------|------|---------|----------|
| VoxConverse | Mono, multi-speaker | CC BY 4.0 | Diarization testing |
| AMI Corpus | Mono, meetings | CC BY 4.0 | Multi-participant scenarios |
| LibriSpeech | Mono, single speaker | CC BY 4.0 | Synthesizing stereo files |

---

## 13. References

- [SKILL.md](./SKILL.md) - Detailed technical documentation
- [Fast Transcription API Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/fast-transcription-create)
- [REST API Reference](https://learn.microsoft.com/en-us/rest/api/speechtotext/transcriptions/transcribe)
- [Call Center Overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/call-center-overview)
- [VoxConverse Dataset](https://www.robots.ox.ac.uk/~vgg/data/voxconverse/)
