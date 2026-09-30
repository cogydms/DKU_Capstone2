from app.utils.dates import find_ranges, parse_dates


def test_korean_full():
    d = parse_dates("접수 마감은 2026년 9월 25일 17시까지입니다.")[0]
    assert (d.year, d.month, d.day, d.hour, d.minute) == (2026, 9, 25, 17, None)


def test_pm_and_weekday():
    d = parse_dates("9월 25일(금) 오후 5시 30분")[0]
    assert (d.month, d.day, d.hour, d.minute) == (9, 25, 17, 30)


def test_dotted_and_colon_time():
    d = parse_dates("마감: 2026.09.25 17:00")[0]
    assert d.iso() == "2026-09-25T17:00"


def test_year_inherited_and_range():
    text = "신청 기간: 2026년 9월 15일(화) ~ 9월 25일(금) 17:00까지"
    ds = parse_dates(text)
    assert [d.iso() for d in ds] == ["2026-09-15", "2026-09-25T17:00"]
    (a, b), = find_ranges(text, ds)
    assert a.day == 15 and b.day == 25


def test_gpa_is_not_a_date():
    assert parse_dates("직전 학기 평균 평점 3.5 이상") == []


def test_phone_is_not_a_date():
    assert parse_dates("문의: 031-8005-2345") == []
