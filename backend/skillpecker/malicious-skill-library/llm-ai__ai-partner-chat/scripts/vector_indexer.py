"""
Vector database utilities for indexing chunks.

This module provides core functionality to:
1. Accept chunks conforming to chunk_schema
2. Generate embeddings using Doubao API
3. Store in ChromaDB

Chunking logic is handled by Claude Code directly, not by pre-written scripts.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional, Set
from datetime import datetime
import chromadb
import requests
from dotenv import load_dotenv

# Load environment variables from .env file in project root
# .cursor/skills/ai-partner-chat/scripts -> ai-partner-chat -> skills -> .cursor -> project_root
# 需要往上5级才能到项目根目录
script_path = Path(__file__).resolve()
project_root = script_path.parent.parent.parent.parent.parent
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


class VectorIndexer:
    """Handle vector database indexing operations."""

    def __init__(self, db_path: str = "./vector_db"):
        """
        Initialize indexer.

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

    def initialize_db(self, reset: bool = False):
        """
        Initialize or connect to vector database.
        
        Args:
            reset: If True, delete existing collection and recreate. 
                   If False, connect to existing or create if not exists.
        """
        print(f"🤖 Using Doubao API for embeddings ({self.model})...")

        print(f"💾 Initializing vector database at: {self.db_path}")
        self.client = chromadb.PersistentClient(path=self.db_path)

        if reset:
            # Delete existing collection
            try:
                self.client.delete_collection("notes")
                print("   Deleted existing collection")
            except:
                pass

        # Get or create collection
        try:
            self.collection = self.client.get_collection("notes")
            print("   Connected to existing collection")
        except:
            self.collection = self.client.create_collection(
                name="notes",
                metadata={"hnsw:space": "cosine"}
            )
            print("   Created new collection")

    def get_file_chunk_ids(self, filepath: str) -> List[str]:
        """
        Get all chunk IDs for a specific file.
        
        Args:
            filepath: Full path to the file
            
        Returns:
            List of chunk IDs
        """
        if not self.collection:
            return []
        
        try:
            # Query by filepath in metadata
            results = self.collection.get(
                where={"filepath": str(Path(filepath).resolve())}
            )
            return results['ids'] if results and 'ids' in results else []
        except:
            return []
    
    def delete_file_chunks(self, filepath: str) -> int:
        """
        Delete all chunks for a specific file.
        
        Args:
            filepath: Full path to the file
            
        Returns:
            Number of chunks deleted
        """
        if not self.collection:
            return 0
        
        chunk_ids = self.get_file_chunk_ids(filepath)
        if chunk_ids:
            self.collection.delete(ids=chunk_ids)
        return len(chunk_ids)

    def index_chunks(self, chunks: List[Dict], filepath: Optional[str] = None) -> None:
        """
        Index chunks into vector database.
        
        If filepath is provided, will delete existing chunks for that file first
        (for incremental updates).

        Args:
            chunks: List of chunks conforming to chunk_schema.Chunk format
            filepath: Optional filepath to delete existing chunks before indexing
        """
        if not self.collection:
            raise RuntimeError("Database not initialized. Call initialize_db() first")

        # Delete existing chunks for this file if filepath provided
        if filepath:
            deleted = self.delete_file_chunks(filepath)
            if deleted > 0:
                print(f"   🗑️  Deleted {deleted} existing chunks for this file")

        print(f"🔄 Indexing {len(chunks)} chunks...")
        start_time = datetime.now()
        print(f"   开始时间: {start_time.strftime('%H:%M:%S')}")

        for i, chunk in enumerate(chunks):
            try:
                # Validate chunk has required fields
                if 'content' not in chunk or 'metadata' not in chunk:
                    print(f"  ⚠️  [{i+1}/{len(chunks)}] Skipping: missing content or metadata")
                    continue

                # Show current progress with details
                metadata = chunk.get('metadata', {})
                chunk_type = metadata.get('chunk_type', 'unknown')
                chunk_date = metadata.get('date', '')
                chunk_title = metadata.get('title', '')[:40] if metadata.get('title') else ''
                
                # 显示进度信息
                progress_info = f"  📝 [{i+1}/{len(chunks)}] {chunk_type}"
                if chunk_date:
                    progress_info += f" ({chunk_date})"
                if chunk_title:
                    progress_info += f": {chunk_title}"
                print(progress_info, end=' ... ', flush=True)

                # Generate embedding using Doubao API
                embedding = self.get_embedding(chunk['content'])

                # Prepare metadata (convert all to strings for ChromaDB)
                metadata_str = {}
                for key, value in chunk['metadata'].items():
                    metadata_str[key] = str(value) if value is not None else ""

                # Generate unique ID: filepath + chunk_id
                filepath_str = metadata_str.get('filepath', '')
                chunk_id = metadata_str.get('chunk_id', i)
                unique_id = f"{Path(filepath_str).name}_{chunk_id}"

                # Add to collection
                self.collection.add(
                    ids=[unique_id],
                    embeddings=[embedding],
                    documents=[chunk['content']],
                    metadatas=[metadata_str]
                )

                elapsed = (datetime.now() - start_time).total_seconds()
                print(f"✓ ({elapsed:.1f}s)")

            except Exception as e:
                print(f"✗ Error: {e}")
                import traceback
                traceback.print_exc()

        total_time = (datetime.now() - start_time).total_seconds()
        print(f"\n✅ Successfully indexed {len(chunks)} chunks")
        print(f"   总耗时: {total_time:.1f}秒")
        print(f"   平均速度: {len(chunks)/total_time:.1f} chunks/秒" if total_time > 0 else "")
        print(f"   数据库位置: {os.path.abspath(self.db_path)}")


def index_chunks_to_db(chunks: List[Dict], db_path: str = "./vector_db") -> None:
    """
    Convenience function to index chunks.

    Args:
        chunks: List of chunks conforming to chunk_schema.Chunk
        db_path: Path to vector database
    """
    indexer = VectorIndexer(db_path=db_path)
    indexer.initialize_db()
    indexer.index_chunks(chunks)
