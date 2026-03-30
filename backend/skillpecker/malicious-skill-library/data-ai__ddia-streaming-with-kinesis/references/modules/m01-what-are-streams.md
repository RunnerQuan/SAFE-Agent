# Module 1: What Are Streams?

**Duration**: 45 minutes
**Prerequisites**: None
**Chapter Reading**: Chapter 11 introduction (lines 0-19)

## Learning Goals

By the end of this module, you will be able to:
1. Explain the difference between bounded and unbounded data
2. Identify when streaming is appropriate vs batch processing
3. Define what an "event" is in stream processing

## Core Concepts (10 min)

### Unbounded Data

Traditional batch processing works with **bounded datasets** - data that has a definite beginning and end. You can load it all into memory or storage, process it completely, and produce results.

Stream processing works with **unbounded datasets** - data that never "ends". Events keep arriving continuously. You can't wait for "all the data" because there is no end.

**Examples of unbounded data**:
- User clickstreams on a website
- IoT sensor readings
- Financial transactions
- Log messages from servers
- Social media posts

### Events

An **event** is a small, self-contained, immutable record of something that happened at a particular time.

**Characteristics**:
- **Immutable**: Once created, never changes
- **Timestamped**: Records when it occurred
- **Small**: Typically a few KB
- **Self-contained**: Has all necessary information

**Example event** (user login):
```json
{
  "userId": "user123",
  "action": "login",
  "timestamp": "2024-01-21T10:00:00Z",
  "ipAddress": "192.168.1.1"
}
```

### Stream vs Batch

| Aspect | Batch | Stream |
|--------|-------|--------|
| **Data Type** | Bounded (finite) | Unbounded (infinite) |
| **Processing** | Complete dataset at once | Incremental, continuous |
| **Latency** | High (minutes to hours) | Low (seconds or less) |
| **When Results Available** | After all data processed | Continuously |
| **Use Case** | Historical analysis | Real-time responses |

**When to use streaming**:
- Results needed in real-time (seconds, not hours)
- Data naturally arrives continuously
- Want to react to events as they happen
- Building real-time dashboards, alerts, recommendations

**When to use batch**:
- Processing historical data
- Results don't need to be real-time
- Complex analytics requiring multiple passes over data
- Data already collected in large chunks

## Discussion Questions (10 min)

Think about these questions before continuing. Consider real-world systems you've worked with.

1. **Unbounded data**: Can you think of three examples from your own experience where data is truly unbounded? What makes them unbounded?

2. **Why not just batch?**: Imagine a fraud detection system. Why can't you just batch process transactions once per hour? What are the consequences?

3. **Event design**: If you were building a system to track user behavior in a mobile app, what fields would you include in each event? Why?

4. **Trade-offs**: What are the downsides of stream processing compared to batch? When would you choose batch even if streams are technically possible?

## Hands-On: Your First Stream (20 min)

Now you'll create your first Kinesis stream and send events to it.

### Step 1: Create Python Producer Script

Create a file called `kinesis_producer.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def create_stream(stream_name, shard_count=1):
    """Create a Kinesis stream"""
    try:
        kinesis.create_stream(
            StreamName=stream_name,
            ShardCount=shard_count
        )
        print(f"Creating stream '{stream_name}'...")

        # Wait for stream to become active
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)
        print(f"Stream '{stream_name}' is active!")
        return True
    except kinesis.exceptions.ResourceInUseException:
        print(f"Stream '{stream_name}' already exists")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def send_event(stream_name, event_data, partition_key):
    """Send an event to the stream"""
    response = kinesis.put_record(
        StreamName=stream_name,
        Data=json.dumps(event_data),
        PartitionKey=partition_key
    )
    return response

def main():
    stream_name = 'my-first-stream'

    # Create the stream
    if not create_stream(stream_name):
        return

    # Send some events
    print("\nSending events...")
    events = [
        {'userId': 'alice', 'action': 'login', 'timestamp': datetime.utcnow().isoformat() + 'Z'},
        {'userId': 'bob', 'action': 'view_page', 'page': '/home', 'timestamp': datetime.utcnow().isoformat() + 'Z'},
        {'userId': 'alice', 'action': 'click_button', 'button': 'search', 'timestamp': datetime.utcnow().isoformat() + 'Z'},
    ]

    for event in events:
        response = send_event(stream_name, event, partition_key=event['userId'])
        print(f"Sent: {event['action']} by {event['userId']} -> Shard: {response['ShardId']}")
        time.sleep(0.5)

    print(f"\nSent {len(events)} events to stream '{stream_name}'")
    print("\nStream info:")
    stream_info = kinesis.describe_stream(StreamName=stream_name)
    print(f"  Status: {stream_info['StreamDescription']['StreamStatus']}")
    print(f"  Shards: {len(stream_info['StreamDescription']['Shards'])}")
    print(f"  Retention: {stream_info['StreamDescription']['RetentionPeriodHours']} hours")

if __name__ == '__main__':
    main()
```

