# Module 5: Message Brokers

**Duration**: 45 minutes
**Prerequisites**: M1, M2, M3
**Chapter Reading**: "Message brokers" section

## Learning Goals

By the end of this module, you will be able to:
1. Understand how traditional message brokers work (AMQP, JMS)
2. Explain how brokers differ from databases and direct messaging
3. Identify when to use message brokers vs other approaches
4. Work with SQS as a traditional message queue

## Core Concepts (10 min)

### What is a Message Broker?

A **message broker** is a centralized server that routes messages from producers to consumers.

**Key characteristics**:
- Runs as a separate server/service
- Producers send messages to the broker
- Consumers pull messages from the broker
- Broker handles durability, routing, and delivery
- Messages typically deleted after acknowledgment

**Examples**: RabbitMQ, ActiveMQ, Apache Qpid, Amazon SQS

### How Brokers Work

```
Producer → Broker (Queue) → Consumer
                ↓
           [Store messages]
           [Route to queues]
           [Track acks]
```

**Message lifecycle**:
1. Producer sends message to broker
2. Broker stores message in queue
3. Broker delivers message to consumer
4. Consumer processes message
5. Consumer sends acknowledgment
6. Broker deletes message

### Broker vs Database

Message brokers and databases both store data, but with different goals:

| Aspect | Database | Message Broker |
|--------|----------|----------------|
| Purpose | Long-term storage | Temporary transit |
| Access | Query anytime | Consume once |
| Durability | Permanent | Until consumed |
| Typical Latency | Milliseconds | Microseconds-milliseconds |
| Query Support | Rich queries (SQL) | Simple: get next message |
| After Read | Data remains | Data deleted |

**Key difference**: Message brokers optimize for throughput and low latency, not long-term storage.

### Message Acknowledgments

**Acknowledgments** prevent message loss when consumers crash.

**How it works**:
```
1. Broker sends message to consumer
2. Consumer receives message (not yet processed)
3. Consumer processes message
4. Consumer sends ACK to broker
5. Broker deletes message
```

**If consumer crashes** before sending ACK:
- Broker redelivers message to another consumer
- Ensures at-least-once delivery
- May cause duplicates (consumer must handle)

**Acknowledgment modes**:
- **Auto-ack**: Message acked when delivered (fast, risky)
- **Manual-ack**: Consumer explicitly acks (slower, safer)
- **Batch-ack**: Ack multiple messages at once (balance)

### Traditional Brokers: Strengths and Weaknesses

**Strengths**:
- Well-established patterns (AMQP, JMS)
- Good for task distribution
- Handles consumer failures gracefully
- Flexible routing (exchanges, bindings)
- Consumer can process at own pace

**Weaknesses**:
- Messages deleted after consumption (no replay)
- Performance degrades with large queues
- Not suitable for long-term storage
- Complex to achieve exactly-once delivery
- No built-in time-travel or reprocessing

## Discussion Questions (10 min)

### Question 1: When to Use Brokers

You're building these systems. Which should use a traditional message broker (like SQS)?

A) **Task queue** - Web app offloads image resizing to background workers
B) **Real-time analytics** - Count page views per minute
C) **Event log** - Store all user actions for 30 days for replay
D) **Email notifications** - Send emails asynchronously

<details>
<summary>Expand for discussion</summary>

**Good fits for traditional brokers**:
- **A) Task queue** - Perfect! Tasks consumed once, workers ack when done
- **D) Email notifications** - Good fit, each email sent once and forgotten

**Poor fits for traditional brokers**:
- **B) Real-time analytics** - Better with log-based broker (multiple consumers, replay)
- **C) Event log** - Traditional brokers delete messages, need log-based system

**Pattern**: Traditional brokers excel at **task distribution** where each message is consumed once and doesn't need to be replayed.
</details>

### Question 2: Acknowledgment Strategy

You're processing payment transactions. Each transaction triggers:
1. Charge credit card (external API call)
2. Update database
3. Send receipt email

Your consumer crashes after step 1 (card charged) but before sending ACK. The message redelivers. What happens?

<details>
<summary>Expand for discussion</summary>

**Problem: Duplicate charge!**
- Message redelivers (no ACK received)
- Consumer charges card again
- Customer charged twice

**Solutions**:

**Option 1: Idempotency tokens**
```python
def process_payment(message):
    idempotency_key = message['transaction_id']
    if already_processed(idempotency_key):
        return  # Skip, already done

    charge_card(message)
    update_database(message)
    send_email(message)
    mark_processed(idempotency_key)
```

**Option 2: Transactional outbox**
- Store "intent to charge" in database
- Separate process reads intents and executes
- Database transaction prevents duplicates

**Option 3: Change ACK timing**
- ACK before processing (at-most-once)
- Risk: lose message if crash during processing
- Only acceptable for non-critical messages

**Key lesson**: At-least-once delivery requires idempotent processing or deduplication.
</details>

