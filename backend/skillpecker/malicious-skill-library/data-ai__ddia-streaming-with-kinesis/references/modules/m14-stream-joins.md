# Module 14: Stream Joins

**Duration**: 45 minutes
**Prerequisites**: M13 (Time in Streams)
**Chapter Reading**: "Stream Joins" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand different types of stream joins
2. Explain stream-stream joins and their challenges
3. Implement stream-table joins (enrichment)
4. Design windowed joins for time-correlated events

## Core Concepts (10 min)

### Why Join Streams?

**Real-world data is often split across multiple streams**:

```
Click stream: [user clicked ad_123]
Impression stream: [ad_123 shown to user]

Question: "What's the click-through rate?"
Answer: Need to JOIN clicks with impressions
```

**Common join scenarios**:
- Match ad clicks with impressions
- Enrich events with user profiles
- Correlate events (login → purchase within 1 hour)
- Combine data from different sources

### Join Types

**1. Stream-Stream Join**
- Join two event streams
- Both inputs are unbounded
- Requires time window (can't wait forever)
- Example: Match clicks with impressions

**2. Stream-Table Join** (Enrichment)
- Join stream with table/database
- Table is bounded, stream is unbounded
- Lookup current value from table
- Example: Add user info to click events

**3. Table-Table Join**
- Join two changelog streams (both are tables)
- Maintain materialized view of join result
- Example: Users table joined with Settings table

### Stream-Stream Joins

**Challenge**: Both streams are unbounded. How long do you wait for matching event?

**Solution**: Time windows

```
Click stream:     [click ad_123 at 10:00:30]
Impression stream: [show ad_123 at 10:00:25]

Join window: 5 minutes

If impression and click within 5 minutes → Match!
If click comes 10 minutes after impression → No match (outside window)
```

**Implementation**:
1. Buffer events from both streams (within window)
2. When event arrives, look for matches in buffer
3. Output join results
4. Discard old events outside window

**Window size trade-offs**:
- **Too small**: Miss valid matches (click 6 minutes after impression)
- **Too large**: Memory usage, slow matching
- **Typical**: Based on domain knowledge (ads: 5 mins, fraud: 1 hour)

### Stream-Table Join (Enrichment)

**Most common pattern**: Enrich stream events with reference data

```
Event stream: [userId: alice, action: purchase]
User table: [alice → {name: "Alice", tier: "gold", country: "US"}]

Enriched: [userId: alice, name: "Alice", tier: "gold", action: purchase]
```

**Implementation approaches**:

**1. Query per event**:
```python
for event in stream:
    user_info = database.get(event['userId'])
    event.update(user_info)
    output(event)
```
- Simple
- Can be slow (database query per event)

**2. Local cache**:
```python
cache = {}
for event in stream:
    if event['userId'] not in cache:
        cache[event['userId']] = database.get(event['userId'])
    event.update(cache[event['userId']])
    output(event)
```
- Faster
- Stale data (cache invalidation challenge)

**3. CDC from table**:
```
User table → CDC stream → Processor maintains local copy
Event stream → Processor looks up local copy
```
- Fast lookups
- Always up-to-date
- More complex

### Join Example: Ad Analytics

**Scenario**: Calculate click-through rate

**Streams**:
```
Impressions: [ad_id, user_id, timestamp]
Clicks: [ad_id, user_id, timestamp]
```

**Join logic**:
```
For each click:
  Find matching impression (same ad_id + user_id within 1 hour)
  Calculate time-to-click
  Output: [ad_id, user_id, impression_time, click_time, time_to_click]
```

**Complications**:
- Click before impression arrives (buffering)
- Impression without click (left join)
- Multiple clicks per impression (which to count?)
- Late arrivals

### Join Correctness

**Questions to answer**:

1. **What if left event arrives before right?**
   - Buffer and wait

2. **What if right never arrives?**
   - Left join (output with null) or inner join (don't output)

3. **What if multiple matches?**
   - All combinations (cartesian product) or business logic (first/last/best)

4. **What if events arrive late?**
   - Emit corrections or drop

## Discussion Questions (10 min)

### Question 1: Join Type Selection

Choose the appropriate join type for each scenario:

A) Add user's country and timezone to every click event
B) Match video "play" events with "pause" events
C) Combine user profile updates with user preferences updates
D) Correlate failed login attempts to detect brute force
E) Show current product prices in order events

<details>
<summary>Expand for discussion</summary>

**Stream-table join** (enrichment):
- **A) Add user info** - Stream of clicks, table of users
- **E) Product prices** - Stream of orders, table of products

**Stream-stream join**:
- **B) Play/pause matching** - Both are event streams
- **D) Failed login correlation** - Stream of login attempts, match related ones

**Table-table join**:
- **C) Profile + preferences** - Both are tables (current state)

