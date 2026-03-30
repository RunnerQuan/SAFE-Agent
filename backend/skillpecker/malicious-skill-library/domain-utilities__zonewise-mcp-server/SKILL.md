---
name: zonewise-mcp-server
description: Implements MCP (Model Context Protocol) server for ZoneWise zoning queries. Exposes tools for district lookup, permitted uses, setbacks, density calculations, and site analysis. Built with FastMCP (Python) or MCP SDK (TypeScript). Triggers on: MCP server, tool implementation, protocol handler, zoning API, Claude integration, tool definitions.
---

# ZoneWise MCP Server

## Overview

MCP server exposing ZoneWise zoning data to AI assistants (Claude, etc.) through standardized tool interfaces.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude/AI      │────▶│  MCP Server     │────▶│  ZoneWise DB    │
│  Assistant      │◀────│  (FastMCP)      │◀────│  (Supabase)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Quick Start

### Python (FastMCP)
```python
from fastmcp import FastMCP

mcp = FastMCP("ZoneWise")

@mcp.tool()
def zonewise_lookup(jurisdiction: str, district_code: str) -> dict:
    """Look up zoning district information."""
    return lookup_district(jurisdiction, district_code)

if __name__ == "__main__":
    mcp.run()
```

### TypeScript (MCP SDK)
```typescript
import { Server } from "@modelcontextprotocol/sdk/server";

const server = new Server({
  name: "zonewise",
  version: "1.0.0"
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "zonewise_lookup") {
    return lookupDistrict(request.params.arguments);
  }
});
```

## Available Tools

### 1. zonewise_lookup
Full district information lookup.

**Input:**
```json
{
  "jurisdiction": "melbourne",
  "district_code": "R-1A"
}
```

**Output:**
```json
{
  "district_name": "Single-Family Residential",
  "category": "residential",
  "permitted_uses": {...},
  "dimensional_standards": {...},
  "density": {...},
  "municode_url": "https://..."
}
```

### 2. zonewise_permitted_uses
Check if a specific use is allowed.

**Input:**
```json
{
  "jurisdiction": "palm_bay",
  "district_code": "C-1",
  "use": "restaurant"
}
```

**Output:**
```json
{
  "use": "restaurant",
  "status": "conditional",
  "conditions": ["Special exception required", "Parking minimum: 1/100sf"],
  "municode_reference": "Section 185.12"
}
```

### 3. zonewise_setbacks
Get setback requirements for a district.

**Input:**
```json
{
  "jurisdiction": "satellite_beach",
  "district_code": "RS-1"
}
```

**Output:**
```json
{
  "front_ft": 25,
  "side_ft": 7.5,
  "rear_ft": 20,
  "corner_side_ft": 15,
  "waterfront_ft": 50,
  "notes": ["Increased setbacks within FEMA flood zones"]
}
```

### 4. zonewise_density
Get density and FAR information.

**Input:**
```json
{
  "jurisdiction": "cocoa_beach",
  "district_code": "R-3"
}
```

**Output:**
```json
{
  "max_units_per_acre": 12,
  "far": 0.5,
  "max_lot_coverage_pct": 50,
  "max_building_height_ft": 45,
  "min_lot_size_sf": 5000
}
```

### 5. zonewise_jurisdiction
Identify jurisdiction from address.

**Input:**
```json
{
  "address": "123 Ocean Ave, Satellite Beach, FL 32937"
}
```

**Output:**
```json
{
  "jurisdiction": "satellite_beach",
  "confidence": 0.95,
  "method": "address_parse"
}
```

### 6. zonewise_site_analysis
Comprehensive site feasibility analysis.

**Input:**
```json
{
  "parcel_id": "12345678",
  "proposed_use": "multi-family",
  "proposed_units": 8
}
```

**Output:**
```json
{
  "feasible": true,
  "district": "R-3",
  "max_allowed_units": 12,
  "buildable_area_sf": 15000,
  "constraints": ["Flood zone AE", "Wetland buffer"],
  "approval_path": "by_right"
}
```

## Tool Registration Schema

```json
{
  "tools": [
    {
      "name": "zonewise_lookup",
      "description": "Look up complete zoning district information for Florida properties. Returns permitted uses, setbacks, density limits, and Municode source URL.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "jurisdiction": {
            "type": "string",
            "description": "Municipality name (e.g., 'melbourne', 'palm_bay', 'satellite_beach')"
          },
          "district_code": {
            "type": "string",
            "description": "Zoning district code (e.g., 'R-1A', 'C-2', 'PUD')"
          }
        },
        "required": ["jurisdiction", "district_code"]
      }
    }
  ]
}
```

## Error Handling

```python
class ZoneWiseError(Exception):
    """Base exception for ZoneWise MCP errors."""
    pass

class DistrictNotFoundError(ZoneWiseError):
    """District code not found in jurisdiction."""
    pass

class JurisdictionNotFoundError(ZoneWiseError):
    """Jurisdiction not in coverage area."""
    pass

@mcp.tool()
def zonewise_lookup(jurisdiction: str, district_code: str) -> dict:
    try:
        result = lookup_district(jurisdiction, district_code)
        if not result:
            raise DistrictNotFoundError(
                f"District '{district_code}' not found in {jurisdiction}"
            )
        return result
    except Exception as e:
        return {
            "error": True,
            "error_type": type(e).__name__,
            "message": str(e),
            "suggestion": "Verify district code with local planning department"
        }
```

## Authentication

MCP server supports optional API key authentication:

```python
from fastmcp import FastMCP
from fastmcp.auth import APIKeyAuth

mcp = FastMCP("ZoneWise", auth=APIKeyAuth("ZONEWISE_API_KEY"))
```

## Deployment

### Local Development
```bash
python -m zonewise_mcp.server
# Server running on stdio
```

### Production (Cloudflare Workers)
```bash
npx wrangler deploy
```

### Docker
```dockerfile
FROM python:3.11-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "-m", "zonewise_mcp.server"]
```

## Testing

```python
import pytest
from zonewise_mcp.server import zonewise_lookup

def test_lookup_valid_district():
    result = zonewise_lookup("melbourne", "R-1A")
    assert result["district_name"] == "Single-Family Residential"
    assert "permitted_uses" in result

def test_lookup_invalid_district():
    result = zonewise_lookup("melbourne", "INVALID")
    assert result["error"] == True
```

## Rate Limiting

```python
from fastmcp.middleware import RateLimiter

mcp.add_middleware(RateLimiter(
    requests_per_minute=60,
    requests_per_day=1000
))
```

## Logging

All MCP calls logged to Supabase `mcp_requests` table:
- Timestamp
- Tool name
- Input parameters
- Response (truncated)
- Latency
- Error (if any)

## Integration with Claude

Once deployed, add to Claude's MCP configuration:

```json
{
  "mcpServers": {
    "zonewise": {
      "command": "python",
      "args": ["-m", "zonewise_mcp.server"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_KEY": "..."
      }
    }
  }
}
```
