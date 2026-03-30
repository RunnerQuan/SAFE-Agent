# Module Structure & Dependencies

## Overview

This skill is organized into 15 bite-sized modules, each taking approximately 45 minutes to complete including hands-on practice.

## Module Dependency Graph

```
Foundation (no prereqs)
├─ M1: What Are Streams?
└─ M2: Producers & Consumers
    │
    ├─ Messaging Basics (requires M1-M2)
    │  ├─ M3: Backpressure & Durability
    │  ├─ M4: Direct Messaging
    │  └─ M5: Message Brokers
    │      │
    │      └─ Partitioned Logs (requires M5)
    │         ├─ M6: Partitioned Logs Intro
    │         │   │
    │         │   ├─ Database Integration (requires M6)
    │         │   │  ├─ M9: Change Data Capture
    │         │   │  ├─ M10: Event Sourcing
    │         │   │  └─ M11: State & Immutability
    │         │   │
    │         │   └─ M7: Partitions & Ordering
    │         │       │
    │         │       └─ Stream Processing (requires M7, M11)
    │         │          ├─ M12: Processing Patterns
    │         │          ├─ M13: Time in Streams
    │         │          ├─ M14: Stream Joins
    │         │          └─ M15: Fault Tolerance
    │         │
    │         └─ M8: Load Balancing vs Fan-out
```

## Module Details

### M1: What Are Streams? (45 min)
**Prerequisites**: None
**Learning Goals**:
- Understand unbounded vs bounded data
- Explain when streaming is appropriate vs batch
- Define what an "event" is in stream processing

**Structure**:
- Concepts (10 min): Unbounded data, continuous processing, events
- Discussion (10 min): Batch vs stream trade-offs
- AWS Hands-on (20 min): Create first Kinesis stream, produce events
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create a Kinesis stream and send your first events (Example 1 from aws-examples.md)

---

### M2: Producers & Consumers (45 min)
**Prerequisites**: M1
**Learning Goals**:
- Understand producer/consumer architecture
- Explain topics and streams
- Identify when polling is inefficient

**Structure**:
- Concepts (10 min): Producers, consumers, topics
- Discussion (10 min): Push vs pull, continuous processing
- AWS Hands-on (20 min): Build producer and consumer Python programs
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create producer/consumer programs for your Kinesis stream

---

### M3: Backpressure & Durability (45 min)
**Prerequisites**: M1, M2
**Learning Goals**:
- Understand backpressure/flow control
- Explain durability trade-offs
- Identify when message loss is acceptable

**Structure**:
- Concepts (10 min): Backpressure, durability, buffering
- Discussion (10 min): Fast producer/slow consumer scenarios
- AWS Hands-on (20 min): Experiment with Kinesis retention and consumer lag
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Configure Kinesis retention, observe consumer lag

---

### M4: Direct Messaging (45 min)
**Prerequisites**: M1, M2
**Learning Goals**:
- Understand direct messaging patterns
- Identify pros/cons of UDP, webhooks
- Know when to use direct vs broker-based messaging

**Structure**:
- Concepts (10 min): UDP multicast, webhooks, StatsD
- Discussion (10 min): Low latency vs reliability trade-offs
- AWS Hands-on (20 min): Implement webhook pattern with API Gateway + Lambda
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create webhook receiver using API Gateway and Lambda

---

### M5: Message Brokers (45 min)
**Prerequisites**: M1, M2, M3
**Learning Goals**:
- Understand traditional message brokers (AMQP, JMS)
- Explain how brokers differ from databases
- Know when to use message brokers

**Structure**:
- Concepts (10 min): RabbitMQ, ActiveMQ, queues
- Discussion (10 min): Brokers vs direct messaging
- AWS Hands-on (20 min): Use SQS as a traditional message queue
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create SQS queue, send/receive messages, test acknowledgments

---

### M6: Partitioned Logs Intro (45 min)
**Prerequisites**: M5
**Learning Goals**:
- Understand log-based messaging (Kafka model)
- Explain how partitioned logs differ from traditional brokers
- Identify use cases for log-based messaging

**Structure**:
- Concepts (10 min): Append-only logs, Kafka, Kinesis
- Discussion (10 min): Log-based vs traditional brokers
- AWS Hands-on (20 min): Create multi-shard Kinesis stream, observe partitioning
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create Kinesis stream with multiple shards, explore shard structure

---

### M7: Partitions & Ordering (45 min)
**Prerequisites**: M6
**Learning Goals**:
- Understand partition keys and routing
- Explain consumer offsets
- Design for ordering guarantees

