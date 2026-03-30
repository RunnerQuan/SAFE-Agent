"""Calendar skill data models."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class CalendarEvent(BaseModel):
    """Represents a calendar event."""

    uid: str = Field(description="Unique identifier for the event")
    summary: str = Field(description="Event title/summary")
    description: Optional[str] = Field(default=None, description="Event description")
    location: Optional[str] = Field(default=None, description="Event location")
    start: datetime = Field(
        description="Event start time (normalized to configured TZ)"
    )
    end: datetime = Field(description="Event end time (normalized to configured TZ)")
    all_day: bool = Field(default=False, description="Whether this is an all-day event")
    rrule: Optional[str] = Field(
        default=None, description="Recurrence rule (RRULE string, unexpanded)"
    )
    attendees: list[str] = Field(
        default_factory=list, description="List of attendee emails"
    )
    organizer: Optional[str] = Field(default=None, description="Organizer email")
    status: Literal["confirmed", "tentative", "cancelled"] = Field(
        default="confirmed", description="Event status"
    )
    calendar_name: str = Field(description="Name of the calendar this event belongs to")


class EventInstance(BaseModel):
    """A specific occurrence of a potentially recurring event."""

    event: CalendarEvent = Field(description="The parent event")
    instance_start: datetime = Field(description="Start time of this instance")
    instance_end: datetime = Field(description="End time of this instance")


class FreeBusySlot(BaseModel):
    """A time slot with availability status."""

    start: datetime = Field(description="Slot start time")
    end: datetime = Field(description="Slot end time")
    status: Literal["busy", "tentative", "free"] = Field(
        description="Availability status"
    )


class CalendarResult(BaseModel):
    """Result from a calendar query, supporting partial success."""

    events: list[CalendarEvent] = Field(
        default_factory=list, description="Retrieved events"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Warnings/errors from failed sources"
    )
    sources_queried: list[str] = Field(
        default_factory=list, description="Names of calendars that were queried"
    )

    @property
    def has_warnings(self) -> bool:
        """Check if any warnings were generated."""
        return len(self.warnings) > 0

    def add_warning(self, source: str, message: str) -> None:
        """Add a warning message for a source."""
        self.warnings.append(f"{source}: {message}")


class FreeBusyResult(BaseModel):
    """Result from a free/busy query."""

    slots: list[FreeBusySlot] = Field(
        default_factory=list, description="Free/busy slots"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Warnings from failed sources"
    )
    sources_queried: list[str] = Field(
        default_factory=list, description="Names of calendars that were queried"
    )

    @property
    def has_warnings(self) -> bool:
        """Check if any warnings were generated."""
        return len(self.warnings) > 0


class InstanceResult(BaseModel):
    """Result from expanding recurring event instances."""

    instances: list[EventInstance] = Field(
        default_factory=list, description="Expanded event instances"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Warnings from expansion"
    )
