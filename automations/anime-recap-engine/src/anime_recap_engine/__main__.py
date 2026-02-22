"""CLI entry point for the Anime Recap Engine."""
import argparse
import sys


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

    print(f"anime-recap-engine: {args.command} (not yet implemented)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
