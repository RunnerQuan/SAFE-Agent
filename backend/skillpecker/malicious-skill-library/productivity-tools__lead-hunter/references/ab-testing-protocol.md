# A/B Testing Protocol

## Statistical Foundations

### Sample Size Calculation

Before launching an experiment, calculate minimum sample size needed for statistical significance.

**Formula (simplified for conversion rate tests):**

```
n = (Z² × p × (1-p)) / E²

Where:
- Z = Z-score for desired confidence level (1.96 for 95% confidence)
- p = baseline conversion rate (e.g., 0.40 for 40%)
- E = minimum detectable effect (e.g., 0.05 for 5% absolute lift)
```

**Example:**
- Current conversion rate: 40% (0.40)
- Want to detect: 5% absolute improvement (to 45%)
- Confidence level: 95%

```
n = (1.96² × 0.40 × 0.60) / 0.05²
n = (3.84 × 0.24) / 0.0025
n = 0.922 / 0.0025
n = 369 leads per group (738 total)
```

**Quick Reference Table:**

| Baseline Rate | Minimum Detectable Effect | Sample Size Per Group |
|---------------|---------------------------|----------------------|
| 20% | 5% (to 25%) | 502 |
| 30% | 5% (to 35%) | 572 |
| 40% | 5% (to 45%) | 600 |
| 50% | 5% (to 55%) | 614 |
| 40% | 10% (to 50%) | 150 |
| 40% | 15% (to 55%) | 67 |

**Rule of thumb:** For most real estate lead tests, **100 leads per group** is minimum. Aim for 200+ per group for reliable results.

### Statistical Significance Testing

Use a two-proportion z-test to determine if the difference between control and treatment is statistically significant.

**Formula:**

```
z = (p₁ - p₂) / √(p̂(1-p̂)(1/n₁ + 1/n₂))

Where:
- p₁ = treatment conversion rate
- p₂ = control conversion rate
- p̂ = pooled conversion rate = (x₁ + x₂) / (n₁ + n₂)
- n₁, n₂ = sample sizes
```

**Implementation (TypeScript):**

```typescript
interface ABTestResults {
  control: {
    n: number;
    conversions: number;
    rate: number;
  };
  treatment: {
    n: number;
    conversions: number;
    rate: number;
  };
  lift: number;
  liftPercentage: number;
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
}

function calculateABTest(
  controlConversions: number,
  controlSample: number,
  treatmentConversions: number,
  treatmentSample: number,
  significanceLevel: number = 0.05
): ABTestResults {
  const p1 = treatmentConversions / treatmentSample;
  const p2 = controlConversions / controlSample;

  const pooledP = (treatmentConversions + controlConversions) /
                  (treatmentSample + controlSample);

  const se = Math.sqrt(pooledP * (1 - pooledP) *
                       (1/treatmentSample + 1/controlSample));

  const zScore = (p1 - p2) / se;

  // Two-tailed test
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  const lift = p1 - p2;
  const liftPercentage = (lift / p2) * 100;

  return {
    control: {
      n: controlSample,
      conversions: controlConversions,
      rate: p2
    },
    treatment: {
      n: treatmentSample,
      conversions: treatmentConversions,
      rate: p1
    },
    lift,
    liftPercentage,
    zScore,
    pValue,
    isSignificant: pValue < significanceLevel,
    confidenceLevel: (1 - pValue) * 100
  };
}

// Normal CDF approximation (for p-value calculation)
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
```

## Assignment Algorithm

### Random Assignment with Consistency

Each lead must be randomly assigned to control or treatment, but the assignment must be **deterministic** (same lead always gets same assignment if reassigned).

**Method 1: Hash-based Assignment**

```typescript
function assignToGroup(leadId: string, experimentId: string): 'control' | 'treatment' {
  // Create deterministic hash from leadId + experimentId
  const hash = cyrb53(`${leadId}:${experimentId}`);

  // Use hash to determine group (50/50 split)
  return (hash % 2) === 0 ? 'control' : 'treatment';
}

// Fast hash function (cyrb53)
function cyrb53(str: string, seed: number = 0): number {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
```

