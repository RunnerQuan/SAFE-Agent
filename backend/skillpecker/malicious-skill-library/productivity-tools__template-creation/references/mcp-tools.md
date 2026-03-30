# Template Creation - MCP Tool Reference

Complete reference for all MCP tools used in template creation workflow.

---

## 1. geo-routing.geocode_address

**Purpose:** Convert human-readable address to GPS coordinates with ambiguity handling.

**Request:**
```json
{
  "address": "Bratislava",
  "country_hint": "SK"
}
```

**Response (Single Match):**
```json
{
  "success": true,
  "confidence": 0.95,
  "coordinates": {
    "latitude": 48.1486,
    "longitude": 17.1077
  },
  "address": "Bratislava, Slovakia",
  "type": "city",
  "alternatives": []
}
```

**Response (Multiple Matches - Ambiguous):**
```json
{
  "success": true,
  "confidence": 0.65,
  "coordinates": {
    "latitude": 48.7164,
    "longitude": 21.2611
  },
  "address": "Košice City Center, Slovakia",
  "type": "city_center",
  "alternatives": [
    {
      "coordinates": {"latitude": 48.7164, "longitude": 21.2611},
      "address": "Košice City Center, Slovakia",
      "type": "city_center",
      "confidence": 0.75
    },
    {
      "coordinates": {"latitude": 48.6950, "longitude": 21.2550},
      "address": "OMV Košice South, Slovakia",
      "type": "fuel_station",
      "confidence": 0.60
    },
    {
      "coordinates": {"latitude": 48.7100, "longitude": 21.2850},
      "address": "Shell Košice East, Slovakia",
      "type": "fuel_station",
      "confidence": 0.58
    }
  ]
}
```

**Key Fields:**
- `confidence`: 0.0-1.0 (≥0.7 is high confidence, <0.7 may have alternatives)
- `coordinates`: GPS coordinates (latitude/longitude)
- `address`: Formatted full address string
- `type`: Location type (city, fuel_station, address, etc.)
- `alternatives`: Array of alternative matches if ambiguous

**Handling Ambiguity:**
When `confidence < 0.7` and `alternatives.length > 0`, present options to user:
1. Show all alternatives sorted by confidence (descending)
2. Display coordinates, address, and type for each
3. User selects best match
4. Use selected coordinates for template

**Slovakia Bounds Validation:**
- Latitude: 47.7° to 49.6°N
- Longitude: 16.8° to 22.6°E
- Warn if outside Slovakia but allow (international trips supported)

---

## 2. geo-routing.calculate_route

**Purpose:** Calculate route distance, time, and alternatives between two GPS coordinates.

**Request:**
```json
{
  "start_coords": {
    "latitude": 48.1486,
    "longitude": 17.1077
  },
  "end_coords": {
    "latitude": 48.7164,
    "longitude": 21.2611
  },
  "alternatives": true
}
```

**Response:**
```json
{
  "success": true,
  "routes": [
    {
      "route_id": "route-001",
      "distance_km": 410,
      "duration_minutes": 270,
      "route_name": "E50 (most direct)",
      "tolls_eur": 0,
      "geometry": "encoded_polyline_here",
      "recommended": true
    },
    {
      "route_id": "route-002",
      "distance_km": 395,
      "duration_minutes": 252,
      "route_name": "D1 highway",
      "tolls_eur": 12,
      "geometry": "encoded_polyline_here",
      "recommended": false
    },
    {
      "route_id": "route-003",
      "distance_km": 385,
      "duration_minutes": 348,
      "route_name": "Local roads",
      "tolls_eur": 0,
      "geometry": "encoded_polyline_here",
      "recommended": false
    }
  ]
}
```

**Key Fields:**
- `distance_km`: Route distance in kilometers
- `duration_minutes`: Estimated travel time
- `route_name`: Human-readable route description
- `tolls_eur`: Total toll costs (0 if none)
- `recommended`: True for most direct/commonly used route
- `geometry`: Encoded polyline (optional, for map display)

