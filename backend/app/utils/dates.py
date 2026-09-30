"""한국어 공지문 날짜 파서.

지원 형식
  2026년 9월 25일(금) 17:00 / 9월 25일 오후 5시 / 9월 25일 17시 30분
  2026.09.25 / 2026-09-25 / 2026/9/25 (뒤에 HH:MM 가능)
  9. 25.(목)
연도가 없는 날짜는 같은 텍스트에서 앞에 나온 날짜의 연도를, 그것도 없으면 default_year를 쓴다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

_WEEKDAY = r"(?:\s*\(\s*[월화수목금토일]\s*\))?"
_TIME = (
    r"(?:\s*(?P<ampm>오전|오후)?\s*(?P<hour>\d{1,2})\s*(?:시|:)\s*(?:(?P<minute>\d{2})\s*분?)?)?"
)

_PATTERNS = [
    re.compile(
        r"(?:(?P<year>\d{4})\s*년\s*)?(?P<month>\d{1,2})\s*월\s*(?P<day>\d{1,2})\s*일" + _WEEKDAY + _TIME
    ),
    re.compile(
        r"(?P<year>\d{4})\s*[.\-/]\s*(?P<month>\d{1,2})\s*[.\-/]\s*(?P<day>\d{1,2})\.?" + _WEEKDAY + _TIME
    ),
    # "9. 25.(목)" : 요일 괄호가 있어야 날짜로 인정 (3.5 같은 숫자 오인 방지)
    re.compile(r"(?<![\d.])(?P<month>\d{1,2})\.\s*(?P<day>\d{1,2})\.?\s*\(\s*[월화수목금토일]\s*\)" + _TIME),
]

_RANGE_SEP = re.compile(r"^[\s\(\)월화수목금토일:\d]*(~|∼|〜|–|부터)")


@dataclass
class ParsedDate:
    year: Optional[int]
    month: int
    day: int
    hour: Optional[int]
    minute: Optional[int]
    start: int  # 텍스트 내 위치
    end: int
    raw: str

    @property
    def has_time(self) -> bool:
        return self.hour is not None

    def iso(self) -> str:
        y = self.year or 0
        if self.has_time:
            return f"{y:04d}-{self.month:02d}-{self.day:02d}T{self.hour:02d}:{self.minute or 0:02d}"
        return f"{y:04d}-{self.month:02d}-{self.day:02d}"

    def same_day(self, other: "ParsedDate") -> bool:
        if (self.month, self.day) != (other.month, other.day):
            return False
        return self.year is None or other.year is None or self.year == other.year

    def same_time(self, other: "ParsedDate") -> bool:
        return (self.hour, self.minute or 0) == (other.hour, other.minute or 0)


def _valid(month: int, day: int, hour: Optional[int], minute: Optional[int]) -> bool:
    if not (1 <= month <= 12 and 1 <= day <= 31):
        return False
    if hour is not None and not (0 <= hour <= 24):
        return False
    if minute is not None and not (0 <= minute <= 59):
        return False
    return True


def parse_dates(text: str, default_year: Optional[int] = None) -> list[ParsedDate]:
    found: list[ParsedDate] = []
    taken: list[tuple[int, int]] = []
    for pat in _PATTERNS:
        for m in pat.finditer(text):
            s, e = m.span()
            if any(s < te and ts < e for ts, te in taken):
                continue
            g = m.groupdict()
            month, day = int(g["month"]), int(g["day"])
            hour = int(g["hour"]) if g.get("hour") else None
            minute = int(g["minute"]) if g.get("minute") else None
            if hour is not None and g.get("ampm") == "오후" and hour < 12:
                hour += 12
            if hour is not None and minute is None and ":" in m.group(0)[m.start("hour") - s:]:
                minute = 0
            if not _valid(month, day, hour, minute):
                continue
            year = int(g["year"]) if g.get("year") else None
            found.append(ParsedDate(year, month, day, hour, minute, s, e, m.group(0).strip()))
            taken.append((s, e))
    found.sort(key=lambda d: d.start)

    last_year = default_year
    for d in found:
        if d.year is None:
            d.year = last_year
        else:
            last_year = d.year
    return found


def find_ranges(text: str, dates: list[ParsedDate]) -> list[tuple[ParsedDate, ParsedDate]]:
    """'9월 15일 ~ 9월 25일', '15일부터 25일까지' 같은 기간 표현을 (시작, 끝) 쌍으로."""
    ranges = []
    for a, b in zip(dates, dates[1:]):
        gap = text[a.end:b.start]
        if len(gap) <= 15 and _RANGE_SEP.search(gap):
            ranges.append((a, b))
    return ranges


def parse_iso(value: Optional[str]) -> Optional[ParsedDate]:
    if not value:
        return None
    try:
        if "T" in value:
            dt = datetime.fromisoformat(value)
            return ParsedDate(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0, 0, value)
        dt = datetime.fromisoformat(value[:10])
        return ParsedDate(dt.year, dt.month, dt.day, None, None, 0, 0, value)
    except ValueError:
        return None
