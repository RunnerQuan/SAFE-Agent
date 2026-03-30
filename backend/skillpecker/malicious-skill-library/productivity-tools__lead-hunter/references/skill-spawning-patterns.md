# Skill Spawning Patterns

## Common Bottlenecks & Solutions

This document provides proven patterns for spawned skills that fix common lead generation bottlenecks.

---

## Pattern 1: Instant Responder

### Problem
Slow response time to incoming leads. Industry standard: contact within 5 minutes increases conversion by 400%.

**Symptoms:**
- Average time to first contact > 1 hour
- Leads going cold before agent response
- Competitive disadvantage (other agents responding faster)

### Solution
Automated instant response within 60 seconds of lead capture.

### Implementation

**Configuration:**
```json
{
  "skill_name": "instant-responder",
  "skill_type": "automation",
  "trigger": "lead_created",
  "channels": ["sms", "email"],
  "response_delay_seconds": 60,
  "personalization_level": "high"
}
```

**Core Logic:**
```typescript
async function instantResponder(lead: Lead, config: SkillConfig) {
  // Wait configured delay (simulate human timing)
  await sleep(config.response_delay_seconds * 1000);

  // Generate personalized response using LLM
  const message = await generatePersonalizedResponse(lead);

  // Send via preferred channel
  if (lead.phone && config.channels.includes('sms')) {
    await sendSMS(lead.phone, message);
  }

  if (lead.email && config.channels.includes('email')) {
    await sendEmail(lead.email, message, { from: lead.assigned_agent });
  }

  // Log event
  await logLeadEvent(lead.id, 'instant_response_sent', {
    channel: lead.phone ? 'sms' : 'email',
    skill_id: config.skill_id,
    message_preview: message.substring(0, 100)
  });
}

async function generatePersonalizedResponse(lead: Lead): Promise<string> {
  const prompt = `
You are a real estate agent responding to a new lead.

Lead details:
- Name: ${lead.first_name} ${lead.last_name}
- Property: ${lead.property_address}, ${lead.property_city}
- Source: ${lead.source}
${lead.estimated_value ? `- Estimated value: $${lead.estimated_value.toLocaleString()}` : ''}

Write a brief, friendly SMS response (under 160 characters) that:
1. Thanks them for their interest
2. References their specific property
3. Promises quick follow-up
4. Sounds human, not robotic

Tone: Casual, helpful, local expert.
`;

  const response = await callLLM(prompt);

  return response.trim();
}
```

**Example Message:**
```
Hi Sarah! Thanks for reaching out about 123 Oak St. I know that area well - great neighborhood. I'll call you this afternoon to discuss. - Mike
```

**A/B Test Hypothesis:**
"Instant automated response + human follow-up will increase lead engagement rate from 40% to 65%+"

**Metrics to Track:**
- Primary: Response rate (% of leads who reply)
- Secondary: Time to first agent contact, Appointment rate

**Expected Lift:** +20-40% response rate

---

## Pattern 2: Lead Scorer

### Problem
Agents waste time on unqualified leads. Low-quality leads dilute conversion rates and burn out agents.

**Symptoms:**
- Low overall conversion rate (<10%)
- Agents complaining about tire-kickers
- High-value leads not prioritized

### Solution
Automated lead scoring (A/B/C/D) based on property characteristics, lead behavior, and demographics.

### Implementation

**Scoring Model:**
```typescript
interface LeadScore {
  score: 'A' | 'B' | 'C' | 'D';
  confidence: number; // 0-100
  reasoning: string[];
  priority: 'immediate' | 'high' | 'medium' | 'low';
}

async function scoreLead(lead: Lead): Promise<LeadScore> {
  const signals = await gatherScoringSignals(lead);
  const score = calculateScore(signals);

  await updateLeadScore(lead.id, score);

  return score;
}

async function gatherScoringSignals(lead: Lead) {
  return {
    // Property signals
    equity_position: lead.estimated_value - (lead.mortgage_balance || 0),
    property_value: lead.estimated_value,
    property_condition: await estimateCondition(lead.property_address),

    // Lead behavior signals
    form_fields_completed: countCompletedFields(lead),
    urgency_keywords: detectUrgencyKeywords(lead.notes),
    time_on_site: lead.raw_data?.time_on_site || 0,
    pages_viewed: lead.raw_data?.pages_viewed || 0,

    // Source signals
    source_quality: getSourceQuality(lead.source),
    is_referral: lead.source === 'referral',

    // Demographic signals
    property_location: lead.property_zip,
    lead_location: lead.zip_code
  };
}

function calculateScore(signals: ScoringSignals): LeadScore {
  let points = 0;
  const reasoning: string[] = [];

  // Equity position (most important)
  if (signals.equity_position > 100000) {
    points += 40;
    reasoning.push(`High equity: $${(signals.equity_position / 1000).toFixed(0)}k`);
  } else if (signals.equity_position > 50000) {
    points += 20;
    reasoning.push(`Moderate equity: $${(signals.equity_position / 1000).toFixed(0)}k`);
  } else if (signals.equity_position < 0) {
    points -= 20;
    reasoning.push('Underwater on mortgage');
  }

  // Property value
  if (signals.property_value > 500000) {
    points += 20;
    reasoning.push('High-value property');
  } else if (signals.property_value < 150000) {
    points -= 10;
    reasoning.push('Low-value property');
  }

  // Urgency signals
  if (signals.urgency_keywords.includes('asap') || signals.urgency_keywords.includes('quickly')) {
    points += 15;
    reasoning.push('Expressed urgency');
  }

  // Engagement
  if (signals.pages_viewed > 5) {
    points += 10;
    reasoning.push('High engagement on site');
  }

  // Source quality
  if (signals.is_referral) {
    points += 25;
    reasoning.push('Referral lead (high quality)');
  } else if (signals.source_quality === 'high') {
    points += 15;
  } else if (signals.source_quality === 'low') {
    points -= 10;
    reasoning.push(`Low-quality source: ${signals.source}`);
  }

  // Determine grade
  let score: 'A' | 'B' | 'C' | 'D';
  let priority: 'immediate' | 'high' | 'medium' | 'low';

  if (points >= 60) {
    score = 'A';
    priority = 'immediate';
  } else if (points >= 30) {
    score = 'B';
    priority = 'high';
  } else if (points >= 0) {
    score = 'C';
    priority = 'medium';
  } else {
    score = 'D';
    priority = 'low';
  }

  return {
    score,
    confidence: Math.min(100, Math.abs(points)),
    reasoning,
    priority
  };
}
```

**Routing Logic:**
```typescript
async function routeByScore(lead: Lead, score: LeadScore) {
  switch (score.score) {
    case 'A':
      // Immediate routing to top agent
      await assignToTopAgent(lead);
      await sendAgentAlert(lead, 'HIGH PRIORITY LEAD');
      await scheduleFollowUp(lead, { delay_minutes: 15 });
      break;

    case 'B':
      // Standard routing to available agent
      await assignToAvailableAgent(lead);
      await scheduleFollowUp(lead, { delay_hours: 2 });
      break;

    case 'C':
      // Automated nurture sequence first
      await enrollInNurtureSequence(lead, 'warm_lead_sequence');
      await assignToAgent(lead, { priority: 'low' });
      break;

    case 'D':
      // Archive or minimal follow-up
      await enrollInNurtureSequence(lead, 'cold_lead_drip');
      // Don't assign to agent unless lead re-engages
      break;
  }
}
```

**A/B Test Hypothesis:**
"Prioritizing A/B leads and auto-nurturing C/D leads will increase agent conversion rate from 10% to 18%+"

**Metrics to Track:**
- Primary: Conversion rate for A/B leads only
- Secondary: Agent time saved, Response time by score tier

**Expected Lift:** +50-80% conversion rate on qualified leads

---

## Pattern 3: Follow-Up Sequencer

### Problem
Leads fall through the cracks. No systematic follow-up after initial contact.

**Symptoms:**
- Leads contacted once, then forgotten
- Inconsistent follow-up cadence
- Deals lost to more persistent competitors

### Solution
Automated multi-touch follow-up sequences based on lead temperature and engagement.

### Implementation

**Sequence Definitions:**
```typescript
interface FollowUpSequence {
  name: string;
  touches: FollowUpTouch[];
  exit_conditions: ExitCondition[];
}

interface FollowUpTouch {
  delay_days: number;
  channel: 'sms' | 'email' | 'call' | 'voicemail';
  template: string;
  personalization_tokens: string[];
}

// Hot Lead Sequence (showed interest, not yet qualified)
const hotLeadSequence: FollowUpSequence = {
  name: 'hot_lead_sequence',
  touches: [
    {
      delay_days: 0,
      channel: 'sms',
      template: 'instant_response',
      personalization_tokens: ['first_name', 'property_address']
    },
    {
      delay_days: 1,
      channel: 'call',
      template: 'qualification_call',
      personalization_tokens: ['first_name', 'property_city']
    },
    {
      delay_days: 3,
      channel: 'email',
      template: 'market_analysis_offer',
      personalization_tokens: ['first_name', 'property_address', 'estimated_value']
    },
    {
      delay_days: 7,
      channel: 'sms',
      template: 'check_in',
      personalization_tokens: ['first_name']
    },
    {
      delay_days: 14,
      channel: 'email',
      template: 'success_story',
      personalization_tokens: ['property_city']
    }
  ],
  exit_conditions: [
    { event: 'appointment_scheduled', action: 'exit' },
    { event: 'lead_responded', action: 'pause' },
    { event: 'qualified', action: 'exit_and_start:qualified_sequence' }
  ]
};

// Warm Lead Sequence (interested but not urgent)
const warmLeadSequence: FollowUpSequence = {
  name: 'warm_lead_sequence',
  touches: [
    {
      delay_days: 0,
      channel: 'email',
      template: 'intro_email',
      personalization_tokens: ['first_name']
    },
    {
      delay_days: 3,
      channel: 'sms',
      template: 'quick_question',
      personalization_tokens: ['first_name']
    },
    {
      delay_days: 7,
      channel: 'email',
      template: 'neighborhood_guide',
      personalization_tokens: ['property_city']
    },
    {
      delay_days: 14,
      channel: 'call',
      template: 'check_in_call',
      personalization_tokens: ['first_name']
    },
    {
      delay_days: 30,
      channel: 'email',
      template: 'market_update',
      personalization_tokens: ['property_city']
    }
  ],
  exit_conditions: [
    { event: 'lead_responded', action: 'exit_and_start:hot_lead_sequence' },
    { event: 'appointment_scheduled', action: 'exit' }
  ]
};
```

**Sequence Engine:**
```typescript
async function enrollInSequence(leadId: string, sequenceName: string) {
  const sequence = getSequence(sequenceName);

  for (const touch of sequence.touches) {
    await scheduleTouch(leadId, touch, sequence.exit_conditions);
  }
}

async function scheduleTouch(
  leadId: string,
  touch: FollowUpTouch,
  exitConditions: ExitCondition[]
) {
  const executeAt = addDays(new Date(), touch.delay_days);

  await createScheduledTask({
    lead_id: leadId,
    execute_at: executeAt,
    action: 'send_follow_up',
    params: {
      channel: touch.channel,
      template: touch.template,
      exit_conditions: exitConditions
    }
  });
}

// Task processor (runs every 5 minutes)
async function processScheduledTasks() {
  const dueTasks = await getTasksDueBefore(new Date());

  for (const task of dueTasks) {
    // Check exit conditions before executing
    const shouldExit = await checkExitConditions(task.lead_id, task.params.exit_conditions);

    if (shouldExit) {
      await markTaskCancelled(task.id, shouldExit.reason);
      continue;
    }

    // Execute touch
    await executeTouchPoint(task);
    await markTaskCompleted(task.id);
  }
}

async function executeTouchPoint(task: ScheduledTask) {
  const lead = await getLead(task.lead_id);
  const message = await renderTemplate(task.params.template, lead);

  switch (task.params.channel) {
    case 'sms':
      await sendSMS(lead.phone, message);
      break;
    case 'email':
      await sendEmail(lead.email, message);
      break;
    case 'call':
      await createAgentTask(lead.assigned_agent_id, {
        type: 'call',
        lead_id: lead.id,
        script: message
      });
      break;
  }

  await logLeadEvent(lead.id, 'follow_up_sent', {
    channel: task.params.channel,
    template: task.params.template,
    sequence_name: task.params.sequence_name
  });
}
```

**A/B Test Hypothesis:**
"Automated 5-touch sequence will increase conversion rate from 12% to 22%+ vs. one-off contact"

**Metrics to Track:**
- Primary: Conversion rate
- Secondary: Response rate by touch number, Optimal touch frequency

**Expected Lift:** +50-100% conversion rate

---

## Pattern 4: Source Optimizer

