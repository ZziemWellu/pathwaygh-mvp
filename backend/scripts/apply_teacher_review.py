"""
Records a teacher's review of the written questions, then rebuilds the bank.

The teacher fills in the "teacher approved? (yes/no)" column of
data/practice/bank_gh_for_teacher_review.csv, and writes any correction in the
last column. Yes approves a question. No removes it. A blank stays a draft.
Corrections aren't applied automatically: they're printed for someone to edit
into question_bank_written.py, and then that question is reviewed again.

    python scripts/apply_teacher_review.py path/to/reviewed.csv
"""

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import build_question_bank  # noqa: E402

DECISIONS_FILE = build_question_bank.DECISIONS_FILE


def main(path: str) -> None:
    decisions = json.loads(DECISIONS_FILE.read_text(encoding="utf-8")) if DECISIONS_FILE.exists() else {}
    corrections = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            answer = (row.get("teacher approved? (yes/no)") or "").strip().lower()
            if row.get("teacher's correction", "").strip():
                corrections.append((row["id"], row["teacher's correction"].strip()))
            if answer in ("yes", "y"):
                decisions[row["id"]] = "approved"
            elif answer in ("no", "n"):
                decisions[row["id"]] = "rejected"
    DECISIONS_FILE.write_text(json.dumps(decisions, indent=1, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    build_question_bank.main()
    print(f"\n{sum(v == 'approved' for v in decisions.values())} approved, {sum(v == 'rejected' for v in decisions.values())} rejected.")
    for question_id, correction in corrections:
        print(f"Correction for {question_id}: {correction}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
