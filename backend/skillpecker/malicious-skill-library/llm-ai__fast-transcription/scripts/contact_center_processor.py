"""
Contact Center Call Processor

Full pipeline for processing contact center recordings with
speaker identification, transcript formatting, and basic analytics.
"""

import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
from dotenv import load_dotenv

try:
    from .transcription_client import TranscriptionClient
    from .stereo_transcriber import StereoTranscriber
    from .diarization_transcriber import DiarizationTranscriber
except ImportError:
    from transcription_client import TranscriptionClient
    from stereo_transcriber import StereoTranscriber
    from diarization_transcriber import DiarizationTranscriber

load_dotenv()


class TranscriptionStrategy(Enum):
    """Strategy for speaker identification."""
    STEREO = "stereo"
    DIARIZATION = "diarization"


@dataclass
class CallAnalysis:
    """Analysis of a contact center call."""
    # Transcripts
    agent_transcript: str
    customer_transcript: str
    combined_transcript: str

    # Conversation flow
    conversation: List[Dict[str, Any]]

    # Metadata
    duration: str
    duration_seconds: float
    strategy: str

    # Analytics
    agent_word_count: int
    customer_word_count: int
    talk_ratio: float  # agent words / total words

    # Raw data
    raw_result: Dict[str, Any] = field(default_factory=dict)


