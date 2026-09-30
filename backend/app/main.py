from fastapi import FastAPI


app = FastAPI(
    title="ActionDoc API",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "ActionDoc backend"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }