# Module 15: Fault Tolerance

**Duration**: 45 minutes
**Prerequisites**: M13 (Time in Streams)
**Chapter Reading**: "Fault Tolerance" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand processing guarantees (at-most-once, at-least-once, exactly-once)
2. Explain idempotence and why it matters
3. Implement checkpointing for state recovery
4. Build idempotent stream processors with DynamoDB deduplication

## Core Concepts (10 min)

### Processing Guarantees

When a stream processor crashes and restarts, what happens to events?

**At-Most-Once**:
- Each event processed **zero or one time**
- May lose events on failure
- Simplest to implement

```
Process event → Commit offset → Crash ✓ (event processed)
Process event → Crash before commit ✗ (event lost)
```

**At-Least-Once**:
- Each event processed **one or more times**
- May duplicate processing on failure
- Most common approach

```
Process event → Crash before commit → Restart → Process again (duplicate)
```

**Exactly-Once**:
- Each event **appears** to be processed exactly one time
- Most complex to achieve
- Requires idempotence or transactions

```
Process event + commit offset atomically
Or: Make processing idempotent so duplicates don't matter
```

### The Challenge

**Problem**: Can't commit offset and produce output atomically

```python
# Non-atomic operations:
result = process_event(event)      # Step 1: Process
database.write(result)             # Step 2: Write output
kinesis.commit_offset(offset)      # Step 3: Commit

# Crash between any steps = inconsistency!
```

**Failure scenarios**:

**Crash after Step 1**: Event not processed, not committed → Reprocessed ✓

**Crash after Step 2**: Output written, offset not committed → Reprocessed → Duplicate output! ✗

**Crash after Step 3**: Everything done ✓

### Idempotence

**Idempotent operation**: Can be applied multiple times with the same result

**Naturally idempotent**:
```python
user.status = 'active'  # Set value (idempotent)
cache.set(key, value)   # Set value (idempotent)
```

**Not idempotent**:
```python
balance += 100  # Increment (duplicate = wrong balance!)
counter += 1    # Increment (duplicate = wrong count!)
list.append(item)  # Append (duplicate = duplicate items!)
```

**Making operations idempotent**:

**1. Deduplication table**:
```python
if not already_processed(event_id):
    balance += 100
    mark_processed(event_id)
```

**2. Idempotency key**:
```python
# Include unique key in operation
payment_api.charge(
    amount=100,
    idempotency_key=event_id  # API deduplicates
)
```

**3. Replace instead of increment**:
```python
# Instead of: balance += 100
new_balance = compute_balance_from_events()
user.balance = new_balance  # Idempotent set
```

### Checkpointing

**Checkpointing** = Periodically save processor state and offset together

**Without checkpointing**:
```
Process 100 events → Crash → Restart from offset 0 → Reprocess all 100
```

**With checkpointing**:
```
Process 100 events → Checkpoint at event 50 → Crash → Restart from event 50 → Process 50-100 only
```

**What to checkpoint**:
1. **Consumer offset** (where we are in stream)
2. **Internal state** (aggregations, buffers, etc.)
3. **Output** (what we've produced)

**Checkpoint strategies**:

**1. Periodic** (every N seconds):
- Simple
- May reprocess up to N seconds of events
- Trade-off: frequency vs overhead

**2. Per-batch** (every N events):
- Bounded reprocessing
- Predictable overhead
- Common in practice

**3. Consistent snapshots** (coordinated):
- All operators checkpoint together
- Complex but provides exactly-once
- Used by Flink, Spark Structured Streaming

### Exactly-Once Semantics

**True exactly-once is impossible in distributed systems** (can't make network + database + offset commit all atomic)

**But we can achieve** "effectively exactly-once":

**Approach 1: Idempotent processing**
```python
# Even if processed twice, result is same
if not already_processed(event_id):
    process_event(event)
    mark_processed(event_id)
```

**Approach 2: Transactional output**
```python
# Commit offset + output in same transaction
with transaction:
    process_event(event)
    write_output(result)
    commit_offset(offset)
```

**Approach 3: Two-phase commit**
```
Prepare all changes → All succeed? → Commit all
Otherwise → Rollback all
```

**In practice**: Idempotent processing (Approach 1) is most common for stream processing.

### AWS Kinesis Guarantees

**Kinesis Data Streams**:
- At-least-once delivery
- Events may be delivered multiple times
- Order preserved within shard

**Lambda with Kinesis**:
- Retries failed batches automatically
- At-least-once processing
- Must make Lambda idempotent

**DynamoDB Streams**:
- Exactly-once processing within 24 hours
- Each shard record delivered exactly once to processor

## Discussion Questions (10 min)

### Question 1: Guarantee Selection

For each use case, what processing guarantee do you need?

A) **Metrics dashboard** - Count page views per minute
B) **Financial ledger** - Record all transactions
C) **Cache warming** - Populate Redis from stream
D) **Email notifications** - Send email on order placed
E) **Ad billing** - Charge advertisers per impression

