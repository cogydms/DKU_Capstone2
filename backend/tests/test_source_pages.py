"""원문 근거 화면: PDF 원본 페이지 이미지와 근거 하이라이트 위치"""
import io

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from tests.conftest import SAMPLE

reportlab = pytest.importorskip("reportlab")
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.cidfonts import UnicodeCIDFont  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402

client = TestClient(app)


def _pdf(lines_per_page: list[list[str]]) -> bytes:
    pdfmetrics.registerFont(UnicodeCIDFont("HYSMyeongJo-Medium"))
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    for lines in lines_per_page:
        c.setFont("HYSMyeongJo-Medium", 11)
        y = A4[1] - 72
        for line in lines:
            c.drawString(60, y, line)
            y -= 20
        c.showPage()
    c.save()
    return buf.getvalue()


@pytest.fixture(autouse=True)
def _tmp_originals(tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "originals_dir", str(tmp_path))


def test_pdf_source_has_page_images_and_highlights():
    lines = [l for l in SAMPLE.splitlines() if l.strip()]
    half = len(lines) // 2
    pdf = _pdf([["안내문 표지", *lines[:half]], lines[half:]])
    r = client.post("/api/documents/analyze", files={"file": ("notice.pdf", pdf, "application/pdf")})
    assert r.status_code == 200, r.text
    doc_id = r.json()["documentId"]
    fields = r.json()["analysis"]["fields"]

    src = client.get(f"/api/documents/{doc_id}/source").json()
    assert src["kind"] == "pdf"
    assert len(src["pageImages"]) == 2 and src["pageImages"][0]["width"] > 0
    found = [f for f in fields if f["id"] in src["highlights"]]
    assert found, "근거 위치를 하나도 찾지 못함"
    for f in found:
        h = src["highlights"][f["id"]]
        assert 1 <= h["page"] <= 2
        for x, y, w, hh in h["rects"]:
            assert 0 <= x <= 1 and 0 <= y <= 1 and 0 < w <= 1 and 0 < hh <= 1

    img = client.get(f"/api/documents/{doc_id}/pages/2/image?width=300")
    assert img.status_code == 200 and img.content[:4] == b"\x89PNG"
    assert client.get(f"/api/documents/{doc_id}/pages/9/image").status_code == 404


def test_text_source_has_no_page_images():
    doc_id = client.post("/api/documents/analyze", data={"text": SAMPLE}).json()["documentId"]
    src = client.get(f"/api/documents/{doc_id}/source").json()
    assert src["kind"] == "text" and src["pageImages"] is None and src["highlights"] == {}
    assert client.get(f"/api/documents/{doc_id}/pages/1/image").status_code == 404
