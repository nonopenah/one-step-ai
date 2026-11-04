import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from . import config, repo
from .db import init_db
from .routers import api, pages


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="단계적 사회진입 지원 서비스 (프로토타입)", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(config.BASE_DIR / "static")), name="static")


@app.middleware("http")
async def anonymous_user(request: Request, call_next):
    """로그인 없이 쿠키로 익명 사용자를 식별. (회원가입/로그인은 팀 논의 후 교체)"""
    if request.url.path.startswith("/static"):
        return await call_next(request)
    uid = request.cookies.get("uid")
    is_new = not uid or len(uid) != 32
    if is_new:
        uid = uuid.uuid4().hex
    request.state.uid = uid
    repo.ensure_user(uid)
    response = await call_next(request)
    if is_new:
        response.set_cookie("uid", uid, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 365)
    return response


app.include_router(api.router)
app.include_router(pages.router)


@app.get("/health")
def health():
    return {"status": "ok"}
