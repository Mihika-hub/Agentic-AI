from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


st.set_page_config(page_title="Car Sell Price Predictor", layout="centered")


@st.cache_data
def load_data() -> pd.DataFrame:
    base = Path(__file__).resolve().parent
    candidates = [
        base / "realistic_car_prices_dataset.xlsx",
        base / "realistic_car_prices_dataset.csv.xlsx",
        base / "realistic_car_prices_dataset.csv",
        base.parent / "realistic_car_prices_dataset.xlsx",
        base.parent / "realistic_car_prices_dataset.csv.xlsx",
        base.parent / "realistic_car_prices_dataset.csv",
    ]

    for file_path in candidates:
        if file_path.exists():
            if file_path.suffix.lower() == ".csv":
                return pd.read_csv(file_path)
            return pd.read_excel(file_path)

    raise FileNotFoundError("No supported dataset file found in the project folder or parent folder.")


@st.cache_resource
def train_best_model(df: pd.DataFrame):
    target_col = "Sell Price"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found.")

    X = df.drop(columns=[target_col])
    y = df[target_col]

    categorical_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                numeric_cols,
            ),
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_cols,
            ),
        ]
    )

    model_candidates = {
        "LinearRegression": LinearRegression(),
        "Ridge": Ridge(alpha=1.0),
        "RandomForestRegressor": RandomForestRegressor(n_estimators=500, random_state=42),
        "GradientBoostingRegressor": GradientBoostingRegressor(random_state=42),
        "ExtraTreesRegressor": ExtraTreesRegressor(n_estimators=500, random_state=42),
    }

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    best_name = None
    best_pipeline = None
    best_rmse = float("inf")
    best_r2 = None
    metrics = []

    for name, model in model_candidates.items():
        pipe = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))
        metrics.append({"Model": name, "RMSE": rmse, "R2": r2})

        if rmse < best_rmse:
            best_rmse = rmse
            best_name = name
            best_pipeline = pipe
            best_r2 = r2

    metrics_df = pd.DataFrame(metrics).sort_values(by="RMSE", ascending=True).reset_index(drop=True)

    return {
        "best_model_name": best_name,
        "best_model": best_pipeline,
        "best_rmse": best_rmse,
        "best_r2": best_r2,
        "metrics": metrics_df,
        "X_columns": X.columns.tolist(),
        "X": X,
    }


st.title("🚗 Car Sell Price Predictor")
st.write("Model comparison uses an 80:20 train-test split and picks the model with the lowest RMSE.")

try:
    df = load_data()
    results = train_best_model(df)

    st.subheader("Best Model Result")
    st.success(
        f"Best model: {results['best_model_name']} | RMSE: {results['best_rmse']:.2f} | R²: {results['best_r2']:.4f}"
    )

    st.subheader("Model Leaderboard")
    st.dataframe(results["metrics"], use_container_width=True)

    st.subheader("Predict Sell Price")
    input_data = {}
    X = results["X"]

    for col in results["X_columns"]:
        if pd.api.types.is_numeric_dtype(X[col]):
            min_val = float(X[col].min())
            max_val = float(X[col].max())
            mean_val = float(X[col].mean())
            input_data[col] = st.number_input(
                col,
                min_value=min_val,
                max_value=max_val,
                value=mean_val,
            )
        else:
            options = sorted(X[col].dropna().astype(str).unique().tolist())
            input_data[col] = st.selectbox(col, options=options)

    if st.button("Predict"):
        input_df = pd.DataFrame([input_data])
        prediction = results["best_model"].predict(input_df)[0]
        st.success(f"Estimated Sell Price: {prediction:,.2f}")

except Exception as exc:
    st.error(f"Error: {exc}")
