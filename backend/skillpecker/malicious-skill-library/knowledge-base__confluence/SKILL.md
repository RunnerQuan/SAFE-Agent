---
name: "confluence"
description: "Read and search Confluence documentation. Use when the user asks about Confluence pages, wants to search documentation, read wiki content, or browse spaces."
---

# Confluence Skill

You are a specialized assistant for reading and searching documentation in Confluence. This skill enables querying spaces, pages, and searching content across the wiki.

## When to Use This Skill

Activate this skill when the user:
- Asks about Confluence pages or documentation
- Wants to read a wiki page
- Needs to search for documentation
- Asks about Confluence spaces
- Wants to find specific content in the wiki
- Mentions "Confluence", "wiki", or "documentation"

## Prerequisites

Before using this skill, ensure:
1. The `~/.claude/.env` file exists with `JIRA_API_TOKEN` and `EMAIL`
   - **Note**: Uses the SAME credentials as Jira (Atlassian Cloud)
2. Python 3.x is installed
3. Network access to Confluence instance

## Skill Structure

```
.claude/skills/confluence/
├── SKILL.md                    # This file
├── requirements.txt            # Python dependencies
└── scripts/
    ├── confluence_client.py    # Core Confluence REST API client
    └── confluence_helper.py    # High-level documentation operations
```

Project root contains:
- `~/.claude/.env` - API credentials (JIRA_API_TOKEN, EMAIL) - shared with Jira
- `output/` - Exported documents directory

## Quick Start

### Using ConfluenceHelper (Recommended)

```python
import sys
sys.path.insert(0, '.claude/skills/confluence/scripts')

from confluence_helper import ConfluenceHelper

helper = ConfluenceHelper()
helper.connect()

# List spaces
spaces = helper.list_spaces()

# Get a specific space
space = helper.get_space("DOCS")

# Get a page by title
page = helper.get_page(space_key="DOCS", title="Getting Started")

# Get page content as text
content = helper.get_page_content(space_key="DOCS", title="Getting Started", format="text")

# Search for pages
results = helper.search_pages("API documentation", space_key="DOCS")

# List pages in a space
pages = helper.list_pages(space_key="DOCS", limit=50)

# Get child pages
children = helper.get_child_pages(space_key="DOCS", title="Parent Page")

# Get page hierarchy
tree = helper.get_page_tree(space_key="DOCS")

# Export page to markdown
filepath = helper.export_page_to_markdown(space_key="DOCS", title="Getting Started")
```

### Using ConfluenceClient Directly

```python
import sys
sys.path.insert(0, '.claude/skills/confluence/scripts')

from confluence_client import ConfluenceClient

client = ConfluenceClient()
client.authenticate()

# Get all spaces
spaces = client.get_spaces(limit=25)

# Get space by key
space = client.get_space_by_key("DOCS")

# Get page by ID
page = client.get_page("123456", body_format="storage")

# Search pages with CQL
results = client.search_pages("API", space_key="DOCS")

# Get page content
content = client.get_page_content("123456", body_format="view")

# Get child pages
children = client.get_page_children("123456")

# Get page labels
labels = client.get_page_labels("123456")
```

## Available Operations

### ConfluenceHelper Methods

| Method | Description |
|--------|-------------|
| `connect()` | Initialize Confluence API client with credentials |
| `list_spaces(type, limit)` | List all accessible spaces |
| `get_space(space_key)` | Get space details by key |
| `get_page(page_id, space_key, title)` | Get page by ID or space/title |
| `get_page_content(page_id, space_key, title, format)` | Get page content (html, text, storage) |
| `list_pages(space_key, limit)` | List pages in a space |
| `search_pages(query, space_key, limit)` | Search for pages |
| `get_child_pages(page_id, space_key, title)` | Get child pages |
| `get_page_tree(space_key, root_title, depth)` | Get page hierarchy tree |
| `get_page_labels(page_id, space_key, title)` | Get page labels |
| `add_label(label, page_id, space_key, title)` | Add label to page |
| `create_page(space_key, title, content, parent)` | Create new page |
| `update_page(page_id, title, content)` | Update existing page |
| `export_page_to_markdown(page_id, space_key, title)` | Export to markdown |

### ConfluenceClient Methods

| Method | Description |
|--------|-------------|
| `authenticate()` | Load credentials and verify API access |
| `get_spaces(type, status, limit)` | Get all spaces |
| `get_space(space_id)` | Get space by ID |
| `get_space_by_key(space_key)` | Get space by key |
| `get_pages(space_id, title, status, limit)` | Get pages with filters |
| `get_page(page_id, body_format)` | Get page by ID |
| `get_page_by_title(space_key, title)` | Get page by title |
| `search_pages(query, space_key, limit)` | Search with CQL |
| `get_page_content(page_id, format)` | Get page content |
| `get_page_children(page_id)` | Get child pages |
| `get_page_ancestors(page_id)` | Get parent hierarchy |
| `create_page(space_id, title, content, parent_id)` | Create page |
| `update_page(page_id, title, content, version)` | Update page |
| `delete_page(page_id)` | Delete page |
| `get_page_labels(page_id)` | Get labels |
| `add_page_label(page_id, label)` | Add label |
| `get_page_comments(page_id)` | Get comments |
| `add_page_comment(page_id, content)` | Add comment |

