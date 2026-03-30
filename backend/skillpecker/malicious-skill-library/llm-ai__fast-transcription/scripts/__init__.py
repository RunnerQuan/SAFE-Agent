"""
Azure AI Speech Fast Transcription Scripts

Building blocks for transcribing contact center calls with speaker identification.
"""

from .transcription_client import TranscriptionClient, TranscriptionResult
from .stereo_transcriber import StereoTranscriber
from .diarization_transcriber import DiarizationTranscriber
from .contact_center_processor import ContactCenterProcessor

__all__ = [
    "TranscriptionClient",
    "TranscriptionResult",
    "StereoTranscriber",
    "DiarizationTranscriber",
    "ContactCenterProcessor",
]
