# Voice Generation Workflows

Detailed workflows for common ElevenLabs audio generation tasks.

## Script Formatting for Natural Speech

### Punctuation for Pacing

```
# Poor pacing
Welcome to Module 1 today we will learn about job searching strategies

# Better pacing
Welcome to Module 1. Today, we'll learn about job searching strategies.

# Best pacing with natural pauses
Welcome to Module 1...

Today, we'll learn about job searching strategies—and how to stand out.
```

### Special Formatting

| Effect | Syntax | Example |
|--------|--------|---------|
| Pause | `...` or line break | "First point... second point" |
| Emphasis | ALL CAPS (sparingly) | "This is CRITICAL" |
| Slower pace | Add commas | "Step one, then step two, then step three" |
| Questions | Use `?` | "Ready to begin?" |

### Pronunciation Hints

For unusual words, add phonetic guidance in script comments:
```
# Script: Accessing the API [pronounce: A-P-I] endpoint...
Actual text: Accessing the API endpoint...
```

## Workflow: Course Voiceover Production

### Batch Processing Script

For processing multiple lesson scripts:

```javascript
#!/usr/bin/env node
import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

// This script prepares batch processing metadata
// Actual TTS calls go through ElevenLabs MCP

const scriptsDir = './content/scripts';
const outputDir = './content/audio';

async function prepareBatch() {
  const files = await readdir(scriptsDir);
  const scripts = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));

  const batch = [];
  for (const file of scripts) {
    const content = await readFile(join(scriptsDir, file), 'utf-8');
    const charCount = content.length;

    batch.push({
      input: join(scriptsDir, file),
      output: join(outputDir, basename(file).replace(/\.(md|txt)$/, '.mp3')),
      characters: charCount,
      estimatedCredits: charCount // 1 credit per character
    });
  }

  console.log('Batch prepared:');
  console.log(JSON.stringify(batch, null, 2));
  console.log(`\nTotal characters: ${batch.reduce((sum, b) => sum + b.characters, 0)}`);
}

prepareBatch();
```

### Voice Selection Strategy

1. **List available voices** using MCP `get_voices` tool
2. **Test top 3 candidates** with a 2-sentence sample
3. **Select based on**:
   - Clarity and pronunciation
   - Appropriate tone for content
   - Consistency across different text types

### Production Checklist

- [ ] All scripts reviewed and finalized
- [ ] Voice selected and tested
- [ ] Output directory structure created
- [ ] API credits sufficient for full batch
- [ ] Naming convention established (e.g., `module-01-lesson-03.mp3`)

## Workflow: Voice Cloning

### Preparing Source Audio

**Requirements:**
- 1-3 minutes of clean audio (minimum 30 seconds)
- High quality recording (no compression artifacts)
- Consistent volume levels
- No background noise or music
- Clear articulation

**Ideal Sources:**
- Professional podcast recordings
- Audiobook samples
- Studio-quality voice recordings

**Poor Sources:**
- Phone call recordings
- Videos with background music
- Compressed social media audio

### Cloning Process

1. **Prepare audio file** (MP3, WAV, or M4A)
2. **Upload via MCP**: Use `voice_clone` tool with file path
3. **Name descriptively**: "project-narrator-warm-female"
4. **Test thoroughly** before production use

### Voice Clone Quality Tips

- Provide emotionally diverse samples (happy, serious, questioning)
- Include varied sentence lengths
- Avoid samples with unusual acoustics (reverb, echo)

## Workflow: Audio Transcription

### Transcribing Existing Content

```
Transcribe: ./recordings/interview-episode-12.mp3
Options:
- Enable speaker diarization
- Request timestamps
- Language: English
```

### Post-Processing Transcripts

1. **Review for accuracy** - especially names, technical terms
2. **Format for readability** - add paragraphs, headers
3. **Add speaker labels** if not automatically detected
4. **Create timestamps** for video synchronization

### Transcript Output Format

```markdown
# Interview Episode 12 Transcript

**Duration**: 45:32
**Speakers**: Host (Sarah), Guest (Dr. Smith)

## Introduction [00:00 - 02:15]

**Sarah**: Welcome to the show. Today we're joined by...

**Dr. Smith**: Thank you for having me...

## Main Discussion [02:15 - 35:00]

...
```

## Workflow: Sound Effects Generation

### Categories for Course Production

| Category | Example Prompts |
|----------|-----------------|
| Transitions | "Gentle whoosh transition", "Page turn sound" |
| Notifications | "Soft chime notification", "Success achievement sound" |
| Ambient | "Quiet office background", "Coffee shop ambience" |
| UI Feedback | "Button click", "Error buzzer gentle" |

### Sound Effect Naming Convention

```
sfx-[category]-[description].mp3

Examples:
sfx-transition-whoosh-soft.mp3
sfx-notification-success-chime.mp3
sfx-ambient-office-quiet.mp3
```

## Workflow: Multi-Speaker Dialogue

### Script Format for Dialogues

```markdown
# Lesson 5: Interview Role Play

[INTERVIEWER - Professional, warm tone]
Tell me about a time you faced a challenge at work.

[CANDIDATE - Confident, measured pace]
In my previous role, we faced a critical deadline when our main developer left unexpectedly...

[INTERVIEWER]
How did you handle the pressure?
```

### Production Approach

1. **Assign distinct voices** to each speaker
2. **Generate segments separately** for each speaker
3. **Maintain consistent voice settings** throughout
4. **Use eleven_multilingual_v2** for longest stability

## Quality Assurance

### Audio Review Checklist

- [ ] No pronunciation errors on key terms
- [ ] Natural pacing throughout
- [ ] Consistent volume levels
- [ ] No audio artifacts or glitches
- [ ] Appropriate emotional tone
- [ ] Correct file naming and organization

### Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| Robotic pacing | Add more punctuation, use `...` for pauses |
| Mispronunciation | Try alternate spelling or phonetic version |
| Inconsistent volume | Process through audio normalization |
| Unnatural emphasis | Restructure sentence, avoid ALL CAPS |
| Cutting off | Add period and pause at end of text |

## Integration with Course OS

### Phase 9 (Media Production) Integration

Audio files generated through this skill integrate with Course OS Phase 9:

```
production/
├── shot-lists/
│   └── module-01-audio-shots.yaml
├── assets/
│   └── audio/
│       ├── voiceovers/
│       ├── sound-effects/
│       └── music/
└── handoff/
    └── phase-9/
        └── audio-manifest.yaml
```

### Audio Manifest Format

```yaml
# audio-manifest.yaml
voiceovers:
  - file: module-01-lesson-01.mp3
    duration: "5:32"
    voice: "professional-narrator"
    model: "eleven_multilingual_v2"
    generated: "2025-01-15"

sound_effects:
  - file: sfx-transition-whoosh.mp3
    category: transition
    usage: "Between major sections"
```
