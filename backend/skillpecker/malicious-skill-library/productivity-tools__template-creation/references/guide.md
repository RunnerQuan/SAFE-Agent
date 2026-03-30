# Skill 4: Template Creation (GPS Mandatory)

**Purpose:** Create recurring trip templates with GPS coordinates (enables high-confidence matching)

**Priority:** P0

---

## Trigger Words

- "create template", "save this route"
- After reconstruction: "Save this as template?"
- "I make this trip every week"

---

## Workflow

### Step 1: Collect Template Data
```
User: "Save Warehouse Run as template"

Claude: "Creating template 'Warehouse Run'.

Where does it start?"

User: "Bratislava office"

Claude: "Geocoding 'Bratislava office'...
[Calls: geo-routing.geocode_address]

Found 3 matches:
1. Bratislava City Center (48.1486°N, 17.1077°E)
2. Bratislava-Petržalka (48.1234°N, 17.1100°E)
3. Bratislava Airport (48.1702°N, 17.2127°E)

Which location? (1/2/3)"

User: "1"

Claude: "✓ Start: 48.1486°N, 17.1077°E 'Bratislava City Center'

Where does it end?"
```

### Step 2: Calculate Route
```
[After collecting end location]

Claude: "Calculating routes...
[Calls: geo-routing.calculate_route]

3 routes found:
• D1 highway: 395km (4.2 hrs) €12 tolls
• E50: 410km (4.5 hrs) ← Recommended (most direct)
• Local roads: 385km (5.8 hrs)

Which route do you typically take? (1/2/3)"
```

### Step 3: Optional Enhancements
```
Claude: "Template basics set (410km).

Optional enhancements:
• Round trip? (yes/no)
• Typical days? (e.g., Monday, Thursday)
• Business or personal?"

User: "Yes round trip, Monday and Thursday, business"

Claude: "✓ Round trip: 820km total
✓ Days: Monday, Thursday
✓ Purpose: Business"
```

### Step 4: Create Template
```
[Calls: car-log-core.create_template]

✅ Template created!

'Warehouse Run'
• From: 48.1486°N, 17.1077°E 'Bratislava'
• To: 48.7164°N, 21.2611°E 'Košice'
• Distance: 820km (round trip)
• Days: Monday, Thursday
• Purpose: Business
• GPS coordinates saved ← 70% matching weight!

I'll match this template with 90%+ confidence on future trips!"
```

---

## MCP Tools Used

1. **geo-routing.geocode_address** - Get GPS from address (CRITICAL)
2. **geo-routing.calculate_route** - Show route alternatives
3. **car-log-core.create_template** - Save template with GPS mandatory
4. **trip-reconstructor.calculate_template_completeness** - Verify template quality

---

## Orchestration Pattern (Detailed)

### Pattern: FROM → TO → Route → Enhancements → Create

```typescript
// 1. Geocode START location
const fromResult = await geo_routing.geocode_address({
  address: "Bratislava office",
  country_hint: "SK"
});

// 2. Handle ambiguity
if (fromResult.alternatives.length > 1) {
  // Show options to user
  // User selects → use selected coordinates
}

// 3. Geocode END location
const toResult = await geo_routing.geocode_address({
  address: "Košice warehouse",
  country_hint: "SK"
});

// 4. Calculate routes (optional but recommended)
const routes = await geo_routing.calculate_route({
  start_coords: fromResult.coordinates,
  end_coords: toResult.coordinates,
  alternatives: true
});

// 5. Collect optional enhancements
// - Round trip? (doubles distance)
// - Typical days? (improves matching)
// - Purpose? (business/personal)
// - Business description? (if business)

// 6. Create template with GPS MANDATORY
const template = await car_log_core.create_template({
  name: "Warehouse Run",
  from_coords: fromResult.coordinates,  // REQUIRED
  from_address: fromResult.address,      // Optional label
  to_coords: toResult.coordinates,       // REQUIRED
  to_address: toResult.address,          // Optional label
  distance_km: routes[0].distance_km,    // From route calculation
  is_round_trip: true,
  typical_days: ["Monday", "Thursday"],
  purpose: "business",
  business_description: "Weekly warehouse pickup"
});

// 7. Verify template completeness
const completeness = await trip_reconstructor.calculate_template_completeness({
  template_id: template.template_id
});
// Returns: { score: 0.95, missing_fields: [], recommendations: [...] }
```

