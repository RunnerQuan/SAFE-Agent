# Security Best Practices for Plugins

## Overview
Security guidelines for plugin development and auditing.

## Core Principles
1. **Input Validation**: Sanitize all inputs from users or external systems.
2. **Permission Scoping**: Request only necessary permissions.
3. **No Credential Leakage**: Never hardcode secrets.
4. **Sandboxing**: Use appropriate execution environments.

## Auditing Checklist
- [ ] Check for hardcoded tokens
- [ ] Verify file system access limits
- [ ] Review network call destinations
