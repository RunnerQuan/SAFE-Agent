# Module 3: Backpressure & Durability

**Duration**: 45 minutes
**Prerequisites**: M1, M2
**Chapter Reading**: "Messaging Systems" section (lines 39-57)

## Learning Goals

By the end of this module, you will be able to:
1. Understand backpressure and flow control mechanisms
2. Explain durability trade-offs in messaging systems
3. Identify when message loss is acceptable
4. Design systems that handle producer/consumer speed mismatches

## Core Concepts (10 min)

### Backpressure (Flow Control)

**The Problem**: What happens when producers send data faster than consumers can process it?

**Without backpressure**:
```
Producer: 1000 events/sec → Queue → Consumer: 100 events/sec
Result: Queue grows unbounded → Out of memory → System crashes
```

**With backpressure**:
```
Producer: 1000 events/sec → Queue (full!) → Blocked → Producer: 100 events/sec
Result: Producer slows down to match consumer speed
```

**Backpressure strategies**:

1. **Blocking**: Producer waits when queue is full (like Unix pipes, TCP)
   - Pros: No data loss, simple
   - Cons: Slows down producer

2. **Buffering**: Queue stores excess events (up to a limit)
   - Pros: Smooths temporary bursts
   - Cons: Still fails if sustained imbalance

3. **Dropping**: Discard events when overwhelmed
   - Pros: Producer keeps running
   - Cons: Data loss

4. **Sampling**: Keep only a fraction of events
   - Pros: Maintains system health
   - Cons: Incomplete data

**Real-world example**:
- TCP uses backpressure (flow control) to prevent sender from overwhelming receiver
- Unix pipes block writers when pipe buffer is full
- Kinesis returns throttling errors if you exceed shard capacity

### Message Durability

**Question**: If the system crashes, are messages preserved or lost?

**Durability levels**:

**1. In-memory only** (No durability)
- Messages stored only in RAM
- Fast but lost on crash
- Example: Redis pub/sub, some message brokers

**2. Disk with async writes** (Partial durability)
- Written to disk eventually
- Recent messages may be lost on crash
- Example: Kafka with acks=1

**3. Synchronous disk writes** (Full durability)
- Written to disk before acknowledging
- Slower but no loss on crash
- Example: Kafka with acks=all, Kinesis

**4. Replicated** (High durability)
- Written to multiple disks/servers
- Survives server failures
- Example: Kafka with replication, Kinesis

**Trade-off**: Durability vs Latency vs Throughput

```
High durability (replicated, sync writes) = Higher latency, Lower throughput
Low durability (memory only) = Lower latency, Higher throughput
```

### When is Message Loss Acceptable?

**Loss is acceptable** when:
- **Metrics/monitoring**: Losing 0.1% of metrics is tolerable
- **Real-time feeds**: Old social media posts less important
- **Sensor data**: Some readings can be lost if you have many

**Loss is NOT acceptable** when:
- **Financial transactions**: Every payment must be recorded
- **Orders**: Can't lose customer orders
- **Security events**: Must not miss security alerts
- **Exactly-once requirements**: Any loss violates guarantees

**Design principle**: Match durability to importance
- Critical data → High durability, low throughput OK
- Non-critical data → Low durability, high throughput

### Consumer Lag

**Consumer lag** = How far behind the consumer is from the latest event

```
Latest event offset: 10,000
Consumer current offset: 9,500
Lag: 500 events
```

**Causes of lag**:
- Consumer slower than producer
- Consumer downtime
- Consumer processing errors (retries)
- Traffic spikes

**Monitoring lag is critical**:
- Growing lag → System problem, consumer can't keep up
- Stable lag → Healthy system
- Zero lag → Consumer idle (maybe over-provisioned)

## Discussion Questions (10 min)

### Question 1: Backpressure Strategy

You're building a web analytics system that tracks clicks. During a product launch, traffic spikes 10x normal levels. Your stream processor can't keep up. What should you do?

**Options**:
A) Block producers (apply backpressure) → Website slows down for users
B) Buffer events → Risk running out of memory
C) Sample events (keep 10%) → Lose detailed data but keep system running
D) Drop events → Lose data

Which do you choose and why?

<details>
<summary>Expand for discussion</summary>

**Best answer: C (Sampling)**

