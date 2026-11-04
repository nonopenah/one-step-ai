"""DB 접근 함수 모음 (repository)."""
import json
from typing import Optional

from .db import db


# ---------- users ----------
def ensure_user(uid: str) -> None:
    with db() as c:
        c.execute("INSERT OR IGNORE INTO users (id) VALUES (?)", (uid,))


def get_user(uid: str) -> dict:
    with db() as c:
        r = c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    u = dict(r)
    u["onboarding"] = json.loads(u["onboarding"]) if u["onboarding"] else None
    u["save_transcript"] = bool(u["save_transcript"])
    u["silence_hint"] = bool(u["silence_hint"])
    return u


def save_onboarding(uid: str, data: dict) -> None:
    with db() as c:
        c.execute("UPDATE users SET onboarding=? WHERE id=?", (json.dumps(data, ensure_ascii=False), uid))


def update_settings(uid: str, save_transcript: bool, silence_hint: bool) -> None:
    with db() as c:
        c.execute(
            "UPDATE users SET save_transcript=?, silence_hint=? WHERE id=?",
            (int(save_transcript), int(silence_hint), uid),
        )


def delete_all(uid: str) -> None:
    with db() as c:
        c.execute("DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id=?)", (uid,))
        c.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
        c.execute("DELETE FROM action_logs WHERE user_id=?", (uid,))
        c.execute("DELETE FROM saved_programs WHERE user_id=?", (uid,))
        c.execute("UPDATE users SET onboarding=NULL WHERE id=?", (uid,))


# ---------- sessions ----------
def create_session(uid: str, scenario_id: str, difficulty: int, mode: str) -> int:
    with db() as c:
        cur = c.execute(
            "INSERT INTO sessions (user_id, scenario_id, difficulty, mode) VALUES (?,?,?,?)",
            (uid, scenario_id, difficulty, mode),
        )
        return cur.lastrowid


def get_session(uid: str, sid: int) -> Optional[dict]:
    with db() as c:
        r = c.execute("SELECT * FROM sessions WHERE id=? AND user_id=?", (sid, uid)).fetchone()
    return _session_dict(r) if r else None


def _session_dict(r) -> dict:
    d = dict(r)
    d["feedback"] = json.loads(d["feedback"]) if d["feedback"] else None
    d["difficult"] = json.loads(d["difficult"]) if d["difficult"] else []
    return d


def add_message(sid: int, role: str, content: str) -> None:
    with db() as c:
        c.execute("INSERT INTO messages (session_id, role, content) VALUES (?,?,?)", (sid, role, content))


def get_messages(sid: int) -> list[dict]:
    with db() as c:
        rows = c.execute("SELECT role, content FROM messages WHERE session_id=? ORDER BY id", (sid,)).fetchall()
    return [dict(r) for r in rows]


def inc_hints(sid: int) -> None:
    with db() as c:
        c.execute("UPDATE sessions SET hints_used = hints_used + 1 WHERE id=?", (sid,))


def end_session(sid: int, feedback: dict, burden: Optional[int], difficult: list[str], keep_transcript: bool) -> None:
    with db() as c:
        c.execute(
            "UPDATE sessions SET ended_at=CURRENT_TIMESTAMP, feedback=?, burden=?, difficult=? WHERE id=?",
            (json.dumps(feedback, ensure_ascii=False), burden, json.dumps(difficult, ensure_ascii=False), sid),
        )
        if not keep_transcript:  # 기본: 전체 대화 텍스트 보관하지 않음
            c.execute("DELETE FROM messages WHERE session_id=?", (sid,))


def set_reflection(sid: int, burden: Optional[int], difficult: list[str]) -> None:
    with db() as c:
        c.execute("UPDATE sessions SET burden=?, difficult=? WHERE id=?",
                  (burden, json.dumps(difficult, ensure_ascii=False), sid))


def list_sessions(uid: str, limit: int = 50) -> list[dict]:
    with db() as c:
        rows = c.execute(
            "SELECT * FROM sessions WHERE user_id=? AND ended_at IS NOT NULL ORDER BY id DESC LIMIT ?",
            (uid, limit),
        ).fetchall()
    return [_session_dict(r) for r in rows]


def delete_session(uid: str, sid: int) -> bool:
    with db() as c:
        cur = c.execute("DELETE FROM sessions WHERE id=? AND user_id=?", (sid, uid))
        if cur.rowcount:
            c.execute("DELETE FROM messages WHERE session_id=?", (sid,))
        return bool(cur.rowcount)


# ---------- actions ----------
def log_action(uid: str, action_id: str, status: str, note: Optional[str]) -> int:
    with db() as c:
        cur = c.execute(
            "INSERT INTO action_logs (user_id, action_id, status, note) VALUES (?,?,?,?)",
            (uid, action_id, status, note),
        )
        return cur.lastrowid


def list_action_logs(uid: str, limit: int = 50) -> list[dict]:
    with db() as c:
        rows = c.execute(
            "SELECT * FROM action_logs WHERE user_id=? ORDER BY id DESC LIMIT ?", (uid, limit)
        ).fetchall()
    return [dict(r) for r in rows]


def delete_action_log(uid: str, log_id: int) -> bool:
    with db() as c:
        return bool(c.execute("DELETE FROM action_logs WHERE id=? AND user_id=?", (log_id, uid)).rowcount)


# ---------- saved programs ----------
def save_program(uid: str, pid: str) -> None:
    with db() as c:
        c.execute("INSERT OR IGNORE INTO saved_programs VALUES (?,?)", (uid, pid))


def unsave_program(uid: str, pid: str) -> None:
    with db() as c:
        c.execute("DELETE FROM saved_programs WHERE user_id=? AND program_id=?", (uid, pid))


def list_saved_programs(uid: str) -> list[str]:
    with db() as c:
        rows = c.execute("SELECT program_id FROM saved_programs WHERE user_id=?", (uid,)).fetchall()
    return [r["program_id"] for r in rows]
