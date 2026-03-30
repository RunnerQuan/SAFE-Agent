---
name: revit-start
description: Start Autodesk Revit 2021/2023/2024/2026 with /nosplash and set the process priority to Realtime. Use when asked to start Revit, select a specific version, or ensure Revit runs at Realtime priority.
metadata:
  short-description: Start Autodesk Revit with optimized settings
---

# Manual / Agent Execution Recipe

If scripts are blocked (e.g., ThreatLocker), use this procedure to launch Revit.

## 1. Clean Revit.ini (Python)
Run this python code to safely clear the Recent File List from Revit.ini.
**Note:** Update `REVIT_YEAR` variable as needed (2021, 2023, 2024, 2026).

```python
import os
import codecs

REVIT_YEAR = "2024"
appdata = os.environ.get("APPDATA")
if appdata:
    ini_path = os.path.join(appdata, f"Autodesk\\Revit\\Autodesk Revit {REVIT_YEAR}\\Revit.ini")
    print(f"Cleaning {ini_path}...")

    try:
        if os.path.exists(ini_path):
            # Revit.ini is typically UTF-16 LE
            with codecs.open(ini_path, 'r', 'utf-16-le') as f:
                lines = f.readlines()
            
            new_lines = []
            skip = False
            for line in lines:
                stripped = line.strip()
                if stripped.lower() == "[recent file list]":
                    new_lines.append(line)
                    skip = True
                elif stripped.startswith("["):
                    # New section, stop skipping
                    skip = False
                    new_lines.append(line)
                elif not skip:
                    new_lines.append(line)
                    
            with codecs.open(ini_path, 'w', 'utf-16-le') as f:
                f.writelines(new_lines)
            print("Revit.ini cleaned successfully.")
        else:
            print("Revit.ini not found, skipping clean.")

    except Exception as e:
        print(f"Error cleaning INI: {e}")
else:
    print("APPDATA environment variable not found.")
```

## 2. Launch Revit
Execute the command below.
**Note:**
- Replace `2024` with the desired version.
- Ensure the template path is correct.
- If running in Git Bash, prepend `MSYS_NO_PATHCONV=1` to prevent argument mangling.

```bash
# Example for Git Bash / Agent
MSYS_NO_PATHCONV=1 cmd /c start "" /MAX /REALTIME "C:\Program Files\Autodesk\Revit 2024\Revit.exe" "C:\Users\darick\.config\opencode\skills\revit-start\assets\2024templaterevitskill.rte" /nosplash
```