For analytics during a spike:
- User experience matters (can't slow website) → Rules out A
- Temporary spike may be longer than buffer allows → Rules out B
- Some analytics data is better than system crash → C is best
- Total data loss is worst → Rules out D

**Alternative: Scale consumers** - Add more consumer instances to handle load (if possible).

**Key insight**: Different data types need different strategies. Financial transactions might require blocking (A) even if it impacts users, because data loss is unacceptable.
</details>

### Question 2: Durability Requirements

You're designing these systems. Match each to appropriate durability level:

1. **Stock trading platform** - Record every trade
2. **IoT temperature sensors** - 1000 sensors, readings every second
3. **User analytics** - Clickstream data for website
4. **Payment processing** - Credit card transactions
5. **Real-time dashboards** - Server metrics

<details>
<summary>Expand for discussion</summary>

**Durability requirements**:

1. **Stock trading** → **Highest** (replicated, sync writes)
   - Regulatory requirements
   - Financial consequences of loss
   - Must be able to audit every trade

2. **IoT sensors** → **Low** (async or in-memory OK)
   - High volume
   - Losing a few readings OK
   - Cheap to collect more data

3. **User analytics** → **Medium** (async writes)
   - Important but not critical
   - Small loss percentage acceptable
   - Value in aggregate patterns

4. **Payment processing** → **Highest** (replicated, sync writes)
   - Money is involved
   - Legal/compliance requirements
   - Zero tolerance for loss

5. **Dashboards** → **Low** (can rebuild from source)
   - Derived/aggregated data
   - Can recompute if lost
   - Real-time matters more than durability

**Pattern**: Match durability to business impact of data loss.
</details>

### Question 3: Consumer Lag Scenario

Your consumer has been running fine processing 100 events/sec. You deploy a new version with a bug that causes 50% of events to fail and retry. What happens to consumer lag over time?

<details>
<summary>Expand for discussion</summary>

**What happens**:

1. **Effective throughput drops**:
   - Before: 100 events/sec successfully processed
   - After: 50 events/sec (half fail and retry)

2. **Lag grows**:
   - Producer still sending 100 events/sec
   - Gap = 100 - 50 = 50 events/sec accumulating
   - After 1 hour: 50 × 3600 = 180,000 events behind

3. **Cascade effect**:
   - Retries consume more resources
   - Slows processing further
   - Lag grows faster
   - Eventually: Out of memory or can't catch up

**Solution**:
- Rollback the buggy deployment
- Fix the bug
- May need to increase consumer capacity temporarily to catch up
- Monitor consumer lag closely!

**Key lesson**: Consumer bugs can cause lag to spiral out of control. Always monitor lag.
</details>

## Hands-On: Backpressure & Durability (20 min)

You'll experiment with Kinesis retention, consumer lag, and handling speed mismatches.

### Step 1: Create Stream with Custom Retention

Create `retention_demo.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def create_stream_with_retention(stream_name, shard_count=1, retention_hours=48):
    """Create stream with extended retention"""
    try:
        kinesis.create_stream(StreamName=stream_name, ShardCount=shard_count)
        print(f"Creating stream '{stream_name}'...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)

        # Increase retention (default is 24 hours, max 365 days)
        kinesis.increase_stream_retention_period(
            StreamName=stream_name,
            RetentionPeriodHours=retention_hours
        )
        print(f"✓ Stream created with {retention_hours}hr retention\n")

    except kinesis.exceptions.ResourceInUseException:
        print(f"✓ Stream '{stream_name}' already exists\n")

def send_events_with_timing(stream_name, count=20, delay=0.5):
    """Send events and track timing"""
    print(f"Sending {count} events with {delay}s delay...")
    start_time = time.time()

    for i in range(count):
        event = {
            'eventId': i,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'data': f'Event number {i}'
        }

        response = kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(event),
            PartitionKey=str(i % 3)
        )

        print(f"  {i+1}/{count} sent")
        time.sleep(delay)

    elapsed = time.time() - start_time
    throughput = count / elapsed

    print(f"\n✓ Sent {count} events in {elapsed:.1f}s ({throughput:.1f} events/sec)\n")

def show_stream_metrics(stream_name):
    """Display stream statistics"""
    response = kinesis.describe_stream(StreamName=stream_name)
    stream = response['StreamDescription']

    print(f"Stream: {stream_name}")
    print(f"  Status: {stream['StreamStatus']}")
    print(f"  Shards: {len(stream['Shards'])}")
    print(f"  Retention: {stream['RetentionPeriodHours']} hours")
    print(f"  Created: {stream.get('StreamCreationTimestamp', 'N/A')}")
    print()

def main():
    stream_name = 'durability-test'

    # Create stream with 48-hour retention
    create_stream_with_retention(stream_name, retention_hours=48)

    # Show initial metrics
    show_stream_metrics(stream_name)

    # Send events (simulates producer speed)
    send_events_with_timing(stream_name, count=20, delay=0.5)

    print("Events are now durable for 48 hours in Kinesis!")
    print("Try reading them tomorrow - they'll still be there.")

if __name__ == '__main__':
    main()
```

### Step 2: Simulate Consumer Lag

Create `consumer_lag_demo.py`:

```python
import boto3
import json
import time
from datetime import datetime

kinesis = boto3.client('kinesis', region_name='us-east-1')

def slow_consumer(stream_name, shard_id, processing_delay=2.0):
    """Simulate a slow consumer that falls behind"""
    print(f"Starting SLOW consumer (processes 1 event every {processing_delay}s)\n")

    # Get shard iterator
    response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'
    )
    shard_iterator = response['ShardIterator']

    events_processed = 0
    start_time = datetime.now()

    while shard_iterator:
        # Get records
        response = kinesis.get_records(ShardIterator=shard_iterator, Limit=5)

        for record in response['Records']:
            data = json.loads(record['Data'])
            arrival_time = record['ApproximateArrivalTimestamp']
            processing_time = datetime.now()

            # Calculate lag
            lag = (processing_time - arrival_time.replace(tzinfo=None)).total_seconds()

            print(f"Processing event {data['eventId']}")
            print(f"  Arrival: {arrival_time}")
            print(f"  Processing: {processing_time}")
            print(f"  Lag: {lag:.1f} seconds")
            print()

            # Simulate slow processing
            time.sleep(processing_delay)
            events_processed += 1

        shard_iterator = response.get('NextShardIterator')

        if not response['Records']:
            break

    duration = (datetime.now() - start_time).seconds
    throughput = events_processed / duration if duration > 0 else 0

    print(f"Consumer Stats:")
    print(f"  Events processed: {events_processed}")
    print(f"  Duration: {duration}s")
    print(f"  Throughput: {throughput:.2f} events/sec")
    print(f"\n⚠️  Notice how lag grows as the consumer falls behind!")

def main():
    stream_name = 'durability-test'

    # Get shard info
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    if shards:
        # Simulate slow consumer on first shard
        slow_consumer(stream_name, shards[0]['ShardId'], processing_delay=2.0)
    else:
        print("No shards found! Run retention_demo.py first.")

if __name__ == '__main__':
    main()
```

### Step 3: Run the Experiments

**Experiment 1 - Durability**:
```bash
# Send events with extended retention
python retention_demo.py

# Events are now stored for 48 hours
# You can read them anytime within that window
```

**Experiment 2 - Consumer Lag**:
```bash
# First, send events (fast producer)
python retention_demo.py

# Then, consume slowly (slow consumer)
python consumer_lag_demo.py
```

Observe:
- Consumer takes 2 seconds per event
- Lag (time between event arrival and processing) grows
- If producer was still sending, lag would grow unbounded

### Step 4: Experiment with Throttling

Modify `retention_demo.py` to send MANY events fast:

```python
# Try to exceed shard capacity (1000 records/sec per shard)
send_events_with_timing(stream_name, count=2000, delay=0.0001)
```

Run it - you'll see throttling errors! This is Kinesis applying backpressure.

### Cleanup

```bash
aws kinesis delete-stream --stream-name durability-test
```

## Checkpoint (5 min)

### Question 1: Backpressure Understanding

What is the purpose of backpressure in streaming systems?

A) To compress data before sending
B) To prevent producers from overwhelming consumers
C) To encrypt messages in transit
D) To speed up processing

