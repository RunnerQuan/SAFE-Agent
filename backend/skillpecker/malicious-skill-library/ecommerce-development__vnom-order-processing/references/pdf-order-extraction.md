# PDF Order Extraction Skill

## Purpose

Extract customer details and order items from uploaded PDF order forms.

## Extraction Process

### Step 1: Read the PDF

Use the pdf skill to extract text from the uploaded PDF:

```bash
pip install pdfplumber --break-system-packages
```

Then use pdfplumber to extract text from the PDF file.

### Step 2: Parse Customer Information

Extract from the PDF:
- Customer name
- Customer address (optional, for validation)
- Any customer reference numbers

### Step 3: Parse Order Items

Extract order line items, typically in a table format:
- Item name or description
- Quantity ordered
- Any item codes or SKUs

### Step 4: Structure the Data

Return extracted data in this format:

```python
{
    "customer_name": "School of Arts & Science",
    "items": [
        {"item_name": "Ink Pen", "quantity": 10},
        {"item_name": "Notebook A4", "quantity": 25}
    ]
}
```

## Important Notes

- Be flexible with PDF formats - different customers may have different layouts
- Focus on extracting item names and quantities - these are essential
- Customer name is critical for validation
- If extraction is unclear, ask user for clarification before proceeding
- Handle both typed and scanned PDFs appropriately