**Method 2: Database-Persisted Assignment**

```typescript
async function getOrCreateAssignment(
  leadId: string,
  experimentId: string
): Promise<'control' | 'treatment'> {
  // Check if assignment already exists
  const existing = await supabase
    .from('lead_experiment_assignments')
    .select('group_name')
    .eq('lead_id', leadId)
    .eq('experiment_id', experimentId)
    .single();

  if (existing.data) {
    return existing.data.group_name as 'control' | 'treatment';
  }

  // Create new assignment
  const group = assignToGroup(leadId, experimentId);

  await supabase
    .from('lead_experiment_assignments')
    .insert({
      lead_id: leadId,
      experiment_id: experimentId,
      group_name: group
    });

  return group;
}
```

### Handling Edge Cases

**Uneven traffic split:**

```typescript
function assignToGroupWeighted(
  leadId: string,
  experimentId: string,
  trafficSplit: number = 0.5 // 0.5 = 50/50, 0.7 = 70/30
): 'control' | 'treatment' {
  const hash = cyrb53(`${leadId}:${experimentId}`);
  const normalized = hash / Number.MAX_SAFE_INTEGER; // 0.0 to 1.0

  return normalized < trafficSplit ? 'treatment' : 'control';
}
```

**Segment-specific experiments:**

```typescript
async function shouldIncludeInExperiment(
  lead: Lead,
  experiment: Experiment
): Promise<boolean> {
  if (!experiment.segment_filter) {
    return true; // No filter, include all leads
  }

  // Check if lead matches segment criteria
  const filter = experiment.segment_filter as Record<string, any>;

  for (const [key, value] of Object.entries(filter)) {
    if (lead[key as keyof Lead] !== value) {
      return false;
    }
  }

  return true;
}

// Usage
async function processNewLead(lead: Lead) {
  const activeExperiments = await getActiveExperiments();

  for (const exp of activeExperiments) {
    if (await shouldIncludeInExperiment(lead, exp)) {
      const group = await getOrCreateAssignment(lead.id, exp.id);

      if (group === 'treatment') {
        await applyTreatment(lead, exp);
      }
    }
  }
}
```

## Common Pitfalls

### 1. Peeking (Checking Results Too Early)

**Problem:** Checking results multiple times increases false positive rate.

**Solution:** Decide on sample size and duration upfront. Don't peek until criteria are met.

**If you must peek:** Use sequential testing methods or adjust significance threshold.

```typescript
// Adjust alpha for multiple looks (Bonferroni correction)
const numberOfLooks = 3; // Planning to check 3 times
const adjustedAlpha = 0.05 / numberOfLooks; // 0.0167 per look

function isPeekSignificant(pValue: number, peekNumber: number): boolean {
  const adjustedAlpha = 0.05 / peekNumber;
  return pValue < adjustedAlpha;
}
```

### 2. Insufficient Sample Size

**Problem:** Calling winners with too few conversions leads to false positives.

**Solution:** Calculate required sample size before starting. Wait until both groups hit minimum.

```typescript
function hasMinimumSampleSize(
  controlN: number,
  treatmentN: number,
  baselineRate: number,
  minDetectableEffect: number
): boolean {
  const requiredN = calculateRequiredSampleSize(baselineRate, minDetectableEffect);
  return controlN >= requiredN && treatmentN >= requiredN;
}
```

### 3. Selection Bias

**Problem:** Treatment and control groups differ in ways other than the intervention.

**Solution:** Ensure random assignment. Check for balance across key dimensions.

