import os, re, json, glob
from pathlib import Path

# ---- CONFIG ----
PROJECT_ROOT = Path(r"D:\mini.shops\cupid")  # <-- change if needed
SCENES_DIR = PROJECT_ROOT / "scenes"
MD_DIR = PROJECT_ROOT  # if your packs are in project root; else point to folder with 1-2.md, 3-4.md, etc.

MD_FILES = [
    MD_DIR / "1-2.md",
    MD_DIR / "3-4.md",
    MD_DIR / "5-6.md",
    MD_DIR / "7-8.md",
    MD_DIR / "9-10.md",
]

# Map MD location titles to scene folder ids (keeps it deterministic)
TITLE_TO_ID = {
    "The Afterparty Apartment": "afterparty_apartment",
    "Late Night Diner": "late_night_diner",
    "Neon Laundry (Spin Cycle After Dark)": "neon_laundry",
    "Dive Bar Karaoke (Last Call)": "karaoke_bar",
    "Rooftop City Overlook": "rooftop",
    "The Road Trip Gas Station": "gas_station",
    "The Friend's House Party": "house_party",
    "The Rain Walk (No Destination)": "rain_walk",
    "The Airport Goodbye": "airport",
    "The Hospital Waiting Room": "hospital",
}

# ---- PARSER HELPERS ----
def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def section_text(block: str, header: str) -> str:
    """
    Grab text after a ### Header until next ### or end of block.
    """
    m = re.search(rf"^###\s+{re.escape(header)}\s*$([\s\S]*?)(?=^###\s+|\Z)", block, flags=re.M)
    return clean(m.group(1)) if m else ""

def bullet_list(text: str):
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("- "):
            lines.append(clean(line[2:]))
    return [x for x in lines if x]

def parse_hotspots(block: str):
    """
    In your MD, hotspots are typically bold lines like **⛽ Gas Pump**
    followed by dash options and sometimes an Effects/Notes line.
    """
    hotspots = []
    # Split by bold hotspot headings
    parts = re.split(r"\n\s*\*\*(.+?)\*\*\s*\n", "\n" + block.strip() + "\n")
    # parts pattern: [pre, name1, body1, name2, body2, ...]
    if len(parts) < 3:
        return hotspots

    for i in range(1, len(parts), 2):
        name = clean(parts[i])
        body = parts[i+1]
        opts = []
        notes = []
        for ln in body.splitlines():
            ln = ln.strip()
            if ln.startswith("- "):
                opts.append(clean(ln[2:]))
            elif ln.startswith("*") and ln.endswith("*"):
                notes.append(clean(ln.strip("*")))
            elif ln.lower().startswith("effects:") or ln.lower().startswith("affects:") or "Effects:" in ln:
                notes.append(clean(ln))
        hotspots.append({
            "name": name,
            "options": opts,
            "notes": " · ".join(notes).strip()
        })
    return hotspots

def parse_location_block(block: str):
    # Title line: ## 📍 Location NN — "Title" OR ### 📍 Location NN — "Title"
    m = re.search(r'^#{2,3}\s*📍\s*Location\s*\d+\s*—\s*"(.*?)"\s*$', block, flags=re.M)
    title = m.group(1).strip() if m else None

    # Infer sceneId from image link like ![Location](scenes/<sceneId>/bg.png)
    img_match = re.search(r"\(scenes/([^/]+)/", block)
    inferred_id = img_match.group(1) if img_match else None

    # Tier/Tone/Vibe table rows exist in every pack
    tier = re.search(r"\*\*Tier\*\*\s*\|\s*(.+)", block)
    tone = re.search(r"\*\*Tone\*\*\s*\|\s*(.+)", block)
    vibe = re.search(r"\*\*Vibe\*\*\s*\|\s*(.+)", block)

    concept = section_text(block, "Scene Concept")
    core_goal = section_text(block, "Core Player Goal")
    mechanics = section_text(block, "Mechanics Introduced")
    hotspots_txt = section_text(block, "Interaction Hotspots")
    secrets_txt = section_text(block, "Secrets")
    outcomes_txt = section_text(block, "Possible Outcomes")
    dlc_txt = section_text(block, "Future DLC Hooks")

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
        "mechanics": bullet_list(mechanics),
        "hotspotsDesign": parse_hotspots(hotspots_txt),
        "secrets": bullet_list(secrets_txt),
        "outcomes": bullet_list(outcomes_txt),
        "dlcHooks": bullet_list(dlc_txt),
    }

def load_scene_json(scene_id: str):
    p = SCENES_DIR / scene_id / "scene.json"
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"id": scene_id, "title": scene_id, "bg": "bg.png", "mid": "mid.svg", "hotspots": []}

def save_scene_json(scene_id: str, data: dict):
    p = SCENES_DIR / scene_id / "scene.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def extract_location_blocks(md: str):
    # split on "## 📍 Location" OR "### 📍 Location"
    blocks = re.split(r"(?=^#{2,3}\s*📍\s*Location)", md, flags=re.M)
    return [b.strip() for b in blocks if b.strip().startswith(("##", "###"))]

def main():
    import argparse
    ap = argparse.ArgumentParser(description="Update scene.json files from MD design docs")
    ap.add_argument("--root", default=str(PROJECT_ROOT), help="Repo root containing /scenes")
    ap.add_argument("--md", nargs="*", default=[], help="MD files (default: project root MD files)")
    ap.add_argument("--dry-run", action="store_true", help="Show what would be updated without writing files")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    scenes_dir = root / "scenes"
    md_files = [Path(p) for p in args.md] if args.md else MD_FILES

    if not scenes_dir.exists():
        raise SystemExit(f"scenes dir not found: {scenes_dir}")

    updated = 0
    missing_map = []
    for mdfile in md_files:
        if not mdfile.exists():
            print(f"Missing: {mdfile}")
            continue
        md = mdfile.read_text(encoding="utf-8", errors="ignore")
        for block in extract_location_blocks(md):
            parsed = parse_location_block(block)
            title = parsed["title"]
            if not title:
                continue
            
            # Use inferred sceneId if available, otherwise fall back to TITLE_TO_ID mapping
            scene_id = parsed.get("sceneId") or TITLE_TO_ID.get(title)
            if not scene_id:
                print(f"Skip (no scenes/<id>/ link or mapping): {title} in {mdfile}")
                missing_map.append(title)
                continue

            scene_path = scenes_dir / scene_id / "scene.json"
            current = load_scene_json(scene_id) if scene_path.exists() else {}

            # Preserve runtime fields (hotspots/bg/mid) but inject doc-driven fields
            merged = {
                **current,
                "id": scene_id,
                "title": title,
                "meta": parsed["meta"],
                "concept": parsed["concept"],
                "coreGoal": parsed["coreGoal"],
                "mechanics": parsed["mechanics"],
                "hotspotsDesign": parsed["hotspotsDesign"],
                "secrets": parsed["secrets"],
                "outcomes": parsed["outcomes"],
                "dlcHooks": parsed["dlcHooks"],
            }

            if args.dry_run:
                print(f"[DRY] would write {scene_path}")
            else:
                save_scene_json(scene_id, merged)
                updated += 1

    print(f"Updated scene.json files: {updated}")
    if missing_map:
        print("Titles not mapped to scene folder ids:")
        for t in missing_map:
            print(" -", t)

if __name__ == "__main__":
    main()