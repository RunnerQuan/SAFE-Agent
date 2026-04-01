from __future__ import annotations

import argparse
import json

from .runtime.workflow import MTAtlasWorkflow
from .static_pure import StaticPureWorkflow
from .utils.llm import build_llm_client_from_env


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run MTAtlas in full or static-pure mode.")
    parser.add_argument(
        "--mode",
        choices=["static-pure", "full"],
        default="static-pure",
        help="Analysis mode to run.",
    )
    parser.add_argument(
        "--adapter",
        choices=["langchain_single_agent"],
        default="langchain_single_agent",
        help="Target adapter to run in full mode.",
    )
    parser.add_argument(
        "--input",
        help="Path to the tool-metadata JSON file for static-pure mode.",
    )
    parser.add_argument(
        "--framework",
        default="langchain",
        help="Framework or app label used in generated artifacts.",
    )
    parser.add_argument(
        "--artifact-root",
        default="MTAtlas/artifacts",
        help="Directory for persisted prompts, traces, and findings.",
    )
    parser.add_argument(
        "--max-candidate-chains",
        type=int,
        default=10,
        help="Maximum number of accepted chains to send into TPS.",
    )
    parser.add_argument(
        "--semantic-filter-budget",
        type=int,
        default=250,
        help="Maximum number of candidate chains to pass through the semantic filter.",
    )
    parser.add_argument(
        "--max-tps-iterations",
        type=int,
        default=5,
        help="Maximum prompt-repair rounds per chain.",
    )
    parser.add_argument(
        "--reachability-runs",
        type=int,
        default=10,
        help="Number of runs used to measure reachability.",
    )
    parser.add_argument(
        "--stable-runs",
        type=int,
        default=5,
        help="Number of consecutive successful runs required for a valid prompt.",
    )
    return parser


def build_adapter(name: str):
    if name == "langchain_single_agent":
        try:
            from .adapters import LangChainSingleAgentAdapter
        except Exception as exc:
            raise RuntimeError(
                "Full mode adapter support is not available in this checkout. "
                "Use `--mode static-pure --input <tools.json>` or restore the adapter package."
            ) from exc
        return LangChainSingleAgentAdapter()
    raise ValueError(f"Unsupported adapter: {name}")


def main() -> None:
    args = build_parser().parse_args()
    llm_client = build_llm_client_from_env()
    if args.mode == "static-pure":
        if not args.input:
            raise SystemExit("`--input` is required in static-pure mode.")
        workflow = StaticPureWorkflow(
            framework=args.framework,
            artifact_root=args.artifact_root,
            llm_client=llm_client,
            semantic_filter_budget=args.semantic_filter_budget,
            max_candidate_chains=args.max_candidate_chains,
        )
        summary = workflow.run_from_path(args.input)
    else:
        adapter = build_adapter(args.adapter)
        workflow = MTAtlasWorkflow(
            agent=adapter,
            framework=args.framework,
            llm_client=llm_client,
            artifact_root=args.artifact_root,
            max_candidate_chains=args.max_candidate_chains,
            semantic_filter_budget=args.semantic_filter_budget,
            max_tps_iterations=args.max_tps_iterations,
            reachability_runs=args.reachability_runs,
            stable_runs=args.stable_runs,
        )
        summary = workflow.run()
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
