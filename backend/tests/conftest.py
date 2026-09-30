from datetime import datetime
from pathlib import Path

import pytest

from app.agents import intake
from app.agents.verification import Verifier
from app.utils.text import split_sentences

SAMPLE = (Path(__file__).parent.parent / "samples" / "scholarship_notice.txt").read_text(encoding="utf-8")
NOW = datetime(2026, 9, 18, 10, 0)


@pytest.fixture
def source():
    return intake.from_text(SAMPLE)


@pytest.fixture
def verifier(source):
    return Verifier(source, split_sentences(source), threshold=80, now=NOW)
