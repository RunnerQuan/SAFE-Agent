# Module 4: Direct Messaging

**Duration**: 45 minutes
**Prerequisites**: M1, M2
**Chapter Reading**: "Direct messaging" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand direct messaging patterns (UDP, webhooks, ZeroMQ)
2. Identify when direct messaging is appropriate
3. Recognize the trade-offs: low latency vs fault tolerance
4. Implement a webhook pattern using AWS services

## Core Concepts (10 min)

### What is Direct Messaging?

**Direct messaging** = Producer sends messages directly to consumer, without an intermediary broker.

```
Producer → → → Consumer
(no broker in between)
```

**Examples**:
- **UDP multicast**: Network packets broadcast to multiple listeners
- **ZeroMQ**: Library for direct messaging patterns
- **Webhooks**: HTTP callbacks from one service to another
- **gRPC streams**: Direct streaming RPC calls
- **WebSockets**: Direct bidirectional browser-server connections

### UDP Multicast

**How it works**:
- Producer broadcasts packets to a multicast IP address
- All consumers listening to that address receive the packet
- Used in financial trading systems for market data

**Characteristics**:
- **Very low latency** (microseconds)
- **No reliability guarantees** - packets can be lost
- **Fire and forget** - sender doesn't wait for acknowledgment
- **No built-in recovery** - if you miss a packet, it's gone

**When to use**:
- Ultra-low latency required (trading systems)
- High throughput needed
- Some data loss acceptable
- On local reliable networks

**When NOT to use**:
- Over internet (firewalls block it)
- When every message is critical
- Need message replay

### Webhooks

**How it works**:
- Service A does something (user signs up)
- Service A sends HTTP POST to Service B's webhook URL
- Service B processes the event

```
GitHub → HTTP POST → Your Server
(when code is pushed)
```

**Characteristics**:
- **Simple** - just HTTP POST
- **Widely used** - Stripe, GitHub, Slack all use webhooks
- **Push-based** - real-time notification
- **Limited reliability** - what if receiver is down?

**Reliability challenges**:
1. **Receiver offline** → Message lost (no retry by default)
2. **Network failure** → Message lost
3. **Slow receiver** → Sender timeout
4. **No ordering guarantee** → Webhooks can arrive out of order

**Making webhooks reliable**:
- **Retries**: Sender retries failed deliveries (with exponential backoff)
- **Idempotency**: Receiver handles duplicates safely
- **Webhook queue**: Put webhooks in queue for processing
- **Signature verification**: Ensure webhook is authentic

### ZeroMQ

**How it works**:
- Lightweight messaging library (not a broker)
- Sockets for direct process-to-process communication
- Multiple patterns: pub-sub, push-pull, request-reply

**Characteristics**:
- **Fast** - in-process or TCP without broker overhead
- **Flexible** - many messaging patterns
- **No broker** - simpler architecture
- **Application-managed reliability** - you handle retries

### Trade-offs: Direct vs Broker

| Aspect | Direct Messaging | Broker-Based |
|--------|------------------|--------------|
| **Latency** | Lower (no intermediary) | Higher (extra hop) |
| **Reliability** | Application handles it | Broker handles it |
| **Fault Tolerance** | Limited (sender/receiver must both be up) | Better (broker buffers) |
| **Complexity** | Simpler architecture | More moving parts |
| **Scalability** | Trickier (each producer knows each consumer) | Easier (broker abstracts) |
| **Replay** | Not possible | Depends on broker |

## Discussion Questions (10 min)

### Question 1: When to Use Direct Messaging

For each scenario, should you use direct messaging or a broker?

**Scenario A**: Real-time multiplayer game, 60 position updates/second per player, 100ms latency budget
**Scenario B**: E-commerce site sending order confirmation emails
**Scenario C**: Financial trading system broadcasting stock prices to 1000 traders
**Scenario D**: Payment processing - recording credit card transactions

<details>
<summary>Expand for discussion</summary>

**Scenario A - Game position updates**:
→ **Direct messaging** (WebSockets or UDP)
- Need ultra-low latency
- Missing a position update is tolerable (next one comes soon)
- Real-time matters more than reliability

**Scenario B - Order emails**:
→ **Broker-based**
- Must not lose orders
- Latency of seconds is acceptable
- Need reliability and retry capability

**Scenario C - Stock prices**:
→ **Direct messaging** (UDP multicast)
- Ultra-low latency required (competitive advantage)
- Missing a price tick is acceptable (next one comes milliseconds later)
- This is exactly what real trading systems use

**Scenario D - Payment processing**:
→ **Broker-based** (definitely)
- Cannot lose transactions
- Need durability and audit trail
- Latency less important than correctness
- Need exactly-once processing

**Pattern**: Direct messaging for latency-sensitive, loss-tolerant data. Broker for reliability-critical data.
</details>

