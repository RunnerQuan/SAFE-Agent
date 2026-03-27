import json
from typing import List, Dict, Tuple
from collections import deque

def load_call_graph(cgWritePath) -> Tuple[Dict[str, List[str]], List[str]]:
    with open(cgWritePath, "r", encoding="utf-8") as f:
        edges = json.load(f)
    graph = {}
    all_nodes = set()
    for edge in edges:
        src = edge["fromFunc"]
        dst = edge["toFunc"]
        all_nodes.add(src)
        all_nodes.add(dst)
        if src not in graph:
            graph[src] = []
        graph[src].append(dst)

    leaf_nodes = [node for node in all_nodes if node not in graph or len(graph[node]) == 0]
    return graph, leaf_nodes


def find_all_paths(
    graph: Dict[str, List[str]],
    start: str,
    end: str
) -> List[List[str]]:
    paths = []
    queue = deque()
    queue.append([start])
    while queue:
        path = queue.popleft()
        last_node = path[-1]
        if last_node == end:
            paths.append(path)
            continue
        if last_node not in graph:
            continue
        for next_node in graph[last_node]:
            if next_node not in path:
                queue.append(path + [next_node])
    return paths


def check_reachability(graph: Dict[str, List[str]], start: str, end: str) -> List[List[str]]:
    paths = find_all_paths(graph, start, end)
    return paths


def deduplicate_path_list(paths: list[list[str]]) -> list[list[str]]:
    seen = set()
    unique_paths = []
    for path in paths:
        path_tuple = tuple(path)
        if path_tuple not in seen:
            seen.add(path_tuple)
            unique_paths.append(path)

    return unique_paths

def findTaintPath(cgWritePath, source, sink):
    graph, leafNodes = load_call_graph(cgWritePath)
    paths_ini = check_reachability(graph, source, sink)
    paths = deduplicate_path_list(paths_ini)
    return paths


def find_source_sink_path(cgWritePath, pathWritePath, source, sink):
    toWriteData = []
    i = 0
    for sourceOne in source:
        for sinkOne in sink:
            i = i + 1
            paths = findTaintPath(cgWritePath, sourceOne, sinkOne)
            if not paths:
                continue
            data = {
                "source": sourceOne,
                "sink": sinkOne,
                "allPaths": paths
            }
            toWriteData.append(data)
    with open(pathWritePath, "w", encoding="utf-8") as f:
        json.dump(toWriteData, f, ensure_ascii=False, indent=2)
    return toWriteData


