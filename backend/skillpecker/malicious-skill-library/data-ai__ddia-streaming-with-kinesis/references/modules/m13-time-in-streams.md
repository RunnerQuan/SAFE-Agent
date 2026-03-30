# Module 13: Time in Streams

**Duration**: 45 minutes
**Prerequisites**: M7 (Partitions & Ordering), M11 (State & Immutability)
**Chapter Reading**: "Reasoning About Time" section

## Learning Goals

By the end of this module, you will be able to:
1. Differentiate event time vs processing time
2. Understand different window types (tumbling, hopping, sliding, session)
3. Handle late-arriving events
4. Use Kinesis Data Analytics for time-windowed aggregations

## Core Concepts (10 min)

### Event Time vs Processing Time

**Event Time**: When the event actually occurred (according to the device/source)
**Processing Time**: When the event is processed by the stream processor

```
Event occurs: 10:00:00 (event time)
    ↓
Network delay, buffering...
    ↓
Event processed: 10:00:15 (processing time)

Difference = 15 seconds of lag
```

**Why it matters**:

**Example - Counting page views per minute**:

Using processing time:
```
Event A: occurred 09:59:58, processed 10:00:02 → counted in 10:00 bucket
Event B: occurred 10:00:01, processed 09:59:59 → counted in 09:59 bucket

Wrong! Events out of order due to network delays
```

Using event time:
```
Event A: occurred 09:59:58 → counted in 09:59 bucket ✓
Event B: occurred 10:00:01 → counted in 10:00 bucket ✓

Correct! Events counted in actual time bucket
```

**Challenges with event time**:
- Clock skew (different devices have different times)
- Events arrive out of order
- How long do you wait for late events?

**When to use each**:
- **Event time**: When correctness matters (analytics, billing, compliance)
- **Processing time**: When simplicity matters, real-time approximations OK

### Windows

**Windows** group unbounded streams into finite chunks for aggregation.

**Types of windows**:

**1. Tumbling Window** (Fixed, non-overlapping)
```
[---- 1 minute ----][---- 1 minute ----][---- 1 minute ----]
 09:00:00-09:01:00   09:01:00-09:02:00   09:02:00-09:03:00

Events in each window are independent
```

**2. Hopping Window** (Fixed, overlapping)
```
[---- 5 minutes ----]
      [---- 5 minutes ----]
            [---- 5 minutes ----]

Each window starts 1 minute apart (hop size)
Events can be in multiple windows
```

**3. Sliding Window** (Per-event, looking back)
```
For each event, consider all events in previous N minutes

Event at 10:05 → Count events from 10:00-10:05
Event at 10:06 → Count events from 10:01-10:06
```

**4. Session Window** (Activity-based, variable length)
```
[--- Session ---] idle gap > 30min [--- Session ---]
 10:00-10:25               10:58-11:15

Groups events by activity, ends after inactivity gap
```

**Window choice depends on use case**:
- **Tumbling**: Hourly reports, daily summaries
- **Hopping**: Moving averages
- **Sliding**: Real-time metrics (last 5 minutes)
- **Session**: User sessions, activity tracking

### Late Events (Stragglers)

**Problem**: Events arrive after window closed.

```
Window: 10:00-10:01
Events arrive:
  10:00:30 (timestamp 10:00:30) ✓ On time
  10:01:05 (timestamp 10:00:45) ✗ Late! Window already closed
```

**Strategies for handling late events**:

**1. Ignore/Drop**:
- Simplest
- Risk: lose data
- OK for approximate metrics

**2. Keep windows open longer**:
- Wait extra time before finalizing window
- Trade-off: Higher latency, more complete results
- "Watermark": Estimate of how far event time has progressed

**3. Emit corrected results**:
- Emit initial result when window closes
- Emit corrections when late events arrive
- Requires downstream systems to handle updates

**4. Track separately**:
- Count on-time and late events separately
- Useful for monitoring data quality