### Problem
Marketing budget wasted on low-converting lead sources.

**Symptoms:**
- Zillow leads convert at 5%, referrals at 40%
- Same budget allocated to all sources
- No data-driven source decisions

### Solution
Automatically track, score, and optimize lead source allocation.

### Implementation

**Source Performance Tracking:**
```typescript
interface SourceMetrics {
  source_name: string;
  total_leads: number;
  conversions: number;
  conversion_rate: number;
  avg_time_to_convert_days: number;
  total_revenue: number;
  cost_per_lead: number;
  roi: number;
  quality_score: number; // 0-100
}

async function calculateSourceMetrics(
  source: string,
  periodDays: number = 30
): Promise<SourceMetrics> {
  const leads = await getLeadsBySource(source, periodDays);

  const conversions = leads.filter(l => l.converted).length;
  const conversionRate = (conversions / leads.length) * 100;
  const totalRevenue = sumBy(leads.filter(l => l.converted), 'conversion_value');

  const avgTimeToConvert = meanBy(
    leads.filter(l => l.converted),
    l => daysBetween(l.created_at, l.converted_at)
  );

  const costPerLead = await getCostPerLead(source, periodDays);
  const roi = ((totalRevenue - (costPerLead * leads.length)) / (costPerLead * leads.length)) * 100;

  // Quality score considers conversion rate, deal value, and time to convert
  const qualityScore =
    (conversionRate * 0.5) +
    ((totalRevenue / leads.length / 10000) * 0.3) + // Normalize avg deal value
    ((30 - Math.min(avgTimeToConvert, 30)) * 0.2); // Faster = better

  return {
    source_name: source,
    total_leads: leads.length,
    conversions,
    conversion_rate: conversionRate,
    avg_time_to_convert_days: avgTimeToConvert,
    total_revenue: totalRevenue,
    cost_per_lead: costPerLead,
    roi,
    quality_score: Math.min(100, qualityScore)
  };
}
```

**Optimization Recommendations:**
```typescript
interface BudgetRecommendation {
  source: string;
  current_budget: number;
  recommended_budget: number;
  change_percentage: number;
  reasoning: string;
}

async function generateBudgetRecommendations(): Promise<BudgetRecommendation[]> {
  const sources = await getAllActiveSources();
  const metrics = await Promise.all(
    sources.map(s => calculateSourceMetrics(s.name))
  );

  // Sort by ROI
  const rankedSources = metrics.sort((a, b) => b.roi - a.roi);

  const recommendations: BudgetRecommendation[] = [];

  for (const [index, source] of rankedSources.entries()) {
    const currentBudget = await getCurrentBudget(source.source_name);

    let recommendedBudget: number;
    let reasoning: string;

    if (source.roi > 200 && source.conversion_rate > 15) {
      // High performer: increase budget
      recommendedBudget = currentBudget * 1.5;
      reasoning = `Strong ROI (${source.roi.toFixed(0)}%) and conversion rate (${source.conversion_rate.toFixed(1)}%). Increase investment.`;
    } else if (source.roi < 50 || source.conversion_rate < 5) {
      // Poor performer: decrease or eliminate
      recommendedBudget = currentBudget * 0.5;
      reasoning = `Low ROI (${source.roi.toFixed(0)}%) or conversion rate (${source.conversion_rate.toFixed(1)}%). Reduce spend.`;
    } else {
      // Average performer: maintain
      recommendedBudget = currentBudget;
      reasoning = 'Moderate performance. Maintain current spend.';
    }

    recommendations.push({
      source: source.source_name,
      current_budget: currentBudget,
      recommended_budget: recommendedBudget,
      change_percentage: ((recommendedBudget - currentBudget) / currentBudget) * 100,
      reasoning
    });
  }

  return recommendations;
}
```

**A/B Test Hypothesis:**
"Reallocating budget based on ROI will increase overall lead quality score from 45 to 65+"

**Metrics to Track:**
- Primary: Overall conversion rate
- Secondary: Cost per conversion, ROI by source

**Expected Lift:** +30-50% conversion rate, +100%+ ROI

---

## Pattern 5: Agent Router

### Problem
All leads routed equally regardless of agent performance.

**Symptoms:**
- Top agent converts at 25%, bottom agent at 8%
- Leads assigned randomly or round-robin
- Best agents aren't utilized fully

### Solution
Performance-based lead routing that assigns best leads to best agents.

