# Module 12: Stream Processing Patterns

**Duration**: 45 minutes
**Prerequisites**: M7 (Partitions & Ordering), M11 (State & Immutability)
**Chapter Reading**: "Uses of Stream Processing" section

## Learning Goals

By the end of this module, you will be able to:
1. Differentiate stateless vs stateful stream processing
2. Identify common stream processing operations
3. Know when to use stream vs batch processing
4. Build a Lambda stream processor with filtering and transformation

## Core Concepts (10 min)

### Stateless Processing

**Stateless** operations process each event independently without remembering previous events.

**Examples**:
- **Filtering**: Keep events matching criteria
- **Mapping/Transformation**: Convert event format
- **Parsing**: Extract fields from raw data
- **Enrichment**: Add static reference data
- **Routing**: Send to different destinations based on content

**Characteristics**:
- No memory between events
- Easy to parallelize
- Scales horizontally trivially
- Can process events in any order

**Example - Filtering**:
```python
def process_event(event):
    if event['amount'] > 1000:
        send_to_fraud_detection(event)
```

### Stateful Processing

**Stateful** operations maintain state across multiple events.

**Examples**:
- **Aggregation**: Count, sum, average over time
- **Windowing**: Group events by time periods
- **Joining**: Combine related events
- **Pattern detection**: Detect sequences (login → failed login → failed login = suspicious)
- **Session tracking**: Group events by session

**Characteristics**:
- Requires memory/state
- More complex to parallelize
- Must handle failures (state recovery)
- Order may matter

**Example - Aggregation**:
```python
# Stateful: maintains count
count = 0
def process_event(event):
    global count
    count += 1
    if count % 100 == 0:
        print(f"Processed {count} events")
```

### Common Processing Patterns

**1. Filter**:
```python
# Keep only high-value transactions
if event['amount'] > 1000:
    output(event)
```

**2. Map/Transform**:
```python
# Convert to different format
output({
    'user': event['userId'],
    'action': event['type'],
    'time': event['timestamp']
})
```

**3. Enrichment**:
```python
# Add user info from database
user_info = database.get(event['userId'])
event['userName'] = user_info['name']
event['userTier'] = user_info['tier']
output(event)
```

**4. Aggregation**:
```python
# Count events per user (stateful)
counts[event['userId']] += 1
```

**5. Split/Branch**:
```python
# Route to different streams
if event['type'] == 'order':
    order_stream.put(event)
elif event['type'] == 'payment':
    payment_stream.put(event)
```

### Stream vs Batch Processing

| Aspect | Stream Processing | Batch Processing |
|--------|------------------|------------------|
| Data | Unbounded (continuous) | Bounded (finite) |
| Latency | Low (seconds) | High (minutes to hours) |
| Results | Continuous | Periodic |
| State | Must manage carefully | Easier (disk-based) |
| Use case | Real-time dashboards | Historical reports |
| Throughput | Good | Excellent |
| Complexity | Higher | Lower |

**When to use streams**:
- Need low latency results
- Data arrives continuously
- Real-time monitoring/alerts
- Fraud detection
- Recommendations

**When to use batch**:
- Historical analysis
- Complex multi-pass algorithms
- Eventual consistency acceptable
- Cheaper (run periodically)

**Lambda Architecture**: Use both!
- Stream: Fast, approximate results
- Batch: Slow, accurate results
- Merge in serving layer

### Stream Processing Operations

**Stateless operations scale easily**:
```
Event stream → [Processor 1] → Output
             → [Processor 2] → Output
             → [Processor 3] → Output

Each processor independent, can scale to thousands
```

**Stateful operations require coordination**:
```
Event stream (partitioned by key)
    Partition 0 → [Processor 1 + State 1]
    Partition 1 → [Processor 2 + State 2]
    Partition 2 → [Processor 3 + State 3]

State must be partitioned by same key as stream
```

## Discussion Questions (10 min)

### Question 1: Stateless vs Stateful

Classify these operations as stateless or stateful:

A) Convert JSON events to CSV format
B) Count page views per hour
C) Filter events where amount > 100
D) Detect pattern: 3 failed logins in a row
E) Add user's country from DynamoDB lookup
F) Calculate running average

<details>
<summary>Expand for discussion</summary>

**Stateless** (no memory between events):
- **A) JSON to CSV** - Just format conversion
- **C) Filter** - Independent decision per event
- **E) DynamoDB lookup** - Lookup is stateless (DynamoDB holds state, processor doesn't)

**Stateful** (maintains state):
- **B) Count per hour** - Must remember counts
- **D) Pattern detection** - Must remember previous logins
- **F) Running average** - Must remember sum and count

