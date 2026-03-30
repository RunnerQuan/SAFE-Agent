# Module 8: Load Balancing vs Fan-out

**Duration**: 45 minutes
**Prerequisites**: M6 (Partitioned Logs Intro)
**Chapter Reading**: "Multiple consumers" and consumer patterns section

## Learning Goals

By the end of this module, you will be able to:
1. Understand load balancing pattern for parallel processing
2. Understand fan-out pattern for independent consumers
3. Implement both patterns using AWS services
4. Choose the appropriate pattern for different use cases

## Core Concepts (10 min)

### Load Balancing Pattern

**Definition**: Divide work among multiple consumers so each message is processed by exactly ONE consumer.

```
            ┌─→ Consumer 1 (processes msg 1, 4, 7...)
Producer →  ├─→ Consumer 2 (processes msg 2, 5, 8...)
            └─→ Consumer 3 (processes msg 3, 6, 9...)
```

**Goal**: Parallelize expensive processing

**Use cases**:
- Task distribution (image processing, report generation)
- High-throughput processing
- Scaling workers horizontally

**Key characteristics**:
- Each message delivered to ONE consumer
- Consumers in same "consumer group"
- Increases processing throughput
- No guarantee which consumer gets which message

### Fan-out Pattern

**Definition**: Deliver each message to MULTIPLE consumers, each processing independently.

```
            ┌─→ Consumer A (analytics)     }
Producer →  ├─→ Consumer B (search index)  } All get same messages
            └─→ Consumer C (dashboard)     }
```

**Goal**: Multiple independent uses of same data

**Use cases**:
- Same data for analytics, indexing, caching
- Different systems need same events
- Real-time and batch processing of same stream

**Key characteristics**:
- Each message delivered to ALL consumers
- Consumers are independent
- Each consumer processes at own pace
- Like multiple batch jobs reading same input file

### Comparison Table

| Aspect | Load Balancing | Fan-out |
|--------|---------------|---------|
| Delivery | One consumer per message | All consumers get message |
| Goal | Parallel processing | Multiple independent uses |
| Consumer relationship | Same group, shared work | Independent consumers |
| Scaling | Add consumers = faster | Add consumers = more views |
| Example (AWS) | Multiple Lambdas reading Kinesis | SNS → Multiple SQS queues |

### Consumer Groups (Kafka/Kinesis)

In Kinesis/Kafka, **partitions** enable both patterns:

**Load balancing**:
- Multiple consumers in same application
- Each consumer reads different partitions
- Max consumers = number of partitions

```
Partition 0 → Consumer A
Partition 1 → Consumer B  } Same consumer group
Partition 2 → Consumer C
```

**Fan-out**:
- Different applications (different consumer groups)
- Each application reads all partitions independently

```
Partition 0 → Consumer Group 1 (Analytics)
Partition 0 → Consumer Group 2 (Search)    } Both read all data
Partition 0 → Consumer Group 3 (Monitoring)
```

### AWS Service Patterns

**Load Balancing**:
- **SQS**: Multiple workers pulling from same queue
- **Kinesis**: Multiple Lambda functions reading different shards

**Fan-out**:
- **SNS → Multiple SQS**: Each queue gets copy of message
- **Kinesis → Multiple Lambdas**: Each Lambda reads all shards

## Discussion Questions (10 min)

### Question 1: Pattern Selection

For each scenario, choose load balancing, fan-out, or both:

A) **E-commerce order processing**: Each order needs payment processing, inventory update, and email notification
B) **Image thumbnails**: Generate 3 sizes (small, medium, large) from uploaded images
C) **Log aggregation**: Collect logs from 1000 servers, parse and index them
D) **User analytics**: Same clickstream data needs real-time dashboard and ML model training

<details>
<summary>Expand for discussion</summary>

**A) Order processing: Fan-out**
- One order event → Three independent tasks
- Payment, inventory, email don't depend on each other
- SNS topic → Three SQS queues (one per task type)

**B) Image thumbnails: Load balancing OR fan-out**
- **Load balancing**: One worker generates all 3 sizes (simpler)
- **Fan-out**: Three workers, each generates one size (more parallel)
- Choose based on: Are workers specialized or general-purpose?

**C) Log aggregation: Load balancing**
- High volume, expensive parsing
- Distribute logs across multiple workers
- Each log processed once

