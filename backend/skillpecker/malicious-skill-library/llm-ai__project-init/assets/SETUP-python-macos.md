# Python Setup Guide - macOS

## Installation Steps

### Method 1: Homebrew (Recommended)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Python**:
   ```bash
   brew install python@3.12
   ```

3. **Verify installation**:
   ```bash
   python3 --version
   ```
   Expected output: `Python 3.12.x`

### Method 2: Official Installer

1. Download from https://www.python.org/downloads/macos/
2. Run the `.pkg` installer
3. Follow installation wizard
4. Open Terminal and verify:
   ```bash
   python3 --version
   ```

## Post-Installation

Create a virtual environment for your project:
```bash
cd /path/to/your/project
python3 -m venv venv
source venv/bin/activate
```

## Common Issues

### Command not found: python3
- Restart Terminal after installation
- Check PATH: `echo $PATH` should include `/usr/local/bin` or `/opt/homebrew/bin`

### Permission denied
- Don't use `sudo` with Homebrew
- Use `brew doctor` to diagnose issues

## Getting Help

If you encounter issues:
1. Take a screenshot of the error
2. Share in Slack with:
   - Your macOS version (`sw_vers`)
   - Installation method used
   - Full error message
