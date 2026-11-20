"""Yearly check of backend/data/explore/universities.json against GTEC.

Reads GTEC's public "Explore Institutions" directory (https://gtec.edu.gh/explore-institutions/)
category by category and prints what has changed since the data was last checked:

  * institutions GTEC now lists as Active that are missing from universities.json
  * Ghanaian entries in universities.json that GTEC no longer lists as Active
    (their accreditation expired or they were removed)

It does not edit the data file - review the report, then update universities.json
by hand (keeping existing fields) and bump each record's `last_checked`.

Usage (from backend/):
    python scripts/check_gtec_institutions.py              # report only
    python scripts/check_gtec_institutions.py --save gtec.json   # also save the raw rows
"""

import argparse
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

GTEC = "https://gtec.edu.gh/institutions/"
DATA = Path(__file__).resolve().parents[1] / "data" / "explore" / "universities.json"

# Category names exactly as GTEC uses them in its directory links.
CATEGORIES = [
    "Traditional University",
    "Public Technical University",
    "Public Degree Awarding and Professional Institution",
    "Public College of Education",
    "Public Nurses/Health Training College",
    "College of Agriculture",
    "Regionally-Owned (West Africa) Tertiary Institution",
    "Chartered Private Tertiary Institution",
    "Private University",
    "Private Tertiary Institutions Offering HND/Degree Programmes",
    "Private Polytechnic",
    "Private College of Education",
    "Private Nurses/Health Training College",
    "Distance Learning Institution",
    "Registered Foreign Institution",
    "Tutorial College",
]

ROW = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
CELL = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)


def _clean(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def _get(url, attempts=5):
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "explore-data-check/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read().decode("utf-8", "replace")
        except OSError as exc:
            if attempt == attempts - 1:
                raise RuntimeError(f"could not fetch {url}: {exc}") from exc
            time.sleep(3 * (attempt + 1))
    return ""


def fetch_gtec():
    rows = []
    for category in CATEGORIES:
        page = 1
        while True:
            url = GTEC + "?" + urllib.parse.urlencode({"category": category, "pg": page})
            body = _get(url)
            found = 0
            for row in ROW.findall(body):
                cells = [_clean(c) for c in CELL.findall(row)]
                if len(cells) < 5 or cells[0] == "Name":
                    continue
                rows.append({"category": category, "name": cells[0], "location": cells[1],
                             "status": cells[2], "start": cells[3], "end": cells[4]})
                found += 1
            if not found or f"pg={page + 1}" not in body.replace("&#038;", "&"):
                break
            page += 1
            time.sleep(0.5)
        print(f"  {category}: {sum(1 for r in rows if r['category'] == category)}", file=sys.stderr)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--save", help="write the raw GTEC rows to this JSON file")
    args = parser.parse_args()

    print("Reading GTEC directory...", file=sys.stderr)
    rows = fetch_gtec()
    if args.save:
        Path(args.save).write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")

    active = {r["name"] for r in rows if r["status"] == "Active"}
    ours = {u["name"] for u in json.loads(DATA.read_text(encoding="utf-8"))["universities"] if u["country"] == "GH"}

    missing = sorted(active - ours)
    gone = sorted(ours - active)
    print(f"GTEC rows: {len(rows)} ({len(active)} active). Ghana entries in data: {len(ours)}.")
    print(f"\nActive on GTEC but missing from universities.json ({len(missing)}):")
    for name in missing:
        print("  +", name)
    print(f"\nIn universities.json but not active on GTEC ({len(gone)}):")
    for name in gone:
        print("  -", name)
    return 1 if (missing or gone) else 0


if __name__ == "__main__":
    sys.exit(main())
