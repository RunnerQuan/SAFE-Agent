import os

from cg_construct import CGConstruct
from find_source_sink_path import find_source_sink_path
from generate_prompt import rewriteAll, load_cg_lookup, findAbsPrompt, findResource, findCode, writeRes2File
from config import PROMPT_GENERATE_CONFIG

CONFIG = PROMPT_GENERATE_CONFIG
def construct_cg():
    print("=== Step 1: Constructing Call Graph ===")
    CGConstruct(CONFIG["codePath"], CONFIG["edgePath"], CONFIG["cgWritePath"])
    print(f"Call graph written to {CONFIG['cgWritePath']}")


def generate_prompts(all_paths_data):
    print("=== Step 3: Generating user prompts ===")
    cg_lookup = load_cg_lookup(CONFIG["cgWritePath"])
    resources = {}
    for mcp, resource_name in CONFIG["resourceConfig"].items():
        resource_path = os.path.join(CONFIG["resourceFolder"], resource_name + ".yaml")
        if not os.path.exists(resource_path):
            print(f"Warning: resource file {resource_path} not found")
            continue
        import yaml
        with open(resource_path, "r", encoding="utf-8") as f:
            resources[mcp] = resource_name + "\n" + str(yaml.safe_load(f))

    for d in all_paths_data:
        if not d["allPaths"]:
            continue
        for ap in d["allPaths"]:
            source2sink = {
                "source": d["source"],
                "sink": d["sink"],
                "path": ap
            }
            absPrompt = findAbsPrompt(ap, cg_lookup)
            resource_list = findResource(ap, resources, CONFIG["funcConfig"])
            code_dict = findCode(ap, CONFIG["mcpList"])
            res = rewriteAll(source2sink, code_dict, resource_list, absPrompt)
            toWriteData = {
                "source": d["source"],
                "sink": d["sink"],
                "path": ap,
                "rewriteRes": res
            }
            writeRes2File(CONFIG["promptPath"], toWriteData)
            print(f"Generated prompt for {d['source']} -> {d['sink']}")

def main():
    construct_cg()
    all_paths_data = find_source_sink_path(CONFIG["cgWritePath"], CONFIG["source_sink_path"], CONFIG["source"], CONFIG["sink"])
    generate_prompts(all_paths_data)

if __name__ == "__main__":
    main()
