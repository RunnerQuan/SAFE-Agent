# Performance Monitoring Framework

## Database Schema

### Core Tables

#### leads
Primary table for all incoming leads.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Lead Details
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,

  -- Property Details
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  estimated_value DECIMAL,
  mortgage_balance DECIMAL,

  -- Attribution
  source TEXT NOT NULL, -- 'zillow', 'facebook', 'referral', 'direct', etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_url TEXT,

  -- Assignment
  assigned_agent_id UUID REFERENCES agent_profiles(id),
  assigned_at TIMESTAMPTZ,

  -- Scoring (populated by lead-scorer skill if active)
  quality_score CHAR(1), -- 'A', 'B', 'C', 'D'
  qualification_reason JSONB,

  -- Conversion Tracking
  current_stage TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'appointment', 'offer', 'closed', 'dead'
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL,

  -- Metadata
  raw_data JSONB, -- Store complete form submission
  notes TEXT
);

CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX idx_leads_current_stage ON leads(current_stage);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_quality_score ON leads(quality_score);
```

#### lead_events
Event log for every action on a lead.

```sql
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event Details
  event_type TEXT NOT NULL, -- 'created', 'assigned', 'contacted', 'responded', 'qualified', 'appointment_scheduled', 'offer_made', 'closed', 'dead'
  event_source TEXT, -- 'agent', 'automation', 'skill:instant-responder', etc.

  -- Actor
  agent_id UUID REFERENCES agent_profiles(id),
  skill_id UUID REFERENCES lead_skills(id),

  -- Context
  details JSONB, -- Event-specific data (email sent, SMS content, call duration, etc.)

  -- Performance Tracking
  time_since_previous_event INTERVAL, -- Auto-calculated
  time_since_lead_created INTERVAL -- Auto-calculated
);

CREATE INDEX idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX idx_lead_events_type ON lead_events(event_type);
CREATE INDEX idx_lead_events_created_at ON lead_events(created_at);

-- Trigger to auto-calculate time intervals
CREATE OR REPLACE FUNCTION calculate_event_intervals()
RETURNS TRIGGER AS $$
DECLARE
  prev_event_time TIMESTAMPTZ;
  lead_created_time TIMESTAMPTZ;
BEGIN
  -- Get time of previous event
  SELECT created_at INTO prev_event_time
  FROM lead_events
  WHERE lead_id = NEW.lead_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get lead creation time
  SELECT created_at INTO lead_created_time
  FROM leads
  WHERE id = NEW.lead_id;

  -- Calculate intervals
  IF prev_event_time IS NOT NULL THEN
    NEW.time_since_previous_event := NEW.created_at - prev_event_time;
  END IF;

  NEW.time_since_lead_created := NEW.created_at - lead_created_time;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_intervals
  BEFORE INSERT ON lead_events
  FOR EACH ROW
  EXECUTE FUNCTION calculate_event_intervals();
```

#### lead_experiments
Tracks A/B tests running on leads.

```sql
CREATE TABLE lead_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Experiment Details
  name TEXT NOT NULL, -- 'instant-responder-v1', 'lead-scorer-equity-focus', etc.
  skill_id UUID REFERENCES lead_skills(id),
  description TEXT,
  hypothesis TEXT, -- "Instant response increases engagement rate from 40% to 65%"

  -- Status
  status TEXT NOT NULL DEFAULT 'running', -- 'draft', 'running', 'paused', 'completed'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Configuration
  traffic_split DECIMAL DEFAULT 0.5, -- 0.5 = 50/50 split
  target_sample_size INTEGER DEFAULT 100,
  min_duration_days INTEGER DEFAULT 14,

  -- Metrics Being Tracked
  primary_metric TEXT NOT NULL, -- 'response_rate', 'conversion_rate', 'time_to_contact', etc.
  secondary_metrics JSONB,

  -- Segmentation (optional)
  segment_filter JSONB, -- { "source": "zillow" } to run experiment only on Zillow leads

  -- Results (populated when experiment ends)
  control_sample_size INTEGER,
  treatment_sample_size INTEGER,
  control_metric_value DECIMAL,
  treatment_metric_value DECIMAL,
  lift_percentage DECIMAL,
  p_value DECIMAL,
  confidence_level DECIMAL,
  decision TEXT, -- 'KEEP', 'KILL', 'INCONCLUSIVE'
  decision_reason TEXT
);

CREATE INDEX idx_experiments_status ON lead_experiments(status);
CREATE INDEX idx_experiments_skill_id ON lead_experiments(skill_id);
```

#### lead_experiment_assignments
Tracks which leads are in which experiment group.

```sql
CREATE TABLE lead_experiment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES lead_experiments(id) ON DELETE CASCADE,

  -- Assignment
  group_name TEXT NOT NULL, -- 'control' or 'treatment'
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensures one lead only assigned once per experiment
  UNIQUE(lead_id, experiment_id)
);

