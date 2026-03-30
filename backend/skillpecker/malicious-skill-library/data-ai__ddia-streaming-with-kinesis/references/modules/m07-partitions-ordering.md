# Module 7: Partitions & Ordering

**Duration**: 45 minutes
**Prerequisites**: M6 (Partitioned Logs Intro)
**Chapter Reading**: "Partitioned Logs" section, partition key discussion

## Learning Goals

By the end of this module, you will be able to:
1. Explain how partition keys determine event routing
2. Understand consumer offsets and how they work
3. Design systems that guarantee ordering where needed
4. Recognize the trade-off between ordering and parallelism

## Core Concepts (10 min)

### Partition Keys

In partitioned log systems (Kafka, Kinesis), every event has a **partition key** that determines which partition (shard) it goes to.

**Key principle**: All events with the same partition key go to the same partition and maintain their order.

```
Partition Key: "user123" → Always goes to Partition 2
Partition Key: "user456" → Always goes to Partition 1
Partition Key: "user789" → Always goes to Partition 2
```

**How it works**:
```
hash(partition_key) % number_of_partitions = partition_number
```

### Ordering Guarantees

**Within a partition**: Total order guaranteed
- Event A sent before Event B → Event A has lower offset than Event B
- All consumers see events in the same order

**Across partitions**: No ordering guarantee
- Events in different partitions may be processed in any order
- Even if Event A was sent before Event B, if they're in different partitions, B might be processed first

**Example - User Activity Stream**:
```
Events for user123:
  1. view_item (t=10:00:00) → Partition 2, offset 100
  2. add_to_cart (t=10:00:05) → Partition 2, offset 101
  3. checkout (t=10:00:30) → Partition 2, offset 102

Events for user456:
  1. view_item (t=10:00:02) → Partition 1, offset 200
  2. view_item (t=10:00:10) → Partition 1, offset 201
```

Each user's events maintain order, but user456's events may be processed before or after user123's events.

### Consumer Offsets

An **offset** is a monotonically increasing sequence number within a partition that uniquely identifies an event's position.

**Key concepts**:
- Each partition has its own offset sequence (starting at 0)
- Offsets are sequential within a partition
- Consumers track their current offset per partition
- Committing an offset means "I've processed everything up to here"

**Example**:
```
Consumer A position in Partition 0: offset 1,234
Consumer B position in Partition 0: offset 890 (behind Consumer A)
Consumer A position in Partition 1: offset 567
```

**Advantages of offset-based tracking**:
- Much simpler than per-message acknowledgments
- Consumer can replay by resetting offset
- Reduced bookkeeping overhead
- Enables "time travel" - reprocess from any point

### Trade-off: Ordering vs Parallelism

**Want strong ordering?** → Use same partition key → Limited parallelism (max consumers = 1 per partition)

**Want high parallelism?** → Distribute across partitions → No ordering across partitions

**Design principle**: Partition by the entity that needs ordering

