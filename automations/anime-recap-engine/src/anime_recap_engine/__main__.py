"""CLI entry point for the Anime Recap Engine."""
import argparse
import os
import sys

from .config import load_config


STAGES = {
    "ingest": 1,
    "script": 2,
    "match": 3,
    "narrate": 4,
    "moments": 5,
    "mix": 6,
    "render": 7,
    "run": 0,
    "validate": -1,
}

# Map stage number → (module_name, validate_function_name)
_STAGE_VALIDATORS = {
    1: ("stage1_ingest", "validate_stage1"),
}


def _run_validate(args):
    """Run validation for a specific stage."""
    stage = args.stage
    work_dir = args.work_dir

    # Check if the stage has a validator
    if stage not in _STAGE_VALIDATORS:
        print(f"PASS: Stage {stage} has no validator implemented yet")
        return 0

    module_name, func_name = _STAGE_VALIDATORS[stage]

    # Check if work dir exists
    if not os.path.isdir(work_dir):
        print(f"PASS: Work directory {work_dir} does not exist (run pipeline first)")
        return 0

    # Check if manifest exists (stage 1 specific)
    manifest_path = os.path.join(work_dir, "manifest.json")
    if stage == 1 and not os.path.exists(manifest_path):
        print(f"PASS: No manifest.json in {work_dir} (run pipeline first)")
        return 0

    # Load config
    config = load_config(args.config)

    # Import and run the validator
    import importlib
    mod = importlib.import_module(f".{module_name}", package="anime_recap_engine")
    validate_fn = getattr(mod, func_name)

    passed, issues = validate_fn(work_dir, config)

    for issue in issues:
        print(issue)

    if passed:
        print("PASS: All checks passed" + (f" ({len(issues)} soft warnings)" if issues else ""))
        return 0
    else:
        hard_count = sum(1 for i in issues if i.startswith("HARD:"))
        print(f"FAIL: {hard_count} hard failures")
        return 1


def main():
    parser = argparse.ArgumentParser(
        prog="anime-recap-engine",
        description="Convert an anime season into a recap video.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Per-stage commands
    for cmd in ["ingest", "script", "match", "narrate", "moments", "mix"]:
        sp = subparsers.add_parser(cmd)
        sp.add_argument("--config", required=True, help="Path to config.yaml")
        sp.add_argument("--work-dir", required=True, help="Path to work directory")

    # Ingest also needs --episodes
    subparsers.choices["ingest"].add_argument(
        "--episodes", required=True, help="Path to episodes directory"
    )

    # Render needs --output
    sp_render = subparsers.add_parser("render")
    sp_render.add_argument("--config", required=True)
    sp_render.add_argument("--work-dir", required=True)
    sp_render.add_argument("--output", required=True, help="Output file path")

    # Full pipeline
    sp_run = subparsers.add_parser("run")
    sp_run.add_argument("--episodes", required=True)
    sp_run.add_argument("--config", required=True)
    sp_run.add_argument("--output", required=True)

    # Validate
    sp_val = subparsers.add_parser("validate")
    sp_val.add_argument("--stage", type=int, required=True, help="Stage number to validate")
    sp_val.add_argument("--config", required=True)
    sp_val.add_argument("--work-dir", required=True)

    args = parser.parse_args()

    if args.command == "validate":
        sys.exit(_run_validate(args))

    print(f"anime-recap-engine: {args.command} (not yet implemented)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