**Key distinction**: Does processing one event require information from previous events?
</details>

### Question 2: Stream vs Batch

For each use case, choose stream processing, batch processing, or both:

A) **Fraud detection** - Block suspicious transactions in real-time
B) **Monthly sales report** - Total sales by product for the month
C) **Real-time dashboard** - Current active users
D) **ML model training** - Train on last 90 days of data
E) **Recommendation system** - Show recommendations based on recent behavior
F) **Data warehouse ETL** - Load daily data into warehouse

<details>
<summary>Expand for discussion</summary>

**Stream processing**:
- **A) Fraud detection** - Must be real-time to block transactions
- **C) Real-time dashboard** - "Real-time" is in the name!
- **E) Recommendations** - Recent behavior = stream processing

**Batch processing**:
- **B) Monthly report** - Monthly = batch, historical data
- **D) ML training** - Large dataset, doesn't need real-time
- **F) Data warehouse** - Daily load = batch job

**Both (Lambda architecture)**:
- **E) Recommendations** could use:
  - Stream: Recent behavior (last hour)
  - Batch: Long-term preferences (last 90 days)
  - Combine: Weight recent activity higher

**Key factors**:
- Latency requirement (real-time = stream, periodic = batch)
- Data completeness (all data = batch, recent data = stream)
- Complexity (simple = stream, complex = batch)
</details>

### Question 3: Scaling Stateful Processing

You have a stream processor that counts events per user (stateful). You have 1 million users and 10,000 events/second.

**Current setup**: 1 processor, 1 shard
- Processing 10,000 events/sec
- Maintaining state for 1M users
- Memory usage: 10GB

You need to scale to 50,000 events/sec. What do you do?

<details>
<summary>Expand for discussion</summary>

**Challenge**: Can't just add more processors - state is tied to data!

**Solution: Partition the stream AND the state**:

```
5 shards (partition by userId):
  Shard 0 → Processor 0 (200k users, 2GB state)
  Shard 1 → Processor 1 (200k users, 2GB state)
  Shard 2 → Processor 2 (200k users, 2GB state)
  Shard 3 → Processor 3 (200k users, 2GB state)
  Shard 4 → Processor 4 (200k users, 2GB state)
```

**Key insights**:
1. **Partition by entity** (userId) - All events for a user go to same processor
2. **Co-locate state** - Processor maintains state only for its users
3. **Scale together** - More shards = more processors = distributed state

**Steps**:
1. Increase Kinesis shards to 5 (or 10 for headroom)
2. Deploy 5 Lambda functions (or increase concurrency)
3. Each Lambda reads different shards
4. Each Lambda maintains state for its subset of users

**Trade-off**: Can't scale beyond number of distinct entities (users in this case). If 1M users across 10 shards = 100k users/shard. That's the granularity.
</details>

## Hands-On: Lambda Stream Processor (20 min)

You'll build a Lambda function that processes Kinesis events with filtering, transformation, and enrichment.

### Step 1: Create Stream and Reference Data

Create `setup_processor_demo.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def setup_stream():
    """Create Kinesis stream"""
    try:
        kinesis.create_stream(StreamName='transaction-stream', ShardCount=1)
        print("Creating stream...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName='transaction-stream')
    except kinesis.exceptions.ResourceInUseException:
        pass
    print("✓ Stream ready\n")

def setup_reference_data():
    """Create DynamoDB table with user reference data"""
    try:
        dynamodb.create_table(
            TableName='user-info',
            AttributeDefinitions=[
                {'AttributeName': 'userId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'userId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Creating reference data table...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName='user-info')
    except dynamodb.exceptions.ResourceInUseException:
        pass

    # Populate with user data
    users = [
        {'userId': 'alice', 'name': 'Alice Smith', 'tier': 'gold', 'country': 'US'},
        {'userId': 'bob', 'name': 'Bob Jones', 'tier': 'silver', 'country': 'CA'},
        {'userId': 'charlie', 'name': 'Charlie Brown', 'tier': 'bronze', 'country': 'UK'},
    ]

    for user in users:
        dynamodb.put_item(
            TableName='user-info',
            Item={
                'userId': {'S': user['userId']},
                'name': {'S': user['name']},
                'tier': {'S': user['tier']},
                'country': {'S': user['country']}
            }
        )

    print("✓ Reference data loaded\n")

def send_transactions():
    """Send transaction events"""
    print("Sending transactions...\n")

    transactions = [
        {'userId': 'alice', 'amount': 50.00, 'merchant': 'Amazon'},
        {'userId': 'bob', 'amount': 1500.00, 'merchant': 'BestBuy'},  # High value
        {'userId': 'charlie', 'amount': 25.00, 'merchant': 'Starbucks'},
        {'userId': 'alice', 'amount': 2000.00, 'merchant': 'Apple'},  # High value
        {'userId': 'bob', 'amount': 15.00, 'merchant': 'Netflix'},
        {'userId': 'alice', 'amount': 3500.00, 'merchant': 'Tesla'},  # Very high value
    ]

    for txn in transactions:
        txn['transactionId'] = f"txn_{int(time.time()*1000)}"
        txn['timestamp'] = datetime.utcnow().isoformat() + 'Z'

        kinesis.put_record(
            StreamName='transaction-stream',
            Data=json.dumps(txn),
            PartitionKey=txn['userId']
        )

        print(f"  {txn['userId']:8s} | ${txn['amount']:8.2f} | {txn['merchant']}")
        time.sleep(0.5)

    print("\n✓ Transactions sent\n")

def main():
    setup_stream()
    setup_reference_data()
    send_transactions()

if __name__ == '__main__':
    main()
```