Examples:
- User activity → partition by user ID (each user's events in order)
- Order events → partition by order ID (each order's lifecycle in order)
- Sensor data → partition by sensor ID (each sensor's readings in order)

## Discussion Questions (10 min)

### Question 1: Partition Key Design

You're building a ride-sharing app that tracks:
- Driver location updates (every 5 seconds)
- Ride requests from passengers
- Ride assignments (matching driver to passenger)
- Trip status updates (started, completed, etc.)

How should you choose partition keys for each event type? What ordering guarantees do you need?

<details>
<summary>Think about it, then expand for discussion points</summary>

**Possible approaches**:

**Option 1 - Partition by driver ID**:
- Keeps all driver location updates in order
- But ride assignments for the same passenger might be out of order
- Good if you're building a "driver view" app

**Option 2 - Partition by ride ID**:
- Keeps all events for a specific ride in order (assignment → start → complete)
- But driver location updates scattered across partitions
- Good for tracking individual ride lifecycle

**Option 3 - Hybrid**:
- Driver locations → partition by driver ID
- Ride events (request, assignment, status) → partition by ride ID
- Use different streams for different event types

**The right answer depends on your queries**: What questions does your system need to answer? That determines what needs to be ordered.
</details>

### Question 2: Consumer Offset Strategy

Your stream processor crashed after processing offsets 100-149 but before committing the offset. When it restarts:

**Option A**: Resume from offset 100 (last committed) → Process 100-149 again
**Option B**: Resume from offset 150 (where it crashed) → Skip 100-149

Which should you choose and why? How does your answer change if:
- Processing is idempotent (safe to process twice)?
- Processing has side effects (sends emails, charges credit cards)?

<details>
<summary>Expand for discussion</summary>

**Generally Option A (at-least-once processing)**:
- Safer default - don't lose data
- Requires idempotent processing or deduplication
- Most stream processors do this

**Option B (at-most-once processing)**:
- Risks data loss
- Only acceptable if some loss is tolerable (metrics, logs)
- Lower overhead, no deduplication needed

**If processing has side effects**:
- Must handle duplicates (idempotency tokens, deduplication table)
- Or commit offsets in same transaction as side effects (exactly-once)
</details>

### Question 3: Partition Count Planning

You're designing a Kinesis stream for user activity events. You expect:
- 1 million users
- 100 events/second total throughput
- Need to maintain per-user ordering

How many shards should you use? What are the trade-offs?

<details>
<summary>Expand for discussion</summary>

**Kinesis shard limits**:
- 1 MB/sec write or 1,000 records/sec per shard
- 2 MB/sec read per shard

**For 100 events/sec**:
- Assuming 1 KB/event = 100 KB/sec
- Well within 1 shard capacity (1 MB/sec = 1,000 KB/sec)

**But consider**:
- **Parallelism**: 1 shard = only 1 consumer can read at a time
- **Growth**: Future traffic growth
- **Hot partitions**: If some users generate way more events

**Reasonable choice**: 5-10 shards
- Allows parallel processing (up to 5-10 consumers)
- Distributes users across shards (partition by user ID)
- Room for growth
- Each user's events still ordered (same partition key → same shard)

**Trade-off**: More shards = higher cost but better parallelism and resilience
</details>

## Hands-On: Partition Keys & Ordering (20 min)

You'll create a stream with multiple shards and verify that partition keys control routing and ordering.

### Step 1: Create Multi-Shard Stream

Create `partition_demo.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def create_stream(stream_name, shard_count):
    """Create a multi-shard Kinesis stream"""
    try:
        kinesis.create_stream(StreamName=stream_name, ShardCount=shard_count)
        print(f"Creating stream '{stream_name}' with {shard_count} shards...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)
        print("Stream is active!\n")
    except kinesis.exceptions.ResourceInUseException:
        print(f"Stream '{stream_name}' already exists\n")

def send_user_events(stream_name, user_id, events):
    """Send a sequence of events for a user"""
    print(f"Sending events for {user_id}:")
    for i, action in enumerate(events):
        event = {
            'userId': user_id,
            'action': action,
            'sequence': i + 1,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        response = kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(event),
            PartitionKey=user_id  # This ensures all events for this user go to same shard
        )

        print(f"  {i+1}. {action:20s} → Shard: {response['ShardId']}, Seq: {response['SequenceNumber'][:10]}...")
        time.sleep(0.1)

    print()

def main():
    stream_name = 'ordering-demo'

    # Create stream with 3 shards
    create_stream(stream_name, shard_count=3)

    # Send ordered sequences for different users
    # All events for each user should go to the SAME shard
    send_user_events(stream_name, 'alice', [
        'view_item',
        'add_to_cart',
        'view_cart',
        'checkout',
        'confirm_order'
    ])

    send_user_events(stream_name, 'bob', [
        'view_item',
        'view_item',
        'add_to_cart',
        'remove_from_cart',
        'logout'
    ])

    send_user_events(stream_name, 'charlie', [
        'login',
        'view_category',
        'view_item',
        'add_to_cart',
        'checkout'
    ])

    # Show stream info
    stream_info = kinesis.describe_stream(StreamName=stream_name)
    shards = stream_info['StreamDescription']['Shards']
    print(f"\nStream '{stream_name}' has {len(shards)} shards:")
    for shard in shards:
        print(f"  - {shard['ShardId']}")

    print("\nKey observation: All events for each user went to the SAME shard!")
    print("This guarantees ordering within each user's event sequence.")

if __name__ == '__main__':
    main()
```

### Step 2: Run and Observe

```bash
python partition_demo.py
```

**What to observe**:
1. All events for "alice" go to the same shard
2. All events for "bob" go to the same shard (possibly different from alice's)
3. All events for "charlie" go to the same shard
4. The shard assignment is deterministic (run again, same results)

### Step 3: Verify Ordering

Create `verify_ordering.py`:

```python
import boto3
import json
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def read_shard_ordered(stream_name, shard_id):
    """Read events from a shard and verify ordering"""
    print(f"\nReading from {shard_id}:")
    print("-" * 60)

    # Get shard iterator
    response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'
    )
    shard_iterator = response['ShardIterator']

    user_sequences = {}  # Track sequence numbers per user

    while shard_iterator:
        response = kinesis.get_records(ShardIterator=shard_iterator, Limit=100)

        for record in response['Records']:
            data = json.loads(record['Data'])
            user_id = data['userId']
            action = data['action']
            sequence = data['sequence']
            offset = record['SequenceNumber']

            # Track this user's sequence
            if user_id not in user_sequences:
                user_sequences[user_id] = []
            user_sequences[user_id].append(sequence)

            print(f"  [{user_id:8s}] seq={sequence} action={action:20s} offset={offset[:10]}...")

        shard_iterator = response.get('NextShardIterator')
        if not response['Records']:
            break

    # Verify ordering
    print("\nOrdering verification:")
    for user_id, sequences in user_sequences.items():
        expected = list(range(1, len(sequences) + 1))
        if sequences == expected:
            print(f"  ✓ {user_id}: Correct order {sequences}")
        else:
            print(f"  ✗ {user_id}: OUT OF ORDER! Got {sequences}, expected {expected}")

def main():
    stream_name = 'ordering-demo'

    # Get all shards
    stream_info = kinesis.describe_stream(StreamName=stream_name)
    shards = stream_info['StreamDescription']['Shards']

    # Read from each shard
    for shard in shards:
        read_shard_ordered(stream_name, shard['ShardId'])
        time.sleep(0.5)

if __name__ == '__main__':
    main()
```

### Step 4: Verify

```bash
python verify_ordering.py
```

You should see:
- Events grouped by shard
- Within each shard, events for the same user appear in order
- Sequence numbers match the order they were sent

### Step 5: Experiment with Wrong Partition Keys

Modify `partition_demo.py` to use a **random** partition key instead:

```python
import random
import string

# In send_user_events function, replace:
PartitionKey=user_id

# With:
PartitionKey=''.join(random.choices(string.ascii_letters, k=10))
```

Run both scripts again. What happens?

<details>
<summary>Expected result</summary>

With random partition keys:
- Events for same user scattered across different shards
- No ordering guarantee anymore
- The sequence numbers will be out of order!

This demonstrates why partition keys are critical for ordering.
</details>

### Cleanup

```bash
aws kinesis delete-stream --stream-name ordering-demo
```

## Checkpoint (5 min)

### Question 1: Partition Key Selection

Which partition key choice maintains ordering for a user's shopping session?

A) Random GUID for each event
B) User ID
C) Timestamp
D) Product ID

