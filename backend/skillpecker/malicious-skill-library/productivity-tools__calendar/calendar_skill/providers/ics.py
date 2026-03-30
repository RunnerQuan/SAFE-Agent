"""ICS file/URL calendar provider (read-only)."""

from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union
from zoneinfo import ZoneInfo

import httpx
from icalendar import Calendar

from calendar_skill.models import CalendarEvent, FreeBusySlot
from calendar_skill.providers.base import CalendarProvider

if TYPE_CHECKING:
    from calendar_skill.config import CalendarSource


class ICSProvider(CalendarProvider):
    """Provider for ICS files and URLs (read-only)."""

    def __init__(self, source: "CalendarSource", timezone: str) -> None:
        """Initialize the ICS provider."""
        super().__init__(source, timezone)
        self._calendar_data: bytes | None = None
        self._tz = ZoneInfo(timezone)

    def _fetch_calendar(self) -> bytes:
        """Fetch the calendar data from URL or file."""
        if self._calendar_data is not None:
            return self._calendar_data

        url = self.source.url

        if url.startswith(("http://", "https://")):
            # Fetch from URL
            response = httpx.get(url, timeout=30.0, follow_redirects=True)
            response.raise_for_status()
            self._calendar_data = response.content
        else:
            # Read from local file
            path = Path(url).expanduser()
            self._calendar_data = path.read_bytes()

        return self._calendar_data

    def _normalize_datetime(self, dt: Union[datetime, date]) -> datetime:
        """Normalize a datetime to the configured timezone."""
        if isinstance(dt, datetime):
            if dt.tzinfo is None:
                # Assume UTC for naive datetimes
                dt = dt.replace(tzinfo=dt_timezone.utc)
            return dt.astimezone(self._tz)
        # date object - convert to datetime at midnight in target timezone
        return datetime.combine(dt, datetime.min.time(), tzinfo=self._tz)

    def _parse_event_end_time(
        self, dtend: Any, all_day: bool, start: datetime
    ) -> datetime:
        """Parse end time for ICS event."""
        if dtend is not None:
            return self._normalize_datetime(dtend.dt)
        if all_day:
            # All-day event with no end: assume 1 day
            return start + timedelta(days=1)
        # Default to 1 hour duration
        return start + timedelta(hours=1)

    def _parse_event_optional_fields(
        self, component: Any
    ) -> tuple[str | None, str | None, str | None]:
        """Parse optional fields from ICS component."""
        description = (
            str(component.get("description")) if component.get("description") else None
        )
        location = str(component.get("location")) if component.get("location") else None
        rrule = (
            component.get("rrule").to_ical().decode("utf-8")
            if component.get("rrule")
            else None
        )
        return description, location, rrule

    def _parse_event_attendees(self, component: Any) -> list[str]:
        """Parse attendees from ICS component."""
        attendees = []
        for attendee in component.get("attendee", []):
            if attendee:
                # Remove "mailto:" prefix if present
                email = str(attendee).replace("mailto:", "")
                attendees.append(email)
        return attendees

    def _parse_event_organizer(self, component: Any) -> str | None:
        """Parse organizer from ICS component."""
        if component.get("organizer"):
            return str(component.get("organizer")).replace("mailto:", "")
        return None

    def _parse_event_status(self, component: Any) -> str:
        """Parse status from ICS component."""
        status = "confirmed"
        if component.get("status"):
            status_val = str(component.get("status")).lower()
            if status_val in ("confirmed", "tentative", "cancelled"):
                status = status_val
        return status

    def _parse_event(self, component: Any) -> CalendarEvent | None:
        """Parse an icalendar VEVENT component into a CalendarEvent."""
        try:
            # Get required fields
            uid = str(component.get("uid", ""))
            summary = str(component.get("summary", "Untitled"))

            # Get start/end times
            dtstart = component.get("dtstart")
            dtend = component.get("dtend")

            if dtstart is None:
                return None

            start_val = dtstart.dt
            all_day = isinstance(start_val, date) and not isinstance(
                start_val, datetime
            )

            start = self._normalize_datetime(start_val)
            end = self._parse_event_end_time(dtend, all_day, start)

            # Get optional fields
            description, location, rrule = self._parse_event_optional_fields(component)
            attendees = self._parse_event_attendees(component)
            organizer = self._parse_event_organizer(component)
            status = self._parse_event_status(component)

            return CalendarEvent(
                uid=uid,
                summary=summary,
                description=description,
                location=location,
                start=start,
                end=end,
                all_day=all_day,
                rrule=rrule,
                attendees=attendees,
                organizer=organizer,
                status=status,
                calendar_name=self.name,
            )
        except Exception:
            # Skip malformed events
            return None

    def get_events(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        """Get events within a time range."""
        data = self._fetch_calendar()
        cal = Calendar.from_ical(data)

        events = []
        for component in cal.walk():
            if component.name == "VEVENT":
                event = self._parse_event(component)
                if event is None:
                    continue

                # Check if event falls within the requested range
                # For recurring events, we include them if the base event is before end
                if event.rrule:
                    # Include recurring events - let caller expand if needed
                    if event.start < end:
                        events.append(event)
                elif event.start < end and event.end > start:
                    events.append(event)

        return events

    def get_freebusy(self, start: datetime, end: datetime) -> list[FreeBusySlot]:
        """Derive free/busy from events (ICS doesn't have native free/busy)."""
        events = self.get_events(start, end)

        slots = []
        for event in events:
            if event.status == "cancelled":
                continue

            # Expand recurring events to get actual busy times
            if event.rrule:
                instances = self.expand_recurrence(event, start, end)
                for instance in instances:
                    status = "tentative" if event.status == "tentative" else "busy"
                    slots.append(
                        FreeBusySlot(
                            start=instance.instance_start,
                            end=instance.instance_end,
                            status=status,
                        )
                    )
            else:
                # Clamp to query range
                slot_start = max(event.start, start)
                slot_end = min(event.end, end)

                status = "tentative" if event.status == "tentative" else "busy"
                slots.append(
                    FreeBusySlot(
                        start=slot_start,
                        end=slot_end,
                        status=status,
                    )
                )

        # Sort by start time
        slots.sort(key=lambda s: s.start)

        return slots
