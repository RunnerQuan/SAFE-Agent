"""Sink-specific oracle implementations."""

from .base import BaseOracle
from .cmdi import CMDiOracle
from .codei import CODEiOracle
from .sqli import SQLiOracle
from .ssrf import SSRFOracle
from .ssti import SSTIOracle

__all__ = [
    "BaseOracle",
    "CMDiOracle",
    "CODEiOracle",
    "SQLiOracle",
    "SSRFOracle",
    "SSTIOracle",
]
