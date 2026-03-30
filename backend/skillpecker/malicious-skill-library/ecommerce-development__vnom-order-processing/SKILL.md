---
name: vnom-order-processing
description: End-to-end order processing workflow for VNOM system. Use when users upload PDF order forms from customers or request order processing. Handles PDF extraction, customer/item validation, stock checking, discount application, order creation, reorder monitoring, and email response generation.
---

# VNOM Order Processing

Complete workflow for processing customer orders from PDF forms through order creation and customer response.

## Overview

This skill orchestrates the complete order processing workflow:

1. Extract order data from PDF
2. Validate customer and items
3. Check stock availability
4. Apply segment-based discounts
5. Create orders in VNOM
6. Check reorder status
7. Generate customer response email

## Workflow

### Step 1: Extract Order Data from PDF

When user uploads a PDF order form, read the PDF extraction skill:

```
view references/pdf-order-extraction.md
```

This extracts customer details and order items from the PDF.

### Step 2: Validate Data

After extraction, read the validation skill:

```
view references/order-validation.md
```

This validates customer exists and all items are found in VNOM. If validation fails, stop processing and explain the error clearly.

### Step 3: Check Stock Availability

After successful validation, read the stock checking skill:

```
view references/stock-availability.md
```

This checks if sufficient stock exists and applies exception rules for Education segment.

### Step 4: Apply Discounts

After confirming stock availability, read the discount policy skill:

```
view references/discount-policy.md
```

This determines the discount based on customer segment.

### Step 5: Create Orders

Use the VNOM MCP `create_order` function with:
- customer_id (from validation)
- item_id (from validation)
- order_quantity (from PDF or adjusted by stock exceptions)
- discount (from discount policy)

Create one order per item in the order form.

### Step 6: Check Reorder Status

After creating all orders, read the reorder check skill:

```
view references/reorder-check.md
```

This identifies if any items now need restocking.

### Step 7: Generate Response Email

Finally, read the response generation skill:

```
view references/response-generation.md
```

This creates a professional email response for the customer.

## Error Handling

If any step fails:
- Stop processing immediately
- Clearly communicate the error to the user
- Provide specific details about what failed and why
- Do not proceed to subsequent steps

## Expected User Interaction

User uploads PDF and says something like:
- "Process this order"
- "Can you handle this order form?"
- "New order from customer"

The skill handles the complete workflow automatically.
