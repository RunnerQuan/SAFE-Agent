# Module 2: Producers & Consumers

**Duration**: 45 minutes
**Prerequisites**: M1 (What Are Streams?)
**Chapter Reading**: "Transmitting Event Streams" section (lines 20-37)

## Learning Goals

By the end of this module, you will be able to:
1. Understand the producer/consumer architecture
2. Explain topics and streams as logical groupings
3. Identify when polling is inefficient vs streaming
4. Build producer and consumer applications

## Core Concepts (10 min)

### Producer (Publisher/Sender)

A **producer** is any component that generates events and writes them to a stream.

**Characteristics**:
- Writes events to specific topics/streams
- May write synchronously (wait for confirmation) or asynchronously (fire-and-forget)
- Usually doesn't know who will consume the events
- Can be any application: web server, mobile app, IoT device, database

**Example producers**:
- Web server logging user clicks
- IoT sensor sending temperature readings
- Mobile app reporting user actions
- Database sending change events

### Consumer (Subscriber/Recipient)

A **consumer** is any component that reads events from a stream and processes them.

**Characteristics**:
- Subscribes to specific topics/streams
- Processes events as they arrive
- Multiple consumers can read the same stream independently
- Can maintain state across events or process statelessly

**Example consumers**:
- Analytics service computing metrics
- Search indexer updating search results
- Notification service sending alerts
- Dashboard updating real-time displays

### Topics / Streams

A **topic** (or **stream**) is a logical grouping of related events.

**Purpose**:
- Organize events by type or category
- Allow consumers to subscribe to specific event types
- Enable multiple producers to write to the same topic
- Similar to how a filename groups records in batch processing

**Examples**:
- `user-activity` - all user interactions
- `orders` - order lifecycle events
- `sensor-readings` - IoT device data
- `page-views` - website traffic

### Push vs Pull

**Pull (Polling)**:
```
Consumer: "Do you have events?" → Stream: "No"
Consumer: "Do you have events?" → Stream: "No"
Consumer: "Do you have events?" → Stream: "Yes, here's 3"
```

Problems with polling:
- Wastes resources checking when no new data
- Adds latency (must wait for next poll)
- Hard to tune polling interval (too fast = waste, too slow = delay)

**Push (Streaming)**:
```
Stream → Consumer: "Here's an event"
Stream → Consumer: "Here's another event"
Stream → Consumer: "Here's another event"
```

Benefits:
- Lower latency (events delivered immediately)
- More efficient (no empty polls)
- Simplifies consumer code

### Decoupling

Streams decouple producers from consumers:

**Producers don't need to know**:
- Who is consuming the events
- How many consumers there are
- What consumers do with the events
- If consumers are online or offline

**Consumers don't need to know**:
- Who produced the events
- How many producers there are
- When events were produced (can process at own pace)

This allows independent scaling and development of producers and consumers.

## Discussion Questions (10 min)

### Question 1: Multiple Producers

Imagine you're building a food delivery app. You have:
- Mobile app (customers placing orders)
- Restaurant dashboard (restaurants updating order status)
- Delivery driver app (drivers updating delivery status)

Should these all write to the same `orders` stream or separate streams? What are the trade-offs?

<details>
<summary>Think about it, then expand for discussion points</summary>

**Option A - Single stream**:
- All order-related events in one place
- Easy to see complete order lifecycle
- But: mixed event types, need to filter

**Option B - Separate streams**:
- `order-created` (from customer app)
- `order-status-changed` (from restaurant)
- `delivery-status-changed` (from driver)
- Clearer separation of concerns
- But: harder to see complete order flow

**Option C - Hybrid**:
- All write to `orders` stream with event types
- Consumers can filter by event type if needed
- Best of both worlds

**The right answer depends on**: How will consumers use the data? If most consumers need the full order lifecycle, single stream is better. If consumers specialize (restaurant dashboard only cares about restaurant events), separate streams might be clearer.
</details>