**D) User analytics: Fan-out**
- Real-time consumer reads all events (for dashboard)
- Batch consumer reads all events (for ML)
- Both need complete data set
- Different processing speeds OK
</details>

### Question 2: Scaling Considerations

You have a Kinesis stream with 10 shards. You're using load balancing pattern (consumer group).

**Scenario 1**: You have 5 consumers
- Each consumer reads 2 shards
- Processing ~2,000 events/sec

**Scenario 2**: You add 5 more consumers (10 total)
- Each consumer reads 1 shard
- What's the new throughput?

**Scenario 3**: You add 5 MORE consumers (15 total)
- Now you have 15 consumers but only 10 shards
- What happens?

<details>
<summary>Expand for discussion</summary>

**Scenario 2: 10 consumers, 10 shards**
- Each consumer reads 1 shard
- Throughput: ~2,000 events/sec (same!)
- Why? You're still processing all shards
- Benefit: Better fault tolerance, faster rebalancing

**Scenario 3: 15 consumers, 10 shards**
- 10 consumers read 1 shard each
- 5 consumers sit idle (no shards to read)
- Throughput: Still ~2,000 events/sec
- **Key insight**: Max consumers = number of partitions

**To scale further**: Add more shards (reshard the stream)

**Trade-off**: More shards = better parallelism but higher cost
</details>

### Question 3: Failure Scenarios

**Load balancing**: Consumer B crashes while processing messages

**Fan-out**: Consumer B crashes while processing messages

What happens in each case? How does it affect other consumers?

<details>
<summary>Expand for discussion</summary>

**Load balancing (SQS example)**:
- Consumer B's messages become visible again after timeout
- Other consumers (A, C) pick up the work
- No impact on A and C's current work
- System degrades gracefully
- Processing continues (maybe slower)

**Fan-out (SNS → SQS example)**:
- Consumer B's queue accumulates messages
- Other consumers (A, C) unaffected
- Queue B grows (monitor queue depth!)
- When B recovers, processes backlog
- Each consumer independent

**Key difference**: Load balancing shares work (crash affects throughput), fan-out isolates consumers (crash only affects that consumer).
</details>

## Hands-On: Implement Both Patterns (20 min)

You'll implement both patterns using AWS services and observe the different behaviors.

### Step 1: Fan-out with SNS + SQS

Create `fanout_pattern.py`:

```python
import boto3
import json
from datetime import datetime
import time

sns = boto3.client('sns', region_name='us-east-1')
sqs = boto3.client('sqs', region_name='us-east-1')

def create_topic(topic_name):
    """Create SNS topic"""
    response = sns.create_topic(Name=topic_name)
    topic_arn = response['TopicArn']
    print(f"✓ Topic: {topic_arn}\n")
    return topic_arn

def create_queue(queue_name):
    """Create SQS queue"""
    response = sqs.create_queue(QueueName=queue_name)
    queue_url = response['QueueUrl']

    # Get queue ARN
    attrs = sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['QueueArn'])
    queue_arn = attrs['Attributes']['QueueArn']

    print(f"✓ Queue: {queue_name}")
    return queue_url, queue_arn

def subscribe_queue_to_topic(topic_arn, queue_arn, queue_url):
    """Subscribe SQS queue to SNS topic"""
    # Subscribe
    response = sns.subscribe(
        TopicArn=topic_arn,
        Protocol='sqs',
        Endpoint=queue_arn
    )

    # Set queue policy to allow SNS to send messages
    policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "sns.amazonaws.com"},
            "Action": "SQS:SendMessage",
            "Resource": queue_arn,
            "Condition": {
                "ArnEquals": {"aws:SourceArn": topic_arn}
            }
        }]
    }

    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={'Policy': json.dumps(policy)}
    )

    print(f"  ✓ Subscribed to topic")

def setup_fanout():
    """Set up SNS fan-out to multiple SQS queues"""
    print("Setting up fan-out pattern...\n")

    # Create SNS topic
    topic_arn = create_topic('order-events')

    # Create three SQS queues (different services)
    queues = {}

    for queue_name in ['analytics-queue', 'inventory-queue', 'notification-queue']:
        queue_url, queue_arn = create_queue(queue_name)
        subscribe_queue_to_topic(topic_arn, queue_arn, queue_url)
        queues[queue_name] = queue_url

    print()
    return topic_arn, queues

def publish_order_event(topic_arn, order_id, amount):
    """Publish order event to SNS"""
    event = {
        'orderId': order_id,
        'amount': amount,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'items': ['item1', 'item2']
    }

    response = sns.publish(
        TopicArn=topic_arn,
        Message=json.dumps(event),
        Subject='New Order'
    )

    print(f"Published order {order_id} (${amount})")
    return response['MessageId']

def check_queue_messages(queue_name, queue_url):
    """Check messages in queue"""
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['ApproximateNumberOfMessages']
    )

    count = attrs['Attributes']['ApproximateNumberOfMessages']
    print(f"  {queue_name:25s}: {count} messages")

def main():
    # Set up fan-out pattern
    topic_arn, queues = setup_fanout()

    # Publish some order events
    print("Publishing order events...\n")
    for i in range(5):
        order_id = f"ORD-{1000+i}"
        amount = 50.0 + (i * 10)
        publish_order_event(topic_arn, order_id, amount)
        time.sleep(0.5)

    print("\n" + "="*60)
    print("Checking queues (each should have ALL 5 messages)...")
    print("="*60)

    time.sleep(2)  # Wait for message propagation

    for queue_name, queue_url in queues.items():
        check_queue_messages(queue_name, queue_url)

    print("\n✓ Fan-out: All queues received all messages independently!")

if __name__ == '__main__':
    main()
```