### Step 2: Create Stream Processor

Create `stream_processor.py`:

```python
import boto3
import json
from datetime import datetime

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

class StreamProcessor:
    """Multi-stage stream processor"""
    def __init__(self):
        self.stats = {
            'total_processed': 0,
            'filtered_out': 0,
            'high_value': 0,
            'enriched': 0
        }

    def process_stream(self, stream_name):
        """Process events from stream"""
        print("Starting stream processor...\n")

        # Get shard
        response = kinesis.describe_stream(StreamName=stream_name)
        shards = response['StreamDescription']['Shards']

        for shard in shards:
            self.process_shard(stream_name, shard['ShardId'])

        self.print_stats()

    def process_shard(self, stream_name, shard_id):
        """Process single shard"""
        # Get iterator
        iterator_response = kinesis.get_shard_iterator(
            StreamName=stream_name,
            ShardId=shard_id,
            ShardIteratorType='TRIM_HORIZON'
        )
        shard_iterator = iterator_response['ShardIterator']

        # Read and process
        while shard_iterator:
            records_response = kinesis.get_records(ShardIterator=shard_iterator)

            for record in records_response['Records']:
                event = json.loads(record['Data'])
                self.process_event(event)

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

    def process_event(self, event):
        """Multi-stage processing pipeline"""
        self.stats['total_processed'] += 1

        print(f"\nProcessing transaction {event['transactionId']}:")
        print(f"  Input: {event['userId']} | ${event['amount']:.2f} | {event['merchant']}")

        # Stage 1: Filter (stateless)
        if not self.filter_event(event):
            self.stats['filtered_out'] += 1
            print(f"  ✗ Filtered out (amount too low)")
            return

        # Stage 2: Transform (stateless)
        transformed = self.transform_event(event)

        # Stage 3: Enrich (stateless with external lookup)
        enriched = self.enrich_event(transformed)
        self.stats['enriched'] += 1

        # Stage 4: Classify (stateless)
        classification = self.classify_event(enriched)

        # Output
        print(f"  ✓ Processed: Tier={enriched.get('userTier')}, "
              f"Country={enriched.get('userCountry')}, "
              f"Risk={classification}")

    def filter_event(self, event):
        """Stage 1: Filter low-value transactions (stateless)"""
        return event['amount'] >= 100.00

    def transform_event(self, event):
        """Stage 2: Transform to standard format (stateless)"""
        return {
            'id': event['transactionId'],
            'user': event['userId'],
            'amount_usd': event['amount'],
            'merchant': event['merchant'],
            'timestamp': event['timestamp'],
            'processed_at': datetime.utcnow().isoformat() + 'Z'
        }

    def enrich_event(self, event):
        """Stage 3: Enrich with user data (stateless, external lookup)"""
        try:
            response = dynamodb.get_item(
                TableName='user-info',
                Key={'userId': {'S': event['user']}}
            )

            if 'Item' in response:
                item = response['Item']
                event['userName'] = item['name']['S']
                event['userTier'] = item['tier']['S']
                event['userCountry'] = item['country']['S']

        except Exception as e:
            print(f"  ⚠ Enrichment failed: {e}")

        return event

    def classify_event(self, event):
        """Stage 4: Classify transaction risk (stateless)"""
        amount = event['amount_usd']

        if amount > 3000:
            self.stats['high_value'] += 1
            return 'HIGH_RISK'
        elif amount > 1000:
            return 'MEDIUM_RISK'
        else:
            return 'LOW_RISK'

    def print_stats(self):
        """Print processing statistics"""
        print("\n" + "="*60)
        print("Stream Processing Statistics")
        print("="*60)
        print(f"Total processed: {self.stats['total_processed']}")
        print(f"Filtered out: {self.stats['filtered_out']}")
        print(f"Enriched: {self.stats['enriched']}")
        print(f"High value flagged: {self.stats['high_value']}")
        print("="*60)

def main():
    processor = StreamProcessor()
    processor.process_stream('transaction-stream')

if __name__ == '__main__':
    main()
```

