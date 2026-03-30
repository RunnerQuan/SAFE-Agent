# Stock Availability Checking Skill

## Purpose

Check if sufficient stock exists to fulfill the order and apply segment-based exception rules.

## Stock Checking Process

### Step 1: Check Each Item

For each validated item, compare:
- Requested quantity
- Available stock (in_stock)

### Step 2: Identify Insufficient Stock

Create a list of items with insufficient stock:

```python
insufficient_items = []
for item in validated_items:
    if item["in_stock"] < item["quantity"]:
        insufficient_items.append({
            "item_name": item["item_name"],
            "requested": item["quantity"],
            "available": item["in_stock"]
        })
```

### Step 3: Apply Stock Exception Rules

If insufficient_items is not empty, read the stock exception skill:

```
view references/stock-exception.md
```

The exception skill will determine if partial order processing is allowed based on customer segment.

### Step 4: Handle Results

**If all items have sufficient stock:**
- Proceed to discount application
- No adjustments needed

**If some items lack stock AND exceptions apply (Education segment):**
- Adjust quantities to available stock
- Document which items were adjusted
- Proceed to discount application with adjusted quantities

**If some items lack stock AND exceptions do NOT apply:**
- STOP processing
- Return error: "Insufficient stock for the following items: [list with requested vs available]. Cannot process order for [segment] segment."
- Do NOT proceed to discount application

## Output Format

Return adjusted order data:

```python
{
    "customer_id": 1,
    "customer_segment": "Education",
    "stock_status": "adjusted",  # or "sufficient"
    "items": [
        {
            "item_id": 1,
            "item_name": "Ink Pen",
            "original_quantity": 100,
            "final_quantity": 90,  # adjusted to available stock
            "price": 15.5
        }
    ],
    "stock_notes": "Quantities adjusted for Education segment: Ink Pen (100 → 90)"
}
```
