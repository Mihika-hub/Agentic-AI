from __future__ import annotations

import csv
import html
import math
import random
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urlparse

DATA_PATH = Path(__file__).with_name("Smartphone_Resale_Price_Regression_100_Rows.csv")
FEATURE_COLUMNS = ["Phone_Age_yrs", "Storage_GB", "Battery_Health_pct", "Camera_MP"]
TARGET_COLUMN = "Resale_Price_AED"
RANDOM_STATE = 42
TEST_SIZE = 0.40


def read_dataset(path: Path) -> tuple[list[list[float]], list[float]]:
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        features: list[list[float]] = []
        target: list[float] = []
        for row in reader:
            features.append([float(row[column]) for column in FEATURE_COLUMNS])
            target.append(float(row[TARGET_COLUMN]))
    return features, target


def train_test_split(features: list[list[float]], target: list[float], test_size: float, random_state: int):
    indices = list(range(len(features)))
    random.Random(random_state).shuffle(indices)
    test_count = max(1, int(round(len(features) * test_size)))
    test_indices = indices[:test_count]
    train_indices = indices[test_count:]
    x_train = [features[index] for index in train_indices]
    y_train = [target[index] for index in train_indices]
    x_test = [features[index] for index in test_indices]
    y_test = [target[index] for index in test_indices]
    return x_train, x_test, y_train, y_test


def mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_list = list(actual)
    predicted_list = list(predicted)
    return sum((a - p) ** 2 for a, p in zip(actual_list, predicted_list)) / len(actual_list)


def rmse(actual: Iterable[float], predicted: Iterable[float]) -> float:
    return math.sqrt(mean_squared_error(actual, predicted))


def transpose(matrix: list[list[float]]) -> list[list[float]]:
    return [list(column) for column in zip(*matrix)]


