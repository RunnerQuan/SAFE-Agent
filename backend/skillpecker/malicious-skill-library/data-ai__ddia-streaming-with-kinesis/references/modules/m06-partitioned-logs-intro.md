# Module 6: Partitioned Logs Introduction

**Duration**: 45 minutes
**Prerequisites**: M5 (Message Brokers)
**Chapter Reading**: "Partitioned Logs" section (lines 138-230)

## Learning Goals

By the end of this module, you will be able to:
1. Understand log-based messaging (Kafka, Kinesis model)
2. Explain how partitioned logs differ from traditional brokers
3. Identify when to use log-based vs traditional brokers
4. Work with multi-shard Kinesis streams

## Core Concepts (10 min)

### What is a Partitioned Log?

A **partitioned log** is an append-only, ordered sequence of records stored on disk, split into partitions for scalability.

**Key idea**: Instead of deleting messages after consumption, keep them in a durable log that multiple consumers can read.

```
Partition 0: [Event1] [Event2] [Event3] [Event4] [Event5] ...
Partition 1: [Event6] [Event7] [Event8] [Event9] [Event10] ...
Partition 2: [Event11] [Event12] [Event13] [Event14] [Event15] ...
```

**Examples**: Apache Kafka, Amazon Kinesis, Apache Pulsar, Twitter DistributedLog

### Log-Based vs Traditional Brokers

| Aspect | Traditional Broker (RabbitMQ, SQS) | Log-Based Broker (Kafka, Kinesis) |
|--------|-----------------------------------|----------------------------------|
| Storage | Messages in memory, deleted after ACK | Append-only log on disk |
| Retention | Until consumed | Days/weeks (configurable) |
| Replay | No | Yes - can reread from any offset |
| Multiple Consumers | Fan-out requires setup | Trivial - each tracks own offset |
| Ordering | Queue order | Per-partition order |
| Throughput | Good | Excellent (sequential disk I/O) |
| Load Balancing | Per-message | Per-partition (coarser) |
| Acknowledgments | Per-message | Offset-based (batch) |

### Why Logs on Disk Are Fast

**Counterintuitive fact**: Sequential disk writes can match or beat random memory access!

**Why**:
- Modern disks: sequential writes ~several hundred MB/sec
- Random access: requires seeks (slow)
- Sequential access: no seeks, OS caching helps
- Log structure: always append (sequential)

**Example performance**:
- Kafka: millions of messages/second
- Kinesis: ~1 MB/sec per shard (1000 records/sec)

### Partitioning for Scalability

**Single log problem**: One log = bottleneck (one reader at a time)

**Solution**: Split into multiple partitions (shards)

```
Topic: user-activity (3 partitions)

user123 → hash(user123) % 3 = 0 → Partition 0
user456 → hash(user456) % 3 = 1 → Partition 1
user789 → hash(user789) % 3 = 2 → Partition 2
```

**Benefits**:
- **Parallelism**: Different consumers read different partitions
- **Ordering**: Events with same partition key stay in order
- **Scalability**: Add partitions to increase throughput

**Trade-off**: Ordering only within partition, not across partitions

### Offset-Based Consumption

Instead of per-message ACKs, consumers track their **offset** (position in log).

**Traditional broker**:
```
Message 1: ✓ ACKed
Message 2: ✓ ACKed
Message 3: ✗ Failed, retry
Message 4: ✓ ACKed
Message 5: waiting...
```

**Log-based broker**:
```
Consumer A at offset 1,234 (processed everything before)
Consumer B at offset 890 (reading from earlier point)
Consumer C at offset 1,234 (caught up with Consumer A)
```

**Advantages**:
- Much simpler bookkeeping
- Can replay by resetting offset
- Batch commits (commit offset every N records)
- Enables "time travel"

## Discussion Questions (10 min)

### Question 1: When to Use Each Type

Match these use cases to the appropriate messaging system:

A) **Email notification queue** - Workers send emails, each sent once
B) **User clickstream** - Analytics, ML, and real-time dashboards all need the data
C) **Background job queue** - Process uploaded images
D) **Event log** - Keep 30 days of events for debugging and replay

Traditional broker (SQS/RabbitMQ) or Log-based broker (Kinesis/Kafka)?

<details>
<summary>Expand for discussion</summary>

**Traditional broker (SQS/RabbitMQ)**:
- **A) Email queue** - Perfect! Each email sent once, no replay needed
- **C) Background jobs** - Good fit, task distribution pattern

**Log-based broker (Kinesis/Kafka)**:
- **B) User clickstream** - Excellent! Multiple consumers need same data
- **D) Event log** - Perfect! Need retention and replay

**Pattern**:
- **One consumer, consume once** → Traditional broker
- **Multiple consumers, replay, retention** → Log-based broker

**Gray areas**:
- Either works, but log-based gives you more flexibility
- Traditional might be simpler if you don't need replay
</details>

### Question 2: Replay Scenarios

Your analytics dashboard showed incorrect numbers yesterday. You fixed the bug in your stream processor. How do you recompute the correct numbers?

**With traditional broker (SQS)**:
- Messages from yesterday are gone
- Can't reprocess
- Stuck with wrong data

**With log-based broker (Kinesis)**:
- Messages still in the log (24hr+ retention)
- Reset consumer offset to yesterday
- Reprocess all events with fixed code
- Correct numbers!

Why is this capability valuable? What use cases does it enable?

<details>
<summary>Expand for discussion</summary>

**Replay enables**:

**1. Bug fixes**:
- Fix processing logic
- Reprocess historical data
- Correct past mistakes

**2. New consumers**:
- Add new analytics dashboard
- Process historical data to catch up
- No need to wait for new events

