# Module 11: State, Streams, and Immutability

**Duration**: 45 minutes
**Prerequisites**: M9 (Change Data Capture), M10 (Event Sourcing)
**Chapter Reading**: "State, Streams, and Immutability" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand the relationship between mutable state and immutable events
2. Explain log compaction and when to use it
3. Design systems that derive state from event streams
4. Build materialized views using Lambda and Kinesis

## Core Concepts (10 min)

### Mutable State vs Immutable Events

**Two perspectives on the same data**:

**Mutable state** (database view):
```
Users table:
userId | name  | email               | status
-------|-------|---------------------|--------
user1  | Alice | alice@example.com   | active

UPDATE users SET email = 'alice.smith@example.com' WHERE userId = 'user1'
```

**Immutable events** (stream view):
```
Events:
1. UserCreated(user1, "Alice", "alice@example.com", "active")
2. EmailChanged(user1, "alice.smith@example.com")

State = apply all events
```

**Key insight**: These are **duals** - you can derive one from the other!

```
Events → (replay) → State
State changes → (CDC) → Events
```

### Log Compaction

**Problem**: Event streams grow unbounded over time.

**Solution**: **Log compaction** - keep only the most recent event for each key.

**Example - User profiles**:
```
Before compaction:
1. UserCreated(user1, email="alice@example.com")
2. EmailUpdated(user1, email="alice.smith@example.com")
3. EmailUpdated(user1, email="alice.jones@example.com")
4. StatusUpdated(user1, status="inactive")

After compaction:
3. EmailUpdated(user1, email="alice.jones@example.com")  ← Latest email
4. StatusUpdated(user1, status="inactive")               ← Latest status
```

**Benefits**:
- Reduces storage (keeps growing slower)
- Maintains current state for all keys
- New consumers don't replay full history
- Still immutable (never modifying existing events)

**When to use**:
- **Changelog streams** (CDC from databases)
- **Stateful snapshots** (current state of entities)
- **Cache hydration** (bootstrap caches)

**When NOT to use**:
- **Audit logs** (need complete history)
- **Event sourcing** (need full replay)
- **Analytics** (need all events for analysis)

**Kafka** supports log compaction natively. Kinesis doesn't, but you can implement similar patterns with DynamoDB + Kinesis.

### Materialized Views

A **materialized view** is a derived data structure that is automatically kept up-to-date.

**Traditional databases**:
```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT month, SUM(amount) FROM orders GROUP BY month;

-- Automatically updated when orders change
```

**Stream processing as materialized views**:
```
Order events → Stream processor → Updated view in database/cache
```

**Examples**:
- Search index (derived from database)
- Recommendation cache (derived from user activity)
- Dashboard metrics (derived from events)
- Denormalized tables (derived from normalized data)

**Benefits**:
- Always up-to-date (no stale cache)
- Decoupled from source system
- Can have multiple views of same data

### Immutability and State Management

**Pattern**: Separate immutable log from mutable views

```
Immutable events (Kinesis/Kafka)
    ↓
Stream processors
    ↓
Mutable views (DynamoDB, Redis, Elasticsearch)
```

**Advantages**:

1. **Reproducible**: Can rebuild views by replaying events
2. **Multiple views**: Same events, different projections
3. **Experimentation**: Test new views on production data
4. **Debugging**: Replay events to reproduce bugs
5. **Scalability**: Views can be optimized for queries

**Trade-offs**:

| Approach | Immutable Events + Views | Mutable Database Only |
|----------|--------------------------|----------------------|
| Reproducibility | ✓ Can rebuild | ✗ History lost |
| Flexibility | ✓ Multiple views | ✗ One schema |
| Storage | Higher (events + views) | Lower (state only) |
| Complexity | Higher | Lower |
| Debugging | Easier (replay) | Harder (no history) |

## Discussion Questions (10 min)

### Question 1: When to Compact

You have these event streams. Which should use log compaction?

A) **User profile updates** - Name, email, preferences change over time
B) **Clickstream analytics** - Every page view on a website
C) **Sensor readings** - Temperature readings every 10 seconds
D) **Product catalog** - Current state of products
E) **Financial transactions** - All payments and transfers

<details>
<summary>Expand for discussion</summary>

**Should use log compaction**:
- **A) User profiles** - Yes! Only need current state, not full history
- **D) Product catalog** - Yes! Current product info, history not critical

