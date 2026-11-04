"""SQLite 연결/스키마. 프로토타입용 - 이후 PostgreSQL 등으로 교체 가능."""
import sqlite3
from contextlib import contextmanager

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    onboarding TEXT,                       -- JSON: burden, interests, goal
    save_transcript INTEGER DEFAULT 0,     -- 전체 대화 저장 (기본 OFF)
    silence_hint INTEGER DEFAULT 1         -- 침묵 시 화면 도움 제안
);
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    mode TEXT DEFAULT 'text',
    hints_used INTEGER DEFAULT 0,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    feedback TEXT,                         -- JSON
    burden INTEGER,                        -- 체감 부담 1~5 (선택)
    difficult TEXT                         -- JSON list (선택)
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,                    -- user | ai
    content TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action_id TEXT NOT NULL,
    status TEXT NOT NULL,                  -- done | partial | later
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS saved_programs (
    user_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    PRIMARY KEY (user_id, program_id)
);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db():
    conn = connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(SCHEMA)
