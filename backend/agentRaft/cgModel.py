
from __future__ import annotations
from typing import List, Optional, Dict, Any
class Node:
    def __init__(
        self,
        func_signature: str,
        MCP: str,
        description: str,
        code: str
    ):
        self.func_signature= func_signature
        self.code = code
        self.MCP = MCP
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        data = {
            "func_signature": self.func_signature,
            "MCP": self.MCP,
            "description": self.description,
            "code": self.code
        }
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Node":
        return cls(
            func_signature=data.get("func_signature"),
            MCP=data.get("MCP", ""),
            description=data.get("description", ""),
            code=data.get("code"),

        )

class Edge:
    def __init__(
        self,
        edgeId: int,
        fromFunc: str,
        toFunc: str,
        abstract_action: Optional[str] = None,
    ):
        self.fromFunc= fromFunc
        self.toFunc = toFunc
        self.edgeId = edgeId
        self.abstract_action = abstract_action

    def to_dict(self) -> Dict[str, Any]:
        return {
            "edgeId": self.edgeId,
            "fromFunc": self.fromFunc,
            "toFunc": self.toFunc,
            "abstract_action": self.abstract_action
        }