### Step 2: Load Balancing with Multiple Consumers

Create `load_balancing_pattern.py`:

```python
import boto3
import json
from datetime import datetime
import time
from multiprocessing import Process

sqs = boto3.client('sqs', region_name='us-east-1')

def create_work_queue():
    """Create SQS queue for load balancing"""
    response = sqs.create_queue(
        QueueName='work-queue',
        Attributes={'VisibilityTimeout': '30'}
    )
    queue_url = response['QueueUrl']
    print(f"✓ Work queue: {queue_url}\n")
    return queue_url

def send_tasks(queue_url, num_tasks=20):
    """Send tasks to queue"""
    print(f"Sending {num_tasks} tasks to queue...\n")

    for i in range(num_tasks):
        task = {
            'taskId': i,
            'type': 'process_image',
            'image': f'image_{i}.jpg',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(task)
        )

        print(f"  Sent task {i}")
        time.sleep(0.1)

    print(f"\n✓ {num_tasks} tasks queued\n")

def worker(worker_id, queue_url, max_tasks=10):
    """Worker process that pulls tasks from queue"""
    print(f"[Worker {worker_id}] Starting...")
    tasks_processed = 0

    while tasks_processed < max_tasks:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=2
        )

        messages = response.get('Messages', [])
        if not messages:
            print(f"[Worker {worker_id}] No more tasks, shutting down")
            break

        for message in messages:
            task = json.loads(message['Body'])
            task_id = task['taskId']

            # Simulate processing
            print(f"[Worker {worker_id}] Processing task {task_id}...")
            time.sleep(1)  # Simulate work

            # Delete message (acknowledge)
            sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message['ReceiptHandle']
            )

            tasks_processed += 1
            print(f"[Worker {worker_id}] ✓ Completed task {task_id}")

    print(f"[Worker {worker_id}] Finished! Processed {tasks_processed} tasks")

def main():
    # Create queue
    queue_url = create_work_queue()

    # Send tasks
    send_tasks(queue_url, num_tasks=20)

    # Start multiple workers (load balancing)
    print("="*60)
    print("Starting 3 workers (load balancing pattern)...")
    print("="*60 + "\n")

    workers = []
    for worker_id in range(1, 4):  # 3 workers
        p = Process(target=worker, args=(worker_id, queue_url, 10))
        p.start()
        workers.append(p)

    # Wait for all workers
    for p in workers:
        p.join()

    print("\n" + "="*60)
    print("✓ Load balancing: Tasks distributed across workers!")
    print("="*60)

if __name__ == '__main__':
    main()
```

### Step 3: Run Fan-out Pattern

```bash
python fanout_pattern.py
```

**Observe**:
- One message published to SNS
- All three SQS queues receive the message
- Each queue has independent copy
- Fan-out pattern in action!

**Verify**:
```bash
# Check each queue has messages
aws sqs get-queue-attributes \
  --queue-url <analytics-queue-url> \
  --attribute-names ApproximateNumberOfMessages
```

### Step 4: Run Load Balancing Pattern