CREATE INDEX idx_assignments_experiment ON lead_experiment_assignments(experiment_id);
CREATE INDEX idx_assignments_lead ON lead_experiment_assignments(lead_id);
```

#### lead_skills
Registry of spawned skills.

```sql
CREATE TABLE lead_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Skill Details
  name TEXT NOT NULL UNIQUE, -- 'instant-responder', 'lead-scorer', etc.
  description TEXT,
  skill_type TEXT, -- 'automation', 'scoring', 'routing', 'nurture'

  -- Status
  status TEXT NOT NULL DEFAULT 'testing', -- 'testing', 'active', 'paused', 'deprecated'
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,

  -- Performance
  total_leads_processed INTEGER DEFAULT 0,
  avg_improvement_lift DECIMAL, -- Average lift across all experiments

  -- Configuration
  config JSONB, -- Skill-specific settings

  -- Metadata
  spawned_reason TEXT, -- Why was this skill created?
  spawned_by TEXT -- 'auto-analysis', 'manual', 'user:john@example.com'
);
```

#### lead_metrics
Aggregated performance metrics (materialized view, refreshed daily).

```sql
CREATE MATERIALIZED VIEW lead_metrics AS
SELECT
  -- Time Period
  DATE_TRUNC('day', l.created_at) as date,

  -- Dimensions
  l.source,
  l.quality_score,
  l.assigned_agent_id,

  -- Volume Metrics
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE l.current_stage != 'new') as contacted_leads,
  COUNT(*) FILTER (WHERE l.current_stage IN ('qualified', 'appointment', 'offer', 'closed')) as qualified_leads,
  COUNT(*) FILTER (WHERE l.converted = true) as converted_leads,

  -- Conversion Rates
  (COUNT(*) FILTER (WHERE l.current_stage != 'new')::FLOAT / NULLIF(COUNT(*), 0)) * 100 as contact_rate,
  (COUNT(*) FILTER (WHERE l.current_stage IN ('qualified', 'appointment', 'offer', 'closed'))::FLOAT / NULLIF(COUNT(*), 0)) * 100 as qualification_rate,
  (COUNT(*) FILTER (WHERE l.converted = true)::FLOAT / NULLIF(COUNT(*), 0)) * 100 as conversion_rate,

  -- Time Metrics
  AVG(EXTRACT(EPOCH FROM (
    SELECT MIN(e.created_at) - l.created_at
    FROM lead_events e
    WHERE e.lead_id = l.id AND e.event_type = 'contacted'
  ))) / 60 as avg_time_to_contact_minutes,

  AVG(EXTRACT(EPOCH FROM (l.converted_at - l.created_at))) / 86400 as avg_days_to_convert,

  -- Revenue Metrics
  SUM(l.conversion_value) as total_revenue,
  AVG(l.conversion_value) as avg_deal_value

FROM leads l
GROUP BY
  DATE_TRUNC('day', l.created_at),
  l.source,
  l.quality_score,
  l.assigned_agent_id;

CREATE INDEX idx_lead_metrics_date ON lead_metrics(date);
CREATE INDEX idx_lead_metrics_source ON lead_metrics(source);
```

## Key Queries

### Conversion Funnel Analysis

```sql
SELECT
  current_stage,
  COUNT(*) as count,
  ROUND((COUNT(*)::FLOAT / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage,
  LAG(COUNT(*)) OVER (ORDER BY
    CASE current_stage
      WHEN 'new' THEN 1
      WHEN 'contacted' THEN 2
      WHEN 'qualified' THEN 3
      WHEN 'appointment' THEN 4
      WHEN 'offer' THEN 5
      WHEN 'closed' THEN 6
      ELSE 7
    END
  ) as previous_stage_count,
  ROUND(
    (COUNT(*)::FLOAT / NULLIF(LAG(COUNT(*)) OVER (ORDER BY
      CASE current_stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'qualified' THEN 3
        WHEN 'appointment' THEN 4
        WHEN 'offer' THEN 5
        WHEN 'closed' THEN 6
        ELSE 7
      END
    ), 0)) * 100,
    2
  ) as conversion_from_previous
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY current_stage
ORDER BY
  CASE current_stage
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'appointment' THEN 4
    WHEN 'offer' THEN 5
    WHEN 'closed' THEN 6
    ELSE 7
  END;
```

### Response Time Analysis

```sql
SELECT
  l.source,
  COUNT(*) as total_leads,
  COUNT(e.id) as contacted_leads,
  ROUND(AVG(EXTRACT(EPOCH FROM (e.created_at - l.created_at)) / 60), 2) as avg_response_minutes,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (e.created_at - l.created_at)) / 60), 2) as median_response_minutes,
  COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (e.created_at - l.created_at)) < 3600) as responded_within_1hr,
  ROUND((COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (e.created_at - l.created_at)) < 3600)::FLOAT / COUNT(*)) * 100, 2) as pct_within_1hr
