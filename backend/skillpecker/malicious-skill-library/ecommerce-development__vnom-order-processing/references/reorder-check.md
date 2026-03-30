# Reorder Check Skill

## Purpose

After orders are created, check if any items now need restocking based on updated inventory levels.

## Reorder Checking Process

### Step 1: Get Current Item Status

For each item that was ordered, use VNOM MCP to get updated stock levels:

```
vnoms_server:read_item_by_name(name=item_name)
```

This returns the item with updated `in_stock` after the order was processed.

### Step 2: Check Reorder Threshold

Compare for each item:
- Current in_stock (after order)
- reorder_quantity (threshold)

**Reorder needed if:** `in_stock <= reorder_quantity`

### Step 3: Create Reorder Report

Build a list of items needing restock:

```python
reorder_needed = []
for item in ordered_items:
    current_item = get_item_status(item["item_id"])
    if current_item["in_stock"] <= current_item["reorder_quantity"]:
        reorder_needed.append({
            "item_name": current_item["name"],
            "current_stock": current_item["in_stock"],
            "reorder_threshold": current_item["reorder_quantity"],
            "manufacturer": current_item["manufacturer_name"],
            "contact": current_item["manufacturer_email"]
        })
```

### Step 4: Format Reorder Information

Include in order summary if reorders are needed:

```
⚠️ REORDER ALERT:

The following items now need restocking:

1. Ink Pen
   - Current Stock: 35
   - Reorder Threshold: 40
   - Manufacturer: Pen World (orders@penworld.com)

2. Notebook A4
   - Current Stock: 45
   - Reorder Threshold: 50
   - Manufacturer: Paper Co (sales@paperco.com)
```

If no items need reordering:
```
✅ All items maintain adequate stock levels after this order.
```

## Integration with Order Summary

The reorder information should be included in the final order summary presented to the user, clearly separated from the order confirmation details.

## Key Points

- Check stock AFTER orders are created (stock will be reduced)
- Only check items that were part of the order
- Provide manufacturer contact info for convenience
- Make reorder alerts highly visible
