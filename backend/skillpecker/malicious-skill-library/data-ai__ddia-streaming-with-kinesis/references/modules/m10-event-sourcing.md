# Module 10: Event Sourcing

**Duration**: 45 minutes
**Prerequisites**: M6 (Partitioned Logs Intro)
**Chapter Reading**: "Event Sourcing" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand the event sourcing pattern
2. Differentiate event sourcing from CDC and traditional databases
3. Explain benefits and challenges of event sourcing
4. Implement event-sourced systems with Kinesis

## Core Concepts (10 min)

### What is Event Sourcing?

**Event Sourcing** is a pattern where you store all changes as a sequence of immutable events, rather than storing current state.

**Traditional database** (mutable state):
```
User Table:
userId | name  | balance
-------|-------|--------
acc123 | Alice | 70

Current state stored. History lost.
```

**Event sourcing** (immutable events):
```
Event Log:
1. AccountCreated(acc123, "Alice", balance=0)
2. MoneyDeposited(acc123, amount=100)
3. MoneyWithdrawn(acc123, amount=30)

Current state = replay all events: 0 + 100 - 30 = 70
```

**Key principle**: Events are facts that happened. They never change.

### Event Sourcing vs CDC

| Aspect | CDC | Event Sourcing |
|--------|-----|----------------|
| Source of Truth | Database (mutable state) | Event log (immutable events) |
| Events | Derived from state changes | Primary storage |
| Purpose | Sync derived systems | Store all history |
| Events represent | What changed in database | What happened in domain |
| Completeness | May miss changes | Complete history guaranteed |

**CDC**: Database is primary, stream is secondary
**Event Sourcing**: Events are primary, state is secondary

### Event Structure

**Good events** are:
1. **Immutable** - Never change or delete
2. **Self-contained** - Include all necessary data
3. **Domain-meaningful** - Reflect business events
4. **Timestamped** - Know when they occurred

**Example - E-commerce**:
```json
{
  "eventId": "evt_123",
  "eventType": "OrderPlaced",
  "timestamp": "2024-01-21T10:30:00Z",
  "aggregateId": "order_456",
  "data": {
    "customerId": "cust_789",
    "items": [{"sku": "ITEM1", "qty": 2, "price": 29.99}],
    "totalAmount": 59.98,
    "shippingAddress": {...}
  }
}
```

### Deriving Current State

**State is computed by replaying events**:

```python
def compute_account_balance(account_id, events):
    balance = 0
    for event in events:
        if event.type == 'AccountCreated':
            balance = event.initial_balance
        elif event.type == 'MoneyDeposited':
            balance += event.amount
        elif event.type == 'MoneyWithdrawn':
            balance -= event.amount
    return balance
```

**Optimization**: Snapshots + recent events

```
Snapshot at event 1000: balance = $5,000
Events 1001-1010: +$100, -$50, +$200...
Current balance = $5,000 + (sum of recent events)
```

### Benefits of Event Sourcing

**1. Complete audit trail**:
- Know exactly what happened
- When, who, why
- Regulatory compliance

**2. Time travel**:
- State at any point in history
- Debug issues: "What was balance on Jan 15?"

**3. Replay with new logic**:
- Fix bugs by replaying with corrected code
- Add new features to historical data

**4. Multiple views**:
- Same events → different projections
- Account balance, transaction history, analytics

**5. Event-driven architecture**:
- Other systems consume events
- Natural pub/sub integration

### Challenges

**1. Schema evolution**:
- Events stored forever
- Must handle old event formats

**2. Performance**:
- Replaying many events can be slow
- Need snapshots for efficiency

**3. Eventual consistency**:
- State might not be immediately available
- Projections catch up asynchronously

**4. Complexity**:
- More complex than CRUD
- Requires different mental model

**5. Event versioning**:
- `OrderPlaced` v1 vs v2
- Must support both forever

## Discussion Questions (10 min)

### Question 1: When to Use Event Sourcing

For each system, is event sourcing a good fit?

A) **Banking application** - Track all account transactions
B) **User profile** - Store user name, email, preferences
C) **Shopping cart** - Current items in cart
D) **Order processing** - Complete order lifecycle
E) **Real-time leaderboard** - Current scores

<details>
<summary>Expand for discussion</summary>

**Great fit for event sourcing**:
- **A) Banking** - Perfect! Need complete audit trail, regulatory requirements
- **D) Order processing** - Excellent! Track order lifecycle, debug issues

**Maybe not**:
- **B) User profile** - Overkill. Changes infrequent, history not critical. Traditional database simpler.
- **C) Shopping cart** - Probably not. Cart is ephemeral, history not valuable. Store current state.
- **E) Leaderboard** - No. Current state matters, history not needed. Use cache or database.

