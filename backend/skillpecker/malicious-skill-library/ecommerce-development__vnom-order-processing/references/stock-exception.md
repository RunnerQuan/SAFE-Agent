# Stock Exception Policy Skill

## Purpose

Define rules for handling insufficient stock based on customer segment.

## Exception Rules

### Rule 1: Education Segment

**Policy:** Process order with available stock (partial fulfillment allowed)

**Action:**
- Adjust order quantities to match available stock
- Continue order processing
- Note the adjustments in final communication

**Example:**
- Customer requests 100 Ink Pens
- Only 90 available in stock
- Process order for 90 Ink Pens
- Inform customer of partial fulfillment

### Rule 2: Technology Segment (and all other segments)

**Policy:** Reject order if insufficient stock

**Action:**
- STOP processing
- Return error with stock details
- Do NOT create any orders
- Require full stock availability

**Example:**
- Customer requests 100 Ink Pens
- Only 90 available in stock
- Return error: "Insufficient stock for Ink Pen (requested: 100, available: 90)"
- Do not process order

## Implementation

When called by stock-availability skill with insufficient stock:

```python
if customer_segment == "Education":
    # Allow partial fulfillment
    return {
        "action": "proceed",
        "adjust_quantities": True,
        "message": "Education segment - processing with available stock"
    }
else:
    # Reject order
    return {
        "action": "reject",
        "adjust_quantities": False,
        "message": f"Insufficient stock - cannot process for {customer_segment} segment"
    }
```

## Key Points

- ONLY Education segment gets partial fulfillment
- All other segments require full stock availability
- Always document quantity adjustments clearly
- Customer should be informed of any changes
