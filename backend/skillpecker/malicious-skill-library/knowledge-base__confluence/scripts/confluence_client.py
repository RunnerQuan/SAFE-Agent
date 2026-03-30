#!/usr/bin/env python3
"""
Confluence REST API Client
Core client for interacting with Confluence REST API.
"""

import json
import os
import urllib.request
import urllib.error
import urllib.parse
import ssl
import base64
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from dotenv import load_dotenv


@dataclass
class ConfluenceConfig:
    """Confluence API configuration."""
    base_url: str = "https://hpe.atlassian.net"
    api_path: str = "/wiki/api/v2"
    api_path_v1: str = "/wiki/rest/api"  # Some endpoints still use v1
    timeout: int = 30
    verify_ssl: bool = True


class ConfluenceClient:
    """
    Confluence REST API client for documentation management.

    Supports both Personal Access Token (PAT) and Basic Auth.
    Uses the same credentials as Jira (Atlassian Cloud).
    """

    def __init__(self, config: Optional[ConfluenceConfig] = None):
        """Initialize the Confluence client."""
        self.config = config or ConfluenceConfig()
        self.token: Optional[str] = None
        self.email: Optional[str] = None
        self.auth_header: Optional[str] = None

        # SSL context
        self.ssl_context = ssl.create_default_context()
        if not self.config.verify_ssl:
            self.ssl_context.check_hostname = False
            self.ssl_context.verify_mode = ssl.CERT_NONE

    @property
    def api_url(self) -> str:
        """Get full API URL (v2)."""
        return f"{self.config.base_url}{self.config.api_path}"

    @property
    def api_url_v1(self) -> str:
        """Get full API URL (v1 - for some endpoints)."""
        return f"{self.config.base_url}{self.config.api_path_v1}"

    def load_credentials(self, env_file: str = os.path.expanduser("~/.claude/.env")) -> Dict[str, str]:
        """Load credentials from .env file using python-dotenv."""
        load_dotenv(env_file)

        # Get credentials from environment variables
        return {
            'JIRA_API_TOKEN': os.getenv('JIRA_API_TOKEN'),
            'EMAIL': os.getenv('EMAIL'),
            'CONFLUENCE_BASE_URL': os.getenv('CONFLUENCE_BASE_URL'),
        }

    def authenticate(self, token: Optional[str] = None, email: Optional[str] = None) -> bool:
        """
        Authenticate with Confluence.

        Uses the same credentials as Jira (JIRA_API_TOKEN and EMAIL).

        Args:
            token: API token (PAT or API key)
            email: User email (for Basic Auth)

        Returns:
            True if authentication successful
        """
        if not token:
            creds = self.load_credentials()
            # Use same credentials as Jira
            token = creds.get('JIRA_API_TOKEN') or creds.get('CONFLUENCE_API_TOKEN')
            email = creds.get('EMAIL') or creds.get('CONFLUENCE_USER_EMAIL')

            if not token:
                raise ValueError("JIRA_API_TOKEN or CONFLUENCE_API_TOKEN not found in .env file")

        self.token = token
        self.email = email

        # Determine auth type
        if email:
            # Basic Auth: email:token
            auth_string = f"{email}:{token}"
            encoded = base64.b64encode(auth_string.encode()).decode()
            self.auth_header = f"Basic {encoded}"
        else:
            # Bearer token (PAT)
            self.auth_header = f"Bearer {token}"

        # Verify authentication
        try:
            self._request("GET", "/spaces", params={"limit": 1})
            return True
        except Exception as e:
            self.auth_header = None
            raise ConnectionError(f"Authentication failed: {e}")

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        use_v1: bool = False
    ) -> Optional[Dict]:
        """
        Make HTTP request to Confluence API.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            data: Request body for POST/PUT
            params: Query parameters
            use_v1: Use v1 API instead of v2

        Returns:
            JSON response or None
        """
        if not self.auth_header:
            raise ConnectionError("Not authenticated. Call authenticate() first.")

        base_url = self.api_url_v1 if use_v1 else self.api_url
        url = f"{base_url}{endpoint}"

        if params:
            query_string = urllib.parse.urlencode(params)
            url = f"{url}?{query_string}"

        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        body = None
        if data:
            body = json.dumps(data).encode('utf-8')

        req = urllib.request.Request(url, data=body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(
                req,
                timeout=self.config.timeout,
                context=self.ssl_context
            ) as response:
                if response.status == 204:
                    return None
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ""
            raise Exception(f"HTTP {e.code}: {e.reason} - {error_body}")
        except urllib.error.URLError as e:
            raise Exception(f"Connection error: {e.reason}")

    # Space Operations

    def get_spaces(
        self,
        space_type: Optional[str] = None,
        status: str = "current",
        limit: int = 25,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get all spaces.

        Args:
            space_type: Filter by type (global, personal)
            status: Space status (current, archived)
            limit: Maximum results per page
            cursor: Pagination cursor

        Returns:
            Spaces list with pagination info
        """
        params = {"limit": limit, "status": status}
        if space_type:
            params["type"] = space_type
        if cursor:
            params["cursor"] = cursor

        return self._request("GET", "/spaces", params=params)

    def get_space(self, space_id: str) -> Dict[str, Any]:
        """
        Get space by ID.

        Args:
            space_id: Space ID

        Returns:
            Space details
        """
        return self._request("GET", f"/spaces/{space_id}")

    def get_space_by_key(self, space_key: str) -> Dict[str, Any]:
        """
        Get space by key.

        Args:
            space_key: Space key (e.g., "DOCS")

        Returns:
            Space details
        """
        # V2 API uses space ID, so we search for it
        spaces = self._request("GET", "/spaces", params={"keys": space_key, "limit": 1})
        results = spaces.get("results", [])
        if not results:
            raise ValueError(f"Space '{space_key}' not found")
        return results[0]

    # Page Operations

    def get_pages(
        self,
        space_id: Optional[str] = None,
        title: Optional[str] = None,
        status: str = "current",
        limit: int = 25,
        cursor: Optional[str] = None,
        body_format: str = "storage"
    ) -> Dict[str, Any]:
        """
        Get pages with optional filters.

        Args:
            space_id: Filter by space ID
            title: Filter by title (exact match)
            status: Page status (current, archived, draft)
            limit: Maximum results
            cursor: Pagination cursor
            body_format: Body format (storage, atlas_doc_format, view)

        Returns:
            Pages list with pagination
        """
        params = {"limit": limit, "status": status, "body-format": body_format}
        if space_id:
            params["space-id"] = space_id
        if title:
            params["title"] = title
        if cursor:
            params["cursor"] = cursor

        return self._request("GET", "/pages", params=params)

    def get_page(
        self,
        page_id: str,
        body_format: str = "storage",
        include_version: bool = True
    ) -> Dict[str, Any]:
        """
        Get page by ID.

        Args:
            page_id: Page ID
            body_format: Body format (storage, atlas_doc_format, view)
            include_version: Include version info

        Returns:
            Page details with content
        """
        params = {"body-format": body_format}
        if include_version:
            params["include-version"] = "true"

        return self._request("GET", f"/pages/{page_id}", params=params)

    def get_page_by_title(
        self,
        space_key: str,
        title: str,
        body_format: str = "storage"
    ) -> Dict[str, Any]:
        """
        Get page by title in a space.

        Args:
            space_key: Space key
            title: Page title
            body_format: Body format

        Returns:
            Page details
        """
        # Get space ID first
        space = self.get_space_by_key(space_key)
        space_id = space.get("id")

        # Search for page
        pages = self.get_pages(space_id=space_id, title=title, body_format=body_format)
        results = pages.get("results", [])

        if not results:
            raise ValueError(f"Page '{title}' not found in space '{space_key}'")
        return results[0]

    def search_pages(
        self,
        query: str,
        space_key: Optional[str] = None,
        limit: int = 25,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for pages using CQL.

        Args:
            query: Search query text
            space_key: Limit to specific space
            limit: Maximum results
            cursor: Pagination cursor

        Returns:
            Search results
        """
        # Build CQL query
        cql_parts = [f'type=page AND text ~ "{query}"']
        if space_key:
            cql_parts.append(f'space.key="{space_key}"')

        cql = " AND ".join(cql_parts)

        params = {
            "cql": cql,
            "limit": limit
        }
        if cursor:
            params["cursor"] = cursor

        # Use v1 API for search
        return self._request("GET", "/content/search", params=params, use_v1=True)

    def get_page_children(
        self,
        page_id: str,
        limit: int = 25,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get child pages.

        Args:
            page_id: Parent page ID
            limit: Maximum results
            cursor: Pagination cursor

        Returns:
            Child pages list
        """
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor

        return self._request("GET", f"/pages/{page_id}/children", params=params)

    def get_page_ancestors(self, page_id: str) -> List[Dict[str, Any]]:
        """
        Get page ancestors (parent hierarchy).

        Args:
            page_id: Page ID

        Returns:
            List of ancestor pages
        """
        # Use v1 API for ancestors
        result = self._request(
            "GET",
            f"/content/{page_id}",
            params={"expand": "ancestors"},
            use_v1=True
        )
        return result.get("ancestors", [])

    # Content Operations

    def get_page_content(
        self,
        page_id: str,
        body_format: str = "view"
    ) -> str:
        """
        Get page content as text.

        Args:
            page_id: Page ID
            body_format: Format (storage, view, atlas_doc_format)

        Returns:
            Page content
        """
        page = self.get_page(page_id, body_format=body_format)
        body = page.get("body", {})

        if body_format == "storage":
            return body.get("storage", {}).get("value", "")
        elif body_format == "view":
            return body.get("view", {}).get("value", "")
        elif body_format == "atlas_doc_format":
            return json.dumps(body.get("atlas_doc_format", {}).get("value", {}))

        return ""

    def create_page(
        self,
        space_id: str,
        title: str,
        content: str,
        parent_id: Optional[str] = None,
        status: str = "current"
    ) -> Dict[str, Any]:
        """
        Create a new page.

        Args:
            space_id: Space ID
            title: Page title
            content: Page content (storage format/HTML)
            parent_id: Parent page ID (optional)
            status: Page status (current, draft)

        Returns:
            Created page info
        """
        data = {
            "spaceId": space_id,
            "status": status,
            "title": title,
            "body": {
                "representation": "storage",
                "value": content
            }
        }

        if parent_id:
            data["parentId"] = parent_id

        return self._request("POST", "/pages", data=data)

    def update_page(
        self,
        page_id: str,
        title: str,
        content: str,
        version_number: int,
        version_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an existing page.

        Args:
            page_id: Page ID
            title: New title
            content: New content (storage format)
            version_number: Current version number (must increment)
            version_message: Optional version comment

        Returns:
            Updated page info
        """
        data = {
            "id": page_id,
            "status": "current",
            "title": title,
            "body": {
                "representation": "storage",
                "value": content
            },
            "version": {
                "number": version_number + 1
            }
        }

        if version_message:
            data["version"]["message"] = version_message

        return self._request("PUT", f"/pages/{page_id}", data=data)

    def delete_page(self, page_id: str) -> None:
        """Delete a page (use with caution)."""
        self._request("DELETE", f"/pages/{page_id}")

    # Labels

    def get_page_labels(self, page_id: str) -> Dict[str, Any]:
        """Get labels on a page."""
        return self._request("GET", f"/pages/{page_id}/labels")

    def add_page_label(self, page_id: str, label: str) -> Dict[str, Any]:
        """Add label to a page."""
        # Use v1 API for labels
        data = [{"prefix": "global", "name": label}]
        return self._request(
            "POST",
            f"/content/{page_id}/label",
            data=data,
            use_v1=True
        )

    # Comments

    def get_page_comments(
        self,
        page_id: str,
        body_format: str = "storage",
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Get comments on a page.

        Args:
            page_id: Page ID
            body_format: Comment body format
            limit: Maximum results

        Returns:
            Comments list
        """
        params = {"body-format": body_format, "limit": limit}
        return self._request("GET", f"/pages/{page_id}/footer-comments", params=params)

    def add_page_comment(
        self,
        page_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Add comment to a page.

        Args:
            page_id: Page ID
            content: Comment content

        Returns:
            Created comment
        """
        data = {
            "pageId": page_id,
            "body": {
                "representation": "storage",
                "value": content
            }
        }
        return self._request("POST", "/footer-comments", data=data)

    # Attachments

    def get_page_attachments(
        self,
        page_id: str,
        limit: int = 25
    ) -> Dict[str, Any]:
        """Get attachments on a page."""
        params = {"limit": limit}
        return self._request("GET", f"/pages/{page_id}/attachments", params=params)

    # User Operations

    def get_current_user(self) -> Dict[str, Any]:
        """Get current authenticated user."""
        return self._request("GET", "/content", params={"limit": 1}, use_v1=True)


# =============================================================================
# Markdown to Confluence Storage Format Converter
# =============================================================================
#
# Confluence does not accept raw Markdown. Content must be converted to
# Confluence Storage Format (XHTML-based) before creating or updating pages.
#
# Key conversions:
#   Markdown              ->  Confluence Storage Format
#   # Heading             ->  <h1>Heading</h1>
#   **bold**              ->  <strong>bold</strong>
#   *italic*              ->  <em>italic</em>
#   `code`                ->  <code>code</code>
#   [text](url)           ->  <a href="url">text</a>
#   - item                ->  <ul><li>item</li></ul>
#   1. item               ->  <ol><li>item</li></ol>
#   ---                   ->  <hr/>
#   ```lang ... ```       ->  <ac:structured-macro ac:name="code">...
#   | table |             ->  <table><tbody><tr><td>...
#
# Obsidian links ([[Page Name]]) must be converted to HTML links:
#   [[Page]] -> <a href="/wiki/spaces/SPACE/pages/ID">Page</a>
# =============================================================================

import re as _re


def _process_inline_formatting(text: str) -> str:
    """
    Convert inline markdown formatting to HTML.

    Handles: **bold**, *italic*, `code`, [text](url)

    Args:
        text: Raw text with markdown formatting

    Returns:
        HTML-formatted text
    """
    # Protect and convert markdown links [text](url)
    links = []
    def save_link(m):
        links.append((m.group(1), m.group(2)))
        return f"__LINK_{len(links)-1}__"
    text = _re.sub(r'\[([^\]]+)\]\(([^)]+)\)', save_link, text)

    # Protect inline code
    codes = []
    def save_code(m):
        codes.append(m.group(1))
        return f"__CODE_{len(codes)-1}__"
    text = _re.sub(r'`([^`]+)`', save_code, text)

    # Protect bold
    bolds = []
    def save_bold(m):
        bolds.append(m.group(1))
        return f"__BOLD_{len(bolds)-1}__"
    text = _re.sub(r'\*\*([^*]+)\*\*', save_bold, text)

    # Protect italic (single *)
    italics = []
    def save_italic(m):
        italics.append(m.group(1))
        return f"__ITALIC_{len(italics)-1}__"
    text = _re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', save_italic, text)

    # Escape HTML special characters
    import html as _html
    text = _html.escape(text)

    # Restore with HTML tags
    for i, (link_text, url) in enumerate(links):
        text = text.replace(f"__LINK_{i}__", f'<a href="{_html.escape(url)}">{_html.escape(link_text)}</a>')
    for i, code in enumerate(codes):
        text = text.replace(f"__CODE_{i}__", f'<code>{_html.escape(code)}</code>')
    for i, bold in enumerate(bolds):
        text = text.replace(f"__BOLD_{i}__", f'<strong>{_html.escape(bold)}</strong>')
    for i, italic in enumerate(italics):
        text = text.replace(f"__ITALIC_{i}__", f'<em>{_html.escape(italic)}</em>')

    return text


def markdown_to_confluence(
    md_content: str,
    obsidian_link_map: Optional[Dict[str, tuple]] = None,
    space_key: Optional[str] = None
) -> str:
    """
    Convert Markdown content to Confluence Storage Format (XHTML).

    Args:
        md_content: Markdown content to convert
        obsidian_link_map: Optional dict mapping Obsidian link text to (page_id, display_title)
                          Example: {"My Note": ("123456", "My Note Title")}
        space_key: Space key for generating Obsidian link URLs (required if obsidian_link_map provided)

    Returns:
        Confluence storage format (XHTML) content

    Example:
        ```python
        md = '''
        # My Document

        This is **bold** and *italic* text with `code`.

        ## Section

        - Item 1
        - Item 2

        [Link](https://example.com)
        '''

        html = markdown_to_confluence(md)
        client.create_page(space_id, "Title", html)
        ```
    """
    import html as _html

    lines = md_content.split('\n')
    result = []
    in_code_block = False
    code_lang = ""
    code_content = []
    in_table = False
    table_rows = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Skip YAML frontmatter
        if line.strip() == '---' and i < 5:
            i += 1
            while i < len(lines) and lines[i].strip() != '---':
                i += 1
            i += 1
            continue

        # Code blocks
        if line.strip().startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lang = line.strip()[3:] or "text"
                code_content = []
            else:
                in_code_block = False
                result.append(
                    f'<ac:structured-macro ac:name="code">'
                    f'<ac:parameter ac:name="language">{code_lang}</ac:parameter>'
                    f'<ac:plain-text-body><![CDATA[{chr(10).join(code_content)}]]></ac:plain-text-body>'
                    f'</ac:structured-macro>'
                )
            i += 1
            continue

        if in_code_block:
            code_content.append(line)
            i += 1
            continue

        # Tables
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_rows = []

            # Skip separator row (|---|---|)
            if _re.match(r'^\|[\s\-:|]+\|$', line.strip()):
                i += 1
                continue

            cells = [c.strip() for c in line.strip().split('|')[1:-1]]
            table_rows.append(cells)
            i += 1
            continue
        elif in_table:
            in_table = False
            if table_rows:
                table_html = '<table><tbody>'
                for idx, row in enumerate(table_rows):
                    tag = 'th' if idx == 0 else 'td'
                    table_html += '<tr>'
                    for cell in row:
                        table_html += f'<{tag}>{_process_inline_formatting(cell)}</{tag}>'
                    table_html += '</tr>'
                table_html += '</tbody></table>'
                result.append(table_html)

        # Convert Obsidian links [[...]] to HTML links
        if obsidian_link_map and space_key:
            def replace_obsidian_link(match):
                link_text = match.group(1)
                if link_text in obsidian_link_map:
                    page_id, title = obsidian_link_map[link_text]
                    return f'[{title}](/wiki/spaces/{space_key}/pages/{page_id})'
                return link_text
            line = _re.sub(r'\[\[([^\]]+)\]\]', replace_obsidian_link, line)
        else:
            # Just remove Obsidian link syntax, keep the text
            line = _re.sub(r'\[\[([^\]]+)\]\]', r'\1', line)

        # Skip image embeds (![[...]])
        if line.strip().startswith('![['):
            i += 1
            continue

        # Headers
        if line.startswith('######'):
            result.append(f'<h6>{_process_inline_formatting(line[6:].strip())}</h6>')
        elif line.startswith('#####'):
            result.append(f'<h5>{_process_inline_formatting(line[5:].strip())}</h5>')
        elif line.startswith('####'):
            result.append(f'<h4>{_process_inline_formatting(line[4:].strip())}</h4>')
        elif line.startswith('###'):
            result.append(f'<h3>{_process_inline_formatting(line[3:].strip())}</h3>')
        elif line.startswith('##'):
            result.append(f'<h2>{_process_inline_formatting(line[2:].strip())}</h2>')
        elif line.startswith('#'):
            result.append(f'<h1>{_process_inline_formatting(line[1:].strip())}</h1>')
        # Horizontal rule
        elif line.strip() == '---':
            result.append('<hr/>')
        # Unordered list items
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            text = line.strip()[2:]
            result.append(f'<ul><li>{_process_inline_formatting(text)}</li></ul>')
        # Ordered list items
        elif _re.match(r'^\d+\.\s', line.strip()):
            text = _re.sub(r'^\d+\.\s', '', line.strip())
            result.append(f'<ol><li>{_process_inline_formatting(text)}</li></ol>')
        # Empty lines (skip)
        elif not line.strip():
            pass
        # Regular paragraphs
        else:
            text = _process_inline_formatting(line)
            if text.strip():
                result.append(f'<p>{text}</p>')

        i += 1

    # Handle remaining table at end of file
    if in_table and table_rows:
        table_html = '<table><tbody>'
        for idx, row in enumerate(table_rows):
            tag = 'th' if idx == 0 else 'td'
            table_html += '<tr>'
            for cell in row:
                table_html += f'<{tag}>{_process_inline_formatting(cell)}</{tag}>'
            table_html += '</tr>'
        table_html += '</tbody></table>'
        result.append(table_html)

    return '\n'.join(result)


def main():
    """Example usage."""
    import sys

    client = ConfluenceClient()

    try:
        client.authenticate()
        print("Authentication successful!")

        # Get spaces
        print("\nFetching spaces...")
        spaces = client.get_spaces(limit=5)

        print(f"Found {len(spaces.get('results', []))} spaces:")
        for space in spaces.get("results", []):
            print(f"  [{space.get('key')}] {space.get('name')}")

        if len(sys.argv) > 2 and sys.argv[1] == "--search":
            query = sys.argv[2]
            print(f"\nSearching for: {query}")
            results = client.search_pages(query, limit=10)

            print(f"Found {results.get('size', 0)} pages:")
            for page in results.get("results", []):
                title = page.get("title", "Untitled")
                space = page.get("_expandable", {}).get("space", "")
                print(f"  {title} - {space}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()