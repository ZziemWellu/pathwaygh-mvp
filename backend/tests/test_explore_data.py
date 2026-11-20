"""Validate the Explore data files (careers, universities, scholarships).

These guard the rules in backend/data/explore/README.md: every record has a
public source and a last-checked date, URLs are well formed, there are no
duplicates, and figures such as cut-offs or salaries only appear with a cited
source and year.
"""

import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import pytest

from modules.explore.router import scholarship_status

DATA = Path(__file__).resolve().parents[1] / "data" / "explore"
COUNTRIES = {"GH", "NG", "SL", "LR", "GM"}
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _load(name):
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))[name]


CAREERS = _load("careers")
UNIVERSITIES = _load("universities")
SCHOLARSHIPS = _load("scholarships")
ALL_FILES = {"careers": CAREERS, "universities": UNIVERSITIES, "scholarships": SCHOLARSHIPS}


def _valid_url(url):
    if not isinstance(url, str) or " " in url:
        return False
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.hostname) and "." in parsed.hostname


def _check_sources(record):
    sources = record.get("source")
    assert isinstance(sources, list) and sources, f"{record['id']}: needs a non-empty source list"
    for s in sources:
        assert s.get("name"), f"{record['id']}: source without a name"
        assert _valid_url(s.get("url")), f"{record['id']}: bad source url {s.get('url')!r}"


def _check_last_checked(record):
    value = record.get("last_checked")
    assert isinstance(value, str) and ISO_DATE.match(value), f"{record['id']}: last_checked must be YYYY-MM-DD"
    assert date.fromisoformat(value) <= date.today(), f"{record['id']}: last_checked is in the future"


def _countries_of(record):
    return set(record.get("countries") or [record.get("country")])


# ---------------------------------------------------------------- all files

@pytest.mark.parametrize("name", ALL_FILES)
def test_ids_are_unique_and_slug_like(name):
    ids = [r["id"] for r in ALL_FILES[name]]
    assert len(ids) == len(set(ids)), f"duplicate ids in {name}"
    assert all(re.fullmatch(r"[a-z0-9][a-z0-9_-]*", i) for i in ids)


@pytest.mark.parametrize("name", ALL_FILES)
def test_every_record_has_source_and_last_checked(name):
    for record in ALL_FILES[name]:
        _check_sources(record)
        _check_last_checked(record)


@pytest.mark.parametrize("name", ALL_FILES)
def test_every_record_is_tagged_with_known_countries(name):
    for record in ALL_FILES[name]:
        countries = _countries_of(record)
        assert countries and countries <= COUNTRIES, f"{record['id']}: unknown country {countries}"


@pytest.mark.parametrize("name", ALL_FILES)
def test_all_urls_are_valid(name):
    url_fields = ("website", "apply_url", "admissions_url")
    for record in ALL_FILES[name]:
        for field in url_fields:
            if field in record:
                assert _valid_url(record[field]), f"{record['id']}.{field} = {record[field]!r}"
        body = record.get("professional_body")
        if body:
            assert _valid_url(body["url"])


# ---------------------------------------------------------------- careers

def test_about_two_hundred_careers():
    assert len(CAREERS) >= 190


def test_career_required_fields():
    for c in CAREERS:
        for field in ("title", "category", "description", "skills", "required_subjects"):
            assert c.get(field), f"{c['id']}: missing {field}"
        path = c["education_path"]
        assert path["shs_programmes"] and path["shs_electives"] and path["after_shs"]
        assert path["route"] in {"university", "tvet", "university_or_tvet", "college", "service_entry"}
        assert c["wassce_subjects"]["core"] and c["wassce_subjects"]["electives"]


def test_career_titles_are_unique():
    titles = [c["title"].lower() for c in CAREERS]
    assert len(titles) == len(set(titles))