**User Presentation:**
```
"3 routes found:
1. E50: 410km (4.5 hrs) ← Recommended (most direct)
2. D1 highway: 395km (4.2 hrs) €12 tolls
3. Local roads: 385km (5.8 hrs)

Which route do you typically take? (1/2/3 or 'skip')"
```

**If User Skips:**
- Template created without distance_km field
- Distance calculated during matching using great-circle distance
- Less accurate but acceptable for template creation

---

## 3. car-log-core.create_template

**Purpose:** Save template with mandatory GPS coordinates and optional enhancements.

**Request (Complete Template):**
```json
{
  "name": "Warehouse Run",
  "from_coords": {
    "lat": 48.1486,
    "lng": 17.1077
  },
  "from_address": "Hlavná 45, Bratislava",
  "from_label": "Bratislava Office",
  "to_coords": {
    "lat": 48.7164,
    "lng": 21.2611
  },
  "to_address": "Mlynská 45, Košice",
  "to_label": "Košice Warehouse",
  "distance_km": 410,
  "is_round_trip": true,
  "typical_days": ["Monday", "Thursday"],
  "purpose": "business",
  "business_description": "Weekly warehouse pickup and delivery"
}
```

**Request (Minimal Template - GPS Only):**
```json
{
  "name": "Quick Route",
  "from_coords": {
    "lat": 48.1486,
    "lng": 17.1077
  },
  "to_coords": {
    "lat": 48.7164,
    "lng": 21.2611
  },
  "purpose": "business"
}
```

**Response:**
```json
{
  "success": true,
  "template": {
    "template_id": "tpl-789-abc",
    "name": "Warehouse Run",
    "from_coords": {"lat": 48.1486, "lng": 17.1077},
    "to_coords": {"lat": 48.7164, "lng": 21.2611},
    "distance_km": 820,
    "is_round_trip": true,
    "typical_days": ["Monday", "Thursday"],
    "purpose": "business",
    "completeness_score": 0.95,
    "created_at": "2025-11-20T10:30:00Z"
  }
}
```

**Required Fields:**
- `name`: Descriptive template name (string, 3-100 characters)
- `from_coords`: Start GPS coordinates {lat, lng} - MANDATORY
- `to_coords`: End GPS coordinates {lat, lng} - MANDATORY
- `purpose`: "business" or "personal"

**Optional Fields (Enhance Matching):**
- `from_address`: Human-readable start address (30% matching weight)
- `to_address`: Human-readable end address (30% matching weight)
- `from_label`: Short label (e.g., "Bratislava" instead of full address)
- `to_label`: Short label (e.g., "Košice")
- `distance_km`: Route distance (from calculate_route or manual)
- `is_round_trip`: If true, matching creates 2 trips (outbound + return)
- `typical_days`: Array of day names (enables +5% confidence bonus)
- `business_description`: Required if purpose is "business"

**Validation Rules:**
- GPS coordinates: Must be valid lat/lng (-90 to 90, -180 to 180)
- Slovakia bounds check: Warn if outside 47.7-49.6°N, 16.8-22.6°E
- Distance: If provided, must be > 0
- Typical days: Must be valid day names (Monday-Sunday)
- Business description: Required if purpose is "business"

---

## 4. trip-reconstructor.calculate_template_completeness

**Purpose:** Assess template quality and provide recommendations for improvement.

**Request:**
```json
{
  "template_id": "tpl-789-abc"
}
```

**Response (High Completeness):**
```json
{
  "success": true,
  "completeness": {
    "score": 0.95,
    "breakdown": {
      "essential_fields": 0.60,
      "distance": 0.10,
      "typical_days": 0.10,
      "purpose": 0.10,
      "business_description": 0.10
    },
    "missing_fields": [],
    "recommendations": [
      "Template is complete and ready for high-confidence matching!"
    ]
  }
}
```

