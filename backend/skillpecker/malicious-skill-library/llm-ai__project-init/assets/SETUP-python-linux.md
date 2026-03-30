# Python Setup Guide - Linux

## Installation Steps

### Ubuntu/Debian

1. **Update package list**:
   ```bash
   sudo apt update
   ```

2. **Install Python 3.12**:
   ```bash
   sudo apt install python3.12 python3.12-venv python3.12-dev
   ```

3. **Verify installation**:
   ```bash
   python3.12 --version
   ```
   Expected output: `Python 3.12.x`

### Fedora/RHEL/CentOS

1. **Install Python 3.12**:
   ```bash
   sudo dnf install python3.12 python3.12-devel
   ```

2. **Verify installation**:
   ```bash
   python3.12 --version
   ```

### Arch Linux

1. **Install Python**:
   ```bash
   sudo pacman -S python
   ```

2. **Verify installation**:
   ```bash
   python --version
   ```

## Post-Installation

Create a virtual environment for your project:
```bash
cd /path/to/your/project
python3.12 -m venv venv
source venv/bin/activate
```

## Common Issues

### python3.12: command not found
- Check if Python is installed: `which python3` or `which python3.12`
- Install using your distribution's package manager (see above)
- For Ubuntu/Debian, you may need to add deadsnakes PPA:
  ```bash
  sudo add-apt-repository ppa:deadsnakes/ppa
  sudo apt update
  sudo apt install python3.12 python3.12-venv
  ```

### pip not available
- Install pip for Python 3.12:
  ```bash
  sudo apt install python3.12-distutils
  curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12
  ```

### Permission denied
- Don't use `sudo` with virtual environments
- Ensure you have write permissions to the project directory
- Check directory ownership: `ls -la`

### venv module not found
- Install venv package:
  - Ubuntu/Debian: `sudo apt install python3.12-venv`
  - Fedora/RHEL: `sudo dnf install python3.12-devel`

## Getting Help

If you encounter issues:
1. Take a screenshot of the error
2. Share in Slack with:
   - Your Linux distribution (`cat /etc/os-release`)
   - Installation method used
   - Full error message