### Question 3: Queue Depth Problem

Your message queue has 1 million messages waiting (queue depth = 1M). What problems might this cause?

<details>
<summary>Expand for discussion</summary>

**Problems with deep queues**:

**1. Memory pressure**:
- Brokers often keep messages in memory
- 1M messages might exceed memory
- Broker may crash or start paging to disk (slow)

**2. Slow delivery**:
- Consumer might be processing old messages
- New messages wait behind old ones (head-of-line blocking)
- Latency increases

**3. Signal of system issues**:
- Consumers can't keep up with producers
- Might indicate:
  - Undersized consumer capacity
  - Consumer bugs/errors
  - Traffic spike

**Solutions**:
- Scale consumers (add more workers)
- Set message TTL (time-to-live) - drop old messages
- Implement backpressure on producers
- Use priority queues for urgent messages
- Switch to streaming system if replay needed

**Best practice**: Monitor queue depth and alert when it grows.
</details>

## Hands-On: Amazon SQS Message Queue (20 min)

You'll create an SQS queue, send messages, process them with acknowledgments, and observe broker behavior.

### Step 1: Create Queue and Send Messages

Create `sqs_producer.py`:

```python
import boto3
import json
from datetime import datetime
import time

sqs = boto3.client('sqs', region_name='us-east-1')

def create_queue(queue_name):
    """Create SQS queue if it doesn't exist"""
    try:
        response = sqs.create_queue(
            QueueName=queue_name,
            Attributes={
                'VisibilityTimeout': '30',  # 30 seconds to process before redelivery
                'MessageRetentionPeriod': '86400'  # 1 day retention
            }
        )
        queue_url = response['QueueUrl']
        print(f"✓ Queue created: {queue_url}\n")
        return queue_url
    except sqs.exceptions.QueueNameExists:
        response = sqs.get_queue_url(QueueName=queue_name)
        queue_url = response['QueueUrl']
        print(f"✓ Queue exists: {queue_url}\n")
        return queue_url

def send_task(queue_url, task_type, task_data):
    """Send a task message to the queue"""
    message = {
        'taskType': task_type,
        'data': task_data,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }

    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message)
    )

    return response['MessageId']

def main():
    queue_name = 'task-queue'
    queue_url = create_queue(queue_name)

    # Send various task types
    tasks = [
        ('resize_image', {'image': 'photo1.jpg', 'size': '800x600'}),
        ('send_email', {'to': 'user@example.com', 'subject': 'Welcome!'}),
        ('process_order', {'order_id': 'ORD-12345', 'amount': 99.99}),
        ('resize_image', {'image': 'photo2.jpg', 'size': '1920x1080'}),
        ('generate_report', {'report_type': 'monthly', 'month': '2024-01'}),
    ]

    print(f"Sending {len(tasks)} tasks to queue...")
    for task_type, task_data in tasks:
        message_id = send_task(queue_url, task_type, task_data)
        print(f"  ✓ {task_type:20s} → MessageId: {message_id[:20]}...")
        time.sleep(0.5)

    # Get queue attributes
    response = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
    )

    attrs = response['Attributes']
    print(f"\nQueue status:")
    print(f"  Messages available: {attrs.get('ApproximateNumberOfMessages', 0)}")
    print(f"  Messages in flight: {attrs.get('ApproximateNumberOfMessagesNotVisible', 0)}")

if __name__ == '__main__':
    main()
```

### Step 2: Create Consumer with Acknowledgments

Create `sqs_consumer.py`:

```python
import boto3
import json
import time
from datetime import datetime

sqs = boto3.client('sqs', region_name='us-east-1')

def get_queue_url(queue_name):
    """Get queue URL"""
    response = sqs.get_queue_url(QueueName=queue_name)
    return response['QueueUrl']

def process_task(message_body):
    """Process a task (simulate work)"""
    task = json.loads(message_body)
    task_type = task['taskType']

    print(f"\n  Processing: {task_type}")
    print(f"    Data: {task['data']}")
    print(f"    Timestamp: {task['timestamp']}")

    # Simulate processing time
    time.sleep(2)

    # Simulate occasional failure (10% chance)
    import random
    if random.random() < 0.1:
        raise Exception("Simulated processing error!")

    print(f"    ✓ Completed successfully")
    return True

def consume_messages(queue_url, max_messages=10):
    """Consume messages from queue with acknowledgments"""
    print(f"Starting consumer for queue: {queue_url}\n")
    print("=" * 60)

    messages_processed = 0
    start_time = datetime.now()

    while messages_processed < max_messages:
        # Receive messages (long polling)
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,  # Process one at a time
            WaitTimeSeconds=5,  # Long polling
            VisibilityTimeout=30  # Hide for 30s while processing
        )

        messages = response.get('Messages', [])
        if not messages:
            print("No more messages. Waiting...")
            continue

        for message in messages:
            message_id = message['MessageId']
            receipt_handle = message['ReceiptHandle']
            body = message['Body']

            print(f"\nMessage {messages_processed + 1}:")
            print(f"  ID: {message_id[:20]}...")

            try:
                # Process the message
                process_task(body)

                # Processing succeeded - send ACK (delete message)
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=receipt_handle
                )
                print(f"  ✓ Message deleted (acknowledged)")
                messages_processed += 1

            except Exception as e:
                # Processing failed - DON'T ACK
                # Message will become visible again after VisibilityTimeout
                print(f"  ✗ Error: {e}")
                print(f"  ⚠ Message NOT deleted - will be redelivered")

    duration = (datetime.now() - start_time).seconds
    print("\n" + "=" * 60)
    print(f"Processed {messages_processed} messages in {duration} seconds")

def main():
    queue_name = 'task-queue'
    queue_url = get_queue_url(queue_name)

    # Consume up to 10 messages
    consume_messages(queue_url, max_messages=10)

if __name__ == '__main__':
    main()
```