**Pattern**: Event sourcing excels when:
- Complete history is valuable
- Audit trail required
- Multiple views of same data needed
- Domain is complex with clear events
</details>

### Question 2: Event Design

You're building an event-sourced order system. Which event design is better?

**Option A - State-oriented**:
```json
{"type": "OrderUpdated", "status": "PAID"}
{"type": "OrderUpdated", "status": "SHIPPED"}
```

**Option B - Domain-oriented**:
```json
{"type": "PaymentReceived", "amount": 99.99, "method": "credit_card"}
{"type": "OrderShipped", "trackingNumber": "1Z999", "carrier": "UPS"}
```

<details>
<summary>Expand for discussion</summary>

**Option B is better** because:

1. **Richer semantics**: Know *what happened*, not just state change
2. **Complete information**: Includes payment method, tracking number
3. **Better audit trail**: Meaningful business events
4. **Multiple consumers**: Different systems care about different events
5. **Debugging**: Easier to understand what happened

**Option A problems**:
- Lost information (how did we get to "PAID"? Payment method?)
- Generic events (everything is "Updated")
- Hard to understand business logic from events

**Key principle**: Events should represent business facts, not database updates.
</details>

### Question 3: Handling Mistakes

You deployed a bug that incorrectly calculated tax on orders. 1,000 orders have wrong tax in the event log.

**Option A**: Delete/modify the incorrect events
**Option B**: Add compensating events
**Option C**: Store correction in metadata
**Option D**: Replay with corrected logic

Which approach(es) are appropriate for event sourcing?

<details>
<summary>Expand for discussion</summary>

**NEVER Option A** - Events are immutable! Never delete or modify.

**Good options**:

**Option B - Compensating events** (best):
```json
{"type": "TaxCorrected", "orderId": "...", "oldTax": 5.00, "newTax": 5.99}
```
- Preserves history
- Clear audit trail
- Follows event sourcing principles

**Option D - Replay with corrected logic**:
- If events contain raw data (item prices)
- Recompute projections with fixed tax calculation
- Future queries use corrected logic

**Option C - Metadata**:
- Less ideal but possible
- Mark events as "corrected"
- More complex to handle

**Key insight**: In event sourcing, history is immutable. Fix forward with new events, not backward by changing history.
</details>

## Hands-On: Event-Sourced Account System (20 min)

You'll build an event-sourced banking system where all operations are stored as events.

### Step 1: Event Store with Kinesis

Create `event_store.py`:

```python
import boto3
import json
from datetime import datetime
import uuid

kinesis = boto3.client('kinesis', region_name='us-east-1')

class EventStore:
    """Event store backed by Kinesis"""
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.ensure_stream_exists()

    def ensure_stream_exists(self):
        """Create stream if needed"""
        try:
            kinesis.create_stream(StreamName=self.stream_name, ShardCount=1)
            print(f"Creating event store '{self.stream_name}'...")
            waiter = kinesis.get_waiter('stream_exists')
            waiter.wait(StreamName=self.stream_name)
            print("✓ Event store ready\n")
        except kinesis.exceptions.ResourceInUseException:
            print(f"✓ Event store '{self.stream_name}' exists\n")

    def append_event(self, aggregate_id, event_type, event_data):
        """Append event to store"""
        event = {
            'eventId': str(uuid.uuid4()),
            'eventType': event_type,
            'aggregateId': aggregate_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'data': event_data
        }

        response = kinesis.put_record(
            StreamName=self.stream_name,
            Data=json.dumps(event),
            PartitionKey=aggregate_id  # All events for same account in order
        )

        print(f"  ✓ Event appended: {event_type}")
        return event

    def get_events(self, aggregate_id=None):
        """Get all events (optionally filtered by aggregate)"""
        # Get shard
        response = kinesis.describe_stream(StreamName=self.stream_name)
        shards = response['StreamDescription']['Shards']

        events = []

        for shard in shards:
            # Get iterator
            iterator_response = kinesis.get_shard_iterator(
                StreamName=self.stream_name,
                ShardId=shard['ShardId'],
                ShardIteratorType='TRIM_HORIZON'
            )
            shard_iterator = iterator_response['ShardIterator']

            # Read all events
            while shard_iterator:
                records_response = kinesis.get_records(ShardIterator=shard_iterator)

                for record in records_response['Records']:
                    event = json.loads(record['Data'])
                    if aggregate_id is None or event['aggregateId'] == aggregate_id:
                        events.append(event)

                shard_iterator = records_response.get('NextShardIterator')
                if not records_response['Records']:
                    break

        return events

class Account:
    """Event-sourced bank account"""
    def __init__(self, account_id, event_store):
        self.account_id = account_id
        self.event_store = event_store
        self.balance = 0
        self.owner = None
        self.created_at = None

    def create(self, owner_name, initial_balance=0):
        """Create account"""
        self.event_store.append_event(
            self.account_id,
            'AccountCreated',
            {
                'owner': owner_name,
                'initialBalance': initial_balance
            }
        )

    def deposit(self, amount):
        """Deposit money"""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        self.event_store.append_event(
            self.account_id,
            'MoneyDeposited',
            {'amount': amount}
        )

    def withdraw(self, amount):
        """Withdraw money"""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Note: We don't check balance here!
        # Balance is derived from events, not stored
        self.event_store.append_event(
            self.account_id,
            'MoneyWithdrawn',
            {'amount': amount}
        )

    def load_from_events(self):
        """Rebuild account state from event history"""
        events = self.event_store.get_events(self.account_id)

        # Reset state
        self.balance = 0
        self.owner = None

        # Replay events
        for event in events:
            self._apply_event(event)

        return self

    def _apply_event(self, event):
        """Apply single event to update state"""
        event_type = event['eventType']
        data = event['data']

        if event_type == 'AccountCreated':
            self.owner = data['owner']
            self.balance = data['initialBalance']
            self.created_at = event['timestamp']

        elif event_type == 'MoneyDeposited':
            self.balance += data['amount']

        elif event_type == 'MoneyWithdrawn':
            self.balance -= data['amount']

    def get_balance(self):
        """Get current balance by replaying events"""
        self.load_from_events()
        return self.balance

    def get_transaction_history(self):
        """Get complete transaction history"""
        events = self.event_store.get_events(self.account_id)
        return events

def main():
    # Create event store
    event_store = EventStore('account-events')

    # Create account
    print("Creating account...")
    account = Account('acc_123', event_store)
    account.create('Alice Johnson', initial_balance=0)

    # Perform transactions
    print("\nPerforming transactions...")
    account.deposit(100.00)
    account.deposit(50.00)
    account.withdraw(30.00)
    account.deposit(25.00)
    account.withdraw(10.00)

    # Compute current balance
    print("\n" + "="*60)
    print("Computing current state from events...")
    print("="*60)
    balance = account.get_balance()
    print(f"\nCurrent balance: ${balance:.2f}")
    print(f"Account owner: {account.owner}")

    # Show transaction history
    print("\n" + "="*60)
    print("Transaction History:")
    print("="*60)
    history = account.get_transaction_history()
    for event in history:
        event_type = event['eventType']
        timestamp = event['timestamp']
        data = event['data']

        if event_type == 'AccountCreated':
            print(f"  {timestamp} | Created | Owner: {data['owner']}, Initial: ${data['initialBalance']:.2f}")
        elif event_type == 'MoneyDeposited':
            print(f"  {timestamp} | Deposit | +${data['amount']:.2f}")
        elif event_type == 'MoneyWithdrawn':
            print(f"  {timestamp} | Withdrawal | -${data['amount']:.2f}")

    print("\n✓ Event sourcing: Complete history preserved!")

if __name__ == '__main__':
    main()
```

### Step 2: Run Event Sourcing Demo

```bash
python event_store.py
```

**Observe**:
1. Events are appended (never updated)
2. Current balance computed by replaying events
3. Complete transaction history available
4. Events are immutable facts

### Step 3: Time Travel

Add this function to `event_store.py`:

```python
def get_balance_at_time(account, target_time):
    """Get balance as it was at specific time"""
    events = account.event_store.get_events(account.account_id)

    balance = 0
    for event in events:
        if event['timestamp'] > target_time:
            break  # Stop at target time

        event_type = event['eventType']
        data = event['data']

        if event_type == 'AccountCreated':
            balance = data['initialBalance']
        elif event_type == 'MoneyDeposited':
            balance += data['amount']
        elif event_type == 'MoneyWithdrawn':
            balance -= data['amount']

    return balance

# In main():
print("\nTime travel: Balance after 2nd event...")
events = account.get_transaction_history()
if len(events) >= 2:
    time_point = events[1]['timestamp']
    historical_balance = get_balance_at_time(account, time_point)
    print(f"Balance at {time_point}: ${historical_balance:.2f}")
```

Run again - you can query historical state!

### Step 4: Build Projection

Create `account_projection.py`:

```python
import boto3
import json
from decimal import Decimal

kinesis = boto3.client('kinesis', region_name='us-east-1')
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def create_projection_table():
    """Create DynamoDB table for account projections"""
    try:
        dynamodb.create_table(
            TableName='account-projections',
            AttributeDefinitions=[
                {'AttributeName': 'accountId', 'AttributeType': 'S'}
            ],
            KeySchema=[
                {'AttributeName': 'accountId', 'KeyType': 'HASH'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Creating projection table...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName='account-projections')
        print("✓ Projection table ready\n")
    except dynamodb.exceptions.ResourceInUseException:
        print("✓ Projection table exists\n")

def build_projection_from_events(stream_name):
    """Build current state projection from event stream"""
    print("Building projection from events...\n")

    # Read all events
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']

    account_states = {}

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
                account_id = event['aggregateId']
                event_type = event['eventType']
                data = event['data']

                # Initialize account state if needed
                if account_id not in account_states:
                    account_states[account_id] = {
                        'accountId': account_id,
                        'balance': Decimal('0'),
                        'owner': None,
                        'transactionCount': 0
                    }

                # Apply event
                state = account_states[account_id]

                if event_type == 'AccountCreated':
                    state['owner'] = data['owner']
                    state['balance'] = Decimal(str(data['initialBalance']))

                elif event_type == 'MoneyDeposited':
                    state['balance'] += Decimal(str(data['amount']))
                    state['transactionCount'] += 1

                elif event_type == 'MoneyWithdrawn':
                    state['balance'] -= Decimal(str(data['amount']))
                    state['transactionCount'] += 1

            shard_iterator = records_response.get('NextShardIterator')
            if not records_response['Records']:
                break

    # Write projections to DynamoDB
    for account_id, state in account_states.items():
        dynamodb.put_item(
            TableName='account-projections',
            Item={
                'accountId': {'S': state['accountId']},
                'balance': {'N': str(state['balance'])},
                'owner': {'S': state['owner']},
                'transactionCount': {'N': str(state['transactionCount'])}
            }
        )
        print(f"  ✓ Projected: {account_id} | Balance: ${float(state['balance']):.2f}")

    print("\n✓ Projection complete! Accounts queryable in DynamoDB.")

def main():
    create_projection_table()
    build_projection_from_events('account-events')

if __name__ == '__main__':
    main()
```

Run it:
```bash
python account_projection.py
```

This builds a queryable view from events - you can rebuild it anytime!

### Cleanup

```bash
aws kinesis delete-stream --stream-name account-events
aws dynamodb delete-table --table-name account-projections
```

## Checkpoint (5 min)

### Question 1: Event Sourcing Definition

What is the key principle of event sourcing?

A) Events are stored in a database
B) Events are the source of truth; state is derived
C) Events are faster than databases
D) Events are only used for logging

<details>
<summary>Answer</summary>

**B) Events are the source of truth; state is derived**

In event sourcing, immutable events are primary storage. Current state is computed by replaying events. This is the opposite of traditional systems where mutable state is primary.
</details>

### Question 2: CDC vs Event Sourcing

What's the key difference between CDC and event sourcing?

<details>
<summary>Answer</summary>

**Source of truth**:

**CDC**:
- Database (mutable state) is source of truth
- Stream is derived from database changes
- Stream may miss changes (if CDC not running)

**Event Sourcing**:
- Events (immutable log) are source of truth
- State is derived from events
- Events are guaranteed complete

**Analogy**: CDC is like tapping a phone line (observing), Event Sourcing is like recording calls (primary record).
</details>

### Question 3: Event Immutability

Why must events be immutable in event sourcing?

<details>
<summary>Answer</summary>

**Events are historical facts** - they represent what actually happened:

1. **Audit trail**: Changing history breaks audit requirements
2. **Consistency**: If events change, replaying gives different results
3. **Trust**: Can't trust system if history changes
4. **Debugging**: Need accurate history to debug issues
5. **Compliance**: Regulations often require immutable records

**Fix forward**: If something was wrong, add new correcting events. Don't change history.

**Analogy**: Like bank statements - errors are corrected with new transactions, not by changing history.
</details>

## Summary

You've completed Module 10! You should now understand:

✓ Event sourcing pattern and principles
✓ Events as source of truth vs derived state
✓ Difference between event sourcing and CDC
✓ Benefits (audit trail, time travel, replay)
✓ Challenges (complexity, performance, schema evolution)
✓ Implementing event sourcing with Kinesis
✓ Building projections from events

**Next modules**:
- **M11: State & Immutability** - Deep dive into deriving state from events
- **M12: Processing Patterns** - Processing event streams
- **M14: Stream Joins** - Combining event streams

**Where to learn more**:
- DDIA Chapter 11, "Event Sourcing" section
- `references/stream-processing-concepts.md` - "Event Sourcing"
- Martin Fowler's "Event Sourcing" article
