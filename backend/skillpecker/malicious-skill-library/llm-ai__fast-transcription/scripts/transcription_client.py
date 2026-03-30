"""
Azure AI Speech Fast Transcription Client

Core API client for synchronous, faster-than-real-time transcription.
Supports both stereo channel separation and mono diarization.
"""

import os
import json
import requests
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Phrase:
    """A transcribed phrase with timing and speaker info."""
    text: str
    offset: str
    duration: str
    channel: Optional[int] = None
    speaker: Optional[int] = None
    confidence: Optional[float] = None


@dataclass
class ChannelResult:
    """Transcription result for a single audio channel."""
    channel: int
    text: str
    phrases: List[Phrase] = field(default_factory=list)


@dataclass
class TranscriptionResult:
    """Complete transcription result."""
    duration: str
    combined_text: str
    phrases: List[Phrase] = field(default_factory=list)
    channels: List[ChannelResult] = field(default_factory=list)
    speakers: Dict[int, str] = field(default_factory=dict)
    raw_response: Dict[str, Any] = field(default_factory=dict)


class TranscriptionClient:
    """
    Azure AI Speech Fast Transcription client.

    Provides synchronous transcription with two strategies:
    - Stereo channel separation (agent/customer on separate channels)
    - Mono diarization (speaker identification in single-channel audio)
    """

    API_VERSION = "2025-10-15"

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """
        Initialize transcription client.

        Args:
            endpoint: Azure Speech endpoint (or AZURE_AI_SPEECH_ENDPOINT env var)
            api_key: Azure Speech API key (or AZURE_AI_SPEECH_KEY env var)
        """
        self.endpoint = endpoint or os.environ.get("AZURE_AI_SPEECH_ENDPOINT")
        self.api_key = api_key or os.environ.get("AZURE_AI_SPEECH_KEY")

        if not self.endpoint:
            raise ValueError("AZURE_AI_SPEECH_ENDPOINT is required")
        if not self.api_key:
            raise ValueError("AZURE_AI_SPEECH_KEY is required")

        # Normalize endpoint
        self.endpoint = self.endpoint.rstrip("/")

        # Build API URL
        self.api_url = f"{self.endpoint}/speechtotext/transcriptions:transcribe?api-version={self.API_VERSION}"

    def transcribe_stereo(
        self,
        audio_file: str,
        locales: List[str] = None,
        channels: List[int] = None,
    ) -> TranscriptionResult:
        """
        Transcribe a stereo audio file with channel separation.

        Args:
            audio_file: Path to audio file (WAV, MP3, FLAC, OGG, AAC)
            locales: Language codes (default: ["en-US"])
            channels: Channels to transcribe (default: [0, 1])

        Returns:
            TranscriptionResult with per-channel transcripts
        """
        if locales is None:
            locales = ["en-US"]
        if channels is None:
            channels = [0, 1]

        definition = {
            "locales": locales,
            "channels": channels,
        }

        return self._transcribe(audio_file, definition)

    def transcribe_with_diarization(
        self,
        audio_file: str,
        max_speakers: int = 2,
        locales: List[str] = None,
    ) -> TranscriptionResult:
        """
        Transcribe a mono audio file with speaker diarization.

        Args:
            audio_file: Path to audio file (WAV, MP3, FLAC, OGG, AAC)
            max_speakers: Maximum number of speakers (2-36)
            locales: Language codes (default: ["en-US"])

        Returns:
            TranscriptionResult with speaker-labeled phrases
        """
        if locales is None:
            locales = ["en-US"]

        if max_speakers < 2 or max_speakers > 36:
            raise ValueError("max_speakers must be between 2 and 36")

        definition = {
            "locales": locales,
            "diarization": {
                "enabled": True,
                "maxSpeakers": max_speakers,
            },
        }

        return self._transcribe(audio_file, definition)

    def transcribe_basic(
        self,
        audio_file: str,
        locales: List[str] = None,
    ) -> TranscriptionResult:
        """
        Basic transcription without speaker identification.

        Args:
            audio_file: Path to audio file
            locales: Language codes (default: ["en-US"])

        Returns:
            TranscriptionResult with combined transcript
        """
        if locales is None:
            locales = ["en-US"]

        definition = {"locales": locales}

        return self._transcribe(audio_file, definition)

    def _transcribe(
        self,
        audio_file: str,
        definition: Dict[str, Any],
    ) -> TranscriptionResult:
        """
        Execute transcription API call.

        Args:
            audio_file: Path to audio file
            definition: API definition object

        Returns:
            TranscriptionResult
        """
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file not found: {audio_file}")

        # Determine content type
        ext = os.path.splitext(audio_file)[1].lower()
        content_types = {
            ".wav": "audio/wav",
            ".mp3": "audio/mpeg",
            ".flac": "audio/flac",
            ".ogg": "audio/ogg",
            ".aac": "audio/aac",
        }
        content_type = content_types.get(ext, "audio/wav")

        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
        }

        with open(audio_file, "rb") as f:
            files = {
                "audio": (os.path.basename(audio_file), f, content_type),
                "definition": (None, json.dumps(definition), "application/json"),
            }

            response = requests.post(
                self.api_url,
                headers=headers,
                files=files,
            )

        if response.status_code != 200:
            error_detail = response.text
            raise Exception(f"Transcription failed ({response.status_code}): {error_detail}")

        return self._parse_response(response.json())

    def _parse_response(self, data: Dict[str, Any]) -> TranscriptionResult:
        """
        Parse API response into TranscriptionResult.

        Args:
            data: Raw API response

        Returns:
            TranscriptionResult
        """
        result = TranscriptionResult(
            duration=data.get("duration", ""),
            combined_text="",
            raw_response=data,
        )

        # Parse phrases
        for phrase_data in data.get("phrases", []):
            phrase = Phrase(
                text=phrase_data.get("text", ""),
                offset=phrase_data.get("offset", ""),
                duration=phrase_data.get("duration", ""),
                channel=phrase_data.get("channel"),
                speaker=phrase_data.get("speaker"),
                confidence=phrase_data.get("confidence"),
            )
            result.phrases.append(phrase)

        # Parse combined phrases (per-channel or per-speaker)
        combined_phrases = data.get("combinedPhrases", [])

        # Check if this is channel-based or speaker-based
        if combined_phrases and "channel" in combined_phrases[0]:
            # Channel-based (stereo)
            channels_dict: Dict[int, ChannelResult] = {}
            for cp in combined_phrases:
                ch = cp.get("channel", 0)
                if ch not in channels_dict:
                    channels_dict[ch] = ChannelResult(channel=ch, text="")
                channels_dict[ch].text = cp.get("text", "")

            result.channels = [channels_dict[k] for k in sorted(channels_dict.keys())]

            # Assign phrases to channels
            for phrase in result.phrases:
                if phrase.channel is not None and phrase.channel in channels_dict:
                    channels_dict[phrase.channel].phrases.append(phrase)

            # Combine all channel texts
            result.combined_text = " ".join(ch.text for ch in result.channels)

        elif combined_phrases and "speaker" in combined_phrases[0]:
            # Speaker-based (diarization)
            for cp in combined_phrases:
                speaker_id = cp.get("speaker", 0)
                result.speakers[speaker_id] = cp.get("text", "")

            # Combine all speaker texts in order
            result.combined_text = " ".join(result.speakers.get(k, "") for k in sorted(result.speakers.keys()))

        else:
            # Basic transcription
            result.combined_text = " ".join(p.text for p in result.phrases)

        return result


