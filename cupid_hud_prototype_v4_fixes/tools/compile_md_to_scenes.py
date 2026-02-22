#!/usr/bin/env python3
import re, json
from pathlib import Path

def clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()

def section_text(block: str, header: str) -> str:
    m = re.search(rf"^###\s+{re.escape(header)}\s*$([\s\S]*?)(?=^###\s+|\Z)", block, flags=re.M)
    return clean(m.group(1)) if m else ""

def bullet_list(text: str):
    out = []
    for line in (text or "").splitlines():
        line = line.strip()
        if line.startswith("- "):
            out.append(clean(line[2:]))
    return [x for x in out if x]

def parse_hotspots_design(block: str):
    hotspots = []
    parts = re.split(r"\n\s*\*\*(.+?)\*\*\s*\n", "\n" + (block or "").strip() + "\n")
    if len(parts) < 3:
        return hotspots
    for i in range(1, len(parts), 2):
        name = clean(parts[i])
        body = parts[i+1]
        opts, notes = [], []
        for ln in body.splitlines():
            ln = ln.strip()
            if ln.startswith("- "):
                opts.append(clean(ln[2:]))
            elif ln.lower().startswith("effects:") or ln.lower().startswith("affects:"):
                notes.append(clean(ln))
        hotspots.append({"name": name, "options": opts, "notes": " · ".join(notes).strip()})
    return hotspots

def extract_location_blocks(md: str):
    patt = r"(?=^#{2,3}\s*📍\s*Location)"
    blocks = re.split(patt, md, flags=re.M)
    return [b.strip() for b in blocks if re.match(r"^#{2,3}\s*📍\s*Location", b)]

def parse_location_block(block: str):
    m = re.search(r'^#{2,3}\s*📍\s*Location\s*\d+\s*—\s*"(.*?)"\s*$', block, flags=re.M)
    title = m.group(1).strip() if m else None

    tier = re.search(r"\*\*Tier\*\*\s*\|\s*(.+)", block)
    tone = re.search(r"\*\*Tone\*\*\s*\|\s*(.+)", block)
    vibe = re.search(r"\*\*Vibe\*\*\s*\|\s*(.+)", block)

    concept = section_text(block, "Scene Concept")
    core_goal = section_text(block, "Core Player Goal")
    mechanics = bullet_list(section_text(block, "Mechanics Introduced"))
    hotspots_txt = section_text(block, "Interaction Hotspots")
    secrets = bullet_list(section_text(block, "Secrets"))
    outcomes = bullet_list(section_text(block, "Possible Outcomes"))
    dlc = bullet_list(section_text(block, "Future DLC Hooks"))

    img = re.search(r"\(scenes/([^/]+)/", block)
    inferred_id = img.group(1) if img else None

    return {
        "title": title,
        "sceneId": inferred_id,
        "meta": {
            "tier": clean(tier.group(1)) if tier else "",
            "tone": clean(tone.group(1)) if tone else "",
            "vibe": clean(vibe.group(1)) if vibe else "",
        },
        "concept": concept,
        "coreGoal": core_goal,
        "mechanics": mechanics,
        "hotspotsDesign": parse_hotspots_design(hotspots_txt),
        "secrets": secrets,
        "outcomes": outcomes,
        "dlcHooks": dlc,
    }

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="Repo root containing /scenes")
    ap.add_argument("--md", nargs="*", default=[], help="MD files (default: design/*.md)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    scenes_dir = root / "scenes"
    md_files = [Path(p) for p in args.md] if args.md else sorted((root / "design").glob("*.md"))

    if not scenes_dir.exists():
        raise SystemExit(f"scenes dir not found: {scenes_dir}")

    updated = 0
    for mdp in md_files:
        if not mdp.exists():
            print(f"Missing MD: {mdp}")
            continue
        md = mdp.read_text(encoding="utf-8", errors="ignore")
        for block in extract_location_blocks(md):
            loc = parse_location_block(block)
            if not loc["title"]:
                continue
            if not loc["sceneId"]:
                print(f"Skip (no scenes/<id>/ link): {loc['title']} in {mdp}")
                continue

            scene_id = loc["sceneId"]
            scene_path = scenes_dir / scene_id / "scene.json"
            current = json.loads(scene_path.read_text(encoding="utf-8")) if scene_path.exists() else {}

            merged = {
                **current,
                "id": scene_id,
                "title": loc["title"],
                "meta": loc["meta"],
                "concept": loc["concept"],
                "coreGoal": loc["coreGoal"],
                "mechanics": loc["mechanics"],
                "hotspotsDesign": loc["hotspotsDesign"],
                "secrets": loc["secrets"],
                "outcomes": loc["outcomes"],
                "dlcHooks": loc["dlcHooks"],
            }

            if args.dry_run:
                print(f"[DRY] would write {scene_path}")
            else:
                scene_path.parent.mkdir(parents=True, exist_ok=True)
                scene_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
                updated += 1

    print(f"Updated: {updated} scene.json files")

if __name__ == "__main__":
    main()
