"""
ml_model/train_model.py

Generates ml_model/model.pkl for the Space-Rover-AI fault-prediction model.

──────────────────────────────────────────────────────────────────────────
WHY THIS FILE WAS REWRITTEN
──────────────────────────────────────────────────────────────────────────
The previous version of this script trained on `rover_dataset.csv`, a
9-column dataset (Battery_Voltage, Battery_Current, Battery_Temperature,
Solar_Voltage, Solar_Current, Motor_Current, Motor_Temperature,
DC_Bus_Voltage -> Fault) with STRING fault labels ("Healthy",
"Battery Fault", ...).

That has nothing to do with what the backend actually sends the model.
`backend/services/prediction_service.py::_build_feature_vector()` builds a
10-feature vector in this exact order:

    [battery, solar_output, speed, temperature, latency,
     coordinates_x, coordinates_y, coordinates_z, heading, power_draw]

and expects the model to output an INTEGER class in {0..5}, mapped by
`_FAULT_LABELS` as:

    0 -> NOMINAL
    1 -> POWER_LOW
    2 -> THERMAL_ANOMALY
    3 -> DSN_DEGRADED
    4 -> HIGH_POWER_DRAW
    5 -> PROPULSION_FAULT

Even if the old model.pkl had deserialized successfully, scikit-learn
would have immediately rejected it with
`ValueError: X has 10 features, but RandomForestClassifier is expecting
8 features as input` (or crashed trying to `int()` a string label like
"Healthy") — both already caught by prediction_service.py's broad
`except Exception`, which silently falls back to mock predictions. That
schema mismatch was a SECOND, deeper root cause of the "always uses mock
predictions" bug, independent of the pickle/version issue.

There is no existing labeled dataset for these 10 real telemetry
channels, so this script generates a large synthetic dataset whose
ground-truth labels are derived directly from the same threshold logic
already encoded in prediction_service.py's rule-based mock
(`_FAULT_CATALOGUE`), plus a rule for PROPULSION_FAULT (stalled motor:
near-zero speed with high power draw), which the mock catalogue never
covered. This means the trained model faithfully learns the same
decision boundaries the mock path already uses, but adds smooth,
probabilistic confidence scores via `predict_proba` and generalizes to
combinations of readings a hand-written if/elif chain wouldn't cover as
gracefully — while guaranteeing the artifact will actually be
COMPATIBLE with the exact feature vector and label scheme the running
API code expects.

──────────────────────────────────────────────────────────────────────────
WHY joblib INSTEAD OF pickle
──────────────────────────────────────────────────────────────────────────
scikit-learn's own documentation recommends `joblib` for persisting
estimators (it handles large numpy arrays inside the model more
efficiently, and is what `backend/ml/model_loader.py` now loads with).
Always dump and load with the same library, in an environment pinned to
the same numpy/scikit-learn versions your production server installs
(see backend/requirements.txt) — mixing pickle/joblib or numpy/sklearn
major versions between train-time and serve-time is exactly what caused
"STACK_GLOBAL requires str" in production.

Run this script using the SAME dependency versions pinned in
backend/requirements.txt (numpy==1.26.4, scikit-learn==1.5.1,
joblib==1.5.3) — e.g. from within a venv built from that file — so the
artifact it produces is guaranteed to deserialize on Render.
"""

try:
    import numpy as np
    import joblib
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score
except ImportError as exc:
    raise ImportError(
        "Missing required dependencies for model training. "
        "Install the pinned backend requirements from backend/requirements.txt "
        "(numpy, scikit-learn, joblib) before running this script."
    ) from exc

RANDOM_STATE = 42
N_SAMPLES = 6000

FEATURE_NAMES = [
    "battery", "solar_output", "speed", "temperature", "latency",
    "coordinates_x", "coordinates_y", "coordinates_z", "heading", "power_draw",
]

FAULT_LABELS = {
    0: "NOMINAL",
    1: "POWER_LOW",
    2: "THERMAL_ANOMALY",
    3: "DSN_DEGRADED",
    4: "HIGH_POWER_DRAW",
    5: "PROPULSION_FAULT",
}


def _generate_synthetic_telemetry(n_samples: int, rng: np.random.Generator) -> np.ndarray:
    """Sample realistic-looking rover telemetry across the full operating envelope."""
    battery = rng.uniform(0, 100, n_samples)
    solar_output = rng.uniform(0, 600, n_samples)
    speed = rng.uniform(0, 3.0, n_samples)
    temperature = rng.uniform(-80, 45, n_samples)
    latency = rng.uniform(80, 180, n_samples)
    coordinates_x = rng.uniform(-500, 500, n_samples)
    coordinates_y = rng.uniform(-500, 500, n_samples)
    coordinates_z = rng.uniform(-50, 50, n_samples)
    heading = rng.uniform(0, 360, n_samples)
    power_draw = rng.uniform(50, 320, n_samples)

    return np.column_stack([
        battery, solar_output, speed, temperature, latency,
        coordinates_x, coordinates_y, coordinates_z, heading, power_draw,
    ])


def _label_row(row: np.ndarray) -> int:
    """
    Ground-truth labeling function — mirrors the thresholds already used
    by prediction_service.py's rule-based mock (_FAULT_CATALOGUE), plus a
    PROPULSION_FAULT rule for near-zero speed combined with high power
    draw (a stalled/jammed drive motor), which the mock never modeled.
    Priority order below reflects worst-condition-first, matching how a
    real operator would triage simultaneous anomalies.
    """
    (battery, _solar_output, speed, temperature, latency,
     _x, _y, _z, _heading, power_draw) = row

    if speed < 0.05 and power_draw > 200:
        return 5  # PROPULSION_FAULT
    if battery < 40:
        return 1  # POWER_LOW
    if temperature < -45:
        return 2  # THERMAL_ANOMALY
    if power_draw > 240:
        return 4  # HIGH_POWER_DRAW
    if latency > 135:
        return 3  # DSN_DEGRADED
    return 0  # NOMINAL


def main() -> None:
    rng = np.random.default_rng(RANDOM_STATE)

    X = _generate_synthetic_telemetry(N_SAMPLES, rng)
    y = np.array([_label_row(row) for row in X])

    # Light label noise so the model learns soft boundaries / calibrated
    # probabilities instead of memorizing a deterministic if/elif chain.
    flip_mask = rng.random(N_SAMPLES) < 0.02
    flip_targets = rng.integers(0, len(FAULT_LABELS), size=N_SAMPLES)
    y = np.where(flip_mask, flip_targets, y)

    print("Class distribution:")
    for label, name in FAULT_LABELS.items():
        print(f"  {label} ({name}): {(y == label).sum()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print(classification_report(
        y_test, predictions,
        labels=list(FAULT_LABELS.keys()),
        target_names=list(FAULT_LABELS.values()),
        zero_division=0,
    ))

    joblib.dump(model, "model.pkl")
    print("\nmodel.pkl created successfully (joblib format).")


if __name__ == "__main__":
    main()