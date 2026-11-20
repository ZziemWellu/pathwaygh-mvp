"""The Ghana syllabus map (data/syllabus/gh.json): levels, subjects, strands
and topics, each with an id that lessons and practice questions are tagged
with."""

import json
from functools import lru_cache
from pathlib import Path

SYLLABUS_FILE = Path(__file__).resolve().parents[2] / "data" / "syllabus" / "gh.json"


@lru_cache(maxsize=1)
def syllabus() -> dict:
    return json.loads(SYLLABUS_FILE.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def topic_index() -> dict:
    """{topic id: {topic, strand, subject, level}} for every syllabus topic."""
    index = {}
    for level in syllabus()["levels"]:
        for subject in level["subjects"]:
            for strand in subject["strands"]:
                for topic in strand["topics"]:
                    index[topic["id"]] = {"topic": topic, "strand": strand, "subject": subject, "level": level}
    return index


def is_topic(topic_id) -> bool:
    return topic_id in topic_index()