---

## GPS Mandatory Philosophy

**Why GPS is Required:**
```
Address alone: "Košice" → 3 fuel stations, ambiguous
GPS: 48.7164°N, 21.2611°E → Exact location, 92% confidence match
```

**Matching Weights:**
```
GPS coordinates:     70% of confidence score
Address matching:    30% of confidence score
```

**GPS Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Slovakia bounds: 47.7-49.6°N, 16.8-22.6°E
- Template MUST have both from_coords AND to_coords

**User Messaging:**
```
"✓ GPS coordinates saved - I can match future trips within 100m accuracy!"
```

---

## Example Conversations

### Example 1: Clear Address (High Confidence)

```
User: "Save my daily commute as a template"

Claude: "I'll create a template for your daily commute.

Where do you start from?"

User: "Hlavná 45, Bratislava"

Claude: "Geocoding address...
[Calls: geo-routing.geocode_address]

✓ Found: Hlavná 45, Bratislava, Slovakia
  GPS: 48.1486°N, 17.1077°E
  Confidence: 95% (clear match)

Where do you end?"

User: "Mlynská 12, Košice"

Claude: "✓ Found: Mlynská 12, Košice, Slovakia
  GPS: 48.7164°N, 21.2611°E
  Confidence: 92%

Calculating route...
[Calls: geo-routing.calculate_route]

Route found: 410km via D1 highway (4.2 hours)

Is this a round trip? (yes/no)"

User: "No, one-way only"

Claude: "Which days do you typically make this trip?
(e.g., 'Monday, Wednesday, Friday' or 'every day' or 'skip')"

User: "Monday and Friday"

Claude: "Is this for business or personal use?"

User: "Business"

Claude: "What's the business purpose? (e.g., 'client meeting', 'delivery')"

User: "Client meetings in Košice office"

Claude: "Creating template...
[Calls: car-log-core.create_template]

✅ Template created!

'Daily Commute'
• From: Hlavná 45, Bratislava (48.1486°N, 17.1077°E)
• To: Mlynská 12, Košice (48.7164°N, 21.2611°E)
• Distance: 410km (one-way)
• Days: Monday, Friday
• Purpose: Business - Client meetings in Košice office
• GPS coordinates saved ← I can match trips within 100m!

I'll recognize this route with 90%+ confidence on future trips."
```

### Example 2: Ambiguous Address (Multiple Matches)

```
User: "Create template for trips to Košice"

Claude: "Creating template. Where does the trip start?"

User: "Bratislava"

Claude: "Geocoding 'Bratislava'...
[Calls: geo-routing.geocode_address]

⚠️ Multiple locations found:

1. Bratislava City Center (48.1486°N, 17.1077°E)
   - Capital city center
   - Confidence: 75%

2. Bratislava-Petržalka (48.1234°N, 17.1100°E)
   - Residential district
   - Confidence: 60%

3. Bratislava Airport (48.1702°N, 17.2127°E)
   - M. R. Štefánik Airport
   - Confidence: 55%

Which location? (1/2/3) or provide more specific address:"

User: "2"

Claude: "✓ Selected: Bratislava-Petržalka (48.1234°N, 17.1100°E)

Where does the trip end?"

User: "Košice fuel station"

Claude: "Geocoding 'Košice fuel station'...

⚠️ Multiple fuel stations found:

1. OMV Košice Center (48.7164°N, 21.2611°E)
   - City center location
   - Confidence: 65%

2. Shell Košice East (48.7100°N, 21.2850°E)
   - Near highway exit
   - Confidence: 60%

3. Slovnaft Košice (48.6950°N, 21.2550°E)
   - South district
   - Confidence: 58%

Which fuel station? (1/2/3)"

User: "The one near the highway"

Claude: "✓ Selected: Shell Košice East (48.7100°N, 21.2850°E)

[Continues with route calculation and optional fields...]"
```

### Example 3: Manual GPS Entry (Fallback)

