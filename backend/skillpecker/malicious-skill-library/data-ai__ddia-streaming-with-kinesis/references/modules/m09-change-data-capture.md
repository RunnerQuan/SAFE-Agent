# Module 9: Change Data Capture

**Duration**: 45 minutes
**Prerequisites**: M6 (Partitioned Logs Intro)
**Chapter Reading**: "Change Data Capture" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand change data capture (CDC) and its use cases
2. Explain how database logs become event streams
3. Identify CDC tools and approaches
4. Work with DynamoDB Streams for CDC

## Core Concepts (10 min)

### What is Change Data Capture (CDC)?

**Change Data Capture** is the process of observing all data changes in a database and extracting them as a stream of events.

**Key idea**: Instead of polling the database, observe its internal log to get real-time change notifications.

```
Database writes → Write-ahead log → CDC tool → Event stream
                        ↓
                  (replication log)
```

**Every change becomes an event**:
- INSERT → "record created" event
- UPDATE → "record updated" event (with before/after values)
- DELETE → "record deleted" event

### Why CDC Matters

**Problem without CDC**: Keeping multiple systems in sync

```
Application writes to:
├─ Database (user data)
├─ Search index (Elasticsearch)
└─ Cache (Redis)

Problem: Writes can fail partially. Systems drift out of sync.
```

**Solution with CDC**: Single source of truth

```
Application → Database
Database → CDC stream → Consumers:
                        ├─ Search indexer
                        ├─ Cache updater
                        └─ Analytics
```

**Benefits**:
1. **Single write path**: App only writes to database
2. **Guaranteed consistency**: CDC captures every change
3. **No dual writes**: Avoid race conditions and partial failures
4. **Replay capability**: Rebuild derived systems from scratch
5. **Audit trail**: Complete history of changes

### CDC vs Application-Level Events

**Application-level**:
```python
# Application publishes events explicitly
def create_user(user_data):
    db.insert(user_data)
    kinesis.put_record({"type": "user_created", "data": user_data})
```

Problems:
- Dual write (can fail partially)
- Bugs might skip event publishing
- Updates might forget to publish

**CDC (Database-level)**:
```python
# Application just writes to database
def create_user(user_data):
    db.insert(user_data)
    # CDC automatically captures change!
```

Benefits:
- Guaranteed capture
- No way to forget
- Works for legacy code
- Includes all changes (even from admin tools)

### How CDC Works

**Most databases have a write-ahead log (WAL)**:
- PostgreSQL: WAL
- MySQL: Binlog
- MongoDB: Oplog
- DynamoDB: Streams

**CDC tools observe these logs**:

1. **Log position tracking**: "I've read up to offset X"
2. **Parse log entries**: Convert binary log to structured events
3. **Publish to stream**: Send events to Kafka/Kinesis
4. **Handle schema changes**: Adapt to database schema evolution

**CDC Tools**:
- Debezium (open source, Kafka-based)
- AWS DMS (Database Migration Service)
- Maxwell's Daemon (MySQL)
- DynamoDB Streams (native)
- Databus (LinkedIn)

### DynamoDB Streams

**DynamoDB Streams** is AWS's native CDC solution for DynamoDB.

**Features**:
- Enabled per table
- Captures all changes (insert, update, delete)
- 24-hour retention
- Exactly-once delivery in order (per item)
- Four view types:
  - `KEYS_ONLY` - Only the key of changed item
  - `NEW_IMAGE` - Entire item after change
  - `OLD_IMAGE` - Entire item before change
  - `NEW_AND_OLD_IMAGES` - Both before and after

**Stream record format**:
```json
{
  "eventName": "INSERT" | "MODIFY" | "REMOVE",
  "eventID": "...",
  "eventSource": "aws:dynamodb",
  "dynamodb": {
    "Keys": {"userId": {"S": "user123"}},
    "NewImage": {...},
    "OldImage": {...},
    "SequenceNumber": "..."
  }
}
```

## Discussion Questions (10 min)

### Question 1: Keeping Systems in Sync

You're building an e-commerce platform. When a product's price changes, you need to update:
1. DynamoDB (source of truth)
2. Elasticsearch (search)
3. Redis (cache)
4. S3 (data warehouse)

**Approach A - Application updates all**:
```python
def update_price(product_id, new_price):
    dynamodb.update(product_id, new_price)
    elasticsearch.update(product_id, new_price)
    redis.update(product_id, new_price)
    s3.append(change_event)
```

**Approach B - CDC**:
```python
def update_price(product_id, new_price):
    dynamodb.update(product_id, new_price)
    # DynamoDB Stream → Lambda → updates others
```

Which is better and why?

<details>
<summary>Expand for discussion</summary>

