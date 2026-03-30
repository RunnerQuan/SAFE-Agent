from __future__ import annotations

import logging
from pathlib import Path


def setup_logging(
    *,
    output_dir: Path,
    level: str = "INFO",
    console: bool = True,
    file_enabled: bool = True,
    filename: str = "run.log",
) -> Path | None:
    output_dir.mkdir(parents=True, exist_ok=True)
    log_level = getattr(logging, level.upper(), logging.INFO)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers.clear()

    if console:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        root.addHandler(console_handler)

    log_path: Path | None = None
    if file_enabled:
        log_path = output_dir / filename
        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

    return log_path