### Question 2: Consumer Lag

A consumer processes 100 events/second. The producer starts sending 150 events/second. What happens over time?

<details>
<summary>Expand for discussion</summary>

**The consumer falls behind** (consumer lag):
- Gap between "latest event" and "event being processed" grows
- After 1 minute: 50 events/sec × 60 sec = 3,000 events behind
- After 1 hour: 180,000 events behind
- Eventually: Out of memory, crashes, or can't catch up

**Solutions**:
1. **Scale consumers** - Add more consumer instances (parallel processing)
2. **Optimize consumer** - Make processing faster
3. **Backpressure** - Slow down producer (not always possible)
4. **Priorities** - Process important events first, drop less important ones

This is why monitoring consumer lag is critical in streaming systems!
</details>

### Question 3: Topic Design

You're building a social media platform. Which topic structure is better?

**Option A - One big topic**:
- `all-events` containing: posts, likes, comments, follows, messages, etc.

**Option B - Topic per event type**:
- `posts`, `likes`, `comments`, `follows`, `messages`

**Option C - Topic per domain**:
- `user-activity` (posts, likes, comments)
- `social-graph` (follows, unfollows)
- `messaging` (messages, notifications)

<details>
<summary>Expand for discussion</summary>

**Option A (one topic)**:
- Simple to start
- But: Consumers must filter unwanted events
- High traffic on single topic
- Hard to scale (one topic = limited partitions)

**Option B (per event type)**:
- Clear separation
- But: Many topics to manage
- Hard to see related events together
- Consumer needs to subscribe to many topics

**Option C (per domain)**:
- Balance between A and B
- Related events together
- Clear boundaries
- Easier to scale (distribute load across topics)

**Best practice**: Start with domains (Option C), split further if topics get too large.
</details>

## Hands-On: Build Producer & Consumer (20 min)

You'll build robust producer and consumer programs with error handling and monitoring.

### Step 1: Enhanced Producer

Create `enhanced_producer.py`:

```python
import boto3
import json
from datetime import datetime
import time
import random

kinesis = boto3.client('kinesis', region_name='us-east-1')

class EventProducer:
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.events_sent = 0
        self.bytes_sent = 0

    def ensure_stream_exists(self, shard_count=2):
        """Create stream if it doesn't exist"""
        try:
            kinesis.create_stream(
                StreamName=self.stream_name,
                ShardCount=shard_count
            )
            print(f"Creating stream '{self.stream_name}'...")
            waiter = kinesis.get_waiter('stream_exists')
            waiter.wait(StreamName=self.stream_name)
            print(f"✓ Stream is ready\n")
        except kinesis.exceptions.ResourceInUseException:
            print(f"✓ Stream '{self.stream_name}' exists\n")

    def send_event(self, event_data, partition_key):
        """Send a single event with error handling"""
        try:
            data = json.dumps(event_data)
            response = kinesis.put_record(
                StreamName=self.stream_name,
                Data=data,
                PartitionKey=partition_key
            )

            self.events_sent += 1
            self.bytes_sent += len(data)

            return {
                'success': True,
                'shard_id': response['ShardId'],
                'sequence_number': response['SequenceNumber']
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def send_batch(self, events, partition_key_fn):
        """Send multiple events efficiently"""
        print(f"Sending {len(events)} events...")

        for i, event in enumerate(events, 1):
            partition_key = partition_key_fn(event)
            result = self.send_event(event, partition_key)

            if result['success']:
                print(f"  {i}/{len(events)} ✓ {event.get('type', 'event')}")
            else:
                print(f"  {i}/{len(events)} ✗ Error: {result['error']}")

            time.sleep(0.1)  # Avoid throttling

        print(f"\nStats: {self.events_sent} events, {self.bytes_sent} bytes sent\n")

    def get_stats(self):
        """Get stream statistics"""
        response = kinesis.describe_stream(StreamName=self.stream_name)
        stream_desc = response['StreamDescription']

        return {
            'status': stream_desc['StreamStatus'],
            'shards': len(stream_desc['Shards']),
            'retention_hours': stream_desc['RetentionPeriodHours']
        }

def generate_sample_events():
    """Generate realistic user activity events"""
    users = ['alice', 'bob', 'charlie', 'diana']
    actions = ['login', 'view_page', 'search', 'click_button', 'add_to_cart', 'logout']

    events = []
    for _ in range(10):
        user = random.choice(users)
        action = random.choice(actions)
        events.append({
            'userId': user,
            'type': action,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'sessionId': f"session-{random.randint(1000, 9999)}"
        })

    return events

def main():
    stream_name = 'user-activity'

    # Create producer
    producer = EventProducer(stream_name)
    producer.ensure_stream_exists(shard_count=2)

    # Send events (partition by user ID for per-user ordering)
    events = generate_sample_events()
    producer.send_batch(events, partition_key_fn=lambda e: e['userId'])

    # Show stats
    stats = producer.get_stats()
    print(f"Stream: {stream_name}")
    print(f"  Status: {stats['status']}")
    print(f"  Shards: {stats['shards']}")
    print(f"  Retention: {stats['retention_hours']} hours")

if __name__ == '__main__':
    main()
```