```
User: "Save my secret spot as template"

Claude: "Creating template. Where does it start?"

User: "I don't have an address, but GPS is 48.2000, 17.3000"

Claude: "✓ GPS coordinates received: 48.2000°N, 17.3000°E

[Calls: geo-routing.reverse_geocode to get friendly label]

Location: Near Svätý Jur, Slovakia

Where does it end?"

User: "GPS: 48.8500, 21.4000"

Claude: "✓ GPS coordinates received: 48.8500°N, 21.4000°E
Location: Near Prešov, Slovakia

Note: GPS-only templates work perfectly! I'll match based on
coordinates (70% weight) without needing address matching.

[Continues with route and optional fields...]"
```

---

## Testing Scenarios

### Scenario 1: Happy Path - Complete Template
**Input:**
- Name: "Warehouse Run"
- From: "Bratislava, Hlavná 45"
- To: "Košice, Mlynská 12"
- Round trip: Yes
- Days: Monday, Thursday
- Purpose: Business
- Description: "Weekly warehouse pickup"

**Expected Behavior:**
1. Geocode both addresses (high confidence)
2. Calculate route (410km × 2 = 820km)
3. Collect all optional fields
4. Create template with GPS mandatory
5. Show confirmation with template details
6. Calculate completeness score (95%+)

**MCP Calls:**
1. `geo-routing.geocode_address` (from)
2. `geo-routing.geocode_address` (to)
3. `geo-routing.calculate_route`
4. `car-log-core.create_template`
5. `trip-reconstructor.calculate_template_completeness`

### Scenario 2: Ambiguous Address Resolution
**Input:**
- From: "Košice" (city name only)
- To: "Bratislava" (city name only)

**Expected Behavior:**
1. Geocode "Košice" → Multiple matches
2. Show alternatives with context
3. User selects option
4. Geocode "Bratislava" → Multiple matches
5. Show alternatives
6. User selects
7. Continue with route calculation

**MCP Calls:**
1. `geo-routing.geocode_address` (returns alternatives)
2. Wait for user selection
3. `geo-routing.geocode_address` (returns alternatives)
4. Wait for user selection
5. `geo-routing.calculate_route`
6. `car-log-core.create_template`

### Scenario 3: GPS-Only Template
**Input:**
- From: 48.1486, 17.1077 (manual GPS)
- To: 48.7164, 21.2611 (manual GPS)
- No addresses provided

**Expected Behavior:**
1. Accept GPS coordinates directly
2. Optionally reverse-geocode for labels
3. Calculate route using GPS
4. Create template with GPS, addresses optional
5. Confirm GPS-only template works (70% matching weight)

**MCP Calls:**
1. `geo-routing.reverse_geocode` (optional, for labels)
2. `geo-routing.calculate_route`
3. `car-log-core.create_template`

### Scenario 4: Minimal Template (GPS Only, No Enhancements)
**Input:**
- Name: "Quick Route"
- From: 48.1486, 17.1077
- To: 48.7164, 21.2611
- User skips all optional fields

**Expected Behavior:**
1. Accept minimal data
2. GPS coordinates mandatory, addresses optional
3. Skip route calculation if user declines
4. Skip optional enhancements
5. Create template with basic data
6. Completeness score: ~60% (missing enhancements)
7. Recommend adding optional fields for better matching

**MCP Calls:**
1. `car-log-core.create_template` (minimal)
2. `trip-reconstructor.calculate_template_completeness` (low score)

### Scenario 5: Route Alternatives
**Input:**
- From: "Bratislava"
- To: "Košice"
- Request route alternatives

**Expected Behavior:**
1. Geocode both locations
2. Calculate multiple routes
3. Show D1 highway, E50, local roads
4. Show distance, time, tolls for each
5. User selects typical route
6. Use selected route distance for template

**MCP Calls:**
1. `geo-routing.geocode_address` (both)
2. `geo-routing.calculate_route` (alternatives: true)
3. `car-log-core.create_template` (with selected route)

---

## Success Criteria

- ✅ GPS coordinates mandatory (validates before saving)
- ✅ Address ambiguity resolved with user selection
- ✅ Route calculation shows alternatives with details
- ✅ Optional fields enhance matching (days, purpose)
- ✅ Manual GPS entry supported (fallback)
- ✅ Template completeness calculated
- ✅ Clear user messaging about GPS benefits
- ✅ Round trip doubles distance automatically
- ✅ Business description required if purpose is business

---

**Implementation:** 📋 Spec ready | **Effort:** 3 hours
