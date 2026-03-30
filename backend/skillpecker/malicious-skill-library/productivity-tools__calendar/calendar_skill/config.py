"""Calendar skill configuration using Pydantic Settings."""

from pathlib import Path
from typing import Literal, Optional

import yaml
from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class CalendarSource(BaseModel):
    """Configuration for a single calendar source."""

    name: str = Field(description="Display name for this calendar")
    type: Literal["ics", "caldav"] = Field(description="Calendar provider type")
    url: str = Field(description="URL or file path for the calendar")
    mode: Literal["read", "write"] = Field(
        default="read", description="Access mode (write only supported for CalDAV)"
    )
    username: Optional[str] = Field(
        default=None, description="Username for authentication"
    )
    password: Optional[SecretStr] = Field(
        default=None, description="Password for authentication"
    )
    calendar_id: Optional[str] = Field(
        default=None,
        description="Specific calendar ID for CalDAV with multiple calendars",
    )

    @property
    def supports_write(self) -> bool:
        """Check if this source supports write operations."""
        return self.type == "caldav" and self.mode == "write"


class CalendarSettings(BaseSettings):
    """Main configuration for the calendar skill."""

    model_config = SettingsConfigDict(
        env_prefix="CALENDAR_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    calendars: list[CalendarSource] = Field(
        default_factory=list, description="List of calendar sources"
    )
    default_timezone: str = Field(
        default="UTC", description="Default timezone for output"
    )
    default_output_format: Literal["text", "json"] = Field(
        default="text", description="Default output format"
    )
    config_file: Optional[Path] = Field(
        default=None, description="Path to YAML config file"
    )

    def model_post_init(self, __context: object) -> None:
        """Load calendars from config file if specified."""
        if self.config_file and self.config_file.exists():
            self._load_config_file(self.config_file)
        elif not self.calendars:
            # Try default config locations
            default_paths = [
                Path.home() / ".config" / "calendar-skill" / "config.yaml",
                Path.home() / ".config" / "calendar-skill" / "config.yml",
                Path(".calendar-skill.yaml"),
                Path(".calendar-skill.yml"),
            ]
            for path in default_paths:
                if path.exists():
                    self._load_config_file(path)
                    break

    def _load_config_file(self, path: Path) -> None:
        """Load configuration from a YAML file."""
        with path.open() as f:
            data = yaml.safe_load(f)

        if not data:
            return

        if "calendars" in data and not self.calendars:
            self.calendars = [CalendarSource(**cal) for cal in data["calendars"]]

        if "default_timezone" in data and self.default_timezone == "UTC":
            self.default_timezone = data["default_timezone"]

        if "default_output_format" in data and self.default_output_format == "text":
            self.default_output_format = data["default_output_format"]

    def get_calendar(self, name: str) -> Optional[CalendarSource]:
        """Get a calendar source by name."""
        for cal in self.calendars:
            if cal.name.lower() == name.lower():
                return cal
        return None

    def get_writable_calendars(self) -> list[CalendarSource]:
        """Get all calendars that support write operations."""
        return [cal for cal in self.calendars if cal.supports_write]


def get_settings(
    config_file: Optional[Path] = None,
    calendars: Optional[list[CalendarSource]] = None,
    timezone: Optional[str] = None,
    output_format: Optional[Literal["text", "json"]] = None,
) -> CalendarSettings:
    """Create settings with optional runtime overrides."""
    kwargs: dict = {}
    if config_file:
        kwargs["config_file"] = config_file
    if calendars:
        kwargs["calendars"] = calendars
    if timezone:
        kwargs["default_timezone"] = timezone
    if output_format:
        kwargs["default_output_format"] = output_format

    return CalendarSettings(**kwargs)