### Step 3: Run the Demo

**Terminal 1 - Send transactions**:
```bash
python setup_processor_demo.py
```

**Terminal 2 - Process stream**:
```bash
python stream_processor.py
```

**Observe**:
- Multi-stage pipeline (filter → transform → enrich → classify)
- All operations are stateless
- Events flow through pipeline
- Statistics tracked

### Step 4: Add Stateful Processing

Add this to `stream_processor.py`:

```python
class StatefulProcessor(StreamProcessor):
    """Processor with stateful aggregation"""
    def __init__(self):
        super().__init__()
        self.user_totals = {}  # State: total spent per user

    def process_event(self, event):
        """Process with stateful aggregation"""
        super().process_event(event)

        # Stateful: track total per user
        user = event['userId']
        if user not in self.user_totals:
            self.user_totals[user] = 0

        self.user_totals[user] += event['amount']

        print(f"  Running total for {user}: ${self.user_totals[user]:.2f}")

    def print_stats(self):
        """Print stats including user totals"""
        super().print_stats()
        print("\nUser Spending Totals (stateful):")
        for user, total in sorted(self.user_totals.items()):
            print(f"  {user}: ${total:.2f}")

# In main():
processor = StatefulProcessor()
```

Run again - now tracks running totals per user!

### Cleanup

```bash
aws kinesis delete-stream --stream-name transaction-stream
aws dynamodb delete-table --table-name user-info
```

## Checkpoint (5 min)

### Question 1: Stateless vs Stateful

Why is stateless processing easier to scale than stateful?

<details>
<summary>Answer</summary>

**Stateless processing**:
- Each event processed independently
- No memory between events
- Can add processors trivially (just duplicate)
- Events can go to any processor
- No state to recover on failure

**Stateful processing**:
- Must maintain state across events
- State must be partitioned with data
- Can't just duplicate processors (state would be inconsistent)
- Must handle state recovery on failure
- Limited by partitioning granularity

**Key difference**: Stateless = no coordination needed. Stateful = must coordinate state with data partitioning.
</details>

### Question 2: Stream Processing Use Cases

Which of these is a good use case for stream processing?

A) Generate annual report from all historical data
B) Alert when user login fails 3 times in 5 minutes
C) Train ML model on 5 years of data
D) Update search index when product changes

<details>
<summary>Answer</summary>

**Good for streaming**:
- **B) Alert on failed logins** - Real-time pattern detection
- **D) Update search index** - Real-time derived data

**Not good for streaming**:
- **A) Annual report** - Historical batch processing
- **C) ML training** - Large dataset batch processing

**Pattern**: Streaming for real-time, recent data. Batch for historical, complete data.
</details>

### Question 3: Processing Pipeline

What's the benefit of breaking stream processing into stages (filter → transform → enrich → classify)?

<details>
<summary>Answer</summary>

**Benefits**:

1. **Modularity**: Each stage has clear responsibility
2. **Testing**: Test stages independently
3. **Optimization**: Optimize expensive stages separately
4. **Filtering early**: Reduce work on filtered-out events
5. **Reusability**: Share stages across pipelines
6. **Monitoring**: Track metrics per stage

**Example**:
```
100 events → Filter (keep 20) → Transform (20) → Enrich (20) → Classify (20)
```

Without filter first:
```
100 events → Transform (100) → Enrich (100) → Filter (keep 20) → Classify (20)
```

Wasted 80% of transform and enrich work!

**Best practice**: Filter early, do expensive operations (enrichment, external calls) on filtered data.
</details>

## Summary

You've completed Module 12! You should now understand:

✓ Stateless vs stateful stream processing
✓ Common processing patterns (filter, map, enrich, aggregate)
✓ When to use stream vs batch processing
✓ Building multi-stage processing pipelines
✓ Scaling stateless and stateful processors
✓ Lambda as a stream processor

**Next modules**:
- **M13: Time in Streams** - Event time vs processing time, windowing
- **M14: Stream Joins** - Combining multiple streams
- **M15: Fault Tolerance** - Exactly-once processing, checkpointing

**Where to learn more**:
- DDIA Chapter 11, "Uses of Stream Processing" section
- `references/stream-processing-concepts.md` - "Stream Processing Operations"
