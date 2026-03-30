# Discount Policy Skill

## Purpose

Determine the discount percentage to apply based on customer segment.

## Discount Rules

### Education Segment

**Discount:** 10% (0.1 in decimal)

**Application:**
- Apply to all items in the order
- Applies regardless of order size
- Applies to both full and partial fulfillment orders

### Technology Segment

**Discount:** 5% (0.05 in decimal)

**Application:**
- Apply to all items in the order
- Applies regardless of order size

### Other Segments

**Discount:** 0% (no discount)

**Application:**
- No discount applied
- Use 0.0 as discount value

## Implementation

```python
def get_discount(customer_segment):
    discount_rules = {
        "Education": 0.1,
        "Technology": 0.05
    }
    return discount_rules.get(customer_segment, 0.0)
```

## Usage in Order Creation

When calling `create_order` MCP:

```python
discount = get_discount(customer_segment)

create_order(
    customer_id=customer_id,
    item_id=item_id,
    order_quantity=final_quantity,
    discount=discount
)
```

## Examples

**Education customer ordering Ink Pen (₹15.50):**
- Discount: 10%
- Final price per unit: ₹13.95

**Technology customer ordering Ink Pen (₹15.50):**
- Discount: 5%
- Final price per unit: ₹14.73

**Other segment ordering Ink Pen (₹15.50):**
- Discount: 0%
- Final price per unit: ₹15.50

## Key Points

- Discount is applied per item, not per order
- Segment determines discount automatically
- No minimum order requirements
- Discounts apply to partial orders (Education segment)