### Question 2: Webhook Reliability

You're building a SaaS app that sends webhooks to customer servers when events happen. What problems might occur?

<details>
<summary>Expand for discussion</summary>

**Problems**:

1. **Customer server is down**:
   - Your webhook fails
   - Need retry logic (how many times? how long?)
   - May need to queue webhooks for later

2. **Customer server is slow**:
   - Takes 30 seconds to respond
   - Ties up your connection
   - Need timeouts

3. **Customer server errors**:
   - Returns 500 error
   - Should you retry? (maybe their code has a bug)
   - Need exponential backoff

4. **Duplicate webhooks**:
   - Network retry causes duplicate
   - Customer receives same event twice
   - Need idempotency (customer should handle duplicates)

5. **Ordering**:
   - Webhook 1 retries multiple times, webhook 2 succeeds first
   - Events arrive out of order
   - Need sequence numbers or timestamps

6. **Security**:
   - Attacker could forge webhooks
   - Need signature verification (HMAC)

**Best practices**:
- Retry with exponential backoff (3-5 attempts)
- Add webhook signature for verification
- Include idempotency key in webhook
- Provide webhook testing endpoint
- Log all webhook attempts for debugging
</details>

### Question 3: Architecture Decision

You're designing a system where microservices need to notify each other of events:
- 10 microservices
- Low traffic (10 events/minute per service)
- All within same AWS VPC
- Need < 100ms latency

Should you use direct messaging (HTTP/webhooks) or a broker (Kinesis/SNS)?

<details>
<summary>Expand for discussion</summary>

**Arguments for direct messaging (webhooks)**:
- Simple: Just HTTP POST between services
- Low latency: Direct connection
- Low traffic: Don't need broker overhead
- Same VPC: Network is reliable

**Arguments for broker**:
- Decouples services (services don't need to know each other's URLs)
- Handles retries automatically
- Built-in durability
- Easier to add new consumers later
- Easier to replay events for debugging

**Best answer: Depends on team experience and future plans**

**If you want simplicity now**: Direct HTTP calls might be fine for low traffic
**If you plan to scale**: Start with broker (SNS/EventBridge) for flexibility

**Reality**: Many systems start with direct calls, then add a broker as they grow. This migration can be painful, so some teams prefer to start with a broker even for low traffic.
</details>

## Hands-On: Webhook Pattern with AWS (20 min)

You'll build a webhook receiver using API Gateway and Lambda, then test sending webhooks to it.

### Step 1: Create Webhook Receiver

Create `webhook_receiver.py` - this will be our Lambda function:

```python
import json
import hashlib
import hmac

# Shared secret for webhook verification (in real system, use environment variable)
WEBHOOK_SECRET = "my-secret-key-12345"

def verify_signature(payload, signature):
    """Verify webhook signature to ensure authenticity"""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def lambda_handler(event, context):
    """Process incoming webhook"""
    print(f"Received webhook: {json.dumps(event)}")

    # Extract body
    body = event.get('body', '{}')

    # Check signature if present
    headers = event.get('headers', {})
    signature = headers.get('x-webhook-signature', '')

    if signature:
        if not verify_signature(body, signature):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

    # Parse event data
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON'})
        }

    # Process the webhook (business logic here)
    event_type = data.get('type', 'unknown')
    print(f"Processing event type: {event_type}")
    print(f"Event data: {json.dumps(data)}")

    # Simulate processing
    if event_type == 'user.created':
        print(f"New user: {data.get('userId')}")
    elif event_type == 'order.placed':
        print(f"New order: {data.get('orderId')}")
    else:
        print(f"Unknown event type: {event_type}")

    # Return success
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Webhook received',
            'eventType': event_type
        })
    }
```

### Step 2: Create Webhook Sender

Create `webhook_sender.py`:

```python
import requests
import json
import hashlib
import hmac
from datetime import datetime
import time

WEBHOOK_SECRET = "my-secret-key-12345"

def compute_signature(payload):
    """Compute HMAC signature for webhook"""
    return hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

def send_webhook(url, event_data, retry_count=3):
    """Send webhook with retry logic"""
    payload = json.dumps(event_data)
    signature = compute_signature(payload)

    headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': datetime.utcnow().isoformat() + 'Z'
    }

    for attempt in range(retry_count):
        try:
            print(f"Attempt {attempt + 1}/{retry_count}: Sending webhook...")

            response = requests.post(
                url,
                data=payload,
                headers=headers,
                timeout=5
            )

            if response.status_code == 200:
                print(f"✓ Webhook delivered successfully")
                print(f"  Response: {response.text}")
                return True
            else:
                print(f"✗ Webhook failed with status {response.status_code}")
                print(f"  Response: {response.text}")

        except requests.exceptions.Timeout:
            print(f"✗ Webhook timed out")
        except requests.exceptions.RequestException as e:
            print(f"✗ Webhook failed: {e}")

        # Exponential backoff
        if attempt < retry_count - 1:
            sleep_time = 2 ** attempt
            print(f"  Retrying in {sleep_time}s...")
            time.sleep(sleep_time)

    print(f"✗ Webhook failed after {retry_count} attempts")
    return False

def main():
    # In real system, this would be your API Gateway URL
    # For demo, we'll use a mock endpoint
    webhook_url = "https://webhook.site/unique-url"  # Replace with your URL

    # Send various webhook events
    events = [
        {
            'type': 'user.created',
            'userId': 'user123',
            'email': 'user@example.com',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        },
        {
            'type': 'order.placed',
            'orderId': 'order456',
            'userId': 'user123',
            'amount': 99.99,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        },
        {
            'type': 'payment.completed',
            'paymentId': 'pay789',
            'orderId': 'order456',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    ]

    print(f"Sending {len(events)} webhooks to {webhook_url}\n")

    for event in events:
        print(f"\n{'='*60}")
        print(f"Event: {event['type']}")
        print(f"{'='*60}")
        send_webhook(webhook_url, event)
        time.sleep(1)

if __name__ == '__main__':
    main()
```

### Step 3: Test with webhook.site

Since we can't easily deploy Lambda from CLI, we'll use a webhook testing service:

1. **Get a webhook URL**:
   - Go to https://webhook.site
   - Copy your unique URL

2. **Update webhook_sender.py**:
   ```python
   webhook_url = "https://webhook.site/YOUR-UNIQUE-ID"
   ```

3. **Send webhooks**:
   ```bash
   pip install requests  # If not already installed
   python webhook_sender.py
   ```

4. **View in webhook.site**:
   - Refresh the page
   - See your webhooks arrive
   - Examine headers, body, signature

### Step 4: Simulate Failures

Modify `webhook_sender.py` to test retry logic:

```python
# Test with a non-existent URL to see retries
webhook_url = "http://localhost:9999/webhook"  # Nothing listening here
```

Run it and observe:
- First attempt fails immediately
- Retry after 1 second
- Retry after 2 seconds
- Retry after 4 seconds (exponential backoff)

### Step 5: Compare to Kinesis

Think about the differences:

**Webhooks**:
- Direct HTTP call
- Failed webhooks require retry logic
- No replay capability
- Receiver must be online

**Kinesis**:
- Events buffered in stream
- Consumer can be offline, events wait
- Can replay events
- Built-in retry and durability

Both have their place!

## Checkpoint (5 min)

### Question 1: Direct Messaging Characteristics

Which is TRUE about direct messaging?

A) Always more reliable than broker-based messaging
B) Lower latency than broker-based messaging
C) Easier to implement fault tolerance
D) Better for high-throughput systems

<details>
<summary>Answer</summary>

**B) Lower latency than broker-based messaging**

Direct messaging has lower latency because there's no intermediary hop. However, it's generally LESS reliable (not A), HARDER to make fault-tolerant (not C), and high throughput depends on the use case (not necessarily D).
</details>

### Question 2: Webhook Best Practice

What should you include when sending webhooks?

A) Retry logic with exponential backoff
B) HMAC signature for verification
C) Idempotency key to handle duplicates
D) All of the above

<details>
<summary>Answer</summary>

**D) All of the above**

Good webhook implementations include:
- Retry logic (receiver might be temporarily down)
- Signature (receiver can verify it's authentic)
- Idempotency key (receiver can detect duplicates)
- Plus: timestamp, event ID, event type
</details>

### Question 3: When Direct Messaging Makes Sense

Direct messaging is most appropriate for:

A) Financial transactions requiring durability
B) Low-latency telemetry data where some loss is acceptable
C) Systems requiring message replay
D) Asynchronous processing of large batches

<details>
<summary>Answer</summary>

**B) Low-latency telemetry data where some loss is acceptable**

Direct messaging trades reliability for latency. Good for:
- Real-time gaming
- Live video streaming
- Monitoring metrics (StatsD)
- Stock price feeds

Not good for transactions (A), replay requirements (C), or when broker buffering helps (D).
</details>

## Summary

You've completed Module 4! You should now understand:

✓ Direct messaging patterns (UDP, webhooks, ZeroMQ)
✓ Trade-offs: low latency vs fault tolerance
✓ When to use direct messaging vs brokers
✓ How to implement reliable webhooks
✓ Retry logic and signature verification

**Next modules**:
- **M5: Message Brokers** - Traditional broker-based patterns
- **M6: Partitioned Logs Intro** - Log-based messaging (Kafka model)

**Where to learn more**:
- DDIA Chapter 11, "Direct messaging" section
- `references/stream-processing-concepts.md` - "Direct Messaging" section
