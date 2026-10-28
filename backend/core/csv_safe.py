"""Shared CSV export helper."""


def csv_safe(value):
    """Neutralizes CSV/formula injection: Excel/Sheets treats a leading
    =, +, -, or @ as the start of a formula, and names in exports (school
    names, student names) are arbitrary user-supplied text."""
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@"):
        return "'" + text
    return text