**Should NOT compact**:
- **B) Clickstream** - No! Need all clicks for analytics
- **C) Sensor readings** - No! Need time-series data, not just latest
- **E) Transactions** - No! Need complete history for audit/compliance

**Pattern**: Compact when:
- Current state matters more than history
- History is very large and mostly irrelevant
- Consumers need to bootstrap quickly
- Entity-based (one entity per key)

**Don't compact when**:
- Every event is valuable (analytics, audit)
- Time-series data
- Regulatory requirements for complete history
</details>

### Question 2: Building Derived Views

You have a Kinesis stream with user activity events (clicks, searches, purchases). You need:

1. Real-time dashboard (metrics per minute)
2. User profile enrichment (last 10 actions per user)
3. ML training data (all events for 90 days)
4. Search suggestions (popular searches today)

Should you build these as:
- Separate views reading the same stream?
- Single view serving all use cases?
- Different streams for different purposes?

<details>
<summary>Expand for discussion</summary>

**Best approach: Separate views from same stream**

```
User activity stream (Kinesis)
    ├─> Lambda → CloudWatch (dashboard)
    ├─> Lambda → DynamoDB (user profiles)
    ├─> Firehose → S3 (ML training data)
    └─> Lambda → ElastiCache (search suggestions)
```

**Why**:
1. **Different requirements**:
   - Dashboard: Real-time aggregation
   - Profiles: Fast key-value lookup
   - ML data: Batch processing
   - Suggestions: Low-latency cache

2. **Independent scaling**: Each view scales independently

3. **Independent failures**: One view failing doesn't affect others

4. **Evolution**: Add new views without changing existing

**Anti-pattern: Single view**:
- One view can't efficiently serve all access patterns
- Couples unrelated use cases
- Hard to evolve

**Key insight**: One immutable stream, many mutable views optimized for different queries.
</details>

### Question 3: Rebuilding Views

Your search index got corrupted. You need to rebuild it. Your architecture:

```
Database (DynamoDB) → DynamoDB Streams → Lambda → Elasticsearch
```

DynamoDB Streams has 24-hour retention. Your index has 1 million products. Some added months ago.

How do you rebuild?

<details>
<summary>Expand for discussion</summary>

**Options**:

**Option 1: Scan + Stream** (Best)
```python
# 1. Scan entire DynamoDB table
for item in dynamodb.scan():
    elasticsearch.index(item)

# 2. Subscribe to stream for ongoing updates
# (Events during scan might be duplicated, make indexing idempotent)
```

**Option 2: Long-term event archive**
```
DynamoDB Streams → Firehose → S3 (complete history)
Rebuild: Read from S3 + recent stream events
```

**Option 3: Periodic snapshots**
```
Daily: Export DynamoDB to S3
Rebuild: Restore snapshot + replay last 24hr of stream
```

**Best practice**:
- **Short-term**: Use scan + stream (works if source data still exists)
- **Long-term**: Archive events to S3 (replay anytime)
- **Critical systems**: Periodic snapshots + event archive

**Key lesson**: If source is mutable (database), you need scan or snapshots. If source is immutable (event stream with long retention), you can always replay.
</details>

## Hands-On: Materialized Views with Lambda + Kinesis (20 min)

You'll build a system that maintains multiple materialized views from a single event stream.

### Step 1: Create Event Stream and Views