**Example with watermarks**:
```
Processing time: 10:02:00
Watermark: "No more events with timestamp < 10:00:00 expected"
→ Can finalize 10:00-10:01 window

Late event arrives with timestamp 09:59:45
→ Watermark was wrong! Event is too late, drop or correct
```

### Time in Practice

**Best practices**:

1. **Always include timestamp in events**:
```json
{
  "userId": "alice",
  "action": "click",
  "timestamp": "2024-01-21T10:00:30Z",  ← Event time
  "device": "mobile"
}
```

2. **Use event time for correctness**:
- Analytics, billing, compliance
- Worth the complexity

3. **Use processing time for simplicity**:
- Monitoring, dashboards
- Approximations OK

4. **Handle clock skew**:
- Validate timestamps (reject if too far in future)
- Use NTP to sync clocks
- Accept some events may be misordered

5. **Monitor lag**:
- Track difference between event time and processing time
- Alert if lag grows

## Discussion Questions (10 min)

### Question 1: Time Choice

For each use case, should you use event time or processing time?

A) **Billing system** - Charge customers for API usage per hour
B) **Real-time dashboard** - Show current requests/second
C) **Fraud detection** - Detect unusual patterns in transaction times
D) **System monitoring** - Alert when error rate spikes
E) **Analytics** - Report on user behavior trends

<details>
<summary>Expand for discussion</summary>

**Event time** (accuracy critical):
- **A) Billing** - Must use when customer actually made requests
- **C) Fraud detection** - Need accurate transaction timing
- **E) Analytics** - Accurate historical analysis

**Processing time** (simplicity OK):
- **B) Real-time dashboard** - Approximate "now" is fine
- **D) System monitoring** - When we noticed the error matters

**Gray area**:
- **C) Fraud** could use processing time if only detecting real-time fraud
- **D) Monitoring** could use event time if analyzing historical patterns

**Key factors**:
- Money involved? → Event time
- Historical accuracy? → Event time
- Real-time approximation? → Processing time
- Simplicity matters? → Processing time
</details>

### Question 2: Window Selection

You're analyzing website traffic. Choose the best window type:

A) Count total page views per hour (for hourly reports)
B) Show "requests in last 5 minutes" on dashboard
C) Calculate average response time over sliding 10-minute periods
D) Track user activity sessions (end after 30 minutes of inactivity)

<details>
<summary>Expand for discussion</summary>

**A) Hourly reports** → **Tumbling window**
- Fixed 1-hour buckets (00:00-01:00, 01:00-02:00, ...)
- Each event in exactly one bucket
- Perfect for periodic reports

**B) Last 5 minutes** → **Sliding window**
- For each query, look back 5 minutes
- Continuously updated
- Good for real-time dashboards

**C) Moving average** → **Hopping window**
- 10-minute window, hop every 1 minute
- Overlapping windows for smooth averages
- Good for trend detection

**D) User sessions** → **Session window**
- Variable length, gap-based
- Natural for user behavior analysis
- Automatically groups related activity

**Key insight**: Window type should match how you think about the data:
- Periodic reports → Tumbling
- Continuous metrics → Sliding
- Smooth trends → Hopping
- Activity-based → Session
</details>

### Question 3: Late Events Strategy

Your analytics pipeline processes click events. Window: 1 minute tumbling. You observe:
- 95% of events arrive within 5 seconds
- 99% arrive within 30 seconds
- 1% arrive 1-10 minutes late

What's your strategy for handling late events?

<details>
<summary>Expand for discussion</summary>

**Option 1: Wait 30 seconds before closing window**
- Captures 99% of events
- Latency: ~30 seconds for results
- Drop 1% (or track separately)

**Option 2: Close window at 5 seconds, emit corrections**
- Fast initial results (95% complete)
- Emit updated results as late events arrive
- Downstream must handle updates
- More complex but lower latency

**Option 3: Two-tier strategy**
- Emit "preliminary" results at 5 seconds
- Emit "final" results at 30 seconds
- Mark clearly which is which
- Downstream uses appropriate version

