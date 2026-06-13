#!/usr/bin/env python3
"""Queue the MVP card sample prompts in a local ComfyUI instance.

This script intentionally uses the local ComfyUI HTTP API at 127.0.0.1:8188.
It does not call any external image generation service.
"""

from __future__ import annotations

import argparse
import copy
import json
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROMPTS_PATH = ROOT / "assets-source" / "prompts" / "comfyui-card-samples.json"
WORKFLOW_PATH = ROOT / "assets" / "cards" / "samples" / "workflows" / "sdxl-text2img-card-sample-api.json"
SAMPLES_DIR = ROOT / "assets" / "cards" / "samples"
CANDIDATES_DIR = SAMPLES_DIR / "candidates"


def request_json(base_url: str, path: str, payload: dict | None = None) -> dict:
    url = urllib.parse.urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Cannot reach ComfyUI at {url}: {exc}") from exc


def get_available_checkpoints(base_url: str) -> list[str]:
    object_info = request_json(base_url, "/object_info")
    loader = object_info.get("CheckpointLoaderSimple")
    if not loader:
        return []
    values = loader["input"]["required"]["ckpt_name"][0]
    return list(values)


def choose_checkpoint(base_url: str, requested: str | None) -> str:
    checkpoints = get_available_checkpoints(base_url)
    if requested:
        if requested not in checkpoints:
            raise SystemExit(
                f"Checkpoint '{requested}' is not available in ComfyUI. "
                f"Available checkpoints: {checkpoints or 'none'}"
            )
        return requested
    if not checkpoints:
        raise SystemExit(
            "No ComfyUI checkpoint is available. Put an SDXL-compatible .safetensors/.ckpt file in "
            "C:\\Users\\Administrator\\ComfyUI-Shared\\models\\checkpoints, refresh/restart ComfyUI, "
            "then rerun this script."
        )
    return checkpoints[0]


def build_workflow(template: dict, checkpoint: str, positive: str, negative: str, prefix: str, seed: int) -> dict:
    workflow = copy.deepcopy(template)
    workflow["4"]["inputs"]["ckpt_name"] = checkpoint
    workflow["6"]["inputs"]["text"] = positive
    workflow["7"]["inputs"]["text"] = negative
    workflow["9"]["inputs"]["filename_prefix"] = prefix
    workflow["3"]["inputs"]["seed"] = seed
    return workflow


def queue_prompt(base_url: str, workflow: dict) -> str:
    result = request_json(base_url, "/prompt", {"prompt": workflow})
    return result["prompt_id"]


def wait_for_history(base_url: str, prompt_id: str, timeout_seconds: int) -> dict:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        history = request_json(base_url, f"/history/{prompt_id}")
        if prompt_id in history:
            return history[prompt_id]
        time.sleep(2)
    raise TimeoutError(f"Timed out waiting for ComfyUI prompt {prompt_id}")


def copy_history_images(base_url: str, history_item: dict, destination: Path) -> list[Path]:
    destination.mkdir(parents=True, exist_ok=True)
    copied: list[Path] = []
    outputs = history_item.get("outputs", {})
    for output in outputs.values():
        for image in output.get("images", []):
            query = urllib.parse.urlencode(
                {
                    "filename": image["filename"],
                    "subfolder": image.get("subfolder", ""),
                    "type": image.get("type", "output"),
                }
            )
            url = f"{base_url.rstrip('/')}/view?{query}"
            target = destination / image["filename"]
            with urllib.request.urlopen(url, timeout=60) as response:
                target.write_bytes(response.read())
            copied.append(target)
    return copied


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate card samples through local ComfyUI.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8188")
    parser.add_argument("--checkpoint", default=None, help="Exact ComfyUI checkpoint name. Defaults to first available.")
    parser.add_argument("--seed", type=int, default=20260612)
    parser.add_argument("--versions", default="a,b", help="Comma-separated candidate versions to generate.")
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--dry-run", action="store_true", help="Validate inputs and print jobs without queueing.")
    args = parser.parse_args()

    prompt_spec = json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))
    template = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    checkpoint = choose_checkpoint(args.base_url, args.checkpoint)
    versions = [item.strip() for item in args.versions.split(",") if item.strip()]
    negative = prompt_spec["negative_prompt"]

    jobs: list[tuple[str, str, str]] = []
    for card in prompt_spec["cards"]:
        for version in versions:
            if version in card["prompts"]:
                jobs.append((card["card_id"], version, card["prompts"][version]))

    print(f"ComfyUI: {args.base_url}")
    print(f"Checkpoint: {checkpoint}")
    print(f"Jobs: {len(jobs)}")

    if args.dry_run:
        for card_id, version, _ in jobs:
            print(f"DRY RUN {card_id}_{version}")
        return 0

    manifest = {
        "comfyui_api": args.base_url,
        "checkpoint": checkpoint,
        "seed_start": args.seed,
        "jobs": [],
    }

    for index, (card_id, version, positive) in enumerate(jobs):
        prefix = f"guofeng_card_samples/{card_id}_{version}"
        workflow = build_workflow(template, checkpoint, positive, negative, prefix, args.seed + index)
        workflow_copy_path = SAMPLES_DIR / "workflows" / f"{card_id}_{version}.json"
        workflow_copy_path.write_text(json.dumps(workflow, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"Queueing {card_id}_{version}...")
        prompt_id = queue_prompt(args.base_url, workflow)
        history_item = wait_for_history(args.base_url, prompt_id, args.timeout)
        copied = copy_history_images(args.base_url, history_item, CANDIDATES_DIR)

        canonical_candidate = CANDIDATES_DIR / f"{card_id}_{version}.png"
        if copied:
            shutil.copy2(copied[0], canonical_candidate)

        card_recommended = next(card for card in prompt_spec["cards"] if card["card_id"] == card_id)["recommended_version"]
        if version == card_recommended and canonical_candidate.exists():
            shutil.copy2(canonical_candidate, SAMPLES_DIR / f"{card_id}.png")

        manifest["jobs"].append(
            {
                "card_id": card_id,
                "version": version,
                "prompt_id": prompt_id,
                "workflow": str(workflow_copy_path.relative_to(ROOT)).replace("\\", "/"),
                "candidate": str(canonical_candidate.relative_to(ROOT)).replace("\\", "/"),
            }
        )

    (SAMPLES_DIR / "generation-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Done. Images copied to {SAMPLES_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
