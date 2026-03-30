"""Abstract base class for calendar providers."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING

from dateutil import rrule as dateutil_rrule

from calendar_skill.models import (
    CalendarEvent,
    EventInstance,
    FreeBusySlot,
)

if TYPE_CHECKING:
    from calendar_skill.config import CalendarSource


class CalendarProvider(ABC):
    """Abstract base class for all calendar providers."""

    def __init__(self, source: "CalendarSource", timezone: str) -> None:
        """Initialize the provider with a calendar source and timezone."""
        self.source = source
        self.timezone = timezone

    @property
    def name(self) -> str:
        """Get the display name of this calendar."""
        return self.source.name

    @property
    def supports_write(self) -> bool:
        """Check if this provider supports write operations."""
        return self.source.supports_write

    @abstractmethod
    def get_events(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        """
        Get events within a time range.

        Args:
            start: Start of the time range (inclusive)
            end: End of the time range (exclusive)

        Returns:
            List of calendar events within the range
        """
        ...

    @abstractmethod
    def get_freebusy(self, start: datetime, end: datetime) -> list[FreeBusySlot]:
        """
        Get free/busy information for a time range.

        Args:
            start: Start of the time range
            end: End of the time range

        Returns:
            List of free/busy slots
        """
        ...

    def expand_recurrence(
        self, event: CalendarEvent, start: datetime, end: datetime
    ) -> list[EventInstance]:
        """
        Expand a recurring event into individual instances within a range.

        Args:
            event: The event with an RRULE to expand
            start: Start of the range for instances
            end: End of the range for instances

        Returns:
            List of event instances within the range
        """
        if not event.rrule:
            # Non-recurring event: return single instance if in range
            if event.start < end and event.end > start:
                return [
                    EventInstance(
                        event=event,
                        instance_start=event.start,
                        instance_end=event.end,
                    )
                ]
            return []

        # Parse the RRULE and generate instances
        try:
            rule = dateutil_rrule.rrulestr(event.rrule, dtstart=event.start)
            event_duration = event.end - event.start

            instances = []
            for dt in rule.between(start, end, inc=True):
                instances.append(
                    EventInstance(
                        event=event,
                        instance_start=dt,
                        instance_end=dt + event_duration,
                    )
                )

            return instances
        except Exception:
            # If RRULE parsing fails, return original event if in range
            if event.start < end and event.end > start:
                return [
                    EventInstance(
                        event=event,
                        instance_start=event.start,
                        instance_end=event.end,
                    )
                ]
            return []

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        """
        Create a new event on the calendar.

        Args:
            event: The event to create

        Returns:
            The created event with any server-assigned fields

        Raises:
            NotImplementedError: If this provider doesn't support write operations
        """
        raise NotImplementedError(
            f"Calendar '{self.name}' does not support write operations"
        )

    def update_event(self, event: CalendarEvent) -> CalendarEvent:
        """
        Update an existing event on the calendar.

        Args:
            event: The event to update (must have a valid UID)

        Returns:
            The updated event

        Raises:
            NotImplementedError: If this provider doesn't support write operations
        """
        raise NotImplementedError(
            f"Calendar '{self.name}' does not support write operations"
        )

    def delete_event(self, uid: str) -> bool:
        """
        Delete an event from the calendar.

        Args:
            uid: The UID of the event to delete

        Returns:
            True if the event was deleted, False if not found

        Raises:
            NotImplementedError: If this provider doesn't support write operations
        """
        raise NotImplementedError(
            f"Calendar '{self.name}' does not support write operations"
        )
