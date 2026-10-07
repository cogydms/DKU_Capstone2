"""사진 업로드: 원본 이미지 + Gemini 줄별 위치로 원문 근거 하이라이트"""
import io

import pytest
from fastapi.testclient import TestClient

from app.api import routes
from app.config import get_settings
from app.llm.mock import MockProvider
from app.main import app
from app.schemas import LLMLine
from app.services import originals
from tests.conftest import SAMPLE

PIL = pytest.importorskip("PIL.Image")
client = TestClient(app)
LINES = [l for l in SAMPLE.splitlines() if l.strip()]


class FakeGemini(MockProvider):
    """받아쓰기만 흉내: 줄마다 세로로 쌓인 상자를 돌려준다."""

    def transcribe_lines(self, data, mime_type):
        return [LLMLine(text=t, box_2d=[50 + i * 50, 100, 90 + i * 50, 900]) for i, t in enumerate(LINES)]


@pytest.fixture(autouse=True)
def _setup(tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "originals_dir", str(tmp_path))
    monkeypatch.setattr(routes, "get_llm", lambda: FakeGemini())


def _png(w=600, h=900):
    buf = io.BytesIO()
    PIL.new("RGB", (w, h), "white").save(buf, format="PNG")
    return buf.getvalue()


def test_photo_has_image_page_and_highlights():
    img = _png()
    r = client.post("/api/documents/analyze", files={"file": ("photo.png", img, "image/png")})
    assert r.status_code == 200, r.text
    doc_id = r.json()["documentId"]
    src = client.get(f"/api/documents/{doc_id}/source").json()
    assert src["kind"] == "image"
    assert src["pageImages"] == [{"width": 600, "height": 900}]
    assert src["highlights"], "근거 위치를 못 찾음"
    deadline = next(f for f in r.json()["analysis"]["fields"] if f["key"] == "deadline")
    h = src["highlights"][deadline["id"]]
    assert h["page"] == 1
    x, y, w, hh = h["rects"][0]
    assert 0.09 <= x <= 0.91 and 0 < w <= 0.82 and 0 < hh < 0.1

    page = client.get(f"/api/documents/{doc_id}/pages/1/image")
    assert page.status_code == 200 and page.content == img and page.headers["content-type"] == "image/png"
    assert client.get(f"/api/documents/{doc_id}/pages/2/image").status_code == 404


def test_jpeg_size_and_web_upload_without_type():
    buf = io.BytesIO()
    PIL.new("RGB", (320, 240), "white").save(buf, format="JPEG")
    assert originals._image_size(buf.getvalue()) == (320, 240)
    r = client.post("/api/documents/analyze", files={"file": ("photo.jpg", buf.getvalue(), "application/octet-stream")})
    assert r.status_code == 200, r.text
    src = client.get(f"/api/documents/{r.json()['documentId']}/source").json()
    assert src["pageImages"] == [{"width": 320, "height": 240}]


def test_webp_size():
    buf = io.BytesIO()
    PIL.new("RGB", (123, 77), "white").save(buf, format="WEBP")
    assert originals._image_size(buf.getvalue()) == (123, 77)
