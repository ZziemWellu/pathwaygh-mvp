from modules.qa.moderation import moderation_reason


def test_clean_question_is_not_flagged():
    assert moderation_reason("How do I factorize a quadratic equation?") is None


def test_profanity_is_flagged():
    assert moderation_reason("This homework is fucking stupid") is not None


def test_email_address_is_flagged():
    assert moderation_reason("Please message me at student123@gmail.com for the notes") is not None


def test_phone_number_is_flagged():
    assert moderation_reason("Call me on 024 123 4567 to discuss") is not None


def test_international_format_phone_number_is_flagged():
    assert moderation_reason("WhatsApp me: +233241234567") is not None


def test_a_year_range_is_not_mistaken_for_a_phone_number():
    """A common, entirely innocent pattern (e.g. discussing past exam
    papers) must not false-positive as a phone number just because it's
    a run of digits and a dash."""
    assert moderation_reason("Does anyone have WASSCE past questions from 1990-2026?") is None


def test_a_short_numeric_range_is_not_flagged():
    assert moderation_reason("Question 12-15 in the textbook are confusing me") is None