### Step 2: Run the Producer

```bash
python kinesis_producer.py
```

You should see output showing:
- Stream creation
- Events being sent
- Which shard each event went to

### Step 3: Create Python Consumer Script

Create `kinesis_consumer.py`:

```python
import boto3
import json
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')

def read_stream(stream_name, shard_id, limit=10):
    """Read events from a stream shard"""
    # Get a shard iterator (starting from the beginning)
    response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'  # Start from oldest record
    )

    shard_iterator = response['ShardIterator']

    print(f"Reading from {stream_name} / {shard_id}...\n")

    records_read = 0
    while records_read < limit and shard_iterator:
        # Get records
        response = kinesis.get_records(
            ShardIterator=shard_iterator,
            Limit=10
        )

        # Process records
        for record in response['Records']:
            data = json.loads(record['Data'])
            sequence = record['SequenceNumber']
            timestamp = record['ApproximateArrivalTimestamp']

            print(f"[{timestamp}] Seq: {sequence[:8]}...")
            print(f"  Event: {json.dumps(data, indent=2)}")
            print()
            records_read += 1

        # Get next iterator
        shard_iterator = response.get('NextShardIterator')

        if not response['Records']:
            break

        time.sleep(0.2)

    print(f"Read {records_read} records")

def main():
    stream_name = 'my-first-stream'

    # Get stream info
    stream_info = kinesis.describe_stream(StreamName=stream_name)
    shards = stream_info['StreamDescription']['Shards']

    print(f"Stream has {len(shards)} shard(s)\n")

    # Read from first shard
    if shards:
        read_stream(stream_name, shards[0]['ShardId'])

if __name__ == '__main__':
    main()
```

### Step 4: Run the Consumer

```bash
python kinesis_consumer.py
```

You should see the events you sent earlier!

### Step 5: Experiment

Try these modifications:
1. Send more events with the producer
2. Run the consumer again to see new events
3. Try sending events with different user IDs
4. Observe the sequence numbers - they increase monotonically

### Cleanup (optional)

```bash
aws kinesis delete-stream --stream-name my-first-stream
```

## Checkpoint (5 min)

Answer these questions to verify your understanding:

### Question 1: Bounded vs Unbounded

Which of the following are examples of unbounded data? (Select all that apply)
- [ ] A CSV file with 1 million customer records
- [ ] Temperature readings from a sensor every second
- [ ] User activity logs from a web application
- [ ] A database dump from last night
- [ ] Stock market tick data

<details>
<summary>Answer</summary>

**Correct answers**: Temperature readings, user activity logs, stock market tick data

These are unbounded because they continuously generate new data with no inherent end. The CSV file and database dump are bounded - they're fixed snapshots.
</details>

### Question 2: When to Stream

You're building a system to analyze customer purchase patterns. Which scenario requires stream processing?

A) Generate a monthly report of top-selling products
B) Send a "thanks for your purchase" email within 10 seconds of checkout
C) Calculate total revenue for the fiscal year
D) Export all purchase data to a data warehouse nightly

<details>
<summary>Answer</summary>

**B) Send email within 10 seconds**

This requires real-time response to events. The other scenarios are batch processing - they operate on historical data and don't need sub-minute latency.
</details>

### Question 3: Event Characteristics

You're designing events for an e-commerce order system. Which event design is better?

**Option A**:
```json
{
  "orderId": "order-123",
  "status": "shipped"
}
```

**Option B**:
```json
{
  "orderId": "order-123",
  "previousStatus": "paid",
  "newStatus": "shipped",
  "timestamp": "2024-01-21T15:30:00Z",
  "shippingCarrier": "FedEx",
  "trackingNumber": "1234567890"
}
```

<details>
<summary>Answer</summary>

**Option B is better**

Good events are self-contained and capture all relevant context:
- Timestamp records when it happened
- Previous status helps understand state transitions
- Shipping details may be needed by downstream consumers
- No need to query other systems to understand the event

Option A requires looking up order details elsewhere to be useful.
</details>

## Summary

You've completed Module 1! You should now understand:

✓ Unbounded vs bounded data
✓ What events are in stream processing
✓ When to use streaming vs batch
✓ How to create a Kinesis stream and send events
✓ How to read events from a stream

**Next modules**: You can now proceed to:
- **M2: Producers & Consumers** - Deep dive into producer/consumer patterns
- **M3: Backpressure & Durability** - Understanding flow control and reliability

**Where to learn more**:
- DDIA Chapter 11, introduction
- `references/stream-processing-concepts.md` - "Core Concepts" section
