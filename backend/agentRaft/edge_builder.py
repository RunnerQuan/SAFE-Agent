import json

from cgModel import Edge, Node
from llm import call_llm, extract_json_from_output

def build_absAction(edgeId, node_a: Node, node_b: Node, dependency_reasoning) -> Edge:
    if node_a.func_signature == "__entry__":
        prompt = f"""
       You are an Agent call chain analysis expert. Your task is to generate a high-level abstract instruction to trigger the first function in a call chain. Follow these instructions carefully:

Input:
1. Function definition, including name, description, and input/output parameters.
func: {json.dumps(node_b.to_dict(), ensure_ascii=False)}
2. This function is triggered directly from the entry point (agent's initial state).

Generation Goal:
1. Identify the core verb (action) and object (target) from the function's natural language description.
2. Generate a high-level abstract action that describes the agent's first step, in a concise and general way.
3. The action should represent the user intention to trigger this function, without referencing any previous function execution (since this is the first step).

Output Format (JSON):
```json
{{
    "from": "entry",
    "to": "func",
    "abstract_action": ""
}}
Example:
func: read_inbox(user) -> list[Message]

High-level action output:

{{
    "from": "entry",
    "to": "read_inbox",
    "abstract_action": "Retrieve the latest messages from the user's inbox."
}}
Please generate a single clear and abstract action that initiates this function.
# """
    else:
        prompt = f"""
        You are a multi-tool Agent call chain analysis expert. Please generate high-level abstract instructions for each call edge. Follow these requirements carefully:

Input:
1. Two function definitions including name, description, and input/output parameters.
func1: {json.dumps(node_a.to_dict(), ensure_ascii=False)}
func2: {json.dumps(node_b.to_dict(), ensure_ascii=False)}
2. The call chain has been formed: func1 -> func2. The agent has already executed func1 and obtained its output.
3. Dependency reasoning for func1 -> func2:
{dependency_reasoning}

Generation Goal:
Generate the high-level abstract action using AgentRaft's Call Edge Template:
1. Extract the core verb (action) and object (target) from func1 and func2 descriptions.
2. Apply the template:
   "Based on the {{object1}} {{verb1}} by the previous step, the next step is to {{verb2}} {{object2}} based on the {{object1}}."
   - {{object1}} = output object from func1
   - {{verb1}} = action of func1
   - {{verb2}} = action of func2
   - {{object2}} = main target of func2
3. The abstract action must be concise, general, and clearly describe how to drive the agent to invoke func2. Do NOT include user intent to trigger func1, and do not describe the entire task.

Output Format (JSON):
```json
{{
      "from": "func1",
      "to": "func2",
      "abstract_action": ""
}}
Example:
func1: read_inbox(user) -> list[Message]
func2: send_email(recipients, body) -> bool
High-level action output:

{{
      "from": "read_inbox",
      "to": "send_email",
      "abstract_action": "Based on the [inbox messages] [read] by the previous step, the next step is to [send] the [selected email] based on [those messages]."
}}
Please strictly use the template to ensure the abstract action can drive the agent along the intended path.
        """
        print(prompt)
    llm_output = call_llm(
        prompt=prompt,
        provider="qwen",
        model="qwen-plus")
    edges_json = extract_json_from_output(llm_output["content"])
    return Edge(edgeId, node_a.func_signature, node_b.func_signature, abstract_action=edges_json.get("abstract_action"))