### Step 2: Run Producer

```bash
python enhanced_producer.py
```

Observe:
- Stream creation/verification
- Events being sent with confirmation
- Stats tracking

### Step 3: Enhanced Consumer

Create `enhanced_consumer.py`:

```python
import boto3
import json
import time
from datetime import datetime

kinesis = boto3.client('kinesis', region_name='us-east-1')

class EventConsumer:
    def __init__(self, stream_name, shard_id):
        self.stream_name = stream_name
        self.shard_id = shard_id
        self.events_processed = 0
        self.bytes_processed = 0
        self.start_time = datetime.now()

    def get_shard_iterator(self, iterator_type='TRIM_HORIZON'):
        """Get iterator for reading from shard"""
        response = kinesis.get_shard_iterator(
            StreamName=self.stream_name,
            ShardId=self.shard_id,
            ShardIteratorType=iterator_type
        )
        return response['ShardIterator']

    def process_event(self, event):
        """Process a single event (override for custom logic)"""
        # This is where your business logic goes
        print(f"  Processing: {event.get('type', 'event')} by {event.get('userId', 'unknown')}")
        return True

    def consume(self, max_events=None, max_seconds=None):
        """Consume events from the shard"""
        print(f"Starting consumer for {self.stream_name}/{self.shard_id}\n")

        shard_iterator = self.get_shard_iterator()
        events_read = 0

        while True:
            # Check stop conditions
            if max_events and events_read >= max_events:
                break
            if max_seconds and (datetime.now() - self.start_time).seconds >= max_seconds:
                break

            # Get records
            try:
                response = kinesis.get_records(
                    ShardIterator=shard_iterator,
                    Limit=100
                )
            except Exception as e:
                print(f"Error reading records: {e}")
                break

            # Process records
            for record in response['Records']:
                data = json.loads(record['Data'])
                sequence = record['SequenceNumber']
                timestamp = record['ApproximateArrivalTimestamp']

                self.process_event(data)

                self.events_processed += 1
                self.bytes_processed += len(record['Data'])
                events_read += 1

            # Get next iterator
            shard_iterator = response.get('NextShardIterator')
            if not shard_iterator:
                print("Reached end of shard")
                break

            # If no records, wait a bit
            if not response['Records']:
                time.sleep(1)

        self.print_stats()

    def print_stats(self):
        """Print consumption statistics"""
        duration = (datetime.now() - self.start_time).seconds
        throughput = self.events_processed / duration if duration > 0 else 0

        print(f"\n{'='*60}")
        print(f"Consumer Statistics")
        print(f"{'='*60}")
        print(f"Events processed: {self.events_processed}")
        print(f"Bytes processed: {self.bytes_processed}")
        print(f"Duration: {duration} seconds")
        print(f"Throughput: {throughput:.1f} events/second")
        print(f"{'='*60}")

def main():
    stream_name = 'user-activity'

    # Get list of shards
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    print(f"Stream '{stream_name}' has {len(shards)} shard(s)\n")

    # Consume from first shard
    if shards:
        consumer = EventConsumer(stream_name, shards[0]['ShardId'])
        consumer.consume(max_events=20)  # Read up to 20 events
    else:
        print("No shards found!")

if __name__ == '__main__':
    main()
```

