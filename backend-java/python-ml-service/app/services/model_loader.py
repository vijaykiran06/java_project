import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib

from app.config import ML_MODELS_DIR


@dataclass
class LoadedModels:
    models_dir: Path
    vectorizer: Any = None
    global_classifiers: Dict[str, Any] = field(default_factory=dict)
    subcategory_classifiers: Dict[str, Any] = field(default_factory=dict)
    intent_classifier: Any = None
    intent_vectorizer: Any = None
    grievance_metadata: Dict[str, Any] = field(default_factory=dict)
    intent_metadata: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)

    @property
    def is_grievance_ready(self) -> bool:
        return (
            self.vectorizer is not None
            and "department" in self.global_classifiers
            and "category" in self.global_classifiers
            and "priority" in self.global_classifiers
        )

    @property
    def is_intent_ready(self) -> bool:
        return self.intent_classifier is not None and self.intent_vectorizer is not None

    @property
    def is_ready(self) -> bool:
        return self.is_grievance_ready and self.is_intent_ready and len(self.errors) == 0


class ModelRegistry:
    """Singleton-style registry that loads Joblib models once at startup."""

    def __init__(self) -> None:
        self._loaded: Optional[LoadedModels] = None

    def load(self, models_dir: Optional[Path] = None) -> LoadedModels:
        target_dir = (models_dir or ML_MODELS_DIR).resolve()
        bundle = LoadedModels(models_dir=target_dir)

        if not target_dir.exists():
            bundle.errors.append(f"Models directory does not exist: {target_dir}")
            self._loaded = bundle
            return bundle

        vec_path = target_dir / "tfidf_vectorizer.joblib"
        if not vec_path.exists():
            bundle.errors.append(f"Missing vectorizer: {vec_path}")
        else:
            bundle.vectorizer = joblib.load(vec_path)

        for target in ("department", "category", "priority"):
            clf_path = target_dir / f"{target}_classifier.joblib"
            if not clf_path.exists():
                bundle.errors.append(f"Missing global classifier: {clf_path}")
            else:
                bundle.global_classifiers[target] = joblib.load(clf_path)

        cat_models_dir = target_dir / "category_models"
        if cat_models_dir.exists():
            for file_path in sorted(cat_models_dir.iterdir()):
                if file_path.name.endswith("_subcategory_clf.joblib"):
                    bundle.subcategory_classifiers[file_path.name] = joblib.load(file_path)

        intent_clf_path = target_dir / "intent_classifier.joblib"
        intent_vec_path = target_dir / "intent_vectorizer.joblib"
        if not intent_clf_path.exists():
            bundle.errors.append(f"Missing intent classifier: {intent_clf_path}")
        else:
            bundle.intent_classifier = joblib.load(intent_clf_path)

        if not intent_vec_path.exists():
            bundle.errors.append(f"Missing intent vectorizer: {intent_vec_path}")
        else:
            bundle.intent_vectorizer = joblib.load(intent_vec_path)

        grievance_meta_path = target_dir / "model_metadata.json"
        if grievance_meta_path.exists():
            bundle.grievance_metadata = json.loads(grievance_meta_path.read_text(encoding="utf-8"))

        intent_meta_path = target_dir / "intent_metadata.json"
        if intent_meta_path.exists():
            bundle.intent_metadata = json.loads(intent_meta_path.read_text(encoding="utf-8"))

        self._loaded = bundle
        return bundle

    def get(self) -> LoadedModels:
        if self._loaded is None:
            return self.load()
        return self._loaded


model_registry = ModelRegistry()