### Implementation

**Agent Performance Tracking:**
```typescript
interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  total_leads_assigned: number;
  conversions: number;
  conversion_rate: number;
  avg_response_time_minutes: number;
  avg_time_to_convert_days: number;
  total_revenue: number;
  performance_score: number; // 0-100
  tier: 'S' | 'A' | 'B' | 'C';
}

async function calculateAgentPerformance(
  agentId: string,
  periodDays: number = 90
): Promise<AgentPerformance> {
  const leads = await getLeadsByAgent(agentId, periodDays);

  const conversions = leads.filter(l => l.converted).length;
  const conversionRate = (conversions / leads.length) * 100;

  const avgResponseTime = meanBy(leads, l => {
    const firstContact = l.events.find(e => e.event_type === 'contacted');
    return firstContact ? minutesBetween(l.created_at, firstContact.created_at) : null;
  });

  const performanceScore =
    (conversionRate * 0.6) + // Conversion rate is most important
    ((120 - Math.min(avgResponseTime, 120)) * 0.2) + // Fast response
    ((leads.length / 10) * 0.2); // Volume handling

  let tier: 'S' | 'A' | 'B' | 'C';
  if (performanceScore >= 80) tier = 'S';
  else if (performanceScore >= 60) tier = 'A';
  else if (performanceScore >= 40) tier = 'B';
  else tier = 'C';

  return {
    agent_id: agentId,
    agent_name: await getAgentName(agentId),
    total_leads_assigned: leads.length,
    conversions,
    conversion_rate: conversionRate,
    avg_response_time_minutes: avgResponseTime,
    avg_time_to_convert_days: meanBy(leads.filter(l => l.converted), l => daysBetween(l.created_at, l.converted_at)),
    total_revenue: sumBy(leads.filter(l => l.converted), 'conversion_value'),
    performance_score: performanceScore,
    tier
  };
}
```

**Smart Routing Logic:**
```typescript
async function routeLeadToOptimalAgent(lead: Lead, leadScore: LeadScore) {
  const availableAgents = await getAvailableAgents();
  const agentPerformance = await Promise.all(
    availableAgents.map(a => calculateAgentPerformance(a.id))
  );

  // Match lead quality to agent tier
  const optimalTier = mapLeadScoreToAgentTier(leadScore.score);

  // Find best available agent in optimal tier
  const candidates = agentPerformance
    .filter(a => a.tier === optimalTier)
    .sort((a, b) => b.performance_score - a.performance_score);

  if (candidates.length === 0) {
    // No agents in optimal tier, fall back to next tier
    return await routeLeadToOptimalAgent(lead, {
      ...leadScore,
      score: downgradeTier(leadScore.score)
    });
  }

  const selectedAgent = candidates[0];

  await assignLeadToAgent(lead.id, selectedAgent.agent_id);

  await logLeadEvent(lead.id, 'assigned', {
    agent_id: selectedAgent.agent_id,
    agent_tier: selectedAgent.tier,
    lead_score: leadScore.score,
    routing_reason: 'performance_based'
  });
}

function mapLeadScoreToAgentTier(leadScore: 'A' | 'B' | 'C' | 'D'): 'S' | 'A' | 'B' | 'C' {
  switch (leadScore) {
    case 'A': return 'S'; // Best leads to top agents
    case 'B': return 'A';
    case 'C': return 'B';
    case 'D': return 'C';
  }
}
```

**A/B Test Hypothesis:**
"Performance-based routing will increase overall conversion rate from 15% to 21%+ vs. round-robin"

**Metrics to Track:**
- Primary: Overall conversion rate
- Secondary: Conversion rate by agent tier, Lead utilization (% of A leads to S agents)

**Expected Lift:** +30-40% conversion rate

---

## Skill Spawning Checklist

When spawning a new skill:

- [ ] Clear problem statement (what metric is underperforming?)
- [ ] Baseline measurement (current performance)
- [ ] Target improvement (specific, measurable goal)
- [ ] Implementation plan (how will the skill work?)
- [ ] A/B test design (control vs. treatment, sample size)
- [ ] Metrics to track (primary + secondary)
- [ ] Expected lift (realistic estimate based on industry benchmarks)
- [ ] Exit criteria (when to keep, kill, or continue testing)

These patterns provide battle-tested solutions for the most common lead generation bottlenecks.
