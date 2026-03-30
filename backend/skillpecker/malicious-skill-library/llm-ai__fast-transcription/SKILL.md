---
name: fast-transcription
description: Azure AI Speech Fast Transcription - Transcribe contact center calls with speaker identification using stereo channel separation or mono diarization. Returns results synchronously and faster than real-time.
version: 1.0.0
triggers:
  - fast transcription
  - speech to text
  - call transcription
  - contact center transcription
  - audio transcription
  - stereo transcription
  - diarization
  - speaker identification
  - azure speech api
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'agent', 'memory', 'todo', 'pw/*', 'c7/*']
model: Claude Opus 4.5 (copilot)
---

# Fast Transcription Skill

## Folder Contents

| File | Type | Description |
|------|------|-------------|
| `SKILL.md` | Documentation | Main skill documentation with API reference, speaker ID strategies, and curl examples |
| `PRD.md` | Documentation | Product Requirements Document for the skill |
| `.env.sample` | Configuration | Sample environment variables (AZURE_AI_SPEECH_ENDPOINT, AZURE_AI_SPEECH_KEY) |
| `requirements.txt` | Dependencies | Python package dependencies (requests, python-dotenv, pydub) |
| **scripts/** | | |
| `scripts/__init__.py` | Module | Package initializer with exports |
| `scripts/transcription_client.py` | Client | Core API client with both stereo and diarization strategies |
| `scripts/stereo_transcriber.py` | Transcriber | Stereo channel separation for pre-separated audio (agent on ch0, customer on ch1) |
| `scripts/diarization_transcriber.py` | Transcriber | Mono diarization for mixed-speaker recordings with 2-36 speaker support |
| `scripts/contact_center_processor.py` | Pipeline | Full contact center pipeline with speaker labeling and call analytics |

---

## CRITICAL: No Mock Functionality

**ALL implementations must be real and fully connected to Azure services.**

- NO mock transcription results
- NO fake speaker labels
- NO simulated audio processing
- NO placeholder transcripts
- NO hardcoded diarization output

**Everything must connect to real Azure AI Speech Fast Transcription API and return real results.**

If any functionality cannot be implemented with real connections (e.g., missing credentials, audio files unavailable), **STOP and confirm with the user** before proceeding.

---

## Overview

Azure AI Speech Fast Transcription API provides **synchronous, faster-than-real-time** transcription ideal for contact center recordings. Unlike batch transcription which requires polling, results are returned immediately.

## API Reference

| Property | Value |
|----------|-------|
| **Endpoint** | `https://{region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe` |
| **API Version** | `2025-10-15` |
| **Max Audio** | 2 hours, 300 MB |
| **Formats** | WAV, MP3, FLAC, OGG, AAC |
| **Auth Header** | `Ocp-Apim-Subscription-Key` |

## Speaker Identification Strategies

### Strategy A: Stereo Channel Separation

For recordings where speakers are pre-separated on audio channels (e.g., agent on channel 0, customer on channel 1):

```python
definition = {
    "locales": ["en-US"],
    "channels": [0, 1]  # Transcribe each channel independently
}
```

**Advantages:**
- ~10% higher accuracy than diarization
- Handles overlapping speech cleanly
- No algorithmic guessing about speakers

### Strategy B: Mono Diarization

For single-channel recordings with mixed speakers:

```python
definition = {
    "locales": ["en-US"],
    "diarization": {
        "enabled": True,
        "maxSpeakers": 2  # 2-36 speakers supported
    }
}
```

**Considerations:**
- Relies on algorithms to detect "who spoke when"
- Can struggle with simultaneous speech or similar voices
- Set `maxSpeakers` to expected count for best results

## Environment Variables

```bash
# Required
AZURE_AI_SPEECH_ENDPOINT=https://swedencentral.api.cognitive.microsoft.com/
AZURE_AI_SPEECH_KEY=your-speech-api-key

# Optional - for embedding transcripts
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large
```

## Building Block Scripts

| Script | Purpose |
|--------|---------|
| `transcription_client.py` | Core API client with both strategies |
| `stereo_transcriber.py` | Stereo channel separation for contact center calls |
| `diarization_transcriber.py` | Mono diarization for mixed-speaker recordings |
| `contact_center_processor.py` | Full pipeline with speaker labeling and analytics |

## Quick Start

### Basic Transcription

```python
from scripts.transcription_client import TranscriptionClient

client = TranscriptionClient()

# Transcribe with stereo channels
result = client.transcribe_stereo("call_recording.wav")
print(f"Channel 0 (Agent): {result.channels[0].text}")
print(f"Channel 1 (Customer): {result.channels[1].text}")
```

### Mono with Diarization

```python
from scripts.transcription_client import TranscriptionClient

client = TranscriptionClient()

# Transcribe with speaker diarization
result = client.transcribe_with_diarization("mono_call.wav", max_speakers=2)
for phrase in result.phrases:
    print(f"Speaker {phrase.speaker}: {phrase.text}")
```

### Contact Center Pipeline

```python
from scripts.contact_center_processor import ContactCenterProcessor

processor = ContactCenterProcessor()
call_analysis = processor.process_call(
    audio_file="call.wav",
    strategy="stereo",  # or "diarization"
    agent_channel=0,
    customer_channel=1
)

print(f"Agent Transcript: {call_analysis.agent_transcript}")
print(f"Customer Transcript: {call_analysis.customer_transcript}")
print(f"Call Duration: {call_analysis.duration_seconds}s")
```

## REST API Examples

### curl - Stereo Channels

```bash
curl --location 'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15' \
--header 'Content-Type: multipart/form-data' \
--header 'Ocp-Apim-Subscription-Key: YOUR_KEY' \
--form 'audio=@"call_recording.wav"' \
--form 'definition="{\"locales\":[\"en-US\"], \"channels\": [0,1]}"'
```

### curl - Mono Diarization

```bash
curl --location 'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15' \
--header 'Content-Type: multipart/form-data' \
--header 'Ocp-Apim-Subscription-Key: YOUR_KEY' \
--form 'audio=@"mono_call.wav"' \
--form 'definition="{\"locales\":[\"en-US\"], \"diarization\": {\"maxSpeakers\": 2, \"enabled\": true}}"'
```

## Response Structure

### Stereo Response

```json
{
  "duration": "PT1M23S",
  "combinedPhrases": [
    {"channel": 0, "text": "Full text from channel 0"},
    {"channel": 1, "text": "Full text from channel 1"}
  ],
  "phrases": [
    {
      "channel": 0,
      "offset": "PT0.5S",
      "duration": "PT2.3S",
      "text": "Hello, thank you for calling."
    }
  ]
}
```

### Diarization Response

```json
{
  "duration": "PT1M23S",
  "combinedPhrases": [
    {"speaker": 1, "text": "Full text from speaker 1"},
    {"speaker": 2, "text": "Full text from speaker 2"}
  ],
  "phrases": [
    {
      "speaker": 1,
      "offset": "PT0.5S",
      "duration": "PT2.3S",
      "text": "Hello, how can I help you today?"
    }
  ]
}
```

## Contact Center Use Cases

### Quality Assurance Automation
Enable 100% call coverage vs. traditional 2-4 calls per agent per month. Companies report 20-30% cost savings.

### Compliance Monitoring
Automatically verify mandatory disclosures, script adherence, and PII handling. Essential for HIPAA, PCI-DSS, GDPR.

### Agent Coaching
Identify specific strengths and weaknesses with data-driven feedback within hours.

### Customer Sentiment Analysis
Detect early signs of dissatisfaction for proactive retention efforts.

### Post-Call Summarization
Auto-generate call summaries with reason for contact, steps taken, and resolution.

## Free Audio Sample Sources

| Source | Type | License | Best For |
|--------|------|---------|----------|
| VoxConverse | Mono, multi-speaker | CC BY 4.0 | Diarization testing |
| AMI Corpus | Mono, meeting recordings | CC BY 4.0 | Multi-participant scenarios |
| LibriSpeech | Mono, single speaker | CC BY 4.0 | Synthesizing stereo files |

## Lessons Learned

### Region Selection
Fast Transcription is available in limited regions. Use East US, West Europe, or Southeast Asia for best availability.

### Audio Format
Convert to 16-bit WAV, 16kHz for best compatibility. API accepts MP3, FLAC, OGG, AAC but WAV is most reliable.

### Channel Configuration
For stereo recordings, `channels: [0, 1]` transcribes both channels independently. Use `channels: [0]` for left-only.

### Diarization Accuracy
Set `maxSpeakers` to the known count. Setting it higher than actual speakers can reduce accuracy.

### Rate Limiting
Free tier provides 5 audio hours/month. For training sessions, use 30-60 second samples to avoid quota exhaustion.

### Error Handling
Common errors:
- HTTP 401/403: Key doesn't match region
- HTTP 429: Rate limited - stagger requests
- Audio format rejected: Convert to 16-bit WAV

## Dependencies

```
requests>=2.31.0
python-dotenv>=1.0.0
pydub>=0.25.1  # Optional, for audio format conversion
```

## References

- [Fast Transcription API Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/fast-transcription-create)
- [REST API Reference](https://learn.microsoft.com/en-us/rest/api/speechtotext/transcriptions/transcribe)
- [Call Center Overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/call-center-overview)
- [VoxConverse Dataset](https://www.robots.ox.ac.uk/~vgg/data/voxconverse/)