**Key distinction**:
- **One bounded + one unbounded** → Stream-table
- **Two unbounded** → Stream-stream
- **Two changelog streams** → Table-table
</details>

### Question 2: Window Size

You're joining ad impressions with clicks. Data shows:
- 80% of clicks happen within 30 seconds of impression
- 95% within 5 minutes
- 99% within 1 hour
- Some clicks up to 24 hours later

What join window size do you choose?

<details>
<summary>Expand for discussion</summary>

**Option 1: 5 minutes** (95% coverage)
- Pros: Low memory, fast processing
- Cons: Miss 5% of clicks
- Good for: Real-time dashboards (approximation OK)

**Option 2: 1 hour** (99% coverage)
- Pros: Captures most clicks
- Cons: Higher memory, slower
- Good for: Accurate analytics

**Option 3: 24 hours** (complete)
- Pros: No missed clicks
- Cons: Very high memory, complex state management
- Good for: Billing (need 100% accuracy)

**Recommended: Depends on use case**

**Alternative: Two-tier**
- Fast path: 5-minute window (real-time metrics)
- Batch path: Daily batch job (complete accuracy)
- Combine in serving layer

**Key insight**: Window size = trade-off between accuracy, latency, and resources.
</details>

### Question 3: Late Arrivals

You're joining impressions and clicks with a 5-minute window.

**Scenario**:
- Impression arrives at 10:00:00 (timestamp 10:00:00)
- Click arrives at 10:06:00 (timestamp 10:00:30)

The click is late (6 minutes after impression), outside 5-minute window. What do you do?

<details>
<summary>Expand for discussion</summary>

**Options**:

**1. Drop the click**:
- Simplest
- Results in under-counting
- OK for approximate metrics

**2. Keep window open longer (grace period)**:
- Wait until 10:00:00 + 5min + 2min grace = 10:07:00
- Captures most late events
- Higher latency (must wait for grace period)

**3. Emit correction**:
- Join succeeds at 10:06:00 (when click arrives)
- Emit updated results: "10:00-10:05 window now has +1 click"
- Requires downstream systems to handle updates
- Most accurate

**4. Track in separate metric**:
- Count on-time matches and late matches separately
- Useful for data quality monitoring

**Best practice**: Depends on accuracy vs latency requirements.

For billing/money: Use option 3 (corrections)
For real-time dashboard: Use option 1 (drop) or 2 (grace period)
</details>

## Hands-On: Stream Enrichment with DynamoDB (20 min)

You'll implement stream-table join pattern by enriching a Kinesis stream with data from DynamoDB.

### Step 1: Setup Data

Create `join_setup.py`:

```python
import boto3
import json
from datetime import datetime
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def create_infrastructure():
    """Create stream and reference table"""
    print("Setting up infrastructure...\n")

    # Create Kinesis stream
    try:
        kinesis.create_stream(StreamName='purchase-events', ShardCount=1)
        print("Creating stream...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName='purchase-events')
    except kinesis.exceptions.ResourceInUseException:
        pass
    print("✓ Stream ready")

    # Create product catalog table
    try:
        dynamodb.create_table(
            TableName='product-catalog',
            AttributeDefinitions=[
                {'AttributeName': 'productId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'productId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Creating product catalog...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName='product-catalog')
    except dynamodb.exceptions.ResourceInUseException:
        pass
    print("✓ Table ready\n")

def populate_catalog():
    """Populate product catalog"""
    print("Populating product catalog...\n")

    products = [
        {'productId': 'LAPTOP-001', 'name': 'MacBook Pro', 'price': 2499.99, 'category': 'Electronics'},
        {'productId': 'PHONE-001', 'name': 'iPhone 15', 'price': 999.99, 'category': 'Electronics'},
        {'productId': 'BOOK-001', 'name': 'DDIA Book', 'price': 45.99, 'category': 'Books'},
        {'productId': 'DESK-001', 'name': 'Standing Desk', 'price': 599.99, 'category': 'Furniture'},
    ]

    for product in products:
        dynamodb.put_item(
            TableName='product-catalog',
            Item={
                'productId': {'S': product['productId']},
                'name': {'S': product['name']},
                'price': {'N': str(product['price'])},
                'category': {'S': product['category']}
            }
        )
        print(f"  {product['productId']:15s} | {product['name']:20s} | ${product['price']:.2f}")

    print("\n✓ Catalog populated\n")

def send_purchase_events():
    """Send purchase events (without product details)"""
    print("Sending purchase events (without product details)...\n")

    purchases = [
        {'userId': 'alice', 'productId': 'LAPTOP-001', 'quantity': 1},
        {'userId': 'bob', 'productId': 'PHONE-001', 'quantity': 2},
        {'userId': 'charlie', 'productId': 'BOOK-001', 'quantity': 3},
        {'userId': 'alice', 'productId': 'DESK-001', 'quantity': 1},
        {'userId': 'bob', 'productId': 'BOOK-001', 'quantity': 1},
    ]

    for purchase in purchases:
        purchase['purchaseId'] = f"purch_{int(time.time()*1000)}"
        purchase['timestamp'] = datetime.utcnow().isoformat() + 'Z'

        kinesis.put_record(
            StreamName='purchase-events',
            Data=json.dumps(purchase),
            PartitionKey=purchase['userId']
        )

        print(f"  {purchase['userId']:8s} | {purchase['productId']:15s} | qty={purchase['quantity']}")
        time.sleep(0.5)

    print("\n✓ Purchase events sent\n")

def main():
    create_infrastructure()
    populate_catalog()
    send_purchase_events()

if __name__ == '__main__':
    main()
```