## CQL Query Examples

```python
# Search by text
'type=page AND text ~ "API documentation"'

# Search in specific space
'type=page AND space.key="DOCS" AND text ~ "getting started"'

# Search by title
'type=page AND title ~ "Installation"'

# Search by label
'type=page AND label = "howto"'

# Search recently modified
'type=page AND lastModified > now("-7d")'

# Search by creator
'type=page AND creator = currentUser()'

# Combine conditions
'type=page AND space.key="DOCS" AND label = "api" AND text ~ "authentication"'
```

## Common Tasks

### 1. Read Documentation Page

```python
# Get page content as plain text
content = helper.get_page_content(
    space_key="DOCS",
    title="API Reference",
    format="text"
)
print(content)
```

### 2. Search Documentation

```python
# Search across all spaces
results = helper.search_pages("authentication flow")

# Search in specific space
results = helper.search_pages("deployment", space_key="DEVOPS")

for result in results:
    print(f"{result['title']} - {result['space_key']}")
    print(f"  Excerpt: {result['excerpt'][:100]}...")
```

### 3. Browse Space Structure

```python
# Get page tree
tree = helper.get_page_tree(space_key="DOCS", max_depth=2)

def print_tree(node, indent=0):
    print("  " * indent + f"- {node['title']}")
    for child in node.get('children', []):
        print_tree(child, indent + 1)

print_tree(tree['root'])
```

### 4. List All Documentation

```python
# List spaces
spaces = helper.list_spaces()
for space in spaces:
    print(f"[{space.key}] {space.name}")

    # List pages in each space
    pages = helper.list_pages(space.key, limit=10)
    for page in pages:
        print(f"  - {page.title}")
```

### 5. Export Documentation

```python
# Export single page to markdown
helper.export_page_to_markdown(
    space_key="DOCS",
    title="Installation Guide",
    output_dir="docs"
)

# Export multiple pages
pages = helper.list_pages("DOCS")
for page in pages:
    helper.export_page_to_markdown(page_id=page.id, output_dir="docs")
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API token | Check JIRA_API_TOKEN in .env |
| 403 Forbidden | No space access | Request space permissions |
| 404 Not Found | Page/space doesn't exist | Verify space key and page title |
| 400 Bad Request | Invalid CQL query | Check CQL syntax |

## Running Scripts

```bash
# Run the helper example
python .claude/skills/confluence/scripts/confluence_helper.py

# Run client directly with search
python .claude/skills/confluence/scripts/confluence_client.py --search "documentation"
```

## Configuration

The client reads settings from environment:

- `JIRA_API_TOKEN` - API token (shared with Jira) **required**
- `EMAIL` - User email for Basic auth **required**
- `CONFLUENCE_BASE_URL` - Confluence instance URL (default: https://hpe.atlassian.net)

**Note**: Both Jira and Confluence use the same Atlassian Cloud credentials.

## API Limits

- Maximum 100 results per page request
- Rate limits apply per Atlassian instance
- Large exports should be batched

## Uploading Markdown Content to Confluence

**Important**: Confluence does not accept raw Markdown. Content must be converted to Confluence Storage Format (XHTML-based) before creating or updating pages.

Use the `markdown_to_confluence()` function from `confluence_client.py`:

```python
from confluence_client import ConfluenceClient, markdown_to_confluence

client = ConfluenceClient()
client.authenticate()

# Read markdown file
with open('document.md', 'r') as f:
    md_content = f.read()

# Convert to Confluence format
html_content = markdown_to_confluence(md_content)

# Create page
client.create_page(space_id="123456", title="My Document", content=html_content)
```

### Supported Markdown Conversions

| Markdown | Confluence Storage Format |
|----------|---------------------------|
| `# Heading` | `<h1>Heading</h1>` |
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| `` `code` `` | `<code>code</code>` |
| `[text](url)` | `<a href="url">text</a>` |
| `- item` | `<ul><li>item</li></ul>` |
| `1. item` | `<ol><li>item</li></ol>` |
| `---` | `<hr/>` |
| Tables | `<table><tbody>...</tbody></table>` |
| Code blocks | `<ac:structured-macro ac:name="code">...</ac:structured-macro>` |

### Converting Obsidian Links

Obsidian-style links (`[[Page Name]]`) can be converted to Confluence links by providing a mapping:

```python
# Map Obsidian note names to (confluence_page_id, display_title)
link_map = {
    "My Note": ("123456", "My Note Title"),
    "Another Note": ("789012", "Another Note Title"),
}

html_content = markdown_to_confluence(
    md_content,
    obsidian_link_map=link_map,
    space_key="~71202056eac634a14d4700b754441b784f3d81"
)
```

Without a link map, Obsidian links are converted to plain text (the link syntax is removed but the text is kept).
