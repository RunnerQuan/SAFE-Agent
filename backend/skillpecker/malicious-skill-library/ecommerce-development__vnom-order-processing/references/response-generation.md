# Order Response Generation Skill

## Purpose

Generate a professional email response to send to the customer confirming their order.

## Response Structure

### Subject Line

```
Order Confirmation - [Customer Name] - Order #[Order IDs]
```

### Email Body

```
Dear [Customer Name],

Thank you for your order. We are pleased to confirm the following:

ORDER DETAILS:
─────────────────────────────────────────

[For each item:]
• [Item Name]
  Quantity: [Quantity]
  Unit Price: ₹[Original Price]
  Discount: [Discount %]
  Final Price: ₹[Discounted Price] per unit
  Total: ₹[Quantity × Discounted Price]

─────────────────────────────────────────
GRAND TOTAL: ₹[Sum of all item totals]
Total Savings: ₹[Total discount amount]

[If stock adjustments were made:]
IMPORTANT NOTE:
Some items were adjusted due to current stock availability:
• [Item Name]: Requested [Original Qty], Fulfilled [Final Qty]

[Standard closing:]
Your order is being processed and will be prepared for delivery shortly.

If you have any questions about this order, please don't hesitate to contact us.

Best regards,
VNOM Order Processing Team
```

## Example Email

```
Dear School of Arts & Science,

Thank you for your order. We are pleased to confirm the following:

ORDER DETAILS:
─────────────────────────────────────────

• Ink Pen
  Quantity: 10
  Unit Price: ₹15.50
  Discount: 10%
  Final Price: ₹13.95 per unit
  Total: ₹139.50

• Notebook A4
  Quantity: 25
  Unit Price: ₹45.00
  Discount: 10%
  Final Price: ₹40.50 per unit
  Total: ₹1,012.50

─────────────────────────────────────────
GRAND TOTAL: ₹1,152.00
Total Savings: ₹117.00

Your order is being processed and will be prepared for delivery shortly.

If you have any questions about this order, please don't hesitate to contact us.

Best regards,
VNOM Order Processing Team
```

## Formatting Guidelines

- Use clear section separators
- Include all pricing details for transparency
- Highlight total savings from discounts
- Use professional but friendly tone
- Include item-level and order-level totals
- Format currency consistently (₹ symbol)
- Use bullet points for line items

## Special Cases

**Partial Fulfillment (Education segment):**
- Add "IMPORTANT NOTE" section
- List all adjusted quantities
- Explain reason clearly
- Maintain positive tone

**No Discount Applied:**
- Omit discount percentage line
- Show original price as final price
- No "Total Savings" line needed

## Key Points

- Response should be ready to copy-paste into email
- Include all financial details for record-keeping
- Professional formatting for business communication
- Clear and transparent about any changes
