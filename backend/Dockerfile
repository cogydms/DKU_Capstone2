FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
# Cloud Run은 PORT 환경변수를 넘겨준다
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
