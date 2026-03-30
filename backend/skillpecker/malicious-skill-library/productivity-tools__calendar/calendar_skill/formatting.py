"""Output formatters for calendar data."""

import json
from datetime import datetime
from typing import Literal

from calendar_skill.models import (
    CalendarEvent,
    CalendarResult,
    FreeBusyResult,
    InstanceResult,
)


def format_datetime(dt: datetime, include_time: bool = True) -> str:
    """Format a datetime for display."""
    if include_time:
        return dt.strftime("%Y-%m-%d %H:%M")
    return dt.strftime("%Y-%m-%d")


def format_event_text(event: CalendarEvent) -> str:
    """Format a single event as human-readable text."""
    lines = []

    # Time and summary
    if event.all_day:
        time_str = format_datetime(event.start, include_time=False)
        lines.append(f"  {time_str} (all day): {event.summary}")
    else:
        start_str = format_datetime(event.start)
        end_str = format_datetime(event.end)
        lines.append(f"  {start_str} - {end_str}: {event.summary}")

    # Location
    if event.location:
        lines.append(f"    Location: {event.location}")

    # Recurrence indicator
    if event.rrule:
        lines.append(f"    Recurring: {event.rrule}")

    # Status if not confirmed
    if event.status != "confirmed":
        lines.append(f"    Status: {event.status}")

    return "\n".join(lines)


def format_result_text(result: CalendarResult) -> str:
    """Format a CalendarResult as human-readable text."""
    lines = []

    if result.events:
        # Group events by date
        events_by_date: dict[str, list[CalendarEvent]] = {}
        for event in sorted(result.events, key=lambda e: e.start):
            date_key = event.start.strftime("%Y-%m-%d (%A)")
            if date_key not in events_by_date:
                events_by_date[date_key] = []
            events_by_date[date_key].append(event)

        for date_key, events in events_by_date.items():
            lines.append(f"\n{date_key}:")
            for event in events:
                lines.append(format_event_text(event))
    else:
        lines.append("No events found.")

    if result.has_warnings:
        lines.append("\nWarnings:")
        for warning in result.warnings:
            lines.append(f"  - {warning}")

    return "\n".join(lines)


def format_freebusy_text(result: FreeBusyResult) -> str:
    """Format a FreeBusyResult as human-readable text."""
    lines = []

    if result.slots:
        lines.append("Busy times:")
        for slot in sorted(result.slots, key=lambda s: s.start):
            start_str = format_datetime(slot.start)
            end_str = format_datetime(slot.end)
            status_indicator = "?" if slot.status == "tentative" else ""
            lines.append(f"  {start_str} - {end_str} ({slot.status}){status_indicator}")
    else:
        lines.append("No busy times found (entirely free).")

    if result.has_warnings:
        lines.append("\nWarnings:")
        for warning in result.warnings:
            lines.append(f"  - {warning}")

    return "\n".join(lines)


def format_instances_text(result: InstanceResult) -> str:
    """Format an InstanceResult as human-readable text."""
    lines = []

    if result.instances:
        event_summary = (
            result.instances[0].event.summary if result.instances else "Event"
        )
        lines.append(f"Instances of '{event_summary}':")
        for instance in sorted(result.instances, key=lambda i: i.instance_start):
            start_str = format_datetime(instance.instance_start)
            end_str = format_datetime(instance.instance_end)
            lines.append(f"  {start_str} - {end_str}")
    else:
        lines.append("No instances found in the specified range.")

    if result.warnings:
        lines.append("\nWarnings:")
        for warning in result.warnings:
            lines.append(f"  - {warning}")

    return "\n".join(lines)


def format_result_json(result: CalendarResult) -> str:
    """Format a CalendarResult as JSON."""
    return result.model_dump_json(indent=2)


def format_freebusy_json(result: FreeBusyResult) -> str:
    """Format a FreeBusyResult as JSON."""
    return result.model_dump_json(indent=2)


def format_instances_json(result: InstanceResult) -> str:
    """Format an InstanceResult as JSON."""
    return result.model_dump_json(indent=2)


def format_calendars_text(calendars: list[dict]) -> str:
    """Format calendar list as human-readable text."""
    lines = ["Configured calendars:"]
    for cal in calendars:
        mode_indicator = "[R/W]" if cal.get("supports_write") else "[R]"
        lines.append(f"  {mode_indicator} {cal['name']} ({cal['type']})")
    return "\n".join(lines)


def format_calendars_json(calendars: list[dict]) -> str:
    """Format calendar list as JSON."""
    return json.dumps(calendars, indent=2)


# Unified formatting functions
def format_result(
    result: CalendarResult | FreeBusyResult | InstanceResult,
    output_format: Literal["text", "json"] = "text",
) -> str:
    """Format any result type in the specified format."""
    if isinstance(result, CalendarResult):
        if output_format == "json":
            return format_result_json(result)
        return format_result_text(result)
    if isinstance(result, FreeBusyResult):
        if output_format == "json":
            return format_freebusy_json(result)
        return format_freebusy_text(result)
    if isinstance(result, InstanceResult):
        if output_format == "json":
            return format_instances_json(result)
        return format_instances_text(result)
    raise TypeError(f"Unknown result type: {type(result)}")


def format_calendars(
    calendars: list[dict],
    output_format: Literal["text", "json"] = "text",
) -> str:
    """Format calendar list in the specified format."""
    if output_format == "json":
        return format_calendars_json(calendars)
    return format_calendars_text(calendars)