<details>
<summary>Expand for discussion</summary>

**At-most-once** (acceptable loss):
- **A) Metrics** - Losing 0.1% of metrics OK for dashboard
- **C) Cache warming** - Cache miss just means slower query

**At-least-once** (idempotent handling):
- **D) Email** - Must send email (use idempotency key to prevent duplicates)

**Exactly-once** (strong guarantee):
- **B) Financial ledger** - Can't miss or duplicate transactions
- **E) Ad billing** - Can't charge twice or miss charges

**Key factors**:
- Money involved? → Exactly-once
- Can tolerate loss? → At-most-once
- Can handle duplicates? → At-least-once

**Reality**: Most systems use at-least-once + idempotence (easier than true exactly-once).
</details>

### Question 2: Idempotence Challenge

You're processing orders:
```python
def process_order(order):
    inventory.decrement(order.item_id, order.quantity)
    accounting.add_revenue(order.amount)
    send_email(order.customer_email)
```

This runs at-least-once (may process duplicates). What problems occur and how do you fix them?

<details>
<summary>Expand for discussion</summary>

**Problems with duplicates**:
1. Inventory decremented twice → Wrong stock count
2. Revenue added twice → Wrong financials
3. Customer gets two emails → Bad experience

**Solution: Add deduplication**:
```python
def process_order(order):
    order_id = order.order_id

    # Check if already processed
    if already_processed(order_id):
        print(f"Order {order_id} already processed, skipping")
        return

    # Process
    inventory.decrement(order.item_id, order.quantity)
    accounting.add_revenue(order.amount)
    send_email(order.customer_email, idempotency_key=order_id)

    # Mark as processed
    mark_processed(order_id)
```

**Implementation**:
```python
# Using DynamoDB for deduplication
def already_processed(order_id):
    response = dynamodb.get_item(
        TableName='processed-orders',
        Key={'orderId': {'S': order_id}}
    )
    return 'Item' in response

def mark_processed(order_id):
    dynamodb.put_item(
        TableName='processed-orders',
        Item={
            'orderId': {'S': order_id},
            'processedAt': {'S': datetime.utcnow().isoformat()},
            'ttl': {'N': str(int(time.time()) + 86400 * 7)}  # 7 days
        }
    )
```

**Key insight**: At-least-once + deduplication = effectively exactly-once
</details>

### Question 3: Checkpoint Frequency

Your stream processor checkpoints every 10 seconds. It processes 1,000 events/second.

**Scenario**: Crash happens 5 seconds after last checkpoint.

What happens on restart?

<details>
<summary>Expand for discussion</summary>

**Analysis**:
- Last checkpoint: offset 10,000 (at t=10s)
- Crash: t=15s (processed up to offset 15,000)
- Events 10,001-15,000 processed but not checkpointed

**On restart**:
- Restore state from checkpoint (offset 10,000)
- Resume processing from offset 10,000
- Events 10,001-15,000 processed AGAIN (5,000 events reprocessed)

**Impact**:
- At-least-once guarantee (duplicates)
- Must handle reprocessing of 5,000 events
- If not idempotent, results will be wrong