**Recommended: Option 1 or 3** depending on latency vs completeness needs.

**Monitoring**:
- Track late event rate
- Alert if suddenly increases (indicates infrastructure issues)
- Log late events for quality analysis

**Key trade-off**: Lower latency vs higher completeness
</details>

## Hands-On: Time-Windowed Aggregations (20 min)

You'll implement time-windowed aggregations using Python and then see how Kinesis Data Analytics handles it with SQL.

### Step 1: Manual Windowing in Python

Create `manual_windowing.py`:

```python
import boto3
import json
from datetime import datetime, timedelta
from collections import defaultdict
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def create_stream():
    """Create Kinesis stream"""
    try:
        kinesis.create_stream(StreamName='click-events', ShardCount=1)
        print("Creating stream...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName='click-events')
    except kinesis.exceptions.ResourceInUseException:
        pass
    print("✓ Stream ready\n")

def send_events_with_delays():
    """Send events with realistic delays and timestamps"""
    print("Sending events (with simulated delays)...\n")

    base_time = datetime.utcnow()

    events = [
        # Batch 1: 10:00:00 - 10:00:59
        {'user': 'alice', 'page': '/home', 'event_time': base_time + timedelta(seconds=10)},
        {'user': 'bob', 'page': '/products', 'event_time': base_time + timedelta(seconds=15)},
        {'user': 'alice', 'page': '/cart', 'event_time': base_time + timedelta(seconds=45)},

        # Batch 2: 10:01:00 - 10:01:59
        {'user': 'charlie', 'page': '/home', 'event_time': base_time + timedelta(seconds=65)},
        {'user': 'alice', 'page': '/checkout', 'event_time': base_time + timedelta(seconds=75)},

        # Late arrival: event from first minute arriving late
        {'user': 'bob', 'page': '/about', 'event_time': base_time + timedelta(seconds=55), 'late': True},

        # Batch 3: 10:02:00 - 10:02:59
        {'user': 'diana', 'page': '/home', 'event_time': base_time + timedelta(seconds=130)},
    ]

    for event in events:
        event['eventId'] = f"evt_{int(time.time()*1000)}"
        event['timestamp'] = event['event_time'].isoformat() + 'Z'

        # Simulate late arrival
        if event.get('late'):
            print(f"  ⚠ LATE EVENT: {event['user']:8s} | {event['page']:12s} | "
                  f"timestamp={event['timestamp']}")
            time.sleep(2)  # Arrives late

        kinesis.put_record(
            StreamName='click-events',
            Data=json.dumps({
                'user': event['user'],
                'page': event['page'],
                'timestamp': event['timestamp']
            }),
            PartitionKey=event['user']
        )

        if not event.get('late'):
            print(f"  {event['user']:8s} | {event['page']:12s} | {event['timestamp']}")

        time.sleep(0.5)

    print("\n✓ Events sent\n")

class WindowedAggregator:
    """Aggregate events into tumbling windows"""
    def __init__(self, window_size_seconds=60):
        self.window_size = window_size_seconds
        self.windows = defaultdict(lambda: {
            'count': 0,
            'users': set(),
            'pages': defaultdict(int)
        })

    def process_stream(self, stream_name):
        """Process events and aggregate by time windows"""
        print("Processing stream with 1-minute tumbling windows...\n")

        # Read stream
        response = kinesis.describe_stream(StreamName=stream_name)
        shards = response['StreamDescription']['Shards']

        for shard in shards:
            iterator_response = kinesis.get_shard_iterator(
                StreamName=stream_name,
                ShardId=shard['ShardId'],
                ShardIteratorType='TRIM_HORIZON'
            )
            shard_iterator = iterator_response['ShardIterator']

            while shard_iterator:
                records_response = kinesis.get_records(ShardIterator=shard_iterator)

                for record in records_response['Records']:
                    self.process_event(json.loads(record['Data']))

                shard_iterator = records_response.get('NextShardIterator')
                if not records_response['Records']:
                    break

        self.print_windows()

    def process_event(self, event):
        """Process single event into window"""
        # Parse event time
        event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))

        # Determine window (floor to minute)
        window_start = event_time.replace(second=0, microsecond=0)
        window_key = window_start.isoformat()

        # Aggregate
        window = self.windows[window_key]
        window['count'] += 1
        window['users'].add(event['user'])
        window['pages'][event['page']] += 1

        print(f"  Event: {event['user']:8s} | {event['page']:12s} | "
              f"timestamp={event['timestamp'][:19]} → Window {window_key[:19]}")

    def print_windows(self):
        """Print windowed results"""
        print("\n" + "="*70)
        print("Tumbling Window Results (1-minute windows, event time)")
        print("="*70 + "\n")

        for window_key in sorted(self.windows.keys()):
            window = self.windows[window_key]
            print(f"Window: {window_key[:19]}")
            print(f"  Total events: {window['count']}")
            print(f"  Unique users: {len(window['users'])}")
            print(f"  Top pages:")
            for page, count in sorted(window['pages'].items(), key=lambda x: -x[1]):
                print(f"    {page:15s}: {count} views")
            print()

def main():
    create_stream()
    send_events_with_delays()

    time.sleep(3)  # Wait for events to be available

    aggregator = WindowedAggregator(window_size_seconds=60)
    aggregator.process_stream('click-events')

    print("✓ Notice how the late event was assigned to correct window based on event time!")

if __name__ == '__main__':
    main()
```