```typescript
async function checkGroupBalance(experimentId: string): Promise<void> {
  const query = `
    SELECT
      lea.group_name,
      l.source,
      COUNT(*) as count,
      AVG(l.estimated_value) as avg_property_value
    FROM lead_experiment_assignments lea
    JOIN leads l ON lea.lead_id = l.id
    WHERE lea.experiment_id = $1
    GROUP BY lea.group_name, l.source
  `;

  const { data } = await supabase.rpc('raw_query', { query, params: [experimentId] });

  // Check if distribution is similar across groups
  console.log('Group balance check:', data);
}
```

### 4. Novelty Effect

**Problem:** Treatment performs better initially just because it's new.

**Solution:** Run experiments for minimum 2 weeks. Look for performance decline over time.

```typescript
// Compare early vs. late performance
async function checkNoveltyEffect(experimentId: string) {
  const query = `
    SELECT
      lea.group_name,
      CASE
        WHEN l.created_at < (SELECT started_at + INTERVAL '7 days' FROM lead_experiments WHERE id = $1)
          THEN 'week_1'
        ELSE 'week_2+'
      END as time_period,
      COUNT(*) FILTER (WHERE l.converted = true) as conversions,
      COUNT(*) as total
    FROM lead_experiment_assignments lea
    JOIN leads l ON lea.lead_id = l.id
    WHERE lea.experiment_id = $1
    GROUP BY lea.group_name, time_period
  `;

  // If treatment effect disappears in week 2+, likely novelty effect
}
```

### 5. Multiple Comparisons Problem

**Problem:** Testing multiple variations or metrics inflates false positive rate.

**Solution:** Define ONE primary metric upfront. Use Bonferroni or Benjamini-Hochberg correction for secondary metrics.

```typescript
// Bonferroni correction for multiple metrics
function adjustForMultipleComparisons(
  pValues: number[],
  alpha: number = 0.05
): boolean[] {
  const adjustedAlpha = alpha / pValues.length;
  return pValues.map(p => p < adjustedAlpha);
}

// Example: Testing 3 metrics
const pValues = [0.03, 0.04, 0.06];
const significant = adjustForMultipleComparisons(pValues);
// Only metrics with p < 0.0167 are significant
```

## Decision Framework

### When to Keep the Treatment

✅ **KEEP if ALL are true:**
1. Sufficient sample size reached (100+ per group minimum)
2. Statistical significance achieved (p < 0.05)
3. Practical significance achieved (lift > 10% or meets business threshold)
4. Effect is consistent across segments
5. No novelty effect detected
6. Duration requirement met (14+ days)

### When to Kill the Treatment

❌ **KILL if ANY are true:**
1. Treatment performs worse than control (negative lift) with p < 0.10
2. Sufficient sample reached but no significance (p > 0.10) and lift < 5%
3. Treatment causes operational problems (cost, complexity, errors)
4. Effect only appears in one small segment (not generalizable)

### When to Continue Testing

⏸️ **CONTINUE if:**
1. Sample size not yet reached but trend is promising
2. Borderline significance (0.05 < p < 0.10) and positive lift
3. Inconsistent results across segments (need more data to understand)

## Reporting Template