```bash
python load_balancing_pattern.py
```

**Observe**:
- 20 tasks sent to queue
- 3 workers pull tasks in parallel
- Each task processed by exactly ONE worker
- Work distributed (load balancing)

### Step 5: Hybrid Pattern with Kinesis

Create `kinesis_hybrid_pattern.py`:

```python
import boto3
import json
from datetime import datetime

kinesis = boto3.client('kinesis', region_name='us-east-1')

def setup_stream():
    """Create Kinesis stream with multiple shards"""
    stream_name = 'hybrid-pattern-demo'

    try:
        kinesis.create_stream(StreamName=stream_name, ShardCount=3)
        print(f"Creating stream '{stream_name}'...")
        waiter = kinesis.get_waiter('stream_exists')
        waiter.wait(StreamName=stream_name)
    except kinesis.exceptions.ResourceInUseException:
        pass

    print(f"✓ Stream ready: {stream_name}\n")
    return stream_name

def send_events(stream_name, count=30):
    """Send events to stream"""
    for i in range(count):
        event = {
            'eventId': i,
            'userId': f'user{i % 5}',
            'action': 'click',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(event),
            PartitionKey=event['userId']
        )

    print(f"✓ Sent {count} events\n")

def main():
    stream_name = setup_stream()
    send_events(stream_name, count=30)

    print("Kinesis enables BOTH patterns:")
    print("  - Load balancing: Multiple Lambdas, each reads different shards")
    print("  - Fan-out: Multiple applications, each reads ALL shards")
    print("\nDeploy Lambda with Kinesis trigger to see it in action!")

if __name__ == '__main__':
    main()
```

### Cleanup

```bash
# Delete SNS and SQS
aws sns delete-topic --topic-arn <topic-arn>
aws sqs delete-queue --queue-url <queue-url>

# Delete Kinesis stream
aws kinesis delete-stream --stream-name hybrid-pattern-demo
```

## Checkpoint (5 min)

### Question 1: Pattern Identification

You have 1,000 customer support tickets to process. Each ticket needs: sentiment analysis, priority assignment, and routing. Which pattern?

A) Load balancing (one worker per ticket)
B) Fan-out (three workers per ticket, one per task)
C) Both (fan-out to 3 queues, then load balance each queue)
D) Neither

<details>
<summary>Answer</summary>

**C) Both (fan-out to 3 queues, then load balance each queue)**

Architecture:
1. Ticket event → SNS (fan-out)
2. SNS → 3 SQS queues (sentiment, priority, routing)
3. Each queue has multiple workers (load balancing)

This combines both patterns: fan-out for independent tasks, load balancing for parallelism within each task type.
</details>

### Question 2: Consumer Group Limit

A Kinesis stream has 5 shards. You have a consumer group with 10 consumers. How many consumers are active?

<details>
<summary>Answer</summary>

**5 consumers active, 5 idle**

Each shard can be read by only ONE consumer in a group. With 5 shards and 10 consumers:
- 5 consumers read one shard each
- 5 consumers have nothing to read (idle)

To use all 10 consumers, you'd need 10 shards.
</details>

### Question 3: Independence

What's the key difference between load balancing and fan-out regarding consumer independence?

<details>
<summary>Answer</summary>

**Load balancing**: Consumers are NOT independent
- They coordinate (implicitly via partitions or explicitly via groups)
- Share the workload
- If one crashes, others pick up the work

**Fan-out**: Consumers ARE independent
- Don't know about each other
- Each processes complete data set
- If one crashes, others unaffected
- Each can have different processing speed

**Key insight**: Load balancing is about teamwork (shared goal), fan-out is about independence (different goals).
</details>

## Summary

You've completed Module 8! You should now understand:

✓ Load balancing for parallel processing
✓ Fan-out for independent consumers
✓ When to use each pattern
✓ Implementing both with AWS (SNS, SQS, Kinesis)
✓ Consumer groups in partitioned logs
✓ Hybrid patterns combining both approaches

**Next modules**:
- **M9: Change Data Capture** - Database events as streams (fan-out pattern)
- **M12: Processing Patterns** - Stream processing operations (both patterns)
- **M14: Stream Joins** - Combining multiple streams

**Where to learn more**:
- DDIA Chapter 11, "Multiple consumers" section
- `references/stream-processing-concepts.md` - "Load Balancing" and "Fan-out"
