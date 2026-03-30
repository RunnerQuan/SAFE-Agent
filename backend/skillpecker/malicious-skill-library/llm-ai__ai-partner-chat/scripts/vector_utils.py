"""
Vector database utilities for AI Partner skill.

This module provides functions to query the vector database programmatically.
"""

import os
from pathlib import Path
from typing import List, Dict, Optional
import chromadb
import requests
from dotenv import load_dotenv

# Load environment variables from .env file in project root
# .cursor/skills/scripts -> .cursor/skills -> .cursor -> project_root
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


class NoteRetriever:
    """Handle vector database operations for note retrieval."""

    def __init__(self, db_path: str = "./vector_db"):
        """
        Initialize the retriever with a database path.

        Args:
            db_path: Path to ChromaDB database
        """
        self.db_path = db_path
        self.client = None
        self.collection = None
        
        # Load API credentials from environment
        self.api_key = os.environ.get('ARK_API_KEY')
        self.model = os.environ.get('ARK_EMBEDDING_MODEL')
        self.api_url = os.environ.get('ARK_EMBEDDING_URL')
        
        if not all([self.api_key, self.model, self.api_url]):
            raise EnvironmentError(
                "Missing required environment variables. Please ensure .env file contains:\n"
                "  ARK_API_KEY\n"
                "  ARK_EMBEDDING_MODEL\n"
                "  ARK_EMBEDDING_URL"
            )

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using Doubao API.
        
        Args:
            text: Input text to embed
            
        Returns:
            Embedding vector as list of floats
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "input": [{"type": "text", "text": text}]
        }
        
        try:
            resp = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            if resp.status_code >= 400:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text}")
            
            result = resp.json()
            return result["data"]["embedding"]
        except Exception as e:
            raise RuntimeError(f"Failed to get embedding from Doubao API: {e}")

    def _ensure_initialized(self):
        """Lazy initialization of database connection."""
        if self.client is None:
            try:
                self.client = chromadb.PersistentClient(path=self.db_path)
                self.collection = self.client.get_collection("notes")
            except Exception as e:
                raise RuntimeError(
                    f"Failed to connect to database at {self.db_path}. "
                    f"Please run chunk_and_index.py first. Error: {e}"
                )

    def query(self, query: str, top_k: int = 5) -> List[Dict[str, str]]:
        """
        Query the vector database for similar notes.

        Args:
            query: Query text
            top_k: Number of results to return

        Returns:
            List of dicts with 'content', 'path', 'filename' keys
        """
        self._ensure_initialized()

        # Generate query embedding using Doubao API
        query_embedding = self.get_embedding(query)

        # Query collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        # Format results
        similar_notes = []
        if results['documents'] and results['documents'][0]:
            for i in range(len(results['documents'][0])):
                metadata = results['metadatas'][0][i]
                similar_notes.append({
                    'content': results['documents'][0][i],
                    'filepath': metadata.get('filepath', ''),
                    'filename': metadata.get('filename', ''),
                    'date': metadata.get('date', ''),
                    'chunk_id': metadata.get('chunk_id', ''),
                    'chunk_type': metadata.get('chunk_type', ''),
                })

        return similar_notes


def get_relevant_notes(query: str, db_path: str = "./vector_db", top_k: int = 5) -> List[Dict[str, str]]:
    """
    Convenience function to retrieve relevant notes.

    Args:
        query: Query text
        db_path: Path to vector database
        top_k: Number of results to return

    Returns:
        List of dicts with 'content', 'path', 'filename' keys
    """
    retriever = NoteRetriever(db_path)
    return retriever.query(query, top_k)




# ARK_API_KEY=os.environ['ARK_API_KEY']
# ARK_EMBEDDING_MODEL=os.environ["ARK_EMBEDDING_MODEL"]
# ARK_EMBEDDING_URL=os.environ["ARK_EMBEDDING_URL"]


# import os
# import requests
# from typing import Optional, Dict, Any, List