if __name__ == "__main__":
    print("=" * 60)
    print("Azure AI Speech Fast Transcription Client - Test")
    print("=" * 60)

    # Load from project root .env
    load_dotenv("C:/Users/User/Desktop/test/.env")

    # Check environment
    endpoint = os.environ.get("AZURE_AI_SPEECH_ENDPOINT")
    api_key = os.environ.get("AZURE_AI_SPEECH_KEY")

    if not endpoint:
        print("\n[ERROR] AZURE_AI_SPEECH_ENDPOINT not set")
        exit(1)
    if not api_key:
        print("\n[ERROR] AZURE_AI_SPEECH_KEY not set")
        exit(1)

    try:
        client = TranscriptionClient()
        print(f"\n[OK] Client initialized")
        print(f"    Endpoint: {client.endpoint}")
        print(f"    API URL: {client.api_url}")

        # Note: To test, you need an actual audio file
        # Example: python transcription_client.py path/to/audio.wav
        import sys
        if len(sys.argv) > 1:
            audio_file = sys.argv[1]
            print(f"\n--- Transcribing: {audio_file} ---")

            result = client.transcribe_basic(audio_file)
            print(f"\n[OK] Transcription complete")
            print(f"    Duration: {result.duration}")
            print(f"    Text: {result.combined_text[:200]}...")
        else:
            print("\n[INFO] No audio file provided")
            print("Usage: python transcription_client.py <audio_file>")
            print("\nClient is ready for use with:")
            print("  - client.transcribe_stereo(file)")
            print("  - client.transcribe_with_diarization(file)")
            print("  - client.transcribe_basic(file)")

        print("\n" + "=" * 60)
        print("[SUCCESS] Transcription client working!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
