"""
Diarization Transcriber

Speaker identification for mono recordings where multiple speakers
are mixed on a single audio channel.
"""

import os
from typing import Optional, List, Dict
from dataclasses import dataclass, field
from dotenv import load_dotenv

try:
    from .transcription_client import TranscriptionClient, TranscriptionResult
except ImportError:
    from transcription_client import TranscriptionClient, TranscriptionResult

load_dotenv()


@dataclass
class SpeakerSegment:
    """A segment of speech from a single speaker."""
    speaker_id: int
    text: str
    offset: str
    duration: str


@dataclass
class DiarizedTranscript:
    """Transcript with speaker diarization."""
    speakers: Dict[int, str]  # speaker_id -> full transcript
    segments: List[SpeakerSegment]  # chronological segments
    combined_text: str
    duration: str
    num_speakers: int


class DiarizationTranscriber:
    """
    Transcriber with speaker diarization for mono recordings.

    Uses Azure AI Speech's diarization feature to identify "who spoke when"
    in single-channel recordings with mixed speakers.

    Considerations:
    - Can struggle with simultaneous speech or crosstalk
    - Accuracy depends on voice distinctiveness
    - Set max_speakers to expected count for best results
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        default_max_speakers: int = 2,
    ):
        """
        Initialize diarization transcriber.

        Args:
            endpoint: Azure Speech endpoint
            api_key: Azure Speech API key
            default_max_speakers: Default max speakers (2-36)
        """
        self.client = TranscriptionClient(endpoint=endpoint, api_key=api_key)
        self.default_max_speakers = default_max_speakers

    def transcribe(
        self,
        audio_file: str,
        max_speakers: Optional[int] = None,
        locales: List[str] = None,
    ) -> DiarizedTranscript:
        """
        Transcribe a mono recording with speaker diarization.

        Args:
            audio_file: Path to mono audio file
            max_speakers: Maximum number of speakers (2-36)
            locales: Language codes (default: ["en-US"])

        Returns:
            DiarizedTranscript with speaker-labeled segments
        """
        if max_speakers is None:
            max_speakers = self.default_max_speakers

        result = self.client.transcribe_with_diarization(
            audio_file=audio_file,
            max_speakers=max_speakers,
            locales=locales,
        )

        return self._parse_result(result)

    def _parse_result(self, result: TranscriptionResult) -> DiarizedTranscript:
        """
        Parse transcription result into DiarizedTranscript.

        Args:
            result: Raw TranscriptionResult

        Returns:
            DiarizedTranscript
        """
        segments = []
        speaker_ids = set()

        for phrase in result.phrases:
            if phrase.speaker is not None:
                speaker_ids.add(phrase.speaker)
                segments.append(SpeakerSegment(
                    speaker_id=phrase.speaker,
                    text=phrase.text,
                    offset=phrase.offset,
                    duration=phrase.duration,
                ))

        return DiarizedTranscript(
            speakers=result.speakers,
            segments=segments,
            combined_text=result.combined_text,
            duration=result.duration,
            num_speakers=len(speaker_ids),
        )

    def get_speaker_transcript(
        self,
        transcript: DiarizedTranscript,
        speaker_id: int,
    ) -> str:
        """
        Get the full transcript for a specific speaker.

        Args:
            transcript: DiarizedTranscript
            speaker_id: Speaker ID to extract

        Returns:
            Full transcript text for the speaker
        """
        return transcript.speakers.get(speaker_id, "")

    def get_conversation_flow(
        self,
        transcript: DiarizedTranscript,
        speaker_labels: Optional[Dict[int, str]] = None,
    ) -> str:
        """
        Format transcript as a conversation with speaker labels.

        Args:
            transcript: DiarizedTranscript
            speaker_labels: Optional mapping of speaker_id -> label
                           (e.g., {1: "Agent", 2: "Customer"})

        Returns:
            Formatted conversation string
        """
        if speaker_labels is None:
            speaker_labels = {
                sid: f"Speaker {sid}" for sid in transcript.speakers.keys()
            }

        lines = []
        for segment in transcript.segments:
            label = speaker_labels.get(segment.speaker_id, f"Speaker {segment.speaker_id}")
            lines.append(f"[{segment.offset}] {label}: {segment.text}")

        return "\n".join(lines)

    def identify_dominant_speaker(
        self,
        transcript: DiarizedTranscript,
    ) -> int:
        """
        Identify the speaker with the most speech.

        Args:
            transcript: DiarizedTranscript

        Returns:
            Speaker ID of the dominant speaker
        """
        word_counts = {}
        for speaker_id, text in transcript.speakers.items():
            word_counts[speaker_id] = len(text.split())

        if not word_counts:
            return 1

        return max(word_counts, key=word_counts.get)


if __name__ == "__main__":
    print("=" * 60)
    print("Diarization Transcriber - Test")
    print("=" * 60)

    # Load from project root .env
    load_dotenv("C:/Users/User/Desktop/test/.env")

    try:
        transcriber = DiarizationTranscriber()
        print(f"\n[OK] Diarization transcriber initialized")
        print(f"    Default max speakers: {transcriber.default_max_speakers}")

        import sys
        if len(sys.argv) > 1:
            audio_file = sys.argv[1]
            max_speakers = int(sys.argv[2]) if len(sys.argv) > 2 else 2
            print(f"\n--- Transcribing with diarization: {audio_file} ---")
            print(f"    Max speakers: {max_speakers}")

            result = transcriber.transcribe(audio_file, max_speakers=max_speakers)
            print(f"\n[OK] Transcription complete")
            print(f"    Duration: {result.duration}")
            print(f"    Speakers detected: {result.num_speakers}")

            # Show conversation flow
            conversation = transcriber.get_conversation_flow(result)
            print(f"\nConversation:\n{conversation[:500]}...")

        else:
            print("\n[INFO] No audio file provided")
            print("Usage: python diarization_transcriber.py <mono_audio_file> [max_speakers]")

        print("\n" + "=" * 60)
        print("[SUCCESS] Diarization transcriber ready!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