**Approach A problems**:
1. **Partial failures**: What if Redis update fails? Database updated but cache stale
2. **Atomicity**: Can't guarantee all-or-nothing
3. **Ordering**: Race conditions possible
4. **Code complexity**: Every update needs to remember all systems
5. **Performance**: Synchronous updates slow down application

**Approach B (CDC) advantages**:
1. **Single write**: Application only updates database
2. **Guaranteed consistency**: Stream captures every change
3. **Async**: Doesn't slow down application
4. **Decoupled**: Add new consumers without changing app
5. **Replay**: Rebuild downstream systems from scratch

**Best practice**: Use CDC for derived data systems. Application only writes to source of truth.
</details>

### Question 2: CDC Use Cases

Which of these are good uses of CDC?

A) Keep search index in sync with database
B) Send email when user signs up
C) Update cache when data changes
D) Replicate database to data warehouse
E) Trigger business workflow when order placed

<details>
<summary>Expand for discussion</summary>

**Great for CDC**:
- **A) Search index** - Perfect! Derived data, needs every change
- **C) Cache updates** - Excellent! Keep cache in sync automatically
- **D) Data warehouse** - Great! Common pattern for analytics

**Maybe not CDC**:
- **B) Email on signup** - Could use CDC, but application-level event might be clearer (includes intent, not just data change)
- **E) Business workflow** - Depends. CDC captures what happened, but business logic might need why/how

**Pattern**: CDC excels for **derived data systems** (search, cache, analytics). For **business logic** (emails, workflows), explicit application events might be clearer.

**Can combine**: Use CDC for derived data, application events for business logic.
</details>

### Question 3: Replay Scenario

Your search index got corrupted. You need to rebuild it from scratch.

**With CDC (DynamoDB Streams)**:
- 24-hour retention
- Can replay last 24 hours
- But what about older data?

**Solutions**?

<details>
<summary>Expand for discussion</summary>

**Option 1: Scan and rebuild**:
```python
# Scan entire DynamoDB table
for item in dynamodb.scan():
    elasticsearch.index(item)

# Then subscribe to stream for ongoing updates
```

Pros: Gets all data
Cons: Expensive, slow, inconsistent during scan

**Option 2: Long-term CDC storage**:
- DynamoDB Streams → Kinesis Data Firehose → S3
- S3 has complete change history
- Replay from S3 for full rebuild

**Option 3: Periodic snapshots**:
- Daily export to S3
- Restore from snapshot + replay recent CDC events

**Best practice**: For critical derived data, archive CDC events to S3 for long-term replay capability.
</details>

## Hands-On: DynamoDB Streams CDC (20 min)

You'll enable DynamoDB Streams, make changes, and observe the change events.

### Step 1: Create Table with Streams

Create `dynamodb_cdc.py`:

```python
import boto3
import json
from datetime import datetime
import time

dynamodb = boto3.client('dynamodb', region_name='us-east-1')
streams = boto3.client('dynamodbstreams', region_name='us-east-1')

def create_table_with_streams(table_name):
    """Create DynamoDB table with streams enabled"""
    try:
        response = dynamodb.create_table(
            TableName=table_name,
            AttributeDefinitions=[
                {'AttributeName': 'userId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'userId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST',
            StreamSpecification={
                'StreamEnabled': True,
                'StreamViewType': 'NEW_AND_OLD_IMAGES'  # Capture before & after
            }
        )

        print(f"Creating table '{table_name}' with streams...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print("✓ Table active with streams enabled\n")

    except dynamodb.exceptions.ResourceInUseException:
        print(f"✓ Table '{table_name}' already exists\n")

def get_stream_arn(table_name):
    """Get stream ARN for table"""
    response = dynamodb.describe_table(TableName=table_name)
    stream_arn = response['Table']['LatestStreamArn']
    return stream_arn

def perform_database_operations(table_name):
    """Perform various database operations"""
    print("Performing database operations...\n")

    # INSERT
    print("1. INSERT user123")
    dynamodb.put_item(
        TableName=table_name,
        Item={
            'userId': {'S': 'user123'},
            'name': {'S': 'Alice Smith'},
            'email': {'S': 'alice@example.com'},
            'status': {'S': 'active'}
        }
    )
    time.sleep(1)

    # UPDATE
    print("2. UPDATE user123 (change email)")
    dynamodb.update_item(
        TableName=table_name,
        Key={'userId': {'S': 'user123'}},
        UpdateExpression='SET email = :new_email',
        ExpressionAttributeValues={':new_email': {'S': 'alice.smith@example.com'}}
    )
    time.sleep(1)

    # Another UPDATE
    print("3. UPDATE user123 (change status)")
    dynamodb.update_item(
        TableName=table_name,
        Key={'userId': {'S': 'user123'}},
        UpdateExpression='SET #status = :new_status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':new_status': {'S': 'inactive'}}
    )
    time.sleep(1)

    # DELETE
    print("4. DELETE user123")
    dynamodb.delete_item(
        TableName=table_name,
        Key={'userId': {'S': 'user123'}}
    )

    print("\n✓ Operations complete\n")

def read_stream_changes(stream_arn):
    """Read and display change events from stream"""
    print("="*70)
    print("Reading CDC events from DynamoDB Stream...")
    print("="*70 + "\n")

    # Describe stream
    response = streams.describe_stream(StreamArn=stream_arn)
    shards = response['StreamDescription']['Shards']

    for shard in shards:
        shard_id = shard['ShardId']
        print(f"Reading from shard: {shard_id}\n")

        # Get shard iterator
        iterator_response = streams.get_shard_iterator(
            StreamArn=stream_arn,
            ShardId=shard_id,
            ShardIteratorType='TRIM_HORIZON'
        )
        shard_iterator = iterator_response['ShardIterator']

        # Read records
        event_num = 1
        while shard_iterator:
            records_response = streams.get_records(ShardIterator=shard_iterator)

            for record in records_response['Records']:
                event_name = record['eventName']  # INSERT, MODIFY, REMOVE
                keys = record['dynamodb']['Keys']
                user_id = keys['userId']['S']

                print(f"Event {event_num}: {event_name} - {user_id}")
                print(f"  Sequence: {record['dynamodb']['SequenceNumber']}")

                # Show old and new images
                if 'OldImage' in record['dynamodb']:
                    old = record['dynamodb']['OldImage']
                    print(f"  Before: {format_item(old)}")

                if 'NewImage' in record['dynamodb']:
                    new = record['dynamodb']['NewImage']
                    print(f"  After:  {format_item(new)}")

                print()
                event_num += 1

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

def format_item(item):
    """Format DynamoDB item for display"""
    formatted = {}
    for key, value in item.items():
        if 'S' in value:
            formatted[key] = value['S']
        elif 'N' in value:
            formatted[key] = value['N']
    return json.dumps(formatted)

def main():
    table_name = 'users-cdc-demo'

    # Create table with streams
    create_table_with_streams(table_name)

    # Get stream ARN
    stream_arn = get_stream_arn(table_name)
    print(f"Stream ARN: {stream_arn}\n")

    # Perform database operations
    perform_database_operations(table_name)

    # Read CDC events
    time.sleep(2)  # Wait for events to propagate
    read_stream_changes(stream_arn)

if __name__ == '__main__':
    main()
```

### Step 2: Run CDC Demo

```bash
python dynamodb_cdc.py
```

**Observe**:
1. **INSERT event**: No OldImage, has NewImage
2. **MODIFY events**: Both OldImage and NewImage (see what changed!)
3. **REMOVE event**: Has OldImage, no NewImage

This is CDC in action - every database change captured as an event!

### Step 3: Build CDC Consumer

Create `cdc_consumer.py`:

```python
import boto3
import json

dynamodb = boto3.client('dynamodb', region_name='us-east-1')
streams = boto3.client('dynamodbstreams', region_name='us-east-1')

class SearchIndexer:
    """Simulated search index (would be Elasticsearch in production)"""
    def __init__(self):
        self.index = {}

    def index_document(self, user_id, data):
        """Add/update document in search index"""
        self.index[user_id] = data
        print(f"  📝 Indexed user: {user_id}")

    def delete_document(self, user_id):
        """Remove document from search index"""
        if user_id in self.index:
            del self.index[user_id]
            print(f"  🗑️  Deleted user: {user_id}")

    def show_index(self):
        """Display current index state"""
        print("\n" + "="*60)
        print("Current Search Index:")
        print("="*60)
        if not self.index:
            print("  (empty)")
        for user_id, data in self.index.items():
            print(f"  {user_id}: {json.dumps(data)}")
        print()

def process_cdc_stream(table_name, indexer):
    """Process CDC events to keep search index in sync"""
    print("Processing CDC stream to update search index...\n")

    # Get stream ARN
    response = dynamodb.describe_table(TableName=table_name)
    stream_arn = response['Table']['LatestStreamArn']

    # Get shards
    stream_response = streams.describe_stream(StreamArn=stream_arn)
    shards = stream_response['StreamDescription']['Shards']

    for shard in shards:
        shard_id = shard['ShardId']

        # Get iterator
        iterator_response = streams.get_shard_iterator(
            StreamArn=stream_arn,
            ShardId=shard_id,
            ShardIteratorType='TRIM_HORIZON'
        )
        shard_iterator = iterator_response['ShardIterator']

        # Process records
        while shard_iterator:
            records_response = streams.get_records(ShardIterator=shard_iterator)

            for record in records_response['Records']:
                event_name = record['eventName']
                user_id = record['dynamodb']['Keys']['userId']['S']

                print(f"Processing: {event_name} - {user_id}")

                if event_name == 'INSERT' or event_name == 'MODIFY':
                    # Index the new/updated document
                    new_image = record['dynamodb']['NewImage']
                    doc = {
                        'name': new_image.get('name', {}).get('S'),
                        'email': new_image.get('email', {}).get('S'),
                        'status': new_image.get('status', {}).get('S')
                    }
                    indexer.index_document(user_id, doc)

                elif event_name == 'REMOVE':
                    # Remove from index
                    indexer.delete_document(user_id)

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

def main():
    table_name = 'users-cdc-demo'
    indexer = SearchIndexer()

    # Process CDC stream
    process_cdc_stream(table_name, indexer)

    # Show final index state
    indexer.show_index()

    print("✓ Search index kept in sync with database via CDC!")

if __name__ == '__main__':
    main()
```

