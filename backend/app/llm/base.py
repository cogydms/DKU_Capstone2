from __future__ import annotations

from typing import Protocol

from app.schemas import LLMExtraction, Sentence


class LLMProvider(Protocol):
    name: str

    def transcribe(self, data: bytes, mime_type: str) -> list[str]:
        """이미지/스캔 PDF를 원문 그대로 텍스트화. 페이지별 문자열 리스트."""
        ...

    def extract(self, sentences: list[Sentence], today: str) -> LLMExtraction:
        """문장 번호가 붙은 원문에서 행동 정보를 구조화 추출."""
        ...


EXTRACTION_SYSTEM_PROMPT = """\
너는 한국어 생활문서(대학 공지, 모집 공고, 고지서, 계약서)에서 사용자가 '해야 할 행동'에 필요한 정보를 뽑는 추출기다.

[규칙]
1. evidence_quote 는 아래 원문에서 근거 문장을 **한 글자도 바꾸지 말고 그대로 복사**한다. 요약·의역 금지. 문장 번호 태그([p1-s3])는 빼고 복사한다.
2. 원문에 없는 정보는 절대 만들지 않는다. 확실하지 않으면 필드를 만들지 말거나 confidence 를 낮춘다.
3. 날짜는 의미를 구분한다.
   - application_start: 신청/접수 시작일
   - deadline: 신청/접수/제출 **마감**일 ("~까지", 기간의 끝)
   - announcement_date: 결과·합격자 발표일
   - event_date: 설명회·행사·교육 일시
   "9월 15일 ~ 9월 25일" 같은 기간이면 시작은 application_start, 끝은 deadline 이다.
4. normalized_datetime 은 날짜 필드에만 넣는다. 연도가 없으면 문서의 다른 날짜나 오늘 날짜({today})로 추론한다.
   시간이 원문에 없으면 날짜만(YYYY-MM-DD) 쓴다. 원문에 없는 시간을 만들지 않는다.
5. applicant_criteria, required_document 는 **한 필드에 한 항목**씩 나눈다. (서류 3개면 필드 3개)
6. todo 는 사용자가 실제로 해야 할 행동을 짧은 동사구로 쓴다. 예: "성적증명서 발급", "신청서 작성", "학생포털에서 서류 제출".
   행동을 유추한 근거 문장을 evidence_quote 에 넣는다. 준비 순서대로 나열한다.
7. confidence 는 0.0~1.0. 원문에 명시되어 있으면 높게, 해석이 필요하면 낮게.
"""


def format_numbered_source(sentences: list[Sentence]) -> str:
    return "\n".join(f"[p{s.page}-s{s.index}] {s.text}" for s in sentences)


TRANSCRIBE_PROMPT = """\
이 문서의 모든 글자를 원문 그대로 텍스트로 옮겨 적어라.
- 요약·번역·해석하지 말고 보이는 그대로 적는다. 표는 한 행을 한 줄로, 칸은 ' | '로 구분한다.
- 페이지가 여러 장이면 각 페이지 시작에 '=== PAGE n ===' 을 적는다.
- 텍스트 외의 설명은 쓰지 않는다.
"""