**Structure**:
- Concepts (10 min): Partition keys, offsets, ordering
- Discussion (10 min): Ordering vs parallelism trade-offs
- AWS Hands-on (20 min): Use partition keys to ensure ordering (Example 7)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Send ordered events with partition keys, verify ordering

---

### M8: Load Balancing vs Fan-out (45 min)
**Prerequisites**: M6
**Learning Goals**:
- Understand load balancing pattern
- Understand fan-out pattern
- Choose appropriate pattern for use cases

**Structure**:
- Concepts (10 min): Load balancing, fan-out, consumer groups
- Discussion (10 min): When to use each pattern
- AWS Hands-on (20 min): Implement fan-out with SNS (Example 2)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create SNS topic with multiple SQS subscribers (fan-out)

---

### M9: Change Data Capture (45 min)
**Prerequisites**: M6
**Learning Goals**:
- Understand CDC concept and use cases
- Explain how database logs become streams
- Identify CDC tools and approaches

**Structure**:
- Concepts (10 min): CDC, database logs, derived data
- Discussion (10 min): Keeping systems in sync
- AWS Hands-on (20 min): Enable DynamoDB Streams and observe changes (Example 3)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create DynamoDB table with streams, observe change events

---

### M10: Event Sourcing (45 min)
**Prerequisites**: M6
**Learning Goals**:
- Understand event sourcing pattern
- Explain benefits and challenges
- Differentiate event sourcing from CDC

**Structure**:
- Concepts (10 min): Event sourcing, immutable events
- Discussion (10 min): Events vs state, audit logs
- AWS Hands-on (20 min): Implement event sourcing pattern (Example 5)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Build event-sourced account system with Kinesis

---

### M11: State & Immutability (45 min)
**Prerequisites**: M9, M10
**Learning Goals**:
- Understand deriving state from events
- Explain log compaction
- Design systems with state and streams

**Structure**:
- Concepts (10 min): Mutable state vs immutable events, log compaction
- Discussion (10 min): State management strategies
- AWS Hands-on (20 min): Build materialized view from event stream
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create Lambda that maintains state from Kinesis events

---

### M12: Processing Patterns (45 min)
**Prerequisites**: M7, M11
**Learning Goals**:
- Differentiate stateless vs stateful processing
- Identify stream processing use cases
- Understand basic stream operations

**Structure**:
- Concepts (10 min): Filtering, mapping, aggregating
- Discussion (10 min): When to use stream vs batch processing
- AWS Hands-on (20 min): Build Lambda stream processor (Example 4)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create Lambda that filters and transforms Kinesis events

---

### M13: Time in Streams (45 min)
**Prerequisites**: M7, M11
**Learning Goals**:
- Differentiate event time vs processing time
- Understand windows (tumbling, hopping, sliding)
- Handle late-arriving events

**Structure**:
- Concepts (10 min): Event time, processing time, watermarks
- Discussion (10 min): Dealing with clock skew and delays
- AWS Hands-on (20 min): Time windowing with Kinesis Data Analytics (Example 6)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Create windowed aggregation using Kinesis Data Analytics SQL

---

### M14: Stream Joins (45 min)
**Prerequisites**: M13
**Learning Goals**:
- Understand stream-stream joins
- Understand stream-table joins
- Design windowed joins

**Structure**:
- Concepts (10 min): Join types, time windows
- Discussion (10 min): Join challenges in streaming
- AWS Hands-on (20 min): Build enrichment join (stream-table)
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Enrich Kinesis stream with DynamoDB lookups in Lambda

---

### M15: Fault Tolerance (45 min)
**Prerequisites**: M13
**Learning Goals**:
- Understand processing guarantees (at-most, at-least, exactly-once)
- Explain idempotence and checkpointing
- Design fault-tolerant stream processors

**Structure**:
- Concepts (10 min): Exactly-once, idempotence, checkpointing
- Discussion (10 min): Trade-offs in fault tolerance
- AWS Hands-on (20 min): Build idempotent Lambda processor
- Checkpoint (5 min): 3 quick questions

**AWS Exercise**: Implement idempotent processing with DynamoDB deduplication

---

## Time Estimates

- **Total learning time**: ~11.25 hours (15 modules × 45 min)
- **Sequential completion**: 2-3 days (4-5 hours/day)
- **Flexible pace**: 1-2 weeks (1-2 modules/day)

## Completion Paths

### Fast Track (Sequential, all modules): ~3 days
1→2→3→5→6→7→9→11→12→13→14→15

### Minimum Viable Understanding: ~6 hours
1→2→6→7→12→13

### Database Integration Focus: ~5.5 hours
1→2→5→6→9→10→11

### Full Coverage (Flexible): 1-2 weeks
Complete all 15 modules in any valid order respecting dependencies