### Step 2: Run Windowing Demo

```bash
python manual_windowing.py
```

**Observe**:
- Events grouped into 1-minute tumbling windows
- Based on event time (not processing time)
- Late event correctly placed in earlier window
- Aggregations per window

### Step 3: Kinesis Data Analytics (SQL)

Create `kda_windowing_setup.py`:

```python
import boto3

def create_kda_sql_template():
    """Generate SQL for Kinesis Data Analytics"""
    sql = """
-- Tumbling window: Count events per minute
CREATE OR REPLACE STREAM "tumbling_window_stream" (
    window_start TIMESTAMP,
    window_end TIMESTAMP,
    event_count INTEGER,
    unique_users INTEGER
);

CREATE OR REPLACE PUMP "tumbling_pump" AS
INSERT INTO "tumbling_window_stream"
SELECT STREAM
    STEP("SOURCE_SQL_STREAM_001".ROWTIME BY INTERVAL '1' MINUTE) AS window_start,
    STEP("SOURCE_SQL_STREAM_001".ROWTIME BY INTERVAL '1' MINUTE)
        + INTERVAL '1' MINUTE AS window_end,
    COUNT(*) AS event_count,
    COUNT(DISTINCT "user") AS unique_users
FROM "SOURCE_SQL_STREAM_001"
GROUP BY STEP("SOURCE_SQL_STREAM_001".ROWTIME BY INTERVAL '1' MINUTE);

-- Hopping window: 5-minute windows every 1 minute
CREATE OR REPLACE STREAM "hopping_window_stream" (
    window_start TIMESTAMP,
    event_count INTEGER
);

CREATE OR REPLACE PUMP "hopping_pump" AS
INSERT INTO "hopping_window_stream"
SELECT STREAM
    HOP_START() AS window_start,
    COUNT(*) AS event_count
FROM "SOURCE_SQL_STREAM_001"
GROUP BY HOP("SOURCE_SQL_STREAM_001".ROWTIME, INTERVAL '1' MINUTE, INTERVAL '5' MINUTE);
"""

    print("Kinesis Data Analytics SQL Template:")
    print("="*70)
    print(sql)
    print("="*70)
    print("\nTo use:")
    print("1. Create Kinesis Data Analytics application in AWS Console")
    print("2. Connect to 'click-events' stream")
    print("3. Paste this SQL")
    print("4. Run application")

def main():
    create_kda_sql_template()

if __name__ == '__main__':
    main()
```