Create `materialized_views.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def setup_infrastructure():
    """Create stream and DynamoDB tables for views"""
    print("Setting up infrastructure...\n")

    # Create Kinesis stream
    stream_name = 'user-events'
    try:
        kinesis.create_stream(StreamName=stream_name, ShardCount=1)
        print(f"Creating stream '{stream_name}'...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)
    except kinesis.exceptions.ResourceInUseException:
        pass

    print(f"✓ Stream ready: {stream_name}")

    # Create view tables
    tables = {
        'user-profiles': 'Current user state',
        'user-activity-count': 'Aggregated activity counts'
    }

    for table_name, description in tables.items():
        try:
            dynamodb.create_table(
                TableName=table_name,
                AttributeDefinitions=[
                    {'AttributeName': 'userId', 'AttributeType': 'S'}
                ],
                KeySchema=[
                    {'AttributeName': 'userId', 'KeyType': 'HASH'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"  Creating table '{table_name}' ({description})...")
            waiter = dynamodb.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
        except dynamodb.exceptions.ResourceInUseException:
            pass

    print("✓ All tables ready\n")

def send_user_events(stream_name):
    """Send various user events"""
    print("Sending user events...\n")

    events = [
        {'userId': 'alice', 'type': 'signup', 'email': 'alice@example.com'},
        {'userId': 'alice', 'type': 'login', 'device': 'mobile'},
        {'userId': 'alice', 'type': 'page_view', 'page': '/products'},
        {'userId': 'bob', 'type': 'signup', 'email': 'bob@example.com'},
        {'userId': 'alice', 'type': 'purchase', 'amount': 49.99},
        {'userId': 'bob', 'type': 'page_view', 'page': '/about'},
        {'userId': 'alice', 'type': 'page_view', 'page': '/checkout'},
        {'userId': 'charlie', 'type': 'signup', 'email': 'charlie@example.com'},
        {'userId': 'bob', 'type': 'purchase', 'amount': 29.99},
        {'userId': 'alice', 'type': 'logout'},
    ]

    for event in events:
        event['timestamp'] = datetime.utcnow().isoformat() + 'Z'

        kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(event),
            PartitionKey=event['userId']
        )

        print(f"  {event['userId']:8s} | {event['type']:12s}")
        time.sleep(0.3)

    print("\n✓ Events sent\n")

def build_user_profile_view(stream_name):
    """Build user profile view (current state per user)"""
    print("Building user profile view...\n")

    # Read stream
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    profiles = {}

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
                user_id = event['userId']
                event_type = event['type']

                # Initialize profile
                if user_id not in profiles:
                    profiles[user_id] = {
                        'userId': user_id,
                        'email': None,
                        'lastLogin': None,
                        'totalPurchases': 0,
                        'lastActivity': None
                    }

                profile = profiles[user_id]

                # Update profile based on event
                if event_type == 'signup':
                    profile['email'] = event.get('email')

                elif event_type == 'login':
                    profile['lastLogin'] = event['timestamp']

                elif event_type == 'purchase':
                    profile['totalPurchases'] += event.get('amount', 0)

                profile['lastActivity'] = event['timestamp']

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

    # Write profiles to DynamoDB
    for user_id, profile in profiles.items():
        dynamodb.put_item(
            TableName='user-profiles',
            Item={
                'userId': {'S': profile['userId']},
                'email': {'S': profile['email'] or 'unknown'},
                'lastLogin': {'S': profile['lastLogin'] or 'never'},
                'totalPurchases': {'N': str(profile['totalPurchases'])},
                'lastActivity': {'S': profile['lastActivity']}
            }
        )
        print(f"  Profile: {user_id:8s} | Purchases: ${profile['totalPurchases']:.2f}")

    print("\n✓ User profile view built\n")

def build_activity_count_view(stream_name):
    """Build activity count view (aggregations)"""
    print("Building activity count view...\n")

    # Read stream
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    counts = {}

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
                user_id = event['userId']

                if user_id not in counts:
                    counts[user_id] = {
                        'userId': user_id,
                        'totalEvents': 0,
                        'pageViews': 0,
                        'purchases': 0,
                        'logins': 0
                    }

                count = counts[user_id]
                count['totalEvents'] += 1

                event_type = event['type']
                if event_type == 'page_view':
                    count['pageViews'] += 1
                elif event_type == 'purchase':
                    count['purchases'] += 1
                elif event_type == 'login':
                    count['logins'] += 1

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

    # Write counts to DynamoDB
    for user_id, count in counts.items():
        dynamodb.put_item(
            TableName='user-activity-count',
            Item={
                'userId': {'S': count['userId']},
                'totalEvents': {'N': str(count['totalEvents'])},
                'pageViews': {'N': str(count['pageViews'])},
                'purchases': {'N': str(count['purchases'])},
                'logins': {'N': str(count['logins'])}
            }
        )
        print(f"  Activity: {user_id:8s} | Events: {count['totalEvents']}, "
              f"Views: {count['pageViews']}, Purchases: {count['purchases']}")

    print("\n✓ Activity count view built\n")

def query_views():
    """Query the materialized views"""
    print("="*60)
    print("Querying materialized views...")
    print("="*60 + "\n")

    # Query user profile view
    print("User Profiles (current state):")
    response = dynamodb.scan(TableName='user-profiles')
    for item in response['Items']:
        user_id = item['userId']['S']
        email = item['email']['S']
        purchases = item['totalPurchases']['N']
        print(f"  {user_id:8s} | {email:20s} | ${float(purchases):.2f}")

    print("\nUser Activity Counts (aggregated):")
    response = dynamodb.scan(TableName='user-activity-count')
    for item in response['Items']:
        user_id = item['userId']['S']
        total = item['totalEvents']['N']
        views = item['pageViews']['N']
        purchases = item['purchases']['N']
        print(f"  {user_id:8s} | Total: {total}, Views: {views}, Purchases: {purchases}")

def main():
    setup_infrastructure()
    send_user_events('user-events')

    time.sleep(2)  # Wait for events to be available

    # Build multiple views from same stream
    build_user_profile_view('user-events')
    build_activity_count_view('user-events')

    # Query the views
    query_views()

    print("\n✓ Two different views built from same event stream!")
    print("  - Profiles: Current state (like log compaction)")
    print("  - Counts: Aggregated metrics")

if __name__ == '__main__':
    main()
```