<details>
<summary>Answer</summary>

**B) User ID**

All events for the same user will go to the same partition, maintaining order. Random GUIDs scatter events, timestamps might collide across users, and product IDs group by product not user.
</details>

### Question 2: Offset Understanding

A consumer has these offsets:
- Partition 0: offset 1,500 (committed)
- Partition 1: offset 2,300 (committed)

The consumer processes events up to:
- Partition 0: offset 1,550
- Partition 1: offset 2,350

Then crashes before committing. Where does it resume?

<details>
<summary>Answer</summary>

**Partition 0: offset 1,500, Partition 1: offset 2,300**

It resumes from the last committed offsets. Events 1,501-1,550 and 2,301-2,350 will be processed again (at-least-once delivery).
</details>

### Question 3: Parallelism Trade-off

You have a stream with 1 shard and need to process 1,000 events/second. Current consumer can only process 500 events/second. What should you do?

A) Add more shards and distribute events across them
B) Optimize the consumer to process faster
C) Buffer events in memory
D) Reduce retention period

<details>
<summary>Answer</summary>

**A) Add more shards (if you can change partition keys)**

Or **B) Optimize the consumer**

Explanation:
- If you increase to 2+ shards and have multiple consumers, you can process in parallel
- BUT: this only works if you can distribute events across shards (different partition keys)
- If all events must maintain order (same partition key), you need to optimize the consumer instead
- Buffering (C) just delays the problem
- Retention period (D) doesn't help with throughput
</details>

## Summary

You've completed Module 7! You should now understand:

✓ How partition keys determine event routing
✓ Consumer offsets and how they work
✓ Ordering guarantees within and across partitions
✓ The trade-off between ordering and parallelism
✓ How to design partition keys for your use case

**Next modules**:
- **M8: Load Balancing vs Fan-out** - Consumer patterns
- **M11: State & Immutability** - Building state from ordered events
- **M12: Processing Patterns** - Using ordered streams for processing

**Where to learn more**:
- DDIA Chapter 11, "Partitioned Logs" section
- `references/stream-processing-concepts.md` - "Partitioned Logs Deep Dive"