<details>
<summary>Answer</summary>

**B) To prevent producers from overwhelming consumers**

Backpressure slows down fast producers to match slow consumers, preventing unbounded queue growth and system crashes.
</details>

### Question 2: Durability Trade-offs

You're building a system that must handle 1 million events/second. Each event must be stored durably. What's the likely impact?

A) No impact - durability is free
B) Higher latency and cost due to disk writes and replication
C) Lower throughput because disk is always slower
D) Both B and C

<details>
<summary>Answer</summary>

**D) Both B and C**

Durability requires:
- Disk writes (slower than memory)
- Replication (sends to multiple servers)
- Acknowledgment waits (ensure data written)

All of these reduce throughput and increase latency. That's the trade-off for durability.
</details>

### Question 3: Consumer Lag

Your monitoring shows consumer lag growing from 100 events to 10,000 events over an hour. What should you do?

A) Nothing - lag always grows
B) Investigate immediately - consumer can't keep up
C) Wait a few more hours to see if it stabilizes
D) Restart the consumer

<details>
<summary>Answer</summary>

**B) Investigate immediately - consumer can't keep up**

Growing lag means:
- Consumer processing slower than producer sending
- Will continue growing unbounded
- Eventually causes system failure

Need to:
- Check for consumer bugs/errors
- Add more consumer capacity
- Optimize consumer performance
- Check for upstream traffic spikes

Restarting (D) might help if it's a transient issue, but won't fix underlying problem.
</details>

## Summary

You've completed Module 3! You should now understand:

✓ Backpressure and flow control mechanisms
✓ Durability trade-offs (latency vs reliability)
✓ When message loss is acceptable
✓ Consumer lag and why monitoring it is critical
✓ How to configure retention in Kinesis

**Next modules**:
- **M4: Direct Messaging** - Alternatives to broker-based systems
- **M5: Message Brokers** - Traditional message queue patterns
- **M6: Partitioned Logs Intro** - Log-based messaging systems

**Where to learn more**:
- DDIA Chapter 11, "Messaging Systems"
- `references/stream-processing-concepts.md` - "Backpressure" section