# def get_multimodal_embedding(
#     text: str,
#     image_url: Optional[str] = None,
#     *,
#     base_url: str = ARK_EMBEDDING_URL,
#     api_key: str = ARK_API_KEY,
#     model: str = ARK_EMBEDDING_MODEL,
#     timeout: int = 30,
# ) -> Dict[str, Any]:
#     """
#     Call Volcengine Ark (Doubao) OpenAI-compatible Embeddings API to obtain a multimodal embedding.

#     This function constructs an `input` array containing:
#     - a required text item: {"type": "text", "text": <text>}
#     - an optional image item (only if `image_url` is provided):
#       {"type": "image_url", "image_url": {"url": <image_url>}}

#     Authentication and model selection are read from environment variables.

#     Environment Variables
#     ---------------------
#     ARK_API_KEY (required):
#         Bearer token used in the `Authorization: Bearer <token>` header.
#     ARK_EMBEDDING_MODEL (required):
#         Model name or endpoint ID configured in Ark (commonly an endpoint id like "ep-xxxx",
#         or a model string like "doubao-embedding-vision-250615").
#     ARK_BASE_URL (optional):
#         Base URL for Ark OpenAI-compatible API. Defaults to:
#         "https://ark.cn-beijing.volces.com/api/v3"
#         The final request URL is: "{ARK_BASE_URL.rstrip('/')}/embeddings"

#     Parameters
#     ----------
#     text : str
#         Input text to embed.
#     image_url : Optional[str], default None
#         Optional public/accessible image URL. If None/empty, the request will be text-only.
#     base_url_env : str, default "ARK_BASE_URL"
#         The environment variable name for the API base URL.
#     api_key_env : str, default "ARK_API_KEY"
#         The environment variable name for the Bearer token.
#     model_env : str, default "ARK_EMBEDDING_MODEL"
#         The environment variable name for the model/endpoint identifier.
#     timeout : int, default 30
#         HTTP request timeout in seconds.

#     Returns
#     -------
#     Dict[str, Any]
#         Parsed JSON response from Ark embeddings endpoint. Typical structure:

#         {
#           "created": 1768311035,
#           "data": {
#             "embedding": [float, float, ...], # 长度：2048
#             "object": "embedding"
#           },
#           "id": "<request_id>",
#           "model": "doubao-embedding-vision-250615",
#           "object": "list",
#           "usage": {
#             "prompt_tokens": 20,
#             "prompt_tokens_details": {
#               "image_tokens": 0,
#               "text_tokens": 20
#             },
#             "total_tokens": 20
#           }
#         }

#         Notes:
#         - `data["embedding"]` is the embedding vector (list of floats).
#         - `usage["prompt_tokens_details"]["image_tokens"]` may be >0 when an image is provided.

#     Raises
#     ------
#     EnvironmentError
#         If required environment variables (ARK_API_KEY / ARK_EMBEDDING_MODEL) are missing.
#     RuntimeError
#         If the HTTP status code is >= 400; the exception message includes status code and response text.
#     requests.RequestException
#         For network/timeout-related errors thrown by `requests`.

#     Examples
#     --------
#     >>> r = get_multimodal_embedding("天很蓝，海很深")
#     >>> vec = r["data"]["embedding"]

#     >>> r = get_multimodal_embedding("天很蓝，海很深", image_url="https://example.com/a.jpg")
#     >>> vec = r["data"]["embedding"]
#     """

#     if not api_key:
#         raise EnvironmentError(f"Missing environment variable: {api_key_env}")
#     if not model:
#         raise EnvironmentError(f"Missing environment variable: {model_env}")

#     url = base_url

#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json",
#     }

#     inputs: List[Dict[str, Any]] = [{"type": "text", "text": text}]
#     if image_url:
#         inputs.append({"type": "image_url", "image_url": {"url": image_url}})

#     payload = {"model": model, "input": inputs}

#     resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
#     if resp.status_code >= 400:
#         raise RuntimeError(f"HTTP {resp.status_code} for {url}\nResponse: {resp.text}")

#     return resp.json()

