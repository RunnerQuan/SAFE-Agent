#!/usr/bin/env python3
"""
Confluence Helper
High-level operations for managing Confluence documentation.
"""

import json
import os
import re
import html
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

from confluence_client import ConfluenceClient, ConfluenceConfig


@dataclass
class Page:
    """Structured page data."""
    id: str
    title: str
    space_id: str
    space_key: str = ""
    status: str = "current"
    parent_id: Optional[str] = None
    version: int = 1
    created: Optional[str] = None
    updated: Optional[str] = None
    author: Optional[str] = None
    content: str = ""
    labels: List[str] = field(default_factory=list)
    url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "space_id": self.space_id,
            "space_key": self.space_key,
            "status": self.status,
            "parent_id": self.parent_id,
            "version": self.version,
            "created": self.created,
            "updated": self.updated,
            "author": self.author,
            "content": self.content,
            "labels": self.labels,
            "url": self.url
        }


@dataclass
class Space:
    """Structured space data."""
    id: str
    key: str
    name: str
    description: str = ""
    space_type: str = "global"
    status: str = "current"
    homepage_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "key": self.key,
            "name": self.name,
            "description": self.description,
            "type": self.space_type,
            "status": self.status,
            "homepage_id": self.homepage_id
        }


class ConfluenceHelper:
    """
    High-level helper for managing Confluence documentation.

    Provides convenience methods for common documentation operations.
    """

    def __init__(self, config: Optional[ConfluenceConfig] = None):
        """Initialize the helper."""
        self.client = ConfluenceClient(config)
        self.connected = False

    def connect(self, token: Optional[str] = None, email: Optional[str] = None) -> bool:
        """
        Connect to Confluence.

        Uses same credentials as Jira (JIRA_API_TOKEN and EMAIL).

        Args:
            token: API token (optional, reads from .env if not provided)
            email: User email (optional)

        Returns:
            True if connected successfully
        """
        self.client.authenticate(token, email)
        self.connected = True
        return True

    def _parse_space(self, space: Dict[str, Any]) -> Space:
        """Parse Confluence space into Space."""
        return Space(
            id=space.get("id", ""),
            key=space.get("key", ""),
            name=space.get("name", ""),
            description=space.get("description", {}).get("plain", {}).get("value", "") if isinstance(space.get("description"), dict) else "",
            space_type=space.get("type", "global"),
            status=space.get("status", "current"),
            homepage_id=space.get("homepageId")
        )

    def _parse_page(self, page: Dict[str, Any]) -> Page:
        """Parse Confluence page into Page."""
        # Extract content
        body = page.get("body", {})
        content = ""
        if "storage" in body:
            content = body["storage"].get("value", "")
        elif "view" in body:
            content = body["view"].get("value", "")

        # Extract version
        version_info = page.get("version", {})
        version = version_info.get("number", 1) if isinstance(version_info, dict) else 1

        # Extract author
        author = None
        if version_info and isinstance(version_info, dict):
            author_info = version_info.get("authorId") or version_info.get("by", {})
            if isinstance(author_info, dict):
                author = author_info.get("displayName") or author_info.get("publicName")

        # Build URL
        base_url = self.client.config.base_url
        url = f"{base_url}/wiki/spaces/{page.get('spaceId')}/pages/{page.get('id')}"

        return Page(
            id=page.get("id", ""),
            title=page.get("title", ""),
            space_id=page.get("spaceId", ""),
            status=page.get("status", "current"),
            parent_id=page.get("parentId"),
            version=version,
            created=page.get("createdAt"),
            updated=version_info.get("createdAt") if isinstance(version_info, dict) else None,
            author=author,
            content=content,
            labels=[],  # Labels need separate API call
            url=url
        )

    def _strip_html(self, html_content: str) -> str:
        """
        Strip HTML tags and return plain text.

        Args:
            html_content: HTML string

        Returns:
            Plain text
        """
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', html_content)
        # Decode HTML entities
        text = html.unescape(text)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    # Space Operations

    def list_spaces(
        self,
        space_type: Optional[str] = None,
        limit: int = 25
    ) -> List[Space]:
        """
        List all spaces.

        Args:
            space_type: Filter by type (global, personal)
            limit: Maximum results

        Returns:
            List of Space objects
        """
        result = self.client.get_spaces(space_type=space_type, limit=limit)
        return [self._parse_space(s) for s in result.get("results", [])]

    def get_space(self, space_key: str) -> Space:
        """
        Get space by key.

        Args:
            space_key: Space key (e.g., "DOCS")

        Returns:
            Space object
        """
        space = self.client.get_space_by_key(space_key)
        return self._parse_space(space)

    # Page Operations

    def get_page(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None,
        include_content: bool = True
    ) -> Page:
        """
        Get a page by ID or by space/title.

        Args:
            page_id: Page ID (if known)
            space_key: Space key (required if using title)
            title: Page title (required if using space_key)
            include_content: Include page content

        Returns:
            Page object
        """
        body_format = "storage" if include_content else "none"

        if page_id:
            page = self.client.get_page(page_id, body_format=body_format)
        elif space_key and title:
            page = self.client.get_page_by_title(space_key, title, body_format=body_format)
        else:
            raise ValueError("Either page_id or (space_key + title) required")

        return self._parse_page(page)

    def get_page_content(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None,
        format: str = "html"
    ) -> str:
        """
        Get page content.

        Args:
            page_id: Page ID
            space_key: Space key (alternative to page_id)
            title: Page title (required with space_key)
            format: Output format (html, text, storage)

        Returns:
            Page content as string
        """
        page = self.get_page(page_id, space_key, title, include_content=True)

        if format == "text":
            return self._strip_html(page.content)
        elif format == "storage":
            return page.content
        else:  # html
            return page.content

    def list_pages(
        self,
        space_key: str,
        limit: int = 25
    ) -> List[Page]:
        """
        List pages in a space.

        Args:
            space_key: Space key
            limit: Maximum results

        Returns:
            List of Page objects
        """
        space = self.client.get_space_by_key(space_key)
        space_id = space.get("id")

        result = self.client.get_pages(space_id=space_id, limit=limit)
        return [self._parse_page(p) for p in result.get("results", [])]

    def search_pages(
        self,
        query: str,
        space_key: Optional[str] = None,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Search for pages.

        Args:
            query: Search query
            space_key: Limit to specific space
            limit: Maximum results

        Returns:
            List of search results
        """
        result = self.client.search_pages(query, space_key=space_key, limit=limit)

        # Parse search results (v1 API format)
        pages = []
        for item in result.get("results", []):
            pages.append({
                "id": item.get("content", {}).get("id"),
                "title": item.get("content", {}).get("title") or item.get("title"),
                "space_key": item.get("content", {}).get("space", {}).get("key"),
                "excerpt": item.get("excerpt", ""),
                "url": item.get("content", {}).get("_links", {}).get("webui", "")
            })

        return pages

    def get_child_pages(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None,
        limit: int = 25
    ) -> List[Page]:
        """
        Get child pages of a page.

        Args:
            page_id: Parent page ID
            space_key: Space key (alternative to page_id)
            title: Page title (required with space_key)
            limit: Maximum results

        Returns:
            List of child Page objects
        """
        if not page_id:
            parent = self.get_page(space_key=space_key, title=title, include_content=False)
            page_id = parent.id

        result = self.client.get_page_children(page_id, limit=limit)
        return [self._parse_page(p) for p in result.get("results", [])]

    def get_page_tree(
        self,
        space_key: str,
        root_title: Optional[str] = None,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """
        Get page tree structure.

        Args:
            space_key: Space key
            root_title: Root page title (defaults to space homepage)
            max_depth: Maximum depth to traverse

        Returns:
            Tree structure with pages
        """
        def build_tree(page_id: str, depth: int) -> Dict[str, Any]:
            if depth > max_depth:
                return {}

            try:
                page = self.client.get_page(page_id, body_format="none")
                children = self.client.get_page_children(page_id, limit=100)

                node = {
                    "id": page.get("id"),
                    "title": page.get("title"),
                    "children": []
                }

                for child in children.get("results", []):
                    child_tree = build_tree(child.get("id"), depth + 1)
                    if child_tree:
                        node["children"].append(child_tree)

                return node
            except Exception:
                return {}

        # Get root page
        if root_title:
            root = self.get_page(space_key=space_key, title=root_title, include_content=False)
            root_id = root.id
        else:
            space = self.client.get_space_by_key(space_key)
            root_id = space.get("homepageId")
            if not root_id:
                # Get first page in space
                pages = self.list_pages(space_key, limit=1)
                if pages:
                    root_id = pages[0].id
                else:
                    return {"space": space_key, "pages": []}

        tree = build_tree(root_id, 1)
        return {"space": space_key, "root": tree}

    # Content Creation

    def create_page(
        self,
        space_key: str,
        title: str,
        content: str,
        parent_title: Optional[str] = None
    ) -> Page:
        """
        Create a new page.

        Args:
            space_key: Space key
            title: Page title
            content: Page content (HTML/storage format)
            parent_title: Parent page title (optional)

        Returns:
            Created Page object
        """
        space = self.client.get_space_by_key(space_key)
        space_id = space.get("id")

        parent_id = None
        if parent_title:
            parent = self.get_page(space_key=space_key, title=parent_title, include_content=False)
            parent_id = parent.id

        result = self.client.create_page(space_id, title, content, parent_id=parent_id)
        return self._parse_page(result)

    def update_page(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None,
        new_title: Optional[str] = None,
        new_content: Optional[str] = None,
        version_message: Optional[str] = None
    ) -> Page:
        """
        Update an existing page.

        Args:
            page_id: Page ID
            space_key: Space key (alternative to page_id)
            title: Current page title (required with space_key)
            new_title: New title (optional)
            new_content: New content (optional)
            version_message: Version comment

        Returns:
            Updated Page object
        """
        # Get current page
        page = self.get_page(page_id, space_key, title, include_content=True)

        result = self.client.update_page(
            page.id,
            title=new_title or page.title,
            content=new_content or page.content,
            version_number=page.version,
            version_message=version_message
        )
        return self._parse_page(result)

    # Labels

    def get_page_labels(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None
    ) -> List[str]:
        """
        Get labels on a page.

        Args:
            page_id: Page ID
            space_key: Space key
            title: Page title

        Returns:
            List of label names
        """
        if not page_id:
            page = self.get_page(space_key=space_key, title=title, include_content=False)
            page_id = page.id

        result = self.client.get_page_labels(page_id)
        return [label.get("name", "") for label in result.get("results", [])]

    def add_label(
        self,
        label: str,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None
    ) -> None:
        """
        Add label to a page.

        Args:
            label: Label name
            page_id: Page ID
            space_key: Space key
            title: Page title
        """
        if not page_id:
            page = self.get_page(space_key=space_key, title=title, include_content=False)
            page_id = page.id

        self.client.add_page_label(page_id, label)

    # Export

    def export_page_to_markdown(
        self,
        page_id: Optional[str] = None,
        space_key: Optional[str] = None,
        title: Optional[str] = None,
        output_dir: str = "output"
    ) -> str:
        """
        Export page to markdown file.

        Args:
            page_id: Page ID
            space_key: Space key
            title: Page title
            output_dir: Output directory

        Returns:
            Path to saved file
        """
        page = self.get_page(page_id, space_key, title, include_content=True)

        # Convert HTML to basic markdown (simplified)
        content = page.content

        # Basic HTML to Markdown conversions
        content = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1\n', content)
        content = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1\n', content)
        content = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1\n', content)
        content = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1\n', content)
        content = re.sub(r'<strong>(.*?)</strong>', r'**\1**', content)
        content = re.sub(r'<b>(.*?)</b>', r'**\1**', content)
        content = re.sub(r'<em>(.*?)</em>', r'*\1*', content)
        content = re.sub(r'<i>(.*?)</i>', r'*\1*', content)
        content = re.sub(r'<code>(.*?)</code>', r'`\1`', content)
        content = re.sub(r'<li>(.*?)</li>', r'- \1\n', content)
        content = re.sub(r'<br\s*/?>', '\n', content)
        content = re.sub(r'<p>(.*?)</p>', r'\1\n\n', content, flags=re.DOTALL)

        # Remove remaining tags
        content = re.sub(r'<[^>]+>', '', content)

        # Clean up
        content = html.unescape(content)
        content = re.sub(r'\n{3,}', '\n\n', content)

        # Build markdown
        md_content = f"# {page.title}\n\n"
        md_content += f"> Space: {page.space_key or page.space_id}\n"
        md_content += f"> Last updated: {page.updated or 'Unknown'}\n\n"
        md_content += "---\n\n"
        md_content += content

        # Save file
        os.makedirs(output_dir, exist_ok=True)
        safe_title = re.sub(r'[^\w\-_]', '_', page.title)
        filepath = os.path.join(output_dir, f"{safe_title}.md")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)

        print(f"Exported to: {filepath}")
        return filepath


def main():
    """Example usage."""
    helper = ConfluenceHelper()

    try:
        helper.connect()
        print("Connected to Confluence!")

        # List spaces
        print("\nSpaces:")
        spaces = helper.list_spaces(limit=5)
        for space in spaces:
            print(f"  [{space.key}] {space.name}")

        # Search for pages
        print("\nSearching for 'documentation'...")
        results = helper.search_pages("documentation", limit=5)
        for result in results:
            print(f"  {result['title']} - {result.get('space_key', 'N/A')}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