### Step 3: Run Producer and Consumer

**Terminal 1 - Send tasks**:
```bash
python sqs_producer.py
```

**Terminal 2 - Process tasks**:
```bash
python sqs_consumer.py
```

**Observe**:
- Messages delivered one at a time
- Processing takes 2 seconds per message
- Simulated failures cause message redelivery
- Successful processing deletes message (ACK)
- Failed processing leaves message (redelivery)

### Step 4: Experiment with Multiple Consumers

Run multiple consumers in parallel:

```bash
# Terminal 2
python sqs_consumer.py &

# Terminal 3
python sqs_consumer.py &

# Terminal 4
python sqs_consumer.py &
```

Observe:
- SQS distributes messages across consumers (load balancing)
- Each message delivered to only ONE consumer
- Parallel processing increases throughput

### Step 5: Test Visibility Timeout

Modify `sqs_consumer.py` to crash before ACK:

```python
def process_task(message_body):
    task = json.loads(message_body)
    print(f"Processing: {task['taskType']}")
    time.sleep(2)

    # Simulate crash BEFORE ACK
    raise Exception("Consumer crashed!")
```

Run the consumer. What happens?

<details>
<summary>Expected result</summary>

1. Message delivered to consumer
2. Consumer starts processing
3. Consumer crashes (exception)
4. No ACK sent
5. After 30 seconds (VisibilityTimeout), message becomes visible again
6. Next poll receives same message (redelivery)

This demonstrates at-least-once delivery!
</details>

### Cleanup

```bash
aws sqs delete-queue --queue-url $(aws sqs get-queue-url --queue-name task-queue --query QueueUrl --output text)
```

## Checkpoint (5 min)

### Question 1: Broker Purpose

What is the PRIMARY purpose of a message broker?

A) Long-term storage of messages
B) Complex querying of message data
C) Routing messages from producers to consumers
D) Real-time analytics on messages

<details>
<summary>Answer</summary>

**C) Routing messages from producers to consumers**

Message brokers are designed for message transit, not storage (A), complex queries (B), or analytics (D). They optimize for delivery and throughput.
</details>

### Question 2: Acknowledgments

What happens if a consumer crashes before sending an ACK?

A) Message is lost forever
B) Message is automatically deleted
C) Message is redelivered to another consumer
D) Producer is notified of failure

<details>
<summary>Answer</summary>

**C) Message is redelivered to another consumer**

This provides at-least-once delivery. The broker doesn't know if processing succeeded, so it assumes failure and redelivers. This may cause duplicates, which consumers must handle.
</details>

### Question 3: Broker vs Database

Why don't message brokers keep messages after they're consumed?

<details>
<summary>Answer</summary>

**Design trade-off for performance**:

1. **Optimized for throughput**: Deleting messages frees resources for new messages
2. **Avoid unbounded growth**: Keeping all messages forever requires infinite storage
3. **Simplify delivery semantics**: Once consumed and acked, no need to track
4. **Performance**: Large message stores slow down delivery

**Trade-off**: Can't replay messages or support multiple independent consumers reading same data. For those use cases, use log-based brokers (Kafka, Kinesis) instead.
</details>

## Summary

You've completed Module 5! You should now understand:

✓ How traditional message brokers work
✓ Message acknowledgments and at-least-once delivery
✓ How brokers differ from databases and direct messaging
✓ When to use brokers vs other approaches
✓ Working with SQS for task distribution

**Next modules**:
- **M6: Partitioned Logs Intro** - Alternative to traditional brokers (Kafka, Kinesis)
- **M8: Load Balancing vs Fan-out** - Consumer patterns in detail
- **M9: Change Data Capture** - Database integration with brokers

**Where to learn more**:
- DDIA Chapter 11, "Message brokers" section
- `references/stream-processing-concepts.md` - "Message Brokers (Traditional)"