**3. Testing**:
- Test processing logic on real production data
- No risk (reading doesn't affect the log)
- Validate before deploying

**4. Recovery**:
- Consumer crashed and lost state
- Rebuild state by replaying events
- Deterministic recovery

**Key insight**: Separating storage (log) from processing (consumers) provides huge flexibility.
</details>

### Question 3: Partition Count Design

You're building an IoT platform tracking 100,000 devices. Each device sends data every 10 seconds. You create a Kinesis stream to collect this data.

**Throughput calculation**:
- 100,000 devices × 1 event/10sec = 10,000 events/sec
- Assume 1 KB/event = 10 MB/sec

**Kinesis shard limits**:
- 1 MB/sec write per shard
- 1,000 records/sec per shard

How many shards do you need? What should you use as partition key?

<details>
<summary>Expand for discussion</summary>

**Shard count calculation**:
- By throughput: 10 MB/sec ÷ 1 MB/sec/shard = 10 shards
- By record count: 10,000 records/sec ÷ 1,000 records/sec/shard = 10 shards
- **Need: 10 shards minimum**

**Add headroom**: Use 15 shards for:
- Traffic spikes
- Hot partition resilience
- Future growth

**Partition key**:
- **deviceId** - Keeps each device's readings in order
- Distributes devices across shards (100k devices / 15 shards ≈ 6.6k devices/shard)
- Good distribution if device IDs are random

**Don't use**:
- Timestamp (all events cluster)
- Fixed string (all go to one shard)
- Random (breaks per-device ordering)
</details>

## Hands-On: Multi-Shard Kinesis Stream (20 min)

You'll create a Kinesis stream with multiple shards, send data, and observe partitioning behavior.

### Step 1: Create Multi-Shard Stream

Create `kinesis_multi_shard.py`:

```python
import boto3
import json
from datetime import datetime
import time
import hashlib

kinesis = boto3.client('kinesis', region_name='us-east-1')

def create_multi_shard_stream(stream_name, shard_count):
    """Create a Kinesis stream with multiple shards"""
    try:
        kinesis.create_stream(StreamName=stream_name, ShardCount=shard_count)
        print(f"Creating stream '{stream_name}' with {shard_count} shards...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)
        print("✓ Stream is ACTIVE\n")
    except kinesis.exceptions.ResourceInUseException:
        print(f"✓ Stream '{stream_name}' already exists\n")

def get_shard_info(stream_name):
    """Display shard structure"""
    response = kinesis.describe_stream(StreamName=stream_name)
    stream = response['StreamDescription']

    print(f"Stream: {stream_name}")
    print(f"  Status: {stream['StreamStatus']}")
    print(f"  Retention: {stream['RetentionPeriodHours']} hours")
    print(f"  Shards: {len(stream['Shards'])}\n")

    for i, shard in enumerate(stream['Shards']):
        print(f"  Shard {i}: {shard['ShardId']}")
        print(f"    Hash range: {shard['HashKeyRange']['StartingHashKey'][:10]}... to "
              f"{shard['HashKeyRange']['EndingHashKey'][:10]}...")
    print()

def send_events_to_shards(stream_name, num_events=30):
    """Send events and observe which shard they go to"""
    print(f"Sending {num_events} events...\n")

    # Track which shard each user goes to
    user_to_shard = {}

    users = ['alice', 'bob', 'charlie', 'diana', 'eve']

    for i in range(num_events):
        user = users[i % len(users)]

        event = {
            'eventId': i,
            'userId': user,
            'action': ['login', 'view_page', 'click', 'logout'][i % 4],
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        response = kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(event),
            PartitionKey=user  # All events for same user go to same shard
        )

        shard_id = response['ShardId']
        sequence = response['SequenceNumber']

        # Track user-to-shard mapping
        if user not in user_to_shard:
            user_to_shard[user] = shard_id

        print(f"  Event {i:3d}: user={user:8s} → {shard_id} (seq: {sequence[:10]}...)")
        time.sleep(0.1)

    print("\nUser-to-Shard mapping:")
    for user, shard_id in sorted(user_to_shard.items()):
        print(f"  {user:8s} → {shard_id}")

    print("\n✓ Notice: Same user always goes to same shard!")

def main():
    stream_name = 'iot-sensor-data'

    # Create stream with 4 shards
    create_multi_shard_stream(stream_name, shard_count=4)

    # Show shard structure
    get_shard_info(stream_name)

    # Send events
    send_events_to_shards(stream_name, num_events=30)

if __name__ == '__main__':
    main()
```

### Step 2: Read from Multiple Shards

Create `kinesis_read_shards.py`:

```python
import boto3
import json
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def read_from_shard(stream_name, shard_id, max_records=50):
    """Read events from a specific shard"""
    print(f"\n{'='*60}")
    print(f"Reading from: {shard_id}")
    print('='*60)

    # Get shard iterator
    response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'  # Read from beginning
    )
    shard_iterator = response['ShardIterator']

    records_read = 0
    user_counts = {}

    while shard_iterator and records_read < max_records:
        response = kinesis.get_records(ShardIterator=shard_iterator, Limit=25)

        for record in response['Records']:
            data = json.loads(record['Data'])
            user_id = data['userId']
            action = data['action']
            sequence = record['SequenceNumber']

            # Count events per user
            user_counts[user_id] = user_counts.get(user_id, 0) + 1

            print(f"  Offset {sequence[:10]}... | {user_id:8s} | {action}")
            records_read += 1

        shard_iterator = response.get('NextShardIterator')

        if not response['Records']:
            break

    print(f"\nSummary for {shard_id}:")
    print(f"  Total events: {records_read}")
    print(f"  Users in this shard: {list(user_counts.keys())}")
    for user, count in sorted(user_counts.items()):
        print(f"    {user}: {count} events")

def read_all_shards(stream_name):
    """Read from all shards in parallel (conceptually)"""
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    print(f"Stream '{stream_name}' has {len(shards)} shards")

    for shard in shards:
        read_from_shard(stream_name, shard['ShardId'])
        time.sleep(1)

def main():
    stream_name = 'iot-sensor-data'
    read_all_shards(stream_name)

if __name__ == '__main__':
    main()
```

### Step 3: Run and Observe

**Terminal 1 - Write data**:
```bash
python kinesis_multi_shard.py
```

Observe:
- Stream created with 4 shards
- Hash key ranges for each shard
- Same user always routes to same shard

**Terminal 2 - Read data**:
```bash
python kinesis_read_shards.py
```

Observe:
- Each shard contains events for specific users
- Users are distributed across shards
- Within each shard, user's events are ordered

### Step 4: Experiment with Replay

Add this function to `kinesis_read_shards.py`:

```python
def replay_from_offset(stream_name, shard_id, starting_sequence_number):
    """Replay events starting from a specific offset"""
    print(f"\nReplaying from offset {starting_sequence_number[:20]}...")

    response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='AT_SEQUENCE_NUMBER',
        StartingSequenceNumber=starting_sequence_number
    )
    shard_iterator = response['ShardIterator']

    response = kinesis.get_records(ShardIterator=shard_iterator, Limit=10)

    for record in response['Records']:
        data = json.loads(record['Data'])
        print(f"  Replayed: {data['userId']} - {data['action']}")
```

Run it with a sequence number from the previous output. See how you can "time travel" to any point in the log!

### Step 5: Compare with SQS

Create an SQS queue and try to:
1. Read a message
2. Read it again

You can't! SQS deletes messages after consumption (or hides them). This demonstrates the fundamental difference.

### Cleanup

```bash
aws kinesis delete-stream --stream-name iot-sensor-data
```

## Checkpoint (5 min)

### Question 1: Log-Based Advantage

What is the PRIMARY advantage of log-based brokers over traditional brokers?

A) Faster message delivery
B) Messages can be read multiple times and by multiple consumers
C) Better security
D) Easier to set up

