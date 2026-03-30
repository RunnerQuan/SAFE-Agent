"""Calendar skill CLI using Typer."""

import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Optional
from zoneinfo import ZoneInfo

import typer
from rich import print as rprint

from calendar_skill.config import CalendarSettings, get_settings
from calendar_skill.formatting import format_calendars, format_result
from calendar_skill.models import (
    CalendarEvent,
    CalendarResult,
    FreeBusyResult,
    InstanceResult,
)
from calendar_skill.providers import get_provider
from calendar_skill.providers.base import CalendarProvider

app = typer.Typer(
    name="calendar-skill",
    help="Access calendars via ICS files/URLs and CalDAV servers.",
    no_args_is_help=True,
)


def parse_datetime(value: str, timezone: str) -> datetime:
    """Parse a datetime string with smart defaults."""
    tz = ZoneInfo(timezone)
    now = datetime.now(tz)

    # Handle special keywords
    if value.lower() == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if value.lower() == "tomorrow":
        return (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    if value.lower() == "yesterday":
        return (now - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    if value.lower() == "now":
        return now

    # Try various datetime formats
    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(value, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=tz)
            return dt
        except ValueError:
            continue

    raise typer.BadParameter(f"Could not parse datetime: {value}")


def parse_duration(value: str) -> timedelta:
    """Parse a duration string like '30m', '1h', '2h30m'."""
    value = value.lower().strip()

    total_minutes = 0

    # Handle hours
    if "h" in value:
        parts = value.split("h")
        total_minutes += int(parts[0]) * 60
        value = parts[1] if len(parts) > 1 else ""

    # Handle minutes
    if "m" in value:
        value = value.replace("m", "")
        if value:
            total_minutes += int(value)
    elif value:
        # Assume remaining value is minutes
        total_minutes += int(value)

    if total_minutes == 0:
        raise typer.BadParameter(f"Could not parse duration: {value}")

    return timedelta(minutes=total_minutes)


# Common options
ConfigOption = Annotated[
    Optional[Path],
    typer.Option("--config", "-c", help="Path to config file"),
]
TimezoneOption = Annotated[
    Optional[str],
    typer.Option("--timezone", "-tz", help="Timezone for output"),
]
FormatOption = Annotated[
    Optional[str],
    typer.Option("--format", "-f", help="Output format: text or json"),
]
CalendarOption = Annotated[
    Optional[str],
    typer.Option("--calendar", help="Specific calendar to query"),
]


def get_effective_settings(
    config: Optional[Path],
    timezone: Optional[str],
    output_format: Optional[str],
) -> CalendarSettings:
    """Get settings with CLI overrides applied."""
    fmt = None
    if output_format in ("text", "json"):
        fmt = output_format

    return get_settings(
        config_file=config,
        timezone=timezone,
        output_format=fmt,
    )


@app.command()
def events(
    start: Annotated[
        str, typer.Option("--start", "-s", help="Start date/time")
    ] = "today",
    end: Annotated[
        Optional[str], typer.Option("--end", "-e", help="End date/time")
    ] = None,
    days: Annotated[
        int, typer.Option("--days", "-d", help="Number of days to query")
    ] = 1,
    calendar: CalendarOption = None,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
    output_format: FormatOption = None,
) -> None:
    """Query calendar events within a time range."""
    settings = get_effective_settings(config, timezone, output_format)

    start_dt = parse_datetime(start, settings.default_timezone)
    if end:
        end_dt = parse_datetime(end, settings.default_timezone)
    else:
        end_dt = start_dt + timedelta(days=days)

    result = CalendarResult(sources_queried=[])

    # Determine which calendars to query
    calendars_to_query = settings.calendars
    if calendar:
        source = settings.get_calendar(calendar)
        if source is None:
            rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
            raise typer.Exit(1)
        calendars_to_query = [source]

    # Query each calendar
    for source in calendars_to_query:
        result.sources_queried.append(source.name)
        try:
            provider = get_provider(source, settings.default_timezone)
            events = provider.get_events(start_dt, end_dt)
            result.events.extend(events)
        except Exception as e:
            result.add_warning(source.name, str(e))

    # Format and output
    output = format_result(result, settings.default_output_format)
    rprint(output)


@app.command()
def freebusy(
    start: Annotated[str, typer.Option("--start", "-s", help="Start date/time")],
    end: Annotated[str, typer.Option("--end", "-e", help="End date/time")],
    calendar: CalendarOption = None,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
    output_format: FormatOption = None,
) -> None:
    """Query free/busy information for a time range."""
    settings = get_effective_settings(config, timezone, output_format)

    start_dt = parse_datetime(start, settings.default_timezone)
    end_dt = parse_datetime(end, settings.default_timezone)

    result = FreeBusyResult(sources_queried=[])

    # Determine which calendars to query
    calendars_to_query = settings.calendars
    if calendar:
        source = settings.get_calendar(calendar)
        if source is None:
            rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
            raise typer.Exit(1)
        calendars_to_query = [source]

    # Query each calendar
    for source in calendars_to_query:
        result.sources_queried.append(source.name)
        try:
            provider = get_provider(source, settings.default_timezone)
            slots = provider.get_freebusy(start_dt, end_dt)
            result.slots.extend(slots)
        except Exception as e:
            result.warnings.append(f"{source.name}: {e}")

    # Format and output
    output = format_result(result, settings.default_output_format)
    rprint(output)


@app.command()
def instances(
    uid: Annotated[str, typer.Option("--uid", "-u", help="Event UID to expand")],
    start: Annotated[
        str, typer.Option("--start", "-s", help="Start date for instances")
    ],
    end: Annotated[str, typer.Option("--end", "-e", help="End date for instances")],
    calendar: CalendarOption = None,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
    output_format: FormatOption = None,
) -> None:
    """Expand a recurring event into instances within a date range."""
    settings = get_effective_settings(config, timezone, output_format)

    start_dt = parse_datetime(start, settings.default_timezone)
    end_dt = parse_datetime(end, settings.default_timezone)

    result = InstanceResult()

    # Find the event
    calendars_to_query = settings.calendars
    if calendar:
        source = settings.get_calendar(calendar)
        if source is None:
            rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
            raise typer.Exit(1)
        calendars_to_query = [source]

    # Search for the event in calendars
    found_event: Optional[CalendarEvent] = None
    found_provider = None

    for source in calendars_to_query:
        try:
            provider = get_provider(source, settings.default_timezone)
            # Query a wide range to find the event
            events = provider.get_events(
                start_dt - timedelta(days=365),
                end_dt + timedelta(days=365),
            )
            for event in events:
                if event.uid == uid:
                    found_event = event
                    found_provider = provider
                    break
            if found_event:
                break
        except Exception as e:
            result.warnings.append(f"{source.name}: {e}")

    if found_event is None:
        rprint(f"[red]Error: Event with UID '{uid}' not found[/red]")
        raise typer.Exit(1)

    if not found_event.rrule:
        rprint(
            f"[yellow]Warning: Event '{found_event.summary}' is not recurring[/yellow]"
        )

    # Expand recurrence
    result.instances = found_provider.expand_recurrence(found_event, start_dt, end_dt)

    # Format and output
    output = format_result(result, settings.default_output_format)
    rprint(output)


@app.command()
def create(
    summary: Annotated[
        str, typer.Option("--summary", "-s", help="Event summary/title")
    ],
    start: Annotated[str, typer.Option("--start", help="Start date/time")],
    end: Annotated[Optional[str], typer.Option("--end", help="End date/time")] = None,
    duration: Annotated[
        Optional[str], typer.Option("--duration", "-d", help="Duration (e.g., 30m, 1h)")
    ] = None,
    description: Annotated[
        Optional[str], typer.Option("--description", help="Event description")
    ] = None,
    location: Annotated[
        Optional[str], typer.Option("--location", "-l", help="Event location")
    ] = None,
    calendar: Annotated[
        Optional[str], typer.Option("--calendar", help="Calendar to create event in")
    ] = None,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
    output_format: FormatOption = None,
) -> None:
    """Create a new event on a writable calendar."""
    settings = get_effective_settings(config, timezone, output_format)

    # Find the target calendar
    if calendar:
        source = settings.get_calendar(calendar)
        if source is None:
            rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
            raise typer.Exit(1)
    else:
        # Use first writable calendar
        writable = settings.get_writable_calendars()
        if not writable:
            rprint("[red]Error: No writable calendars configured[/red]")
            raise typer.Exit(1)
        source = writable[0]

    if not source.supports_write:
        rprint(f"[red]Error: Calendar '{source.name}' is read-only[/red]")
        raise typer.Exit(1)

    # Parse times
    start_dt = parse_datetime(start, settings.default_timezone)
    if end:
        end_dt = parse_datetime(end, settings.default_timezone)
    elif duration:
        end_dt = start_dt + parse_duration(duration)
    else:
        # Default to 1 hour
        end_dt = start_dt + timedelta(hours=1)

    # Create event object
    event = CalendarEvent(
        uid=str(uuid.uuid4()),
        summary=summary,
        description=description,
        location=location,
        start=start_dt,
        end=end_dt,
        calendar_name=source.name,
    )

    # Create via provider
    try:
        provider = get_provider(source, settings.default_timezone)
        created = provider.create_event(event)
        rprint(f"[green]Created event: {created.summary}[/green]")
        rprint(f"  UID: {created.uid}")
        rprint(f"  Time: {created.start} - {created.end}")
    except Exception as e:
        rprint(f"[red]Error creating event: {e}[/red]")
        raise typer.Exit(1) from None


def _find_event_by_uid(
    provider: CalendarProvider, uid: str, timezone: str
) -> CalendarEvent | None:
    """Find an event by its UID."""
    events = provider.get_events(
        datetime.now(ZoneInfo(timezone)) - timedelta(days=365),
        datetime.now(ZoneInfo(timezone)) + timedelta(days=365),
    )

    for event in events:
        if event.uid == uid:
            return event
    return None


def _apply_event_updates(
    event: CalendarEvent,
    summary: Optional[str],
    start: Optional[str],
    end: Optional[str],
    description: Optional[str],
    location: Optional[str],
    timezone: str,
) -> None:
    """Apply updates to an event."""
    if summary:
        event.summary = summary
    if start:
        event.start = parse_datetime(start, timezone)
    if end:
        event.end = parse_datetime(end, timezone)
    if description:
        event.description = description
    if location:
        event.location = location


@app.command()
def update(
    uid: Annotated[str, typer.Option("--uid", "-u", help="Event UID to update")],
    calendar: Annotated[
        str, typer.Option("--calendar", help="Calendar containing the event")
    ],
    summary: Annotated[
        Optional[str], typer.Option("--summary", "-s", help="New summary")
    ] = None,
    start: Annotated[
        Optional[str], typer.Option("--start", help="New start time")
    ] = None,
    end: Annotated[Optional[str], typer.Option("--end", help="New end time")] = None,
    description: Annotated[
        Optional[str], typer.Option("--description", help="New description")
    ] = None,
    location: Annotated[
        Optional[str], typer.Option("--location", "-l", help="New location")
    ] = None,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
) -> None:
    """Update an existing event on a writable calendar."""
    settings = get_effective_settings(config, timezone, None)

    source = settings.get_calendar(calendar)
    if source is None:
        rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
        raise typer.Exit(1)

    if not source.supports_write:
        rprint(f"[red]Error: Calendar '{source.name}' is read-only[/red]")
        raise typer.Exit(1)

    try:
        provider = get_provider(source, settings.default_timezone)

        # Find the existing event
        existing = _find_event_by_uid(provider, uid, settings.default_timezone)
        if existing is None:
            rprint(f"[red]Error: Event with UID '{uid}' not found[/red]")
            raise typer.Exit(1)

        # Apply updates
        _apply_event_updates(
            existing,
            summary,
            start,
            end,
            description,
            location,
            settings.default_timezone,
        )

        updated = provider.update_event(existing)
        rprint(f"[green]Updated event: {updated.summary}[/green]")

    except Exception as e:
        rprint(f"[red]Error updating event: {e}[/red]")
        raise typer.Exit(1) from None


@app.command()
def delete(
    uid: Annotated[str, typer.Option("--uid", "-u", help="Event UID to delete")],
    calendar: Annotated[
        str, typer.Option("--calendar", help="Calendar containing the event")
    ],
    force: Annotated[
        bool, typer.Option("--force", "-f", help="Skip confirmation")
    ] = False,
    config: ConfigOption = None,
    timezone: TimezoneOption = None,
) -> None:
    """Delete an event from a writable calendar."""
    settings = get_effective_settings(config, timezone, None)

    source = settings.get_calendar(calendar)
    if source is None:
        rprint(f"[red]Error: Calendar '{calendar}' not found[/red]")
        raise typer.Exit(1)

    if not source.supports_write:
        rprint(f"[red]Error: Calendar '{source.name}' is read-only[/red]")
        raise typer.Exit(1)

    if not force:
        confirm = typer.confirm(f"Delete event with UID '{uid}'?")
        if not confirm:
            raise typer.Abort()

    try:
        provider = get_provider(source, settings.default_timezone)
        deleted = provider.delete_event(uid)

        if deleted:
            rprint(f"[green]Deleted event with UID: {uid}[/green]")
        else:
            rprint(f"[yellow]Event with UID '{uid}' not found[/yellow]")

    except Exception as e:
        rprint(f"[red]Error deleting event: {e}[/red]")
        raise typer.Exit(1) from None


@app.command("list-calendars")
def list_calendars(
    config: ConfigOption = None,
    output_format: FormatOption = None,
) -> None:
    """List configured calendars."""
    settings = get_effective_settings(config, None, output_format)

    calendars = [
        {
            "name": cal.name,
            "type": cal.type,
            "mode": cal.mode,
            "supports_write": cal.supports_write,
            "url": cal.url,
        }
        for cal in settings.calendars
    ]

    output = format_calendars(calendars, settings.default_output_format)
    rprint(output)


@app.command("config-check")
def config_check(
    config: ConfigOption = None,
) -> None:
    """Validate configuration and test calendar connections."""
    settings = get_effective_settings(config, None, None)

    if not settings.calendars:
        rprint("[yellow]Warning: No calendars configured[/yellow]")
        rprint("Add calendars via config file or environment variables.")
        raise typer.Exit(1)

    rprint(f"Timezone: {settings.default_timezone}")
    rprint(f"Output format: {settings.default_output_format}")
    rprint(f"Calendars: {len(settings.calendars)}")
    rprint()

    for source in settings.calendars:
        rprint(f"Testing '{source.name}' ({source.type})...")
        try:
            provider = get_provider(source, settings.default_timezone)
            # Try to fetch a small time range
            now = datetime.now(ZoneInfo(settings.default_timezone))
            events = provider.get_events(now, now + timedelta(days=1))
            rprint(f"  [green]OK[/green] - {len(events)} events in next 24h")
        except Exception as e:
            rprint(f"  [red]FAILED[/red] - {e}")


if __name__ == "__main__":
    app()