FROM leads l
LEFT JOIN lead_events e ON l.id = e.lead_id AND e.event_type = 'contacted'
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY l.source
ORDER BY avg_response_minutes;
```

### Lead Source Performance

```sql
SELECT
  source,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE converted = true) as conversions,
  ROUND((COUNT(*) FILTER (WHERE converted = true)::FLOAT / COUNT(*)) * 100, 2) as conversion_rate,
  ROUND(AVG(conversion_value), 2) as avg_deal_value,
  SUM(conversion_value) as total_revenue,
  quality_score,
  COUNT(*) as leads_by_score
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source, quality_score
ORDER BY total_revenue DESC NULLS LAST, conversion_rate DESC;
```

### Agent Performance

```sql
SELECT
  ap.first_name || ' ' || ap.last_name as agent_name,
  COUNT(l.id) as leads_assigned,
  COUNT(*) FILTER (WHERE l.converted = true) as conversions,
  ROUND((COUNT(*) FILTER (WHERE l.converted = true)::FLOAT / COUNT(l.id)) * 100, 2) as conversion_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (e.created_at - l.created_at)) / 60), 2) as avg_response_minutes,
  SUM(l.conversion_value) as total_revenue
FROM leads l
JOIN agent_profiles ap ON l.assigned_agent_id = ap.id
LEFT JOIN lead_events e ON l.id = e.lead_id AND e.event_type = 'contacted'
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY ap.id, ap.first_name, ap.last_name
ORDER BY conversion_rate DESC;
```

### Experiment Results

```sql
WITH experiment_data AS (
  SELECT
    exp.name,
    exp.primary_metric,

    -- Control group
    COUNT(*) FILTER (WHERE lea.group_name = 'control') as control_n,
    AVG(
      CASE
        WHEN exp.primary_metric = 'conversion_rate' THEN (l.converted::int)::float
        WHEN exp.primary_metric = 'response_rate' THEN (EXISTS(SELECT 1 FROM lead_events WHERE lead_id = l.id AND event_type = 'contacted'))::int::float
        -- Add other metrics as needed
      END
    ) FILTER (WHERE lea.group_name = 'control') as control_value,

    -- Treatment group
    COUNT(*) FILTER (WHERE lea.group_name = 'treatment') as treatment_n,
    AVG(
      CASE
        WHEN exp.primary_metric = 'conversion_rate' THEN (l.converted::int)::float
        WHEN exp.primary_metric = 'response_rate' THEN (EXISTS(SELECT 1 FROM lead_events WHERE lead_id = l.id AND event_type = 'contacted'))::int::float
      END
    ) FILTER (WHERE lea.group_name = 'treatment') as treatment_value

  FROM lead_experiments exp
  JOIN lead_experiment_assignments lea ON exp.id = lea.experiment_id
  JOIN leads l ON lea.lead_id = l.id
  WHERE exp.status = 'running'
  GROUP BY exp.id, exp.name, exp.primary_metric
)
SELECT
  name,
  primary_metric,
  control_n,
  ROUND(control_value * 100, 2) as control_pct,
  treatment_n,
  ROUND(treatment_value * 100, 2) as treatment_pct,
  ROUND(((treatment_value - control_value) / NULLIF(control_value, 0)) * 100, 2) as lift_pct
FROM experiment_data;
```

## Automated Alerts

Set up triggers to notify when key metrics fall outside acceptable ranges:

```sql
CREATE OR REPLACE FUNCTION check_response_time_sla()
RETURNS void AS $$
DECLARE
  avg_response_hours FLOAT;
BEGIN
  SELECT AVG(EXTRACT(EPOCH FROM (e.created_at - l.created_at)) / 3600)
  INTO avg_response_hours
  FROM leads l
  JOIN lead_events e ON l.id = e.lead_id AND e.event_type = 'contacted'
  WHERE l.created_at > NOW() - INTERVAL '24 hours';

  IF avg_response_hours > 2 THEN
    -- Send alert (integrate with notification system)
    RAISE NOTICE 'ALERT: Average response time is % hours (SLA: 2 hours)', avg_response_hours;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run hourly via pg_cron or external scheduler
```

## Dashboard Queries

### Executive Summary (Last 30 Days)

```sql
SELECT
  COUNT(*) as total_leads,
  COUNT(DISTINCT source) as active_sources,
  COUNT(*) FILTER (WHERE converted = true) as conversions,
  ROUND((COUNT(*) FILTER (WHERE converted = true)::FLOAT / COUNT(*)) * 100, 2) as conversion_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (
    SELECT MIN(e.created_at) - l.created_at
    FROM lead_events e
    WHERE e.lead_id = l.id AND e.event_type = 'contacted'
  ))) / 60, 2) as avg_response_minutes,
  SUM(conversion_value) as total_revenue,
  ROUND(AVG(conversion_value), 2) as avg_deal_value,
  COUNT(*) FILTER (WHERE quality_score = 'A') as a_leads,
  COUNT(*) FILTER (WHERE quality_score = 'B') as b_leads,
  COUNT(*) FILTER (WHERE quality_score = 'C') as c_leads,
  COUNT(*) FILTER (WHERE quality_score = 'D') as d_leads
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days';
```

This monitoring framework provides complete visibility into lead pipeline performance and enables data-driven optimization decisions.
