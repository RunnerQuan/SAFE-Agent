"""
Stereo Channel Transcriber

Specialized transcription for stereo recordings with pre-separated speakers
(e.g., agent on channel 0, customer on channel 1).
"""

import os
from typing import Optional, List
from dataclasses import dataclass
from dotenv import load_dotenv

try:
    from .transcription_client import TranscriptionClient, TranscriptionResult
except ImportError:
    from transcription_client import TranscriptionClient, TranscriptionResult

load_dotenv()


@dataclass
class StereoCallTranscript:
    """Transcript of a stereo call with agent/customer separation."""
    agent_transcript: str
    customer_transcript: str
    agent_phrases: List[dict]
    customer_phrases: List[dict]
    duration: str
    agent_channel: int
    customer_channel: int


class StereoTranscriber:
    """
    Transcriber for stereo recordings with channel separation.

    Ideal for contact center recordings where:
    - Agent audio is on channel 0 (left)
    - Customer audio is on channel 1 (right)

    Provides ~10% higher accuracy than diarization because speaker
    separation happens at the recording level, not algorithmically.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        agent_channel: int = 0,
        customer_channel: int = 1,
    ):
        """
        Initialize stereo transcriber.

        Args:
            endpoint: Azure Speech endpoint
            api_key: Azure Speech API key
            agent_channel: Channel number for agent (default: 0)
            customer_channel: Channel number for customer (default: 1)
        """
        self.client = TranscriptionClient(endpoint=endpoint, api_key=api_key)
        self.agent_channel = agent_channel
        self.customer_channel = customer_channel

    def transcribe(
        self,
        audio_file: str,
        locales: List[str] = None,
    ) -> StereoCallTranscript:
        """
        Transcribe a stereo call recording.

        Args:
            audio_file: Path to stereo audio file
            locales: Language codes (default: ["en-US"])

        Returns:
            StereoCallTranscript with separated agent/customer transcripts
        """
        channels = [self.agent_channel, self.customer_channel]
        result = self.client.transcribe_stereo(
            audio_file=audio_file,
            locales=locales,
            channels=channels,
        )

        return self._parse_result(result)

    def _parse_result(self, result: TranscriptionResult) -> StereoCallTranscript:
        """
        Parse transcription result into StereoCallTranscript.

        Args:
            result: Raw TranscriptionResult

        Returns:
            StereoCallTranscript
        """
        agent_transcript = ""
        customer_transcript = ""
        agent_phrases = []
        customer_phrases = []

        for channel in result.channels:
            if channel.channel == self.agent_channel:
                agent_transcript = channel.text
                agent_phrases = [
                    {
                        "text": p.text,
                        "offset": p.offset,
                        "duration": p.duration,
                    }
                    for p in channel.phrases
                ]
            elif channel.channel == self.customer_channel:
                customer_transcript = channel.text
                customer_phrases = [
                    {
                        "text": p.text,
                        "offset": p.offset,
                        "duration": p.duration,
                    }
                    for p in channel.phrases
                ]

        return StereoCallTranscript(
            agent_transcript=agent_transcript,
            customer_transcript=customer_transcript,
            agent_phrases=agent_phrases,
            customer_phrases=customer_phrases,
            duration=result.duration,
            agent_channel=self.agent_channel,
            customer_channel=self.customer_channel,
        )

    def transcribe_agent_only(
        self,
        audio_file: str,
        locales: List[str] = None,
    ) -> str:
        """
        Transcribe only the agent channel.

        Args:
            audio_file: Path to stereo audio file
            locales: Language codes

        Returns:
            Agent transcript text
        """
        result = self.client.transcribe_stereo(
            audio_file=audio_file,
            locales=locales,
            channels=[self.agent_channel],
        )

        for channel in result.channels:
            if channel.channel == self.agent_channel:
                return channel.text

        return ""

    def transcribe_customer_only(
        self,
        audio_file: str,
        locales: List[str] = None,
    ) -> str:
        """
        Transcribe only the customer channel.

        Args:
            audio_file: Path to stereo audio file
            locales: Language codes

        Returns:
            Customer transcript text
        """
        result = self.client.transcribe_stereo(
            audio_file=audio_file,
            locales=locales,
            channels=[self.customer_channel],
        )

        for channel in result.channels:
            if channel.channel == self.customer_channel:
                return channel.text

        return ""


if __name__ == "__main__":
    print("=" * 60)
    print("Stereo Transcriber - Test")
    print("=" * 60)

    # Load from project root .env
    load_dotenv("C:/Users/User/Desktop/test/.env")

    try:
        transcriber = StereoTranscriber()
        print(f"\n[OK] Stereo transcriber initialized")
        print(f"    Agent channel: {transcriber.agent_channel}")
        print(f"    Customer channel: {transcriber.customer_channel}")

        import sys
        if len(sys.argv) > 1:
            audio_file = sys.argv[1]
            print(f"\n--- Transcribing stereo: {audio_file} ---")

            result = transcriber.transcribe(audio_file)
            print(f"\n[OK] Transcription complete")
            print(f"    Duration: {result.duration}")
            print(f"\nAgent ({result.agent_channel}):")
            print(f"    {result.agent_transcript[:200]}..." if len(result.agent_transcript) > 200 else f"    {result.agent_transcript}")
            print(f"\nCustomer ({result.customer_channel}):")
            print(f"    {result.customer_transcript[:200]}..." if len(result.customer_transcript) > 200 else f"    {result.customer_transcript}")
        else:
            print("\n[INFO] No audio file provided")
            print("Usage: python stereo_transcriber.py <stereo_audio_file>")

        print("\n" + "=" * 60)
        print("[SUCCESS] Stereo transcriber ready!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
