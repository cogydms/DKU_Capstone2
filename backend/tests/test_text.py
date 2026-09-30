from app.agents import intake
from app.utils.text import mask_pii, split_sentences


def test_sentence_offsets_match_full_text(source):
    full = source.full_text
    for s in split_sentences(source):
        assert full[s.char_start:s.char_end] == s.text


def test_date_dots_do_not_split_sentences():
    src = intake.from_text("마감은 2026. 9. 25.(금)입니다. 늦지 마세요.")
    texts = [s.text for s in split_sentences(src)]
    assert texts == ["마감은 2026. 9. 25.(금)입니다.", "늦지 마세요."]


def test_multi_page_offsets():
    src = intake.from_text("첫 페이지입니다.\f둘째 페이지 첫 문장입니다. 둘째 문장입니다.")
    ss = split_sentences(src)
    assert [(s.page, s.index) for s in ss] == [(1, 1), (2, 1), (2, 2)]
    assert all(src.full_text[s.char_start:s.char_end] == s.text for s in ss)


def test_pii_masking():
    text, n = mask_pii("연락처 010-1234-5678, 주민번호 030101-3123456, 사무실 031-8005-2345")
    assert n == 2
    assert "010-1234-5678" not in text and "030101-3123456" not in text
    assert "031-8005-2345" in text  # 기관 번호는 유지
