# Order Validation Skill

## Purpose

Validate that the customer exists and all ordered items are found in the VNOM system.

## Validation Process

### Step 1: Validate Customer

Use the VNOM MCP to find the customer:

```
vnoms_server:read_customer_by_name(name=customer_name)
```

**Success criteria:**
- Customer is found
- Extract customer_id and segment for later use

**Failure handling:**
- If customer not found, STOP processing
- Return error: "Customer '[name]' not found in VNOM system. Please add this customer before processing the order."
- Do NOT proceed to item validation

### Step 2: Validate Items

For each item in the order, use VNOM MCP:

```
vnoms_server:read_item_by_name(name=item_name)
```

**Success criteria:**
- All items are found
- Extract item_id, price, and in_stock for each item

**Failure handling:**
- If ANY item is not found, STOP processing
- Return error listing all missing items: "The following items were not found in VNOM: [list]. Please add these items before processing the order."
- Do NOT proceed to stock checking

### Step 3: Return Validated Data

If all validations pass, return:

```python
{
    "customer_id": 1,
    "customer_segment": "Education",
    "items": [
        {
            "item_id": 1,
            "item_name": "Ink Pen",
            "quantity": 10,
            "price": 15.5,
            "in_stock": 90
        },
        {
            "item_id": 2,
            "item_name": "Notebook A4",
            "quantity": 25,
            "price": 45.0,
            "in_stock": 200
        }
    ]
}
```

## Critical Rules

- ALWAYS validate customer first before validating items
- If customer OR any item fails validation, stop immediately
- Clear error messages are essential for user to fix the issue
- Do not attempt partial processing