**Trade-offs**:

**More frequent checkpoints** (e.g., every 1 second):
- Pros: Less reprocessing on failure (only 1,000 events)
- Cons: Higher overhead, slower processing

**Less frequent checkpoints** (e.g., every 60 seconds):
- Pros: Less overhead, faster processing
- Cons: More reprocessing on failure (60,000 events)

**Typical choice**: 5-30 seconds (balance between overhead and reprocessing)

**Best practice**: Make processing idempotent so reprocessing is safe.
</details>

## Hands-On: Idempotent Processing with DynamoDB (20 min)

You'll build a fault-tolerant stream processor that handles duplicates correctly using deduplication.

### Step 1: Setup Infrastructure

Create `fault_tolerance_setup.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def create_infrastructure():
    """Create stream and tables"""
    print("Setting up infrastructure...\n")

    # Create Kinesis stream
    try:
        kinesis.create_stream(StreamName='payment-events', ShardCount=1)
        print("Creating stream...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName='payment-events')
    except kinesis.exceptions.ResourceInUseException:
        pass
    print("✓ Stream ready")

    # Create account balances table
    try:
        dynamodb.create_table(
            TableName='account-balances',
            AttributeDefinitions=[
                {'AttributeName': 'accountId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'accountId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName='account-balances')
    except dynamodb.exceptions.ResourceInUseException:
        pass
    print("✓ Balances table ready")

    # Create processed events table (deduplication)
    try:
        dynamodb.create_table(
            TableName='processed-events',
            AttributeDefinitions=[
                {'AttributeName': 'eventId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'eventId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName='processed-events')
    except dynamodb.exceptions.ResourceInUseException:
        pass
    print("✓ Deduplication table ready\n")

def initialize_accounts():
    """Initialize account balances"""
    accounts = [
        {'accountId': 'alice', 'balance': 100.00},
        {'accountId': 'bob', 'balance': 200.00},
    ]

    print("Initializing accounts...\n")
    for account in accounts:
        dynamodb.put_item(
            TableName='account-balances',
            Item={
                'accountId': {'S': account['accountId']},
                'balance': {'N': str(account['balance'])}
            }
        )
        print(f"  {account['accountId']}: ${account['balance']:.2f}")
    print()

def send_payment_events():
    """Send payment events (with intentional duplicate)"""
    print("Sending payment events...\n")

    events = [
        {'eventId': 'evt_1', 'accountId': 'alice', 'amount': 50.00, 'type': 'deposit'},
        {'eventId': 'evt_2', 'accountId': 'bob', 'amount': 30.00, 'type': 'deposit'},
        {'eventId': 'evt_3', 'accountId': 'alice', 'amount': 20.00, 'type': 'withdraw'},
        {'eventId': 'evt_2', 'accountId': 'bob', 'amount': 30.00, 'type': 'deposit'},  # DUPLICATE!
        {'eventId': 'evt_4', 'accountId': 'bob', 'amount': 10.00, 'type': 'withdraw'},
    ]

    for event in events:
        event['timestamp'] = datetime.utcnow().isoformat() + 'Z'

        kinesis.put_record(
            StreamName='payment-events',
            Data=json.dumps(event),
            PartitionKey=event['accountId']
        )

        marker = " ⚠ DUPLICATE!" if event['eventId'] == 'evt_2' and events.index(event) > 0 else ""
        print(f"  {event['eventId']:8s} | {event['accountId']:8s} | "
              f"{event['type']:10s} | ${event['amount']:.2f}{marker}")
        time.sleep(0.5)

    print("\n✓ Events sent (including duplicate)\n")

def main():
    create_infrastructure()
    initialize_accounts()
    send_payment_events()

if __name__ == '__main__':
    main()
```

### Step 2: Build Idempotent Processor