def test_careers_cover_every_sector():
    categories = {c["category"] for c in CAREERS}
    for sector in ("Health", "Engineering", "ICT", "Agriculture", "Business and Finance", "Education",
                   "Law and Public Service", "Creative Arts and Media", "Trades and TVET"):
        assert sector in categories


def test_career_institutions_are_gtec_listed():
    ghana_names = {u["name"] for u in UNIVERSITIES if u["country"] == "GH"}
    for c in CAREERS:
        for name in c.get("ghana_institutions", []):
            assert name in ghana_names, f"{c['id']}: {name!r} is not in universities.json"


def test_salary_and_demand_figures_need_a_dated_source():
    for c in CAREERS:
        for field in ("salary_range", "demand", "growth"):
            if field in c:
                cited = c.get(f"{field}_source") or {}
                assert _valid_url(cited.get("url")) and re.fullmatch(r"\d{4}", str(cited.get("year", ""))), (
                    f"{c['id']}: {field} needs {field}_source with url and year"
                )


# ---------------------------------------------------------------- universities

def test_ghana_institutions_come_from_the_gtec_list():
    ghana = [u for u in UNIVERSITIES if u["country"] == "GH"]
    assert len(ghana) >= 250
    for u in ghana:
        assert u["accreditation"]["status"] == "Active"
        assert u["accreditation"]["list_url"].startswith("https://gtec.edu.gh/")
        assert ISO_DATE.match(u["accreditation"]["list_checked"])
        assert u["gtec_category"] and u["type"] and u["location"]
        assert u["ownership"] in {"public", "private"}


def test_university_names_are_unique_per_country():
    seen = set()
    for u in UNIVERSITIES:
        key = (u["country"], u["name"].lower())
        assert key not in seen, f"duplicate {key}"
        seen.add(key)


def test_cutoffs_and_rankings_need_a_dated_source():
    for u in UNIVERSITIES:
        for field in ("cutoff", "ranking"):
            if field in u:
                cited = u.get(f"{field}_source") or {}
                assert _valid_url(cited.get("url")) and re.fullmatch(r"\d{4}", str(cited.get("year", ""))), (
                    f"{u['id']}: {field} needs {field}_source with url and year"
                )


# ---------------------------------------------------------------- scholarships

def test_scholarship_required_fields():
    for s in SCHOLARSHIPS:
        for field in ("title", "sponsor", "eligibility", "coverage", "description", "deadline"):
            assert s.get(field), f"{s['id']}: missing {field}"
        assert s["type"] in {"government", "private", "international"}
        assert set(s["level"]) <= {"secondary", "undergraduate", "postgraduate", "tvet"}
        assert _valid_url(s["website"])
        if ISO_DATE.match(s["deadline"]) is None:
            assert not re.match(r"^\d{4}-", s["deadline"]), f"{s['id']}: malformed date"


def test_scholarship_titles_are_unique():
    titles = [s["title"].lower() for s in SCHOLARSHIPS]
    assert len(titles) == len(set(titles))


def test_scholarship_status_comes_from_the_dates():
    today = date(2026, 6, 1)
    assert scholarship_status({"deadline": "2026-05-31"}, today) == "closed"
    assert scholarship_status({"deadline": "2026-06-01"}, today) == "open"
    assert scholarship_status({"deadline": "2026-12-01", "opens": "2026-10-01"}, today) == "upcoming"
    assert scholarship_status({"deadline": "rolling"}, today) == "rolling"
    assert scholarship_status({"deadline": "Announced yearly"}, today) == "check"


def test_api_recomputes_scholarship_status(client):
    for s in client.get("/api/explore/scholarships").json()["scholarships"]:
        assert s["status"] == scholarship_status(s)


def test_west_african_scholarship_is_shown_outside_ghana_only(client):
    ids = lambda country: {  # noqa: E731
        s["id"] for s in client.get("/api/explore/scholarships", params={"country": country}).json()["scholarships"]
    }
    assert "wa_pwasi" in ids("NG")
    assert "wa_pwasi" not in ids("GH")
