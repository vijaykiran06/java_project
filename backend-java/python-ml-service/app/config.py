import os
from pathlib import Path


def resolve_models_dir() -> Path:
    env_dir = os.getenv("ML_MODELS_DIR")
    if env_dir:
        p = Path(env_dir).expanduser().resolve()
        if p.exists():
            return p

    app_dir = Path(__file__).resolve().parent
    candidates = [
        app_dir.parent / "models",
        app_dir.parents[2] / "ml" / "models",
        app_dir.parents[2] / "backend" / "ml" / "models",
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()

    return (app_dir.parent / "models").resolve()


ML_MODELS_DIR: Path = resolve_models_dir()
ML_SERVICE_HOST: str = os.getenv("ML_SERVICE_HOST", "127.0.0.1")
ML_SERVICE_PORT: int = int(os.getenv("ML_SERVICE_PORT", "8001"))