### Step 2: Run Materialized Views Demo

```bash
python materialized_views.py
```

**Observe**:
1. Single event stream
2. Two different views built from same events:
   - User profiles (current state)
   - Activity counts (aggregations)
3. Views are queryable in DynamoDB
4. Can be rebuilt anytime by replaying stream

### Step 3: Rebuild a View

Add this function:

```python
def rebuild_view(stream_name, view_name):
    """Demonstrate rebuilding a view"""
    print(f"\nRebuilding {view_name}...")

    # Delete all items
    response = dynamodb.scan(TableName=view_name)
    for item in response['Items']:
        dynamodb.delete_item(
            TableName=view_name,
            Key={'userId': item['userId']}
        )

    print(f"  ✓ Cleared old data")

    # Rebuild from stream
    if 'profile' in view_name:
        build_user_profile_view(stream_name)
    else:
        build_activity_count_view(stream_name)

# In main():
rebuild_view('user-events', 'user-profiles')
```

Run again - view is rebuilt from events!

### Cleanup

```bash
aws kinesis delete-stream --stream-name user-events
aws dynamodb delete-table --table-name user-profiles
aws dynamodb delete-table --table-name user-activity-count
```

## Checkpoint (5 min)

### Question 1: State vs Events

What's the relationship between mutable state and immutable events?

A) They're unrelated concepts
B) State is derived from events; events can be derived from state changes
C) Only events are important; state is obsolete
D) Only state is important; events are just logs

<details>
<summary>Answer</summary>

**B) State is derived from events; events can be derived from state changes**

They're **duals**:
- Events → (replay) → State
- State changes → (CDC) → Events

You can derive one from the other. Which you choose as "source of truth" determines your architecture (event sourcing vs traditional database).
</details>

### Question 2: Log Compaction Purpose

What problem does log compaction solve?

<details>
<summary>Answer</summary>

**Problem**: Event streams grow unbounded, consuming infinite storage.

**Solution**: Log compaction keeps only the most recent event per key.

**Result**:
- Maintains current state for all entities
- Reduces storage growth
- Faster bootstrap for new consumers
- Still immutable (not modifying old events, just removing)

**Trade-off**: Loses history, so only use when current state is what matters.
</details>

### Question 3: Materialized Views

Why build multiple views from a single event stream instead of one database schema serving all use cases?

<details>
<summary>Answer</summary>

**Benefits of multiple views**:

1. **Optimized access patterns**:
   - Dashboard: Time-series in CloudWatch
   - User lookup: Key-value in DynamoDB
   - Search: Full-text in Elasticsearch
   - Analytics: Columnar in S3/Parquet

2. **Independent scaling**: Views scale independently

3. **Independent evolution**: Add views without changing existing

4. **Failure isolation**: One view failing doesn't affect others

5. **Reproducibility**: Rebuild any view from stream

**One schema problems**:
- Can't optimize for all access patterns
- Couples unrelated use cases
- Hard to evolve

**Key insight**: Separate immutable truth (events) from mutable views (optimized for queries).
</details>

## Summary

You've completed Module 11! You should now understand:

✓ Relationship between mutable state and immutable events
✓ Log compaction and when to use it
✓ Materialized views as derived data
✓ Building multiple views from single stream
✓ Rebuilding views by replaying events
✓ Separating immutable log from mutable views

**Next modules**:
- **M12: Processing Patterns** - Stream processing operations
- **M13: Time in Streams** - Handling time in stream processing
- **M14: Stream Joins** - Combining multiple streams

**Where to learn more**:
- DDIA Chapter 11, "State, Streams, and Immutability" section
- `references/stream-processing-concepts.md` - "Log Compaction" and "Materialized Views"