### Step 4: Run Consumer

```bash
python enhanced_consumer.py
```

Observe:
- Events being read and processed
- Statistics on throughput
- Clean shutdown

### Step 5: Experiment

Try these modifications:

**1. Multiple producers** - Run producer multiple times in parallel:
```bash
python enhanced_producer.py &
python enhanced_producer.py &
python enhanced_producer.py &
```

Then run consumer - events from all producers appear in stream!

**2. Consumer filtering** - Modify `process_event` to filter:
```python
def process_event(self, event):
    # Only process 'add_to_cart' events
    if event.get('type') == 'add_to_cart':
        print(f"  🛒 Cart addition by {event.get('userId')}")
        return True
    return False
```

**3. Multiple consumers** - Run consumer in multiple terminals. Each sees the same events (unlike message queues).

### Cleanup

```bash
aws kinesis delete-stream --stream-name user-activity
```

## Checkpoint (5 min)

### Question 1: Producer/Consumer Relationship

Which statement is TRUE about producers and consumers?

A) A producer must wait for a consumer to be ready before sending events
B) A producer and consumer must be written in the same programming language
C) Multiple consumers can independently read the same events
D) A consumer must process events at the same rate the producer sends them

<details>
<summary>Answer</summary>

**C) Multiple consumers can independently read the same events**

Streams decouple producers and consumers completely. Producers don't know about consumers, and multiple consumers can read independently. They don't need to be in the same language or process at the same rate.
</details>

### Question 2: Topics

You have a stream with these events mixed together:
- User registrations
- Order placements
- Product reviews
- Password resets

Your analytics service only needs order data. What's the best approach?

A) Create separate topics for each event type
B) Keep one topic, consumer filters for order events
C) Producer should send orders to a different stream
D) Either A or C depending on traffic volume

<details>
<summary>Answer</summary>

**D) Either A or C depending on traffic volume**

Both approaches work:
- **Low traffic**: One topic with filtering (B) is simpler
- **High traffic**: Separate topics (A/C) is more efficient - consumer doesn't waste resources reading and filtering unwanted events

Best practice: Separate topics for different domains/event types if traffic is significant.
</details>

### Question 3: Push vs Pull

Why is push-based streaming more efficient than polling?

<details>
<summary>Answer</summary>

**Multiple reasons**:

1. **No wasted polls**: Don't check when there's no data
2. **Lower latency**: Events delivered immediately, not waiting for next poll
3. **Better resource usage**: Consumer isn't constantly making requests
4. **Simpler code**: Consumer just processes events as they arrive

Polling wastes resources checking "anything new?" when the answer is usually "no".
</details>

## Summary

You've completed Module 2! You should now understand:

✓ Producer and consumer architecture
✓ Topics/streams as logical groupings
✓ Push vs pull models
✓ Decoupling benefits
✓ How to build producers and consumers with error handling

**Next modules**: You can now proceed to:
- **M3: Backpressure & Durability** - What happens when consumers can't keep up
- **M4: Direct Messaging** - Alternative to broker-based messaging
- **M5: Message Brokers** - Traditional message queue systems

**Where to learn more**:
- DDIA Chapter 11, "Transmitting Event Streams"
- `references/stream-processing-concepts.md` - "Producer / Consumer" section