Create `idempotent_processor.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

class IdempotentProcessor:
    """Fault-tolerant processor with deduplication"""
    def __init__(self):
        self.stats = {
            'total_events': 0,
            'processed': 0,
            'duplicates_detected': 0
        }

    def process_stream(self, stream_name):
        """Process payment events idempotently"""
        print("Starting idempotent processor...\n")
        print("="*80)

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
                    event = json.loads(record['Data'])
                    self.process_event_idempotently(event)

                shard_iterator = records_response.get('NextShardIterator')
                if not records_response['Records']:
                    break

        self.print_results()

    def process_event_idempotently(self, event):
        """Process event with deduplication"""
        self.stats['total_events'] += 1
        event_id = event['eventId']

        print(f"\nProcessing: {event_id}")
        print(f"  Account: {event['accountId']}")
        print(f"  Type: {event['type']}")
        print(f"  Amount: ${event['amount']:.2f}")

        # Check if already processed (deduplication)
        if self.already_processed(event_id):
            print(f"  ⚠ DUPLICATE DETECTED - Skipping!")
            self.stats['duplicates_detected'] += 1
            return

        # Process the event
        self.update_balance(event)

        # Mark as processed (deduplication record)
        self.mark_processed(event_id)

        self.stats['processed'] += 1
        print(f"  ✓ Processed successfully")

    def already_processed(self, event_id):
        """Check if event already processed"""
        try:
            response = dynamodb.get_item(
                TableName='processed-events',
                Key={'eventId': {'S': event_id}}
            )
            return 'Item' in response
        except Exception as e:
            print(f"  Error checking deduplication: {e}")
            return False

    def mark_processed(self, event_id):
        """Mark event as processed"""
        try:
            dynamodb.put_item(
                TableName='processed-events',
                Item={
                    'eventId': {'S': event_id},
                    'processedAt': {'S': datetime.utcnow().isoformat() + 'Z'},
                    'ttl': {'N': str(int(time.time()) + 86400 * 7)}  # 7-day TTL
                }
            )
        except Exception as e:
            print(f"  Error marking processed: {e}")

    def update_balance(self, event):
        """Update account balance"""
        account_id = event['accountId']
        amount = event['amount']
        event_type = event['type']

        try:
            # Get current balance
            response = dynamodb.get_item(
                TableName='account-balances',
                Key={'accountId': {'S': account_id}}
            )

            if 'Item' in response:
                current_balance = float(response['Item']['balance']['N'])
            else:
                current_balance = 0.0

            # Calculate new balance
            if event_type == 'deposit':
                new_balance = current_balance + amount
            else:  # withdraw
                new_balance = current_balance - amount

            # Update balance
            dynamodb.put_item(
                TableName='account-balances',
                Item={
                    'accountId': {'S': account_id},
                    'balance': {'N': str(new_balance)}
                }
            )

            print(f"  Balance: ${current_balance:.2f} → ${new_balance:.2f}")

        except Exception as e:
            print(f"  Error updating balance: {e}")

    def print_results(self):
        """Print final results"""
        print("\n" + "="*80)
        print("Processing Complete")
        print("="*80)
        print(f"Total events received: {self.stats['total_events']}")
        print(f"Events processed: {self.stats['processed']}")
        print(f"Duplicates detected: {self.stats['duplicates_detected']}")
        print("="*80)

        # Show final balances
        print("\nFinal Account Balances:")
        response = dynamodb.scan(TableName='account-balances')
        for item in response['Items']:
            account_id = item['accountId']['S']
            balance = float(item['balance']['N'])
            print(f"  {account_id}: ${balance:.2f}")

        print("\n✓ Without deduplication, duplicate event would cause incorrect balance!")
        print("  With deduplication, balance is correct despite duplicate.")

def main():
    processor = IdempotentProcessor()
    processor.process_stream('payment-events')

if __name__ == '__main__':
    main()
```

### Step 3: Run the Demo

**Terminal 1 - Send events**:
```bash
python fault_tolerance_setup.py
```

**Terminal 2 - Process idempotently**:
```bash
python idempotent_processor.py
```

**Observe**:
- Duplicate event detected and skipped
- Balance remains correct
- Deduplication table prevents reprocessing