**Response (Low Completeness):**
```json
{
  "success": true,
  "completeness": {
    "score": 0.60,
    "breakdown": {
      "essential_fields": 0.60,
      "distance": 0.00,
      "typical_days": 0.00,
      "purpose": 0.00,
      "business_description": 0.00
    },
    "missing_fields": [
      "distance_km",
      "typical_days",
      "business_description"
    ],
    "recommendations": [
      "Add distance_km for better matching accuracy",
      "Add typical_days for +5% confidence bonus",
      "Add business_description for Slovak tax compliance"
    ]
  }
}
```

**Completeness Scoring:**
- **Essential (GPS coords):** 60% (always present for valid template)
- **Distance:** +10% (from route calculation)
- **Typical days:** +10% (enables day-of-week matching bonus)
- **Purpose:** +10% (business/personal classification)
- **Business description:** +10% (Slovak compliance for business trips)

**User Presentation:**
```
"✅ Template created!

'Warehouse Run'
• From: 48.1486°N, 17.1077°E 'Bratislava Office'
• To: 48.7164°N, 21.2611°E 'Košice Warehouse'
• Distance: 820km (round trip)
• Days: Monday, Thursday
• Purpose: Business - Weekly warehouse pickup
• Completeness: 95%

I'll match this template with 90%+ confidence on future trips!"
```

For low completeness (60-70%), show recommendations:
```
"Template created (60% complete)

'Quick Route'
• From: 48.1486°N, 17.1077°E
• To: 48.7164°N, 21.2611°E
• GPS coordinates saved ← 70% matching weight!

Recommendations to improve matching:
• Add distance (use 'calculate route')
• Add typical days (e.g., 'Monday, Thursday')
• Add business description if this is for work trips

You can update this template later with 'edit template'."
```

---

## Tool Call Sequence

**Happy Path (Complete Template):**
```
1. geo-routing.geocode_address (from)
   ↓ (coordinates + address)
2. geo-routing.geocode_address (to)
   ↓ (coordinates + address)
3. geo-routing.calculate_route (optional)
   ↓ (distance_km)
4. car-log-core.create_template
   ↓ (template_id)
5. trip-reconstructor.calculate_template_completeness
   ↓ (completeness score + recommendations)
```

**Minimal Path (GPS Only):**
```
1. [User provides GPS directly]
2. car-log-core.create_template (GPS only)
   ↓ (template_id)
3. trip-reconstructor.calculate_template_completeness
   ↓ (60% completeness, recommendations shown)
```

**Ambiguous Path (Multiple Geocoding Matches):**
```
1. geo-routing.geocode_address (from)
   ↓ (multiple alternatives)
2. [User selects alternative]
3. geo-routing.geocode_address (to)
   ↓ (multiple alternatives)
4. [User selects alternative]
5. geo-routing.calculate_route
6. car-log-core.create_template
7. trip-reconstructor.calculate_template_completeness
```

**Total MCP Calls:** 2-5 depending on route calculation and ambiguity resolution

---

## Error Handling

**Common Error Codes:**
- `GEOCODING_FAILED`: Address not found or invalid
- `AMBIGUOUS_ADDRESS`: Multiple matches, user selection required
- `GPS_REQUIRED`: Missing mandatory GPS coordinates
- `VALIDATION_ERROR`: Invalid GPS bounds or missing required fields
- `DUPLICATE_TEMPLATE`: Template with same name already exists

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "GPS_REQUIRED",
    "message": "GPS coordinates are mandatory for template creation",
    "field": "from_coords",
    "details": "Provide coordinates directly or use geocode_address"
  }
}
```

---

## Performance Considerations

**Geocoding:**
- OpenStreetMap Nominatim: 1-2 seconds typical
- Cache results (24-hour TTL) to avoid repeated API calls
- Rate limit: 1 request/second (respect OSM usage policy)

**Route Calculation:**
- OSRM: 500ms-2 seconds typical
- Optional step - can skip if user declines
- Cache routes by coordinates pair (24-hour TTL)

**Template Creation:**
- File-based storage: <100ms
- Atomic write pattern prevents corruption
- File path: `~/Documents/MileageLog/data/templates/{template_id}.json`

**Completeness Calculation:**
- Pure function: <10ms
- No external API calls
- Runs immediately after template creation