### Step 2: Build Stream Enrichment Processor

Create `stream_enrichment.py`:

```python
import boto3
import json
import time

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

class EnrichmentProcessor:
    """Stream-table join: Enrich purchases with product info"""
    def __init__(self):
        self.enriched_count = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.product_cache = {}  # Local cache for performance

    def process_stream(self, stream_name):
        """Process and enrich purchase events"""
        print("Processing and enriching purchase stream...\n")
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
                    purchase = json.loads(record['Data'])
                    enriched = self.enrich_purchase(purchase)
                    self.output_enriched(enriched)

                shard_iterator = records_response.get('NextShardIterator')
                if not records_response['Records']:
                    break

        self.print_stats()

    def enrich_purchase(self, purchase):
        """Join purchase with product catalog (stream-table join)"""
        product_id = purchase['productId']

        # Check cache first
        if product_id in self.product_cache:
            product_info = self.product_cache[product_id]
            self.cache_hits += 1
        else:
            # Cache miss - query DynamoDB
            self.cache_misses += 1
            product_info = self.lookup_product(product_id)
            self.product_cache[product_id] = product_info

        # Enrich purchase with product details
        enriched = purchase.copy()
        enriched['productName'] = product_info.get('name', 'Unknown')
        enriched['productPrice'] = product_info.get('price', 0.0)
        enriched['productCategory'] = product_info.get('category', 'Unknown')
        enriched['totalAmount'] = product_info.get('price', 0.0) * purchase['quantity']

        self.enriched_count += 1
        return enriched

    def lookup_product(self, product_id):
        """Lookup product from DynamoDB"""
        try:
            response = dynamodb.get_item(
                TableName='product-catalog',
                Key={'productId': {'S': product_id}}
            )

            if 'Item' in response:
                item = response['Item']
                return {
                    'name': item['name']['S'],
                    'price': float(item['price']['N']),
                    'category': item['category']['S']
                }
        except Exception as e:
            print(f"  ⚠ Lookup error: {e}")

        return {'name': 'Unknown', 'price': 0.0, 'category': 'Unknown'}

    def output_enriched(self, enriched):
        """Output enriched event"""
        print(f"Purchase: {enriched['purchaseId']}")
        print(f"  User: {enriched['userId']}")
        print(f"  Product: {enriched['productName']} ({enriched['productId']})")
        print(f"  Category: {enriched['productCategory']}")
        print(f"  Price: ${enriched['productPrice']:.2f} × {enriched['quantity']}")
        print(f"  Total: ${enriched['totalAmount']:.2f}")
        print()

        # In production: Write to output stream, database, etc.

    def print_stats(self):
        """Print enrichment statistics"""
        print("="*80)
        print("Enrichment Statistics")
        print("="*80)
        print(f"Events enriched: {self.enriched_count}")
        print(f"Cache hits: {self.cache_hits}")
        print(f"Cache misses: {self.cache_misses}")
        if self.cache_hits + self.cache_misses > 0:
            hit_rate = 100 * self.cache_hits / (self.cache_hits + self.cache_misses)
            print(f"Cache hit rate: {hit_rate:.1f}%")
        print("="*80)

def main():
    processor = EnrichmentProcessor()
    processor.process_stream('purchase-events')

    print("\n✓ Stream enrichment complete!")
    print("  Pattern: Stream-table join")
    print("  Benefits: Added product details without storing in events")
    print("  Optimization: Local cache reduces database queries")

if __name__ == '__main__':
    main()
```

### Step 3: Run the Demo

**Terminal 1 - Setup data**:
```bash
python join_setup.py
```

**Terminal 2 - Enrich stream**:
```bash
python stream_enrichment.py
```

**Observe**:
- Purchase events have minimal data (just product ID)
- Processor enriches with product name, price, category
- Total amount calculated from joined data
- Cache improves performance

### Step 4: Stream-Stream Join (Bonus)

Create `stream_stream_join.py`:

```python
import boto3
import json
from datetime import datetime, timedelta
from collections import defaultdict

kinesis = boto3.client('kinesis', region_name='us-east-1')

class StreamStreamJoin:
    """Join two event streams within time window"""
    def __init__(self, window_minutes=5):
        self.window_size = timedelta(minutes=window_minutes)
        self.impression_buffer = {}  # Buffer for impressions
        self.matches = []

    def process_impression(self, impression):
        """Buffer impression for matching"""
        ad_id = impression['adId']
        timestamp = datetime.fromisoformat(impression['timestamp'].replace('Z', ''))

        if ad_id not in self.impression_buffer:
            self.impression_buffer[ad_id] = []

        self.impression_buffer[ad_id].append({
            'timestamp': timestamp,
            'data': impression
        })

        # Clean old impressions outside window
        self.clean_old_impressions()

    def process_click(self, click):
        """Find matching impression for click"""
        ad_id = click['adId']
        click_time = datetime.fromisoformat(click['timestamp'].replace('Z', ''))

        # Look for matching impression
        if ad_id in self.impression_buffer:
            for imp in self.impression_buffer[ad_id]:
                imp_time = imp['timestamp']

                # Check if within window
                time_diff = abs((click_time - imp_time).total_seconds())
                if time_diff <= self.window_size.total_seconds():
                    # Match found!
                    self.matches.append({
                        'ad_id': ad_id,
                        'impression_time': imp_time,
                        'click_time': click_time,
                        'time_to_click': time_diff
                    })
                    print(f"  ✓ Match: ad {ad_id}, "
                          f"time-to-click: {time_diff:.1f}s")
                    return

        print(f"  ✗ No match: ad {ad_id} (outside window or no impression)")

    def clean_old_impressions(self):
        """Remove impressions outside window"""
        now = datetime.utcnow()
        for ad_id in list(self.impression_buffer.keys()):
            self.impression_buffer[ad_id] = [
                imp for imp in self.impression_buffer[ad_id]
                if (now - imp['timestamp']) <= self.window_size
            ]
            if not self.impression_buffer[ad_id]:
                del self.impression_buffer[ad_id]

# Demo usage would follow similar pattern to enrichment example
```

This shows the concept of stream-stream join with windowed buffering.

### Cleanup

```bash
aws kinesis delete-stream --stream-name purchase-events
aws dynamodb delete-table --table-name product-catalog
```

## Checkpoint (5 min)

### Question 1: Join Types

What's the key difference between stream-table and stream-stream joins?

<details>
<summary>Answer</summary>

**Stream-table join**:
- One unbounded stream + one bounded table
- Lookup current value from table
- No buffering needed (just query table)
- Example: Enrich events with user info

**Stream-stream join**:
- Two unbounded streams
- Must buffer events from both streams
- Requires time window (can't wait forever)
- Example: Match clicks with impressions

**Key difference**: Boundedness. Tables are bounded (lookup), streams are unbounded (must buffer and window).
</details>

### Question 2: Caching

Why use a local cache when doing stream-table joins?

<details>
<summary>Answer</summary>

**Without cache**:
- Database query for every event
- High latency (network + database)
- Database load (thousands of queries/second)
- Expensive

**With cache**:
- Query database only on cache miss
- Fast lookups (memory access)
- Reduces database load
- Much cheaper

**Trade-off**: Stale data. If product price changes, cache might have old price.

**Best practice**:
- Cache for frequently accessed data
- Short TTL (e.g., 5 minutes)
- Or use CDC to invalidate cache on changes
</details>

### Question 3: Window Size

In stream-stream joins, what happens if the window is too small or too large?

<details>
<summary>Answer</summary>

**Window too small**:
- Miss valid matches
- Under-count results
- Low memory usage
- Fast processing

**Window too large**:
- Capture more matches
- High memory usage (buffer many events)
- Slow matching (search larger buffer)
- Risk of memory exhaustion

**Right size**: Based on domain knowledge
- Ads: 5-30 minutes (how long users think before clicking)
- Fraud: 1-24 hours (detection window)
- IoT correlation: Seconds to minutes

**Rule of thumb**: Cover 95-99% of legitimate matches, measured from historical data.
</details>

## Summary

You've completed Module 14! You should now understand:

✓ Stream-stream vs stream-table vs table-table joins
✓ Time windowing for stream-stream joins
✓ Stream enrichment pattern (stream-table join)
✓ Buffering and matching strategies
✓ Trade-offs in window size
✓ Caching for performance optimization

**Next module**:
- **M15: Fault Tolerance** - Handling failures in joins, exactly-once processing

**Where to learn more**:
- DDIA Chapter 11, "Stream Joins" section
- `references/stream-processing-concepts.md` - "Stream Joins"
- Apache Flink documentation on joins