Run it to see SQL for time-windowed aggregations:
```bash
python kda_windowing_setup.py
```

### Step 4: Simulate Processing Time vs Event Time

Add this to `manual_windowing.py`:

```python
def compare_time_modes():
    """Compare event time vs processing time windowing"""
    print("\nComparing event time vs processing time...\n")

    events = [
        {'user': 'alice', 'event_time': datetime.utcnow() - timedelta(minutes=2)},
        {'user': 'bob', 'event_time': datetime.utcnow() - timedelta(minutes=1)},
        {'user': 'charlie', 'event_time': datetime.utcnow()},
    ]

    processing_time = datetime.utcnow()

    print("Events:")
    for event in events:
        event_window = event['event_time'].replace(second=0, microsecond=0)
        processing_window = processing_time.replace(second=0, microsecond=0)

        print(f"  User: {event['user']}")
        print(f"    Event time window:      {event_window.isoformat()}")
        print(f"    Processing time window: {processing_window.isoformat()}")

        if event_window != processing_window:
            print(f"    ⚠ DIFFERENT WINDOWS!")
        print()

    print("Event time = correct historical analysis")
    print("Processing time = simpler but potentially incorrect")
```

### Cleanup

```bash
aws kinesis delete-stream --stream-name click-events
```

## Checkpoint (5 min)

### Question 1: Time Types

An event occurs at 10:00:00 but is processed at 10:05:00 due to network delay. For analytics, which time should you use?

A) Processing time (10:05:00)
B) Event time (10:00:00)
C) Doesn't matter
D) Use both

<details>
<summary>Answer</summary>

**B) Event time (10:00:00)**

For analytics, you want to know when things actually happened, not when you noticed them. Event time gives correct historical analysis. Processing time would show event in wrong time bucket.

**Exception**: Use processing time for real-time monitoring where "when we noticed" matters more than "when it happened".
</details>

### Question 2: Window Types

What's the difference between tumbling and hopping windows?

<details>
<summary>Answer</summary>

**Tumbling windows**:
- Fixed size, non-overlapping
- [0-5min] [5-10min] [10-15min]
- Each event in exactly ONE window
- Use for: Periodic reports, distinct time periods

**Hopping windows**:
- Fixed size, overlapping
- [0-5min] [2-7min] [4-9min]
- Each event can be in MULTIPLE windows
- Use for: Moving averages, trend detection

**Key difference**: Overlap. Hopping windows slide forward by less than their size.
</details>

### Question 3: Late Events

Why can't you just wait indefinitely for late events?

<details>
<summary>Answer</summary>

**Problems with waiting forever**:

1. **Unbounded latency**: Never get results!
2. **Memory**: Must keep all windows open forever
3. **Resource exhaustion**: Can't maintain infinite windows
4. **Usability**: Users need timely results

**Must choose**: Wait time vs completeness vs latency

**Solutions**:
- Wait reasonable time (e.g., 99th percentile of lag)
- Emit corrections for late events
- Track late events separately
- Two-tier (preliminary + final results)

**Key insight**: In streaming, perfection is the enemy of good enough. Accept some incompleteness for bounded latency.
</details>

## Summary

You've completed Module 13! You should now understand:

✓ Event time vs processing time
✓ Window types (tumbling, hopping, sliding, session)
✓ Late event handling strategies
✓ Time-windowed aggregations
✓ Watermarks for window closing
✓ Trade-offs between latency and completeness

**Next modules**:
- **M14: Stream Joins** - Combining multiple streams (often time-windowed)
- **M15: Fault Tolerance** - Handling failures in windowed processing

**Where to learn more**:
- DDIA Chapter 11, "Reasoning About Time" section
- `references/stream-processing-concepts.md` - "Time in Stream Processing"
- "Streaming Systems" by Tyler Akidau (deep dive on time and windowing)
