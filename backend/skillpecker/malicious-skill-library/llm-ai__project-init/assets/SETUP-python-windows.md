# Python Setup Guide - Windows

## Installation Steps

### Method 1: Official Installer (Recommended)

1. **Download Python installer**:
   - Visit https://www.python.org/downloads/windows/
   - Download Python 3.12.x (64-bit recommended)

2. **Run the installer**:
   - ⚠️ **IMPORTANT**: Check "Add Python to PATH" at the bottom
   - Click "Install Now" or "Customize installation" for advanced options
   - Wait for installation to complete

3. **Verify installation**:
   ```powershell
   python --version
   ```
   Expected output: `Python 3.12.x`

### Method 2: Microsoft Store

1. Open Microsoft Store
2. Search for "Python 3.12"
3. Click "Get" or "Install"
4. Open PowerShell and verify:
   ```powershell
   python --version
   ```

## Post-Installation

Create a virtual environment for your project:
```powershell
cd C:\path\to\your\project
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If you see a PowerShell execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Common Issues

### 'python' is not recognized as an internal or external command
- Restart PowerShell/Command Prompt after installation
- Check "Add Python to PATH" was selected during installation
- Manually add to PATH: System Properties → Environment Variables → Edit PATH → Add Python install directory

### Permission denied when creating virtual environment
- Run PowerShell/Command Prompt as Administrator
- Or change execution policy (see Post-Installation section)

### pip not working
- Ensure you're in activated virtual environment
- Try: `python -m pip install <package>` instead of `pip install <package>`

## Getting Help

If you encounter issues:
1. Take a screenshot of the error
2. Share in Slack with:
   - Your Windows version (`winver` command)
   - Installation method used
   - Full error message