### Step 4: Run CDC Consumer

```bash
python cdc_consumer.py
```

**Observe**:
- CDC events processed
- Search index updated automatically
- Final index reflects database state
- No dual writes needed!

### Step 5: Test Live Updates

In separate terminal, make more changes:

```python
import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Add another user
dynamodb.put_item(
    TableName='users-cdc-demo',
    Item={
        'userId': {'S': 'user456'},
        'name': {'S': 'Bob Jones'},
        'email': {'S': 'bob@example.com'},
        'status': {'S': 'active'}
    }
)
```

Run consumer again - it picks up the new change!

### Cleanup

```bash
aws dynamodb delete-table --table-name users-cdc-demo
```

## Checkpoint (5 min)

### Question 1: CDC Purpose

What is the PRIMARY benefit of CDC?

A) Faster database queries
B) Keeping derived systems in sync automatically
C) Reducing database storage
D) Improving database security

<details>
<summary>Answer</summary>

**B) Keeping derived systems in sync automatically**

CDC captures every database change as an event, allowing downstream systems (search indexes, caches, data warehouses) to stay synchronized without dual writes.
</details>

### Question 2: CDC vs Application Events

When should you use CDC instead of application-level events?

<details>
<summary>Answer</summary>

**Use CDC when**:
- Need to keep derived data systems in sync (search, cache, warehouse)
- Want guaranteed capture of every change
- Working with legacy systems
- Need to avoid dual writes
- Changes come from multiple sources (app, admin tools, imports)

**Use application events when**:
- Capturing business intent, not just data changes
- Need context beyond what changed (why, how, by whom)
- Triggering business workflows
- Need semantic events (not just CREATE/UPDATE/DELETE)

**Best practice**: Use both! CDC for derived data, application events for business logic.
</details>

### Question 3: Stream View Types

DynamoDB Streams offers four view types:
- `KEYS_ONLY`
- `NEW_IMAGE`
- `OLD_IMAGE`
- `NEW_AND_OLD_IMAGES`

For each use case, which view type is most appropriate?

A) Invalidate cache entries when data changes
B) Rebuild search index with latest data
C) Audit log showing what changed
D) Replicate to another table

<details>
<summary>Answer</summary>

**A) Cache invalidation: KEYS_ONLY**
- Only need to know which item changed
- Delete from cache by key
- Minimal data transfer

**B) Search index: NEW_IMAGE**
- Need current data to index
- Don't care about old values
- Smaller stream records

**C) Audit log: NEW_AND_OLD_IMAGES**
- Need to see what changed (before/after)
- Full change history
- More complete audit trail

**D) Replication: NEW_IMAGE (or NEW_AND_OLD_IMAGES)**
- Need current data to replicate
- NEW_IMAGE sufficient if just copying data
- NEW_AND_OLD_IMAGES if need to verify changes
</details>

## Summary

You've completed Module 9! You should now understand:

✓ Change Data Capture and its benefits
✓ How database logs become event streams
✓ Avoiding dual writes with CDC
✓ DynamoDB Streams for CDC
✓ Building consumers that react to database changes
✓ When to use CDC vs application events

**Next modules**:
- **M10: Event Sourcing** - Events as the source of truth (vs CDC as derived stream)
- **M11: State & Immutability** - Deriving state from event streams
- **M12: Processing Patterns** - Stream processing on CDC events

**Where to learn more**:
- DDIA Chapter 11, "Change Data Capture" section
- `references/stream-processing-concepts.md` - "Change Data Capture (CDC)"
- AWS DynamoDB Streams documentation