<details>
<summary>Answer</summary>

**B) Messages can be read multiple times and by multiple consumers**

The key innovation is treating messages as durable data in a log, not ephemeral tasks to be deleted. This enables replay, multiple consumers, and new use cases.
</details>

### Question 2: Partition Purpose

Why do Kafka and Kinesis partition their logs?

A) To reduce storage costs
B) To enable parallel processing and scalability
C) To improve security
D) To compress data better

<details>
<summary>Answer</summary>

**B) To enable parallel processing and scalability**

Partitions allow:
- Multiple consumers to read different partitions in parallel
- Horizontal scaling (add more partitions for more throughput)
- Ordering within each partition

Without partitions, you'd have a single sequential log that only one consumer could read efficiently.
</details>

### Question 3: Offset vs Acknowledgment

How does offset-based consumption differ from per-message acknowledgments?

<details>
<summary>Answer</summary>

**Offset-based (Kafka/Kinesis)**:
- Consumer tracks position in log (offset)
- Commits offset periodically (e.g., every 100 messages)
- "I've processed everything up to offset X"
- Much simpler bookkeeping
- Enables replay (reset offset)

**Per-message ACK (SQS/RabbitMQ)**:
- Each message acknowledged individually
- Broker tracks which messages acked
- More complex state management
- Can't replay (messages deleted after ACK)

**Trade-off**: Offset-based is simpler and enables replay, but coarser-grained (can't acknowledge individual messages within a batch).
</details>

## Summary

You've completed Module 6! You should now understand:

✓ Log-based messaging fundamentals
✓ How partitioned logs differ from traditional brokers
✓ Why sequential disk I/O is fast
✓ Partitioning for scalability and ordering
✓ Offset-based consumption
✓ When to use each type of broker

**Next modules**:
- **M7: Partitions & Ordering** - Deep dive into partition keys and ordering
- **M8: Load Balancing vs Fan-out** - Consumer patterns
- **M9: Change Data Capture** - Using logs for database integration

**Where to learn more**:
- DDIA Chapter 11, "Partitioned Logs" section
- `references/stream-processing-concepts.md` - "Log-based Message Brokers"