class ContactCenterProcessor:
    """
    Full-featured contact center call processor.

    Combines transcription with basic analytics for:
    - Quality assurance
    - Compliance monitoring
    - Agent coaching
    - Customer sentiment insights
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        """
        Initialize contact center processor.

        Args:
            endpoint: Azure Speech endpoint
            api_key: Azure Speech API key
        """
        self.stereo = StereoTranscriber(endpoint=endpoint, api_key=api_key)
        self.diarization = DiarizationTranscriber(endpoint=endpoint, api_key=api_key)

    def process_call(
        self,
        audio_file: str,
        strategy: str = "stereo",
        agent_channel: int = 0,
        customer_channel: int = 1,
        max_speakers: int = 2,
        locales: List[str] = None,
    ) -> CallAnalysis:
        """
        Process a contact center call recording.

        Args:
            audio_file: Path to audio file
            strategy: "stereo" or "diarization"
            agent_channel: Agent channel for stereo (default: 0)
            customer_channel: Customer channel for stereo (default: 1)
            max_speakers: Max speakers for diarization (default: 2)
            locales: Language codes (default: ["en-US"])

        Returns:
            CallAnalysis with transcripts and analytics
        """
        if strategy == "stereo":
            return self._process_stereo(
                audio_file=audio_file,
                agent_channel=agent_channel,
                customer_channel=customer_channel,
                locales=locales,
            )
        elif strategy == "diarization":
            return self._process_diarization(
                audio_file=audio_file,
                max_speakers=max_speakers,
                locales=locales,
            )
        else:
            raise ValueError(f"Unknown strategy: {strategy}. Use 'stereo' or 'diarization'.")

    def _process_stereo(
        self,
        audio_file: str,
        agent_channel: int,
        customer_channel: int,
        locales: List[str],
    ) -> CallAnalysis:
        """Process stereo recording."""
        self.stereo.agent_channel = agent_channel
        self.stereo.customer_channel = customer_channel

        result = self.stereo.transcribe(audio_file, locales=locales)

        # Build conversation flow
        conversation = self._build_conversation_stereo(result)

        # Calculate analytics
        agent_words = len(result.agent_transcript.split())
        customer_words = len(result.customer_transcript.split())
        total_words = agent_words + customer_words
        talk_ratio = agent_words / total_words if total_words > 0 else 0

        return CallAnalysis(
            agent_transcript=result.agent_transcript,
            customer_transcript=result.customer_transcript,
            combined_transcript=f"{result.agent_transcript} {result.customer_transcript}",
            conversation=conversation,
            duration=result.duration,
            duration_seconds=self._parse_duration(result.duration),
            strategy="stereo",
            agent_word_count=agent_words,
            customer_word_count=customer_words,
            talk_ratio=talk_ratio,
        )

    def _process_diarization(
        self,
        audio_file: str,
        max_speakers: int,
        locales: List[str],
    ) -> CallAnalysis:
        """Process mono recording with diarization."""
        result = self.diarization.transcribe(
            audio_file,
            max_speakers=max_speakers,
            locales=locales,
        )

        # Assume speaker 1 is agent, speaker 2 is customer
        # (In production, you might use voice recognition or other heuristics)
        agent_transcript = result.speakers.get(1, "")
        customer_transcript = result.speakers.get(2, "")

        # Build conversation flow
        conversation = self._build_conversation_diarization(result)

        # Calculate analytics
        agent_words = len(agent_transcript.split())
        customer_words = len(customer_transcript.split())
        total_words = agent_words + customer_words
        talk_ratio = agent_words / total_words if total_words > 0 else 0

        return CallAnalysis(
            agent_transcript=agent_transcript,
            customer_transcript=customer_transcript,
            combined_transcript=result.combined_text,
            conversation=conversation,
            duration=result.duration,
            duration_seconds=self._parse_duration(result.duration),
            strategy="diarization",
            agent_word_count=agent_words,
            customer_word_count=customer_words,
            talk_ratio=talk_ratio,
        )

    def _build_conversation_stereo(self, result) -> List[Dict[str, Any]]:
        """Build conversation list from stereo result."""
        conversation = []

        # Merge phrases from both channels by offset
        all_phrases = []
        for phrase in result.agent_phrases:
            all_phrases.append({
                "speaker": "Agent",
                "text": phrase["text"],
                "offset": phrase["offset"],
            })
        for phrase in result.customer_phrases:
            all_phrases.append({
                "speaker": "Customer",
                "text": phrase["text"],
                "offset": phrase["offset"],
            })

        # Sort by offset
        all_phrases.sort(key=lambda x: self._parse_offset(x["offset"]))

        return all_phrases

    def _build_conversation_diarization(self, result) -> List[Dict[str, Any]]:
        """Build conversation list from diarization result."""
        speaker_labels = {1: "Agent", 2: "Customer"}

        return [
            {
                "speaker": speaker_labels.get(seg.speaker_id, f"Speaker {seg.speaker_id}"),
                "text": seg.text,
                "offset": seg.offset,
            }
            for seg in result.segments
        ]

    def _parse_duration(self, duration: str) -> float:
        """
        Parse ISO 8601 duration to seconds.

        Args:
            duration: Duration string (e.g., "PT1M23S")

        Returns:
            Duration in seconds
        """
        if not duration:
            return 0.0

        import re
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?'
        match = re.match(pattern, duration)

        if not match:
            return 0.0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = float(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def _parse_offset(self, offset: str) -> float:
        """Parse ISO 8601 offset to seconds."""
        return self._parse_duration(offset)

    def format_conversation(
        self,
        analysis: CallAnalysis,
        include_timestamps: bool = True,
    ) -> str:
        """
        Format conversation as readable text.

        Args:
            analysis: CallAnalysis object
            include_timestamps: Whether to include timestamps

        Returns:
            Formatted conversation string
        """
        lines = []
        for turn in analysis.conversation:
            if include_timestamps:
                lines.append(f"[{turn['offset']}] {turn['speaker']}: {turn['text']}")
            else:
                lines.append(f"{turn['speaker']}: {turn['text']}")

        return "\n".join(lines)

    def get_summary(self, analysis: CallAnalysis) -> Dict[str, Any]:
        """
        Get a summary of the call analysis.

        Args:
            analysis: CallAnalysis object

        Returns:
            Summary dictionary
        """
        return {
            "duration_seconds": analysis.duration_seconds,
            "strategy": analysis.strategy,
            "agent_word_count": analysis.agent_word_count,
            "customer_word_count": analysis.customer_word_count,
            "total_word_count": analysis.agent_word_count + analysis.customer_word_count,
            "agent_talk_ratio": round(analysis.talk_ratio * 100, 1),
            "customer_talk_ratio": round((1 - analysis.talk_ratio) * 100, 1),
            "conversation_turns": len(analysis.conversation),
        }


if __name__ == "__main__":
    print("=" * 60)
    print("Contact Center Processor - Test")
    print("=" * 60)

    # Load from project root .env
    load_dotenv("C:/Users/User/Desktop/test/.env")

    try:
        processor = ContactCenterProcessor()
        print(f"\n[OK] Contact center processor initialized")

        import sys
        if len(sys.argv) > 1:
            audio_file = sys.argv[1]
            strategy = sys.argv[2] if len(sys.argv) > 2 else "stereo"
            print(f"\n--- Processing call: {audio_file} ---")
            print(f"    Strategy: {strategy}")

            analysis = processor.process_call(
                audio_file=audio_file,
                strategy=strategy,
            )

            print(f"\n[OK] Call processed")
            print(f"\n--- Summary ---")
            summary = processor.get_summary(analysis)
            for key, value in summary.items():
                print(f"    {key}: {value}")

            print(f"\n--- Conversation (first 500 chars) ---")
            conversation = processor.format_conversation(analysis)
            print(conversation[:500])
            if len(conversation) > 500:
                print("...")

        else:
            print("\n[INFO] No audio file provided")
            print("Usage: python contact_center_processor.py <audio_file> [stereo|diarization]")

        print("\n" + "=" * 60)
        print("[SUCCESS] Contact center processor ready!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
