"""Tests for ICS parsing functionality."""

from datetime import datetime
from zoneinfo import ZoneInfo

from calendar_skill.config import CalendarSource
from calendar_skill.models import CalendarResult
from calendar_skill.providers.ics import ICSProvider

# Sample ICS data for testing
SIMPLE_EVENT_ICS = b"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-event-123
DTSTART:20260127T100000Z
DTEND:20260127T110000Z
SUMMARY:Test Meeting
DESCRIPTION:A test event for unit testing
LOCATION:Conference Room A
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
"""

ALL_DAY_EVENT_ICS = b"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:all-day-event-456
DTSTART;VALUE=DATE:20260127
DTEND;VALUE=DATE:20260128
SUMMARY:All Day Event
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
"""

RECURRING_EVENT_ICS = b"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:recurring-event-789
DTSTART:20260127T090000Z
DTEND:20260127T093000Z
SUMMARY:Daily Standup
RRULE:FREQ=DAILY;COUNT=5
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
"""

TENTATIVE_EVENT_ICS = b"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:tentative-event-101
DTSTART:20260127T140000Z
DTEND:20260127T150000Z
SUMMARY:Maybe Meeting
STATUS:TENTATIVE
END:VEVENT
END:VCALENDAR
"""


class MockICSProvider(ICSProvider):
    """ICS provider that uses mock data instead of fetching."""

    def __init__(self, ics_data: bytes, timezone: str = "UTC"):
        source = CalendarSource(
            name="Test Calendar",
            type="ics",
            url="mock://test.ics",
            mode="read",
        )
        super().__init__(source, timezone)
        self._calendar_data = ics_data


class TestICSParsing:
    """Test ICS event parsing."""

    def test_parse_simple_event(self):
        """Parse a basic VEVENT."""
        provider = MockICSProvider(SIMPLE_EVENT_ICS)
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)

        assert len(events) == 1
        event = events[0]
        assert event.uid == "test-event-123"
        assert event.summary == "Test Meeting"
        assert event.description == "A test event for unit testing"
        assert event.location == "Conference Room A"
        assert event.status == "confirmed"
        assert not event.all_day

    def test_parse_all_day_event(self):
        """All-day events are detected correctly."""
        provider = MockICSProvider(ALL_DAY_EVENT_ICS)
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)

        assert len(events) == 1
        event = events[0]
        assert event.uid == "all-day-event-456"
        assert event.summary == "All Day Event"
        assert event.all_day is True

    def test_parse_recurring_event(self):
        """RRULE is preserved, not expanded by default."""
        provider = MockICSProvider(RECURRING_EVENT_ICS)
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)

        assert len(events) == 1
        event = events[0]
        assert event.uid == "recurring-event-789"
        assert event.rrule is not None
        assert "FREQ=DAILY" in event.rrule

    def test_expand_recurring_event(self):
        """Recurring events can be expanded into instances."""
        provider = MockICSProvider(RECURRING_EVENT_ICS)
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)
        assert len(events) == 1

        instances = provider.expand_recurrence(events[0], start, end)

        # RRULE says COUNT=5
        assert len(instances) == 5

        # Check instances are on consecutive days
        for i, instance in enumerate(instances):
            expected_date = datetime(2026, 1, 27 + i, 9, 0, tzinfo=ZoneInfo("UTC"))
            assert instance.instance_start == expected_date

    def test_timezone_normalization(self):
        """Events are normalized to configured timezone."""
        provider = MockICSProvider(SIMPLE_EVENT_ICS, timezone="America/Chicago")
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("America/Chicago"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("America/Chicago"))

        events = provider.get_events(start, end)

        assert len(events) == 1
        event = events[0]
        # Event was at 10:00 UTC, should be 04:00 Chicago (UTC-6)
        assert event.start.tzinfo is not None
        assert str(event.start.tzinfo) == "America/Chicago"

    def test_tentative_status(self):
        """Tentative events are parsed correctly."""
        provider = MockICSProvider(TENTATIVE_EVENT_ICS)
        start = datetime(2026, 1, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)

        assert len(events) == 1
        assert events[0].status == "tentative"

    def test_freebusy_from_events(self):
        """Free/busy is derived from events correctly."""
        provider = MockICSProvider(SIMPLE_EVENT_ICS)
        start = datetime(2026, 1, 27, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 1, 28, tzinfo=ZoneInfo("UTC"))

        slots = provider.get_freebusy(start, end)

        assert len(slots) == 1
        assert slots[0].status == "busy"

    def test_freebusy_tentative_events(self):
        """Tentative events show as tentative in free/busy."""
        provider = MockICSProvider(TENTATIVE_EVENT_ICS)
        start = datetime(2026, 1, 27, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 1, 28, tzinfo=ZoneInfo("UTC"))

        slots = provider.get_freebusy(start, end)

        assert len(slots) == 1
        assert slots[0].status == "tentative"

    def test_event_outside_range_not_returned(self):
        """Events outside the query range are not returned."""
        provider = MockICSProvider(SIMPLE_EVENT_ICS)
        # Query for February, event is in January
        start = datetime(2026, 2, 1, tzinfo=ZoneInfo("UTC"))
        end = datetime(2026, 3, 1, tzinfo=ZoneInfo("UTC"))

        events = provider.get_events(start, end)

        assert len(events) == 0


class TestCalendarResult:
    """Test CalendarResult partial failure handling."""

    def test_result_warnings(self):
        """CalendarResult tracks warnings correctly."""

        result = CalendarResult()
        assert not result.has_warnings

        result.add_warning("Test Calendar", "Connection failed")
        assert result.has_warnings
        assert len(result.warnings) == 1
        assert "Test Calendar: Connection failed" in result.warnings[0]
