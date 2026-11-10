import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# .env가 있으면 간단히 로드 (python-dotenv 없이)
_env = BASE_DIR.parent / ".env"
if _env.exists():
    for line in _env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

DB_PATH = os.getenv("DB_PATH", str(BASE_DIR.parent / "app.db"))
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "claude-haiku-5-5")
SILENCE_SECONDS = int(os.getenv("SILENCE_SECONDS", "30"))
