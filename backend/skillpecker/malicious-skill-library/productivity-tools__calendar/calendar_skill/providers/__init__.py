"""Calendar providers package."""

from calendar_skill.config import CalendarSource
from calendar_skill.providers.base import CalendarProvider
from calendar_skill.providers.caldav_provider import CalDAVProvider
from calendar_skill.providers.ics import ICSProvider

__all__ = ["CalDAVProvider", "CalendarProvider", "ICSProvider"]


def get_provider(source: CalendarSource, timezone: str) -> CalendarProvider:
    """Factory function to create the appropriate provider for a calendar source."""

    if source.type == "ics":
        return ICSProvider(source, timezone)
    if source.type == "caldav":
        return CalDAVProvider(source, timezone)
    raise ValueError(f"Unknown calendar type: {source.type}")
