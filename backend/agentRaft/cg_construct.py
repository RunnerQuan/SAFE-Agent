# main.py
# -*- coding: utf-8 -*-
"""
Main pipeline for semantic call graph construction.
"""

import json
import os
import itertools

from cgModel import Node, Edge
from llm import call_llm, extract_json_from_output
from edge_builder import build_absAction


def judge_edges(func_defs: list):
    prompt = f"""
I will provide you with **{len(func_defs)} tool function definitions**.  
These functions can be combined pairwise to form call chains of the form **func1 → func2**.  
Each tool function includes the following information:

- **Function name** (serves as the function signature)  
- **MCP name** the function belongs to  
- **Functional description**  
- **Function implementation code**

---

### Your task

Identify **all function pairs** that satisfy a valid parameter dependency relationship.

---

### Judgment criteria

For a function pair **func1 → func2** to be considered valid, there must exist a reasonable and realistic scenario such that:

- The output of **func1** is logically suitable to serve as the input of **func2**.  
- It is natural and reasonable for an agent to invoke **func2 after func1** in order to accomplish a task.

---

### About the data usage relationship of **func1 → func2**

When determining whether a function pair is valid, **all** of the following conditions must be satisfied:

- The data returned by **func1** can semantically serve as the input, operation target, or written content of **func2**.  
- **func1** is a reasonable prerequisite step for **func2**.  
- The MCP name is provided only to assist your understanding; you must consider **all possible combinations of functions**, including:  
  ① functions from different MCPs  
  ② functions from the same MCP  

---

### Output requirements

- Output **all function pairs** that satisfy the above conditions **in JSON format only**.  
- **Do not output any explanatory text outside the JSON.**

The output must strictly follow the format below:

```json
{{
    "Matched_func_pairs": [
        {{
            "func1": "<function name of func1>",
            "func1's MCP name": "<MCP name of func1>",
            "func2": "<function name of func2>",
            "func2's MCP name": "<MCP name of func2>",
            "whyThisCaseVaild": "<brief explanation of why this function pair is valid>"
        }}
    ]
}}
Below are the {len(func_defs)} function descriptions:
{func_defs}
    """
    llm_output = call_llm(
        prompt=prompt,
        provider="deepseek",
        model="deepseek-chat")
    func_pairs_json = extract_json_from_output(llm_output["content"]).get("Matched_func_pairs", [])
    return func_pairs_json


def build_entry_edges(edgePath): # 用
    output_file = os.path.join(edgePath, "Edge_entry.json")

    if not os.path.isdir(edgePath):
        print(f"Directory does not exist: {edgePath}")
        return
    all_sources = set()
    all_targets = set()
    node_to_mcp = {}
    for filename in os.listdir(edgePath):
        if not filename.endswith(".json"):
            continue
        file_path = os.path.join(edgePath, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for entry in data:
            func1 = entry.get("func1")
            func2 = entry.get("func2")
            mcp1 = entry.get("func1's MCP name")
            mcp2 = entry.get("func2's MCP name")
            if func1:
                all_sources.add(func1)
                if mcp1 is not None:
                    node_to_mcp[func1] = mcp1
            if func2:
                all_targets.add(func2)
                if mcp2 is not None:
                    node_to_mcp[func2] = mcp2
    all_nodes = all_sources | all_targets
    leaf_nodes = all_targets - all_sources
    non_leaf_nodes = sorted(all_nodes - leaf_nodes)
    starting_nodes = non_leaf_nodes
    result_edges = []

    for node in starting_nodes:
        new_edge = {
            "func1": "__entry__",
            "func1's MCP name": None,
            "func2": node,
            "func2's MCP name": node_to_mcp.get(node),
            "dependency_reasoning": None
        }
        result_edges.append(new_edge)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result_edges, f, ensure_ascii=False, indent=2)




from pathlib import Path
def deduplicate_judge_edge_files(folder_path):
    seen = set()
    unique_entries = []
    for file_path in Path(folder_path).glob("*.json"):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for entry in data:
                try:
                    key_tuple = (
                        entry["func1"],
                        entry["func1's MCP name"],
                        entry["func2"],
                        entry["func2's MCP name"]
                    )
                except KeyError as e:
                    print(f"Missing key {e} in entry from {file_path}. Skipping entry.")
                    continue
                if key_tuple not in seen:
                    seen.add(key_tuple)
                    unique_entries.append(entry)
    with open(os.path.join(folder_path, "Edge_deduplicated.json"), 'w', encoding='utf-8') as f:
        json.dump(unique_entries, f, indent=2, ensure_ascii=False)
    return unique_entries


def CGFinal(nodes, edgePath, cgWritePath):
    node_lookup = {item.func_signature: item for item in nodes}
    edge_counter = 1
    edges_with_action = []
    for filename in os.listdir(edgePath):
        file_path = os.path.join(edgePath, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for d in data:
            func1 = d.get("func1")
            func2 = d.get("func2")
            dependency_reasoning = d.get("whyThisCaseVaild")
            nodeFromSig = node_lookup.get(func1)
            toFromSig = node_lookup.get(func2)
            edge = build_absAction(edge_counter, nodeFromSig, toFromSig, dependency_reasoning)
            edge.edgeId = edge_counter
            edge_counter += 1
            edges_with_action.append(edge)
    print(edges_with_action)
    edges_json = [edge.to_dict() for edge in edges_with_action]
    with open(cgWritePath, "w", encoding="utf-8") as f:
        json.dump(edges_json, f, ensure_ascii=False, indent=2)



def judgeEdge_pair(codePath, edgePath, func_filenames):
    run_list = list(itertools.combinations(func_filenames, 2))
    run_list = [list(item) for item in run_list]
    for MCP_server_fileList in run_list:
        func_defs = []
        toWritefileName = MCP_server_fileList[0] + "+" + MCP_server_fileList[1]
        for filename in MCP_server_fileList:
            full_path = codePath+ filename + ".json"
            with open(full_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item in data:
                item_str = json.dumps(item, ensure_ascii=False, indent=2)
                func_defs.append(item_str)
        path = edgePath + toWritefileName + ".json"
        if os.path.isfile(path):
            continue
        func_pairs_json = judge_edges(func_defs)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(func_pairs_json, f, ensure_ascii=False, indent=2)


def buildNode(codePath, func_filenames):
    all_nodes = []
    for ff in func_filenames:
        with open(codePath + ff+".json", "r", encoding="utf-8") as f:
            json_content = json.load(f)
        for entry in json_content:
            if not isinstance(entry, dict):
                print(f"[WARNING] Invalid entry found in file {ff}. Skipping.")
                continue
            node = Node.from_dict(entry)
            all_nodes.append(node)
    return all_nodes



def CGConstruct(codePath, edgePath, cgWritePath): # 用
    func_filenames = []
    if not os.path.isdir(codePath):
        print(f"[ERROR] Please add function files to the node directory.")
        return func_filenames
    for filename in os.listdir(codePath):
        file_full_path = os.path.join(codePath, filename)
        if os.path.isfile(file_full_path) and filename.lower().endswith(".json"):
            filename_without_suffix = os.path.splitext(filename)[0]
            func_filenames.append(filename_without_suffix)
    nodes = buildNode(codePath, func_filenames)
    entry_node = Node("__entry__", "", "", "")
    nodes.append(entry_node)
    judgeEdge_pair(codePath, edgePath, func_filenames)
    build_entry_edges(edgePath)
    deduplicate_judge_edge_files(edgePath)
    CGFinal(nodes, edgePath, cgWritePath)