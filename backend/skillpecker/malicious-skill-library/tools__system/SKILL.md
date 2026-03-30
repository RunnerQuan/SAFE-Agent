---
name: system
description: |
  System maintenance for Bazzite OS. Updates via topgrade, cleanup of podman/flatpaks,
  viewing logs and changelogs, diagnostics, and power measurements. Use when users
  need to update, clean, or diagnose their Bazzite system.
---

# System - Bazzite System Maintenance

## Overview

The system skill covers core Bazzite maintenance tasks: updates, cleanup, logging, diagnostics, and benchmarking.

## Quick Reference

| Command | Description |
|---------|-------------|
| `ujust update` | Update system via topgrade |
| `ujust upgrade` | Alias for update |
| `ujust changelogs` | View stable release notes |
| `ujust changelogs-testing` | View pre-release notes |
| `ujust toggle-updates` | Enable/disable automatic updates |
| `ujust clean-system` | Cleanup podman, flatpaks, rpm-ostree |
| `ujust logs-this-boot` | Current boot journal logs |
| `ujust logs-last-boot` | Previous boot journal logs |
| `ujust get-logs` | Upload logs to pastebin |
| `ujust device-info` | Upload device info to pastebin |
| `ujust check-idle-power-draw` | Measure idle power with powerstat |
| `ujust check-local-overrides` | Compare /usr/etc vs /etc |
| `ujust benchmark` | 1-minute stress test |
| `ujust bazzite-cli` | Toggle Bluefin CLI experience |

## Updates

### Update System

```bash
# Full system update (flatpaks, containers, rpm-ostree)
ujust update

# Same as update
ujust upgrade
```

Uses `topgrade` to update:
- Flatpak applications
- Podman containers
- rpm-ostree packages
- System components

### View Changelogs

```bash
# Stable release notes
ujust changelogs

# Pre-release/testing notes
ujust changelogs-testing
```

### Automatic Updates

```bash
# Toggle uupd.timer (automatic updates)
ujust toggle-updates
```

## Cleanup

```bash
# Clean podman images, flatpaks, rpm-ostree content
ujust clean-system
```

Removes:
- Unused podman images
- Orphaned flatpak runtimes
- Old rpm-ostree deployments

## Logging

### View Logs

```bash
# Current boot
ujust logs-this-boot

# Previous boot (useful after crash)
ujust logs-last-boot
```

### Share Logs

```bash
# Upload system logs to pastebin for support
ujust get-logs

# Upload device info to pastebin
ujust device-info
```

Returns a pastebin URL to share with support.

## Diagnostics

### Power Measurement

```bash
# Measure idle power draw
ujust check-idle-power-draw
```

Uses `powerstat` to measure system power consumption.

### Local Overrides

```bash
# Compare /usr/etc vs /etc
ujust check-local-overrides
```

Shows files in /etc that override /usr/etc defaults.

### Benchmarking

```bash
# 1-minute stress test
ujust benchmark
```

Uses `stress-ng` to benchmark CPU, memory, and I/O.

## CLI Experience

```bash
# Toggle Bluefin-style CLI (bling)
ujust bazzite-cli
```

Enables/disables enhanced CLI features from Bluefin.

## Common Workflows

### Weekly Maintenance

```bash
# Update everything
ujust update

# Clean unused resources
ujust clean-system
```

### Troubleshooting Crashes

```bash
# Check previous boot logs
ujust logs-last-boot

# Share logs for support
ujust get-logs
```

### Performance Testing

```bash
# Run benchmark
ujust benchmark

# Check power draw
ujust check-idle-power-draw
```

## Troubleshooting

### Update Fails

**Check:** Network connectivity, disk space

```bash
# Manual rpm-ostree update
rpm-ostree upgrade

# Check for pending changes
rpm-ostree status
```

### Logs Too Long

**Use journalctl filters:**

```bash
# Last 100 lines
journalctl -n 100

# Since specific time
journalctl --since "1 hour ago"

# Specific unit
journalctl -u <service-name>
```

## Cross-References

- **bazzite-ai:configure** - Service configuration
- **bazzite:boot** - Boot and GRUB settings
- **bazzite:storage** - Disk management and snapshots

## When to Use This Skill

Use when the user asks about:
- "update bazzite", "upgrade system", "system update"
- "view changelog", "release notes", "what's new"
- "clean up system", "free disk space", "remove unused"
- "view logs", "system logs", "check journal"
- "share logs", "upload logs", "support pastebin"
- "power consumption", "idle power", "battery"
- "benchmark", "stress test", "performance"
- "automatic updates", "disable updates"
