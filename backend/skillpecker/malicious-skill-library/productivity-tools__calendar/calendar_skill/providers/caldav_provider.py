"""CalDAV calendar provider (read/write)."""

import logging
from datetime import date, datetime, timedelta
from datetime import timezone as dt_timezone
from typing import TYPE_CHECKING, Any
from zoneinfo import ZoneInfo

import caldav
from icalendar import Calendar
from icalendar import Event as ICalEvent

from calendar_skill.models import CalendarEvent, FreeBusySlot
from calendar_skill.providers.base import CalendarProvider

if TYPE_CHECKING:
    from calendar_skill.config import CalendarSource

logger = logging.getLogger(__name__)


class CalDAVProvider(CalendarProvider):
    """Provider for CalDAV servers (read/write)."""

    def __init__(self, source: "CalendarSource", timezone: str) -> None:
        """Initialize the CalDAV provider."""
        super().__init__(source, timezone)
        self._client: caldav.DAVClient | None = None
        self._calendar: caldav.Calendar | None = None
        self._tz = ZoneInfo(timezone)

    def _get_client(self) -> caldav.DAVClient:
        """Get or create the CalDAV client."""
        if self._client is None:
            username = self.source.username
            password = None
            if self.source.password:
                password = self.source.password.get_secret_value()

            self._client = caldav.DAVClient(
                url=self.source.url,
                username=username,
                password=password,
            )

        return self._client

    def _get_calendar(self) -> caldav.Calendar:
        """Get the CalDAV calendar object."""
        if self._calendar is None:
            client = self._get_client()

            # Check if the URL points directly to a calendar
            # (contains /calendars/ or /public-calendars/ with a calendar path)
            url = self.source.url.rstrip("/")
            is_direct_calendar_url = (
                "/calendars/" in url or "/public-calendars/" in url
            ) and url.count("/") > url.find("/calendars/") + len("/calendars/") // 2

            # Check if this is a public calendar (no auth required)
            is_public = "public-calendars" in self.source.url or (
                self.source.username is None and self.source.password is None
            )

            if is_direct_calendar_url or is_public:
                # URL points directly to a calendar - use it as-is
                self._calendar = caldav.Calendar(client=client, url=self.source.url)
            elif self.source.calendar_id:
                # Find specific calendar by ID/name
                principal = client.principal()
                calendars = principal.calendars()
                for cal in calendars:
                    if self.source.calendar_id in (cal.id, cal.name):
                        self._calendar = cal
                        break
                if self._calendar is None:
                    raise ValueError(
                        f"Calendar '{self.source.calendar_id}' not found on server"
                    )
            else:
                # Use first available calendar
                principal = client.principal()
                calendars = principal.calendars()
                if not calendars:
                    raise ValueError("No calendars found on server")
                self._calendar = calendars[0]

        return self._calendar

    def _normalize_datetime(self, dt: datetime) -> datetime:
        """Normalize a datetime to the configured timezone."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=dt_timezone.utc)
        return dt.astimezone(self._tz)

    def _parse_datetime_pair(
        self, dtstart: Any, dtend: Any, all_day: bool
    ) -> tuple[datetime, datetime]:
        """Parse start and end datetime pair."""
        start_val = dtstart.dt

        if all_day:
            start = datetime.combine(start_val, datetime.min.time(), tzinfo=self._tz)
        else:
            start = self._normalize_datetime(start_val)

        if dtend is not None:
            end_val = dtend.dt
            if all_day:
                end = datetime.combine(end_val, datetime.min.time(), tzinfo=self._tz)
            else:
                end = self._normalize_datetime(end_val)
        elif all_day:
            end = start + timedelta(days=1)
        else:
            end = start + timedelta(hours=1)

        return start, end

    def _parse_attendees(self, ical: Any) -> list[str]:
        """Parse attendees from iCalendar component."""
        attendees = []
        for attendee in ical.get("attendee", []):
            if attendee:
                email = str(attendee).replace("mailto:", "")
                attendees.append(email)
        return attendees

    def _parse_status(self, ical: Any) -> str:
        """Parse event status from iCalendar component."""
        status = "confirmed"
        if ical.get("status"):
            status_val = str(ical.get("status")).lower()
            if status_val in ("confirmed", "tentative", "cancelled"):
                status = status_val
        return status

    def _parse_caldav_event(self, caldav_event: caldav.Event) -> CalendarEvent | None:
        """Parse a CalDAV event into a CalendarEvent."""
        try:
            ical = caldav_event.icalendar_component

            uid = str(ical.get("uid", ""))
            summary = str(ical.get("summary", "Untitled"))

            dtstart = ical.get("dtstart")
            dtend = ical.get("dtend")

            if dtstart is None:
                return None

            start_val = dtstart.dt
            all_day = isinstance(start_val, date) and not isinstance(
                start_val, datetime
            )

            start, end = self._parse_datetime_pair(dtstart, dtend, all_day)

            description = (
                str(ical.get("description")) if ical.get("description") else None
            )
            location = str(ical.get("location")) if ical.get("location") else None
            rrule = (
                ical.get("rrule").to_ical().decode("utf-8")
                if ical.get("rrule")
                else None
            )

            attendees = self._parse_attendees(ical)
            organizer = (
                str(ical.get("organizer")).replace("mailto:", "")
                if ical.get("organizer")
                else None
            )
            status = self._parse_status(ical)

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
            return None

    def get_events(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        """Get events within a time range."""
        calendar = self._get_calendar()

        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=dt_timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=dt_timezone.utc)

        caldav_events = calendar.search(
            start=start,
            end=end,
            event=True,
            expand=False,  # Don't expand recurring events
        )

        events = []
        for caldav_event in caldav_events:
            event = self._parse_caldav_event(caldav_event)
            if event is not None:
                events.append(event)

        return events

    def _try_native_freebusy(
        self, calendar: Any, start: datetime, end: datetime
    ) -> list[FreeBusySlot] | None:
        """Try to get free/busy info via native CalDAV freebusy request."""
        try:
            freebusy = calendar.freebusy_request(start, end)

            slots = []
            for fb in freebusy.icalendar_component.walk():
                if fb.name == "VFREEBUSY":
                    for period in fb.get("freebusy", []):
                        period_start, duration = period.dt
                        period_end = period_start + duration
                        slots.append(
                            FreeBusySlot(
                                start=self._normalize_datetime(period_start),
                                end=self._normalize_datetime(period_end),
                                status="busy",
                            )
                        )

            if slots:
                slots.sort(key=lambda s: s.start)
                return slots
        except Exception as e:
            logger.debug("Failed to get free/busy info directly: %s", e)

        return None

    def _create_slot_from_event(
        self, event: CalendarEvent, start: datetime, end: datetime
    ) -> FreeBusySlot | None:
        """Create a free/busy slot from a single event."""
        if event.status == "cancelled":
            return None

        status = "tentative" if event.status == "tentative" else "busy"

        if event.rrule:
            instances = self.expand_recurrence(event, start, end)
            # Return first instance as representative - multiple will be handled by caller
            for instance in instances:
                return FreeBusySlot(
                    start=instance.instance_start,
                    end=instance.instance_end,
                    status=status,
                )
            # No instances found
            return None
        slot_start = max(event.start, start)
        slot_end = min(event.end, end)
        return FreeBusySlot(
            start=slot_start,
            end=slot_end,
            status=status,
        )

    def _derive_freebusy_from_events(
        self, start: datetime, end: datetime
    ) -> list[FreeBusySlot]:
        """Derive free/busy information from events."""
        events = self.get_events(start, end)

        slots = []
        for event in events:
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
                slot = self._create_slot_from_event(event, start, end)
                if slot:
                    slots.append(slot)

        slots.sort(key=lambda s: s.start)
        return slots

    def get_freebusy(self, start: datetime, end: datetime) -> list[FreeBusySlot]:
        """Get free/busy information for a time range."""
        calendar = self._get_calendar()

        # Ensure timezone awareness
        if start.tzinfo is None:
            start = start.replace(tzinfo=dt_timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=dt_timezone.utc)

        # Try native free/busy query first
        slots = self._try_native_freebusy(calendar, start, end)
        if slots is not None:
            return slots

        # Fall back to deriving from events
        return self._derive_freebusy_from_events(start, end)

    def create_event(self, event: CalendarEvent) -> CalendarEvent:
        """Create a new event on the calendar."""
        if not self.supports_write:
            raise NotImplementedError(
                f"Calendar '{self.name}' is configured as read-only"
            )

        calendar = self._get_calendar()

        # Build iCalendar event
        cal = Calendar()
        cal.add("prodid", "-//Calendar Skill//EN")
        cal.add("version", "2.0")

        ical_event = ICalEvent()
        ical_event.add("uid", event.uid)
        ical_event.add("summary", event.summary)
        ical_event.add("dtstart", event.start)
        ical_event.add("dtend", event.end)

        if event.description:
            ical_event.add("description", event.description)
        if event.location:
            ical_event.add("location", event.location)
        if event.rrule:
            # Parse RRULE string and add

            rrule_dict = {}
            for part in event.rrule.split(";"):
                if "=" in part:
                    key, value = part.split("=", 1)
                    rrule_dict[key] = value
            ical_event.add("rrule", rrule_dict)

        ical_event.add("status", event.status.upper())

        cal.add_component(ical_event)

        # Create on server
        created = calendar.save_event(cal.to_ical().decode("utf-8"))

        # Return the created event
        return self._parse_caldav_event(created) or event

    def update_event(self, event: CalendarEvent) -> CalendarEvent:
        """Update an existing event on the calendar."""
        if not self.supports_write:
            raise NotImplementedError(
                f"Calendar '{self.name}' is configured as read-only"
            )

        calendar = self._get_calendar()

        # Find the existing event
        try:
            existing = calendar.event_by_uid(event.uid)
        except Exception as e:
            raise ValueError(f"Event with UID '{event.uid}' not found") from e

        # Update the event
        ical = existing.icalendar_component
        ical["summary"] = event.summary
        ical["dtstart"].dt = event.start
        ical["dtend"].dt = event.end

        if event.description:
            ical["description"] = event.description
        if event.location:
            ical["location"] = event.location

        ical["status"] = event.status.upper()

        existing.save()

        return self._parse_caldav_event(existing) or event

    def delete_event(self, uid: str) -> bool:
        """Delete an event from the calendar."""
        if not self.supports_write:
            raise NotImplementedError(
                f"Calendar '{self.name}' is configured as read-only"
            )

        calendar = self._get_calendar()

        try:
            existing = calendar.event_by_uid(uid)
            existing.delete()
            return True
        except Exception:
            return False