```typescript
interface ExperimentReport {
  experimentId: string;
  experimentName: string;
  hypothesis: string;
  primaryMetric: string;

  duration: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };

  sampleSize: {
    control: number;
    treatment: number;
    total: number;
    plannedMinimum: number;
  };

  results: {
    control: {
      rate: number;
      conversions: number;
    };
    treatment: {
      rate: number;
      conversions: number;
    };
    lift: {
      absolute: number;
      relative: number; // percentage
    };
    statistics: {
      zScore: number;
      pValue: number;
      confidenceLevel: number;
      isSignificant: boolean;
    };
  };

  decision: 'KEEP' | 'KILL' | 'CONTINUE';
  reasoning: string;

  nextSteps: string;
}

// Generate report
async function generateExperimentReport(experimentId: string): Promise<ExperimentReport> {
  // Query data
  const experiment = await getExperiment(experimentId);
  const results = await calculateExperimentResults(experimentId);

  // Make decision
  const decision = makeDecision(results, experiment);

  return {
    experimentId,
    experimentName: experiment.name,
    hypothesis: experiment.hypothesis,
    primaryMetric: experiment.primary_metric,

    duration: {
      startDate: experiment.started_at,
      endDate: experiment.ended_at || new Date().toISOString(),
      totalDays: daysBetween(experiment.started_at, experiment.ended_at || new Date())
    },

    sampleSize: {
      control: results.control.n,
      treatment: results.treatment.n,
      total: results.control.n + results.treatment.n,
      plannedMinimum: experiment.target_sample_size
    },

    results: {
      control: {
        rate: results.control.rate,
        conversions: results.control.conversions
      },
      treatment: {
        rate: results.treatment.rate,
        conversions: results.treatment.conversions
      },
      lift: {
        absolute: results.lift,
        relative: results.liftPercentage
      },
      statistics: {
        zScore: results.zScore,
        pValue: results.pValue,
        confidenceLevel: results.confidenceLevel,
        isSignificant: results.isSignificant
      }
    },

    decision: decision.action,
    reasoning: decision.reasoning,
    nextSteps: decision.nextSteps
  };
}

function makeDecision(results: ABTestResults, experiment: Experiment) {
  // KILL if treatment is worse
  if (results.lift < 0 && results.pValue < 0.10) {
    return {
      action: 'KILL',
      reasoning: `Treatment performed ${Math.abs(results.liftPercentage).toFixed(1)}% worse than control with p=${results.pValue.toFixed(4)}`,
      nextSteps: 'Revert to control. Analyze why treatment failed. Consider alternative approach.'
    };
  }

  // KEEP if all criteria met
  if (
    results.isSignificant &&
    results.liftPercentage > 10 &&
    results.control.n >= experiment.target_sample_size &&
    results.treatment.n >= experiment.target_sample_size
  ) {
    return {
      action: 'KEEP',
      reasoning: `Treatment improved ${results.liftPercentage.toFixed(1)}% with p=${results.pValue.toFixed(4)}`,
      nextSteps: 'Roll out treatment to 100% of leads. Make treatment the new baseline. Identify next bottleneck to optimize.'
    };
  }

  // CONTINUE if promising but not conclusive
  if (results.liftPercentage > 5 && results.pValue < 0.10) {
    return {
      action: 'CONTINUE',
      reasoning: `Promising trend (+${results.liftPercentage.toFixed(1)}%) but not yet significant (p=${results.pValue.toFixed(4)})`,
      nextSteps: `Continue test until reaching ${experiment.target_sample_size} leads per group.`
    };
  }

  // KILL if no effect after sufficient sample
  return {
    action: 'KILL',
    reasoning: `Insufficient lift (${results.liftPercentage.toFixed(1)}%) after ${results.control.n + results.treatment.n} leads`,
    nextSteps: 'End experiment. Treatment did not meaningfully improve performance.'
  };
}
```

## Best Practices Checklist

Before launching an experiment:

- [ ] Hypothesis clearly stated
- [ ] Primary metric defined
- [ ] Baseline metric measured
- [ ] Minimum sample size calculated
- [ ] Minimum duration set (14+ days)
- [ ] Assignment algorithm tested
- [ ] Tracking instrumented
- [ ] Decision criteria documented

During the experiment:

- [ ] No peeking before minimum criteria met
- [ ] Monitor for bugs or data quality issues
- [ ] Check group balance weekly
- [ ] Document any anomalies

After the experiment:

- [ ] Calculate statistical significance
- [ ] Check for segment differences
- [ ] Review novelty effect
- [ ] Document decision and reasoning
- [ ] If KEEP: roll out to 100%
- [ ] If KILL: analyze failure and iterate
- [ ] Update baseline metrics
- [ ] Plan next experiment

This protocol ensures rigorous, scientifically valid A/B testing for lead optimization.