def matmul(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    right_transposed = transpose(right)
    return [[sum(a * b for a, b in zip(row, column)) for column in right_transposed] for row in left]


def matvec(matrix: list[list[float]], vector: list[float]) -> list[float]:
    return [sum(value * coef for value, coef in zip(row, vector)) for row in matrix]


def add_intercept(matrix: list[list[float]]) -> list[list[float]]:
    return [[1.0] + row[:] for row in matrix]


def solve_linear_system(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(matrix)
    augmented = [row[:] + [value] for row, value in zip(matrix, vector)]
    for pivot_index in range(size):
        pivot_row = max(range(pivot_index, size), key=lambda index: abs(augmented[index][pivot_index]))
        augmented[pivot_index], augmented[pivot_row] = augmented[pivot_row], augmented[pivot_index]
        pivot_value = augmented[pivot_index][pivot_index]
        if abs(pivot_value) < 1e-12:
            raise ValueError("Singular matrix")
        for column in range(pivot_index, size + 1):
            augmented[pivot_index][column] /= pivot_value
        for row_index in range(size):
            if row_index == pivot_index:
                continue
            factor = augmented[row_index][pivot_index]
            if factor == 0:
                continue
            for column in range(pivot_index, size + 1):
                augmented[row_index][column] -= factor * augmented[pivot_index][column]
    return [augmented[index][size] for index in range(size)]


def fit_linear_regression(features: list[list[float]], target: list[float], ridge_lambda: float = 0.0, regularize_intercept: bool = False) -> list[float]:
    design = add_intercept(features)
    xt = transpose(design)
    xtx = matmul(xt, design)
    if ridge_lambda > 0:
        for index in range(len(xtx)):
            if index == 0 and not regularize_intercept:
                continue
            xtx[index][index] += ridge_lambda
    xty = matvec(xt, target)
    return solve_linear_system(xtx, xty)


def predict_linear(weights: list[float], features: list[list[float]]) -> list[float]:
    design = add_intercept(features)
    return [sum(weight * value for weight, value in zip(weights, row)) for row in design]


def feature_means_and_stds(features: list[list[float]]) -> tuple[list[float], list[float]]:
    column_count = len(features[0])
    means = [sum(row[column] for row in features) / len(features) for column in range(column_count)]
    stds = []
    for column in range(column_count):
        variance = sum((row[column] - means[column]) ** 2 for row in features) / max(1, len(features) - 1)
        stds.append(math.sqrt(variance) if variance > 0 else 1.0)
    return means, stds


def standardize(features: list[list[float]], means: list[float], stds: list[float]) -> list[list[float]]:
    standardized: list[list[float]] = []
    for row in features:
        standardized.append([(value - mean) / std for value, mean, std in zip(row, means, stds)])
    return standardized


def polynomial_features(features: list[list[float]]) -> list[list[float]]:
    expanded: list[list[float]] = []
    for age, storage, battery, camera in features:
        expanded.append([
            age,
            storage,
            battery,
            camera,
            age * age,
            storage * storage,
            battery * battery,
            camera * camera,
            age * storage,
            age * battery,
            age * camera,
            storage * battery,
            storage * camera,
            battery * camera,
        ])
    return expanded


def knn_predict(train_features: list[list[float]], train_target: list[float], query_features: list[list[float]], k: int = 5) -> list[float]:
    predictions: list[float] = []
    for query in query_features:
        distances = sorted(
            (
                math.sqrt(sum((a - b) ** 2 for a, b in zip(query, train_row))),
                target_value,
            )
            for train_row, target_value in zip(train_features, train_target)
        )
        neighbors = [target_value for _, target_value in distances[:k]]
        predictions.append(sum(neighbors) / len(neighbors))
    return predictions


@dataclass
class TrainedModel:
    name: str
    rmse: float
    predictor: callable
    description: str


def train_best_model(features: list[list[float]], target: list[float]):
    x_train, x_test, y_train, y_test = train_test_split(features, target, TEST_SIZE, RANDOM_STATE)
    train_means, train_stds = feature_means_and_stds(x_train)
    x_train_scaled = standardize(x_train, train_means, train_stds)
    x_test_scaled = standardize(x_test, train_means, train_stds)
    x_train_poly = polynomial_features(x_train_scaled)
    x_test_poly = polynomial_features(x_test_scaled)

    candidates: list[TrainedModel] = []

    baseline_prediction = [sum(y_train) / len(y_train)] * len(y_test)
    candidates.append(TrainedModel("MeanBaseline", rmse(y_test, baseline_prediction), lambda rows: [sum(y_train) / len(y_train)] * len(rows), "Predicts the training mean"))

    linear_weights = fit_linear_regression(x_train, y_train)
    candidates.append(TrainedModel("LinearRegression", rmse(y_test, predict_linear(linear_weights, x_test)), lambda rows, weights=linear_weights: predict_linear(weights, rows), "Ordinary least squares"))

    ridge_weights = fit_linear_regression(x_train_scaled, y_train, ridge_lambda=1.0)
    candidates.append(TrainedModel("RidgeRegression", rmse(y_test, predict_linear(ridge_weights, x_test_scaled)), lambda rows, weights=ridge_weights, means=train_means, stds=train_stds: predict_linear(weights, standardize(rows, means, stds)), "L2-regularized linear model"))

    poly_weights = fit_linear_regression(x_train_poly, y_train, ridge_lambda=0.5)
    candidates.append(TrainedModel("PolynomialRegression", rmse(y_test, predict_linear(poly_weights, x_test_poly)), lambda rows, weights=poly_weights, means=train_means, stds=train_stds: predict_linear(weights, polynomial_features(standardize(rows, means, stds))), "Degree-2 polynomial features with ridge regularization"))

    knn_prediction = knn_predict(x_train_scaled, y_train, x_test_scaled, k=5)
    candidates.append(TrainedModel("KNNRegressor", rmse(y_test, knn_prediction), lambda rows, train_x=x_train_scaled, train_y=y_train: knn_predict(train_x, train_y, standardize(rows, train_means, train_stds), k=5), "Distance-based neighborhood averaging"))

    best = min(candidates, key=lambda candidate: candidate.rmse)

    full_means, full_stds = feature_means_and_stds(features)
    full_scaled = standardize(features, full_means, full_stds)
    full_poly = polynomial_features(full_scaled)

    if best.name == "MeanBaseline":
        final_predictor = lambda rows: [sum(target) / len(target)] * len(rows)
    elif best.name == "LinearRegression":
        final_weights = fit_linear_regression(features, target)
        final_predictor = lambda rows, weights=final_weights: predict_linear(weights, rows)
    elif best.name == "RidgeRegression":
        final_weights = fit_linear_regression(full_scaled, target, ridge_lambda=1.0)
        final_predictor = lambda rows, weights=final_weights, means=full_means, stds=full_stds: predict_linear(weights, standardize(rows, means, stds))
    elif best.name == "PolynomialRegression":
        final_weights = fit_linear_regression(full_poly, target, ridge_lambda=0.5)
        final_predictor = lambda rows, weights=final_weights, means=full_means, stds=full_stds: predict_linear(weights, polynomial_features(standardize(rows, means, stds)))
    else:
        final_predictor = lambda rows, train_x=full_scaled, train_y=target: knn_predict(train_x, train_y, standardize(rows, full_means, full_stds), k=5)

    return best, final_predictor, full_means, full_stds, candidates


def render_page(best, final_predictor, means, stds, all_candidates):
    model_rows = "".join(
        f"<tr><td>{html.escape(candidate.name)}</td><td>{candidate.rmse:.4f}</td><td>{html.escape(candidate.description)}</td></tr>"
        for candidate in sorted(all_candidates, key=lambda candidate: candidate.rmse)
    )

    def predict_from_query(query: str):
        params = parse_qs(urlparse(query).query)
        defaults = {
            "age": 2.0,
            "storage": 256.0,
            "battery": 85.0,
            "camera": 64.0,
        }
        values = {key: float(params.get(key, [default])[0]) for key, default in defaults.items()}
        row = [[values["age"], values["storage"], values["battery"], values["camera"]]]
        prediction = final_predictor(row)[0]
        return values, prediction

    class RequestHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            values, prediction = predict_from_query(self.path)
            page = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Smartphone Resale Price Predictor</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #0f172a, #1e293b); color: #e2e8f0; }}
    .wrap {{ max-width: 980px; margin: 0 auto; padding: 32px 20px 48px; }}
    .card {{ background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 18px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); }}
    h1 {{ margin-top: 0; font-size: 2rem; }}
    p {{ line-height: 1.6; color: #cbd5e1; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin: 18px 0; }}
    label {{ display: block; font-weight: 700; margin-bottom: 6px; color: #f8fafc; }}
    input {{ width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; box-sizing: border-box; }}
    button {{ margin-top: 8px; background: linear-gradient(135deg, #38bdf8, #8b5cf6); border: none; color: white; padding: 13px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; }}
    .metric {{ display: inline-block; background: linear-gradient(135deg, #0ea5e9, #7c3aed); padding: 18px 22px; border-radius: 16px; font-size: 1.35rem; font-weight: 800; margin: 16px 0; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 18px; overflow: hidden; border-radius: 14px; }}
    th, td {{ text-align: left; padding: 12px 14px; border-bottom: 1px solid rgba(148, 163, 184, 0.18); }}
    th {{ color: #93c5fd; }}
    .footer {{ margin-top: 18px; font-size: 0.95rem; color: #94a3b8; }}
    .small {{ font-size: 0.92rem; color: #cbd5e1; }}
  </style>
</head>
<body>
  <div class=\"wrap\">
    <div class=\"card\">
      <h1>Smartphone Resale Price Predictor</h1>
      <p>Best model from a 60:40 split: <strong>{html.escape(best.name)}</strong> with RMSE <strong>{best.rmse:.4f}</strong>.</p>
      <p class=\"small\">Open the page, adjust the inputs, and press Predict to refresh the estimate.</p>
      <form method=\"get\">
        <div class=\"grid\">
          <div><label>Phone age (years)</label><input name=\"age\" type=\"number\" step=\"0.1\" value=\"{values['age']}\" /></div>
          <div><label>Storage (GB)</label><input name=\"storage\" type=\"number\" step=\"1\" value=\"{values['storage']}\" /></div>
          <div><label>Battery health (%)</label><input name=\"battery\" type=\"number\" step=\"0.1\" value=\"{values['battery']}\" /></div>
          <div><label>Camera (MP)</label><input name=\"camera\" type=\"number\" step=\"1\" value=\"{values['camera']}\" /></div>
        </div>
        <button type=\"submit\">Predict</button>
      </form>
      <div class=\"metric\">Estimated resale price: AED {prediction:,.2f}</div>
      <p class=\"footer\">Model comparison</p>
      <table>
        <thead><tr><th>Model</th><th>RMSE</th><th>Notes</th></tr></thead>
        <tbody>{model_rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>"""
            response = page.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)

        def log_message(self, format, *args):
            return

    return RequestHandler


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    features, target = read_dataset(DATA_PATH)
    best, final_predictor, means, stds, all_candidates = train_best_model(features, target)

    print("Model comparison using a 60:40 split")
    for candidate in sorted(all_candidates, key=lambda candidate: candidate.rmse):
        print(f"- {candidate.name}: RMSE={candidate.rmse:.4f} | {candidate.description}")
    print(f"Best model: {best.name}")
    print("Local server starting at http://localhost:8000")

    handler_class = render_page(best, final_predictor, means, stds, all_candidates)
    server = HTTPServer(("127.0.0.1", 8000), handler_class)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
