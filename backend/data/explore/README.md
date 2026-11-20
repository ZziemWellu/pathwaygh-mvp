# Explore data

The Explore section (`/api/explore/...`, `backend/modules/explore/router.py`) reads three files:

| File | What it holds | Records (last check) |
| --- | --- | --- |
| `careers.json` | Careers, with how to get there from SHS | 201 |
| `universities.json` | Tertiary institutions (Ghana: GTEC-accredited) | 285 (274 Ghana + 11 other countries) |
| `scholarships.json` | Scholarships for secondary and tertiary students | 19 |

Last full check: **20 November 2026**. These pages guide children, so **accuracy comes before volume**.
If you can't verify something, leave it out.

## Rules for every record

- `source`: a non-empty list of `{ "name", "url" }` pointing to public pages that back the record.
- `last_checked`: the date (`YYYY-MM-DD`) someone last checked the record against its source.
- `countries`: which of `GH`, `NG`, `SL`, `LR`, `GM` the record is shown to. Careers are shown in all
  five unless a career is clearly country-specific. Older single-country records may use `country` instead.
- Write descriptions in your own words. Don't copy text, and don't use NonCommercial-licensed data.
- Don't use "certificate" or "certification" in student-facing text
  (`backend/tests/test_no_certificates.py` checks every data file). Say "professional qualification",
  "passed the WASSCE", "WASSCE results" or "birth record" instead.
- Figures need a dated source. A university `cutoff` or `ranking`, or a career `salary_range`,
  `demand` or `growth`, is only allowed with a matching `<field>_source` holding a `url` and a `year`.
  Without one, leave the figure out rather than estimate it.

`backend/tests/test_explore_data.py` enforces these rules: required fields, valid URLs, no duplicates,
`source` and `last_checked` present, and career institutions that match GTEC-listed names.

## Sources

### Universities (`universities.json`)
- **GTEC Explore Institutions directory** (https://gtec.edu.gh/explore-institutions/), read category by
  category on 2026-11-20. Only institutions GTEC showed as **Active** are included (274). Each record keeps
  GTEC's category (`gtec_category`), its accreditation dates where GTEC gives them, and a link to the
  category list. 45 institutions GTEC listed as **Expired** were left out.
- **Websites**: from the Ghana Scholarships Authority's PWASI 2026 notice (official admission sites of
  public universities), or from the institution's Wikipedia infobox when the article title matches the
  GTEC name exactly and the address is a West African `.edu` domain. Otherwise no website is given.
- The non-Ghana entries (NG, SL, LR, GM) are kept from the earlier file and cite Wikipedia. They are not
  yet checked against their national regulators (NUC, TEC Sierra Leone, NCHE Liberia, NAQAA Gambia).
- Unsourced cut-offs and rankings were removed.

### Careers (`careers.json`)
- Each career cites the regulator for the profession in Ghana where one exists (Medical and Dental Council,
  Nursing and Midwifery Council, Pharmacy Council, Allied Health Professions Council, Engineering Council
  (Act 819), National Teaching Council, General Legal Council, ICAG, Architects Registration Council,
  Ghana TVET Service / NTVETQF), a Wikipedia article on the occupation, and NaCCA's curriculum resources.
- `education_path.shs_programmes` and `shs_electives` use the SHS programme and WASSCE subject names in use
  up to the 2024 curriculum change. Students on NaCCA's new standards-based curriculum (from the 2024/25
  intake) choose subjects rather than a programme, so the elective subjects are the part to follow.
- `ghana_institutions` lists only institutions we are confident offer the programme. Each must be a GTEC
  name in `universities.json` (tested). It is a sample, not a complete list.
- No salary or demand figures: we found no citable, recent public source for them.

### Scholarships (`scholarships.json`)
- Only scholarships with an official page or an official notice: Ghana Scholarships Authority notices
  (scholarships.gov.gh), sponsor and university pages, and official programme sites. `verification` records
  how each was checked (`official_page`, `official_page_via_search` when the official site blocked automated
  reading, or `official_portal_exists_dates_from_news`).
- `deadline` is a `YYYY-MM-DD` date, `"rolling"`, or a short note when dates are announced each year. The
  API works out `status` (`open`, `upcoming`, `closed`, `rolling`, `check`) from `opens` and `deadline` on
  each request, so it doesn't go stale.
- None of the scholarships asks applicants to pay an agent. Don't add ones that charge to apply, promise
  guaranteed places, or have no official page.

## Yearly refresh (each September to November)

1. **Universities:** from `backend/`, run `python scripts/check_gtec_institutions.py`. It lists institutions
   newly active on GTEC and entries that are no longer active. Update `universities.json` by hand (keep
   existing fields), then set `last_checked` and `accreditation.list_checked`.
2. **Scholarships:** check each official page for the new round. Update the dates, eligibility and
   `last_checked`, and remove any programme that has ended or can't be verified. Check
   https://scholarships.gov.gh/opportunities for new Ghana Scholarships Authority calls.
3. **Careers:** check the regulator links still work and the training routes haven't changed. For example,
   the route to becoming a lawyer is changing under the Legal Education Act, 2026.
4. Run `ruff check . && pytest` in `backend/`, then update the counts and date at the top of this file.
