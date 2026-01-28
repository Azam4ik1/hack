from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Tuple

import numpy as np


@dataclass
class LogisticModel:
    weights: np.ndarray
    bias: float
    feature_names: List[str]

    def predict_proba(self, features: Dict[str, float]) -> float:
        vector = np.array([features.get(name, 0.0) for name in self.feature_names])
        score = float(np.dot(self.weights, vector) + self.bias)
        return 1.0 / (1.0 + np.exp(-score))


@dataclass
class PlattCalibrator:
    a: float = 1.0
    b: float = 0.0

    def fit(self, probs: Iterable[float], labels: Iterable[int], steps: int = 300, lr: float = 0.1) -> None:
        probs_array = np.clip(np.array(list(probs)), 1e-6, 1 - 1e-6)
        labels_array = np.array(list(labels))
        a = self.a
        b = self.b
        for _ in range(steps):
            logits = a * probs_array + b
            preds = 1.0 / (1.0 + np.exp(-logits))
            error = preds - labels_array
            grad_a = float(np.mean(error * probs_array))
            grad_b = float(np.mean(error))
            a -= lr * grad_a
            b -= lr * grad_b
        self.a = float(a)
        self.b = float(b)

    def predict(self, probs: Iterable[float]) -> List[float]:
        probs_array = np.clip(np.array(list(probs)), 1e-6, 1 - 1e-6)
        logits = self.a * probs_array + self.b
        calibrated = 1.0 / (1.0 + np.exp(-logits))
        return [float(x) for x in calibrated]


@dataclass
class ModelBundle:
    feature_names: List[str]
    model: LogisticModel
    calibrator: PlattCalibrator = field(default_factory=PlattCalibrator)


def _prepare_matrix(
    rows: List[Dict[str, float]], feature_names: List[str]
) -> np.ndarray:
    matrix = []
    for row in rows:
        matrix.append([row.get(name, 0.0) for name in feature_names])
    return np.array(matrix, dtype=float)


def train_logistic(
    features: List[Dict[str, float]],
    labels: List[int],
    steps: int = 400,
    lr: float = 0.1,
) -> ModelBundle:
    if not features:
        raise ValueError("Need features to train")

    feature_names = sorted(features[0].keys())
    x = _prepare_matrix(features, feature_names)
    y = np.array(labels, dtype=float)

    weights = np.zeros(x.shape[1], dtype=float)
    bias = 0.0

    for _ in range(steps):
        logits = np.dot(x, weights) + bias
        preds = 1.0 / (1.0 + np.exp(-logits))
        error = preds - y
        grad_w = np.dot(x.T, error) / len(x)
        grad_b = float(np.mean(error))
        weights -= lr * grad_w
        bias -= lr * grad_b

    model = LogisticModel(weights=weights, bias=bias, feature_names=feature_names)
    probs = [model.predict_proba(row) for row in features]
    calibrator = PlattCalibrator()
    calibrator.fit(probs, labels)
    return ModelBundle(feature_names=feature_names, model=model, calibrator=calibrator)


def predict_with_calibration(bundle: ModelBundle, features: Dict[str, float]) -> float:
    raw_prob = bundle.model.predict_proba(features)
    return bundle.calibrator.predict([raw_prob])[0]


def reliability_curve(probs: Iterable[float], labels: Iterable[int], bins: int = 10) -> List[Tuple[float, float, int]]:
    probs_list = list(probs)
    labels_list = list(labels)
    if not probs_list:
        return []

    bucket_size = 1.0 / bins
    results = []
    for i in range(bins):
        low = i * bucket_size
        high = (i + 1) * bucket_size
        bucket_probs = []
        bucket_labels = []
        for prob, label in zip(probs_list, labels_list):
            if (prob >= low and prob < high) or (i == bins - 1 and prob <= high):
                bucket_probs.append(prob)
                bucket_labels.append(label)
        if bucket_probs:
            avg_prob = float(np.mean(bucket_probs))
            avg_label = float(np.mean(bucket_labels))
            results.append((avg_prob, avg_label, len(bucket_probs)))
    return results