### Step 4: Test Without Deduplication

Create `naive_processor.py` (without deduplication):

```python
# Similar to idempotent_processor.py but WITHOUT deduplication checks
# Just process every event blindly

class NaiveProcessor:
    def process_event_naively(self, event):
        """Process without deduplication (WRONG!)"""
        # No check for already_processed
        # No mark_processed
        # Just update balance directly
        self.update_balance(event)

# Run this to see incorrect results with duplicates
```

Compare results:
- Naive processor: Wrong balance (duplicate processed twice)
- Idempotent processor: Correct balance (duplicate skipped)

### Cleanup

```bash
aws kinesis delete-stream --stream-name payment-events
aws dynamodb delete-table --table-name account-balances
aws dynamodb delete-table --table-name processed-events
```

## Checkpoint (5 min)

### Question 1: Processing Guarantees

What's the difference between at-least-once and exactly-once?

<details>
<summary>Answer</summary>

**At-least-once**:
- May process events multiple times
- Simpler to implement
- Requires idempotent handling to be correct

**Exactly-once**:
- Appears to process each event exactly once
- Complex to implement (transactions or deduplication)
- No duplicate effects

**Key insight**: "Exactly-once" usually means "at-least-once with idempotence" (effectively exactly-once), not true exactly-once (impossible in distributed systems).
</details>

### Question 2: Idempotence

Why is idempotence critical for at-least-once processing?

<details>
<summary>Answer</summary>

**Without idempotence** + at-least-once:
- Events may be reprocessed
- Duplicates cause incorrect results
- Balance += 100 twice = wrong balance

**With idempotence** + at-least-once:
- Events may be reprocessed
- Duplicates have no effect
- Check if processed + skip = correct result

**Making it idempotent**:
1. Deduplication table (event ID → processed?)
2. Idempotency keys in external APIs
3. Replace instead of increment operations

**Key insight**: At-least-once + idempotence = effectively exactly-once (much simpler than true exactly-once).
</details>

### Question 3: Checkpoint Frequency

What's the trade-off in checkpoint frequency?

<details>
<summary>Answer</summary>

**More frequent checkpoints**:
- Pros:
  - Less reprocessing on failure
  - Faster recovery
- Cons:
  - Higher overhead (slow processing)
  - More I/O

**Less frequent checkpoints**:
- Pros:
  - Lower overhead (faster processing)
  - Less I/O
- Cons:
  - More reprocessing on failure
  - Slower recovery

**Typical choice**: 5-30 seconds

**Best practice**: Balance based on:
- Event processing cost (expensive = checkpoint more)
- Failure rate (frequent failures = checkpoint more)
- Idempotence (idempotent = can checkpoint less)
</details>

## Summary

You've completed Module 15 and the entire course! You should now understand:

✓ Processing guarantees (at-most-once, at-least-once, exactly-once)
✓ Idempotence and why it matters
✓ Checkpointing for state recovery
✓ Deduplication using DynamoDB
✓ Trade-offs in fault tolerance strategies
✓ Building production-ready stream processors

**You've completed all 15 modules!** You now have a comprehensive understanding of:
- Stream processing fundamentals
- AWS streaming services (Kinesis, DynamoDB Streams, Lambda, SNS, SQS)
- Messaging patterns (partitioned logs, CDC, event sourcing)
- Stream processing operations (windowing, joins, aggregations)
- Production concerns (time handling, fault tolerance, idempotence)

**Next steps**:
1. Review the complete flow from M1-M15
2. Build a complete streaming application using these patterns
3. Explore production streaming frameworks (Apache Flink, Kafka Streams)
4. Read DDIA Chapter 12 on "The Future of Data Systems"

**Where to learn more**:
- DDIA Chapter 11, "Fault Tolerance" section
- `references/stream-processing-concepts.md` - "Fault Tolerance"
- Apache Flink documentation on exactly-once semantics
- AWS Lambda best practices for stream processing

**Congratulations on completing the DDIA Stream Processing skill!**
