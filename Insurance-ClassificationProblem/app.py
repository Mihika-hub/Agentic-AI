from io import BytesIO
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st
from sklearn.ensemble import AdaBoostClassifier, ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


DATA_PATH = Path(__file__).with_name("realistic_insurance_classification_1000.csv")
MODEL_PATH = Path(__file__).with_name("best_insurance_model.joblib")


def load_data() -> pd.DataFrame:
    return pd.read_csv(DATA_PATH)


def build_models() -> dict[str, Pipeline]:
    scaler = StandardScaler()

    return {
        "AdaBoost": AdaBoostClassifier(
            estimator=DecisionTreeClassifier(max_depth=2, random_state=42),
            n_estimators=200,
            learning_rate=0.5,
            random_state=42,
        ),
        "Logistic Regression": Pipeline(
            steps=[
                ("scaler", scaler),
                ("model", LogisticRegression(max_iter=2000, random_state=42)),
            ]
        ),
        "K-Nearest Neighbors": Pipeline(
            steps=[
                ("scaler", scaler),
                ("model", KNeighborsClassifier(n_neighbors=7)),
            ]
        ),
        "Support Vector Machine": Pipeline(
            steps=[
                ("scaler", scaler),
                ("model", SVC(kernel="rbf", random_state=42)),
            ]
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
        ),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=400,
            random_state=42,
        ),
    }


@st.cache_data
def train_and_evaluate():
    data = load_data()
    features = data.drop(columns=["Bought_Insurance"])
    target = data["Bought_Insurance"]

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.30,
        random_state=42,
        stratify=target,
    )

    results = []
    best_name = None
    best_model = None
    best_accuracy = -1.0

    for name, model in build_models().items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        accuracy = accuracy_score(y_test, predictions)
        results.append({"Model": name, "Accuracy": accuracy})

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_name = name
            best_model = model

    results_frame = pd.DataFrame(results).sort_values("Accuracy", ascending=False)
    test_predictions = best_model.predict(x_test)

    return {
        "results": results_frame,
        "best_name": best_name,
        "best_model": best_model,
        "best_accuracy": best_accuracy,
        "report": classification_report(y_test, test_predictions, zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, test_predictions),
    }


def save_model(model):
    joblib.dump(model, MODEL_PATH)


def model_download_bytes(model) -> bytes:
    buffer = BytesIO()
    joblib.dump(model, buffer)
    return buffer.getvalue()


def main() -> None:
    st.set_page_config(page_title="Insurance Classification", page_icon="🛡️", layout="wide")
    st.title("Insurance Purchase Predictor")
    st.caption("Trains and compares several classifiers using a 70:30 train/test split.")

    try:
        results = train_and_evaluate()
        if not MODEL_PATH.exists():
            save_model(results["best_model"])
    except Exception as exc:
        st.error(f"Training failed: {exc}")
        st.stop()

    st.subheader("Model comparison")
    st.dataframe(results["results"])

    st.success(
        f"Best model: {results['best_name']} | Test accuracy: {results['best_accuracy']:.4f}"
    )

    left, right = st.columns(2)
    with left:
        st.subheader("Classification report")
        st.text(results["report"])
    with right:
        st.subheader("Confusion matrix")
        st.write(results["confusion_matrix"])

    st.subheader("Make a prediction")
    with st.form("prediction_form"):
        age = st.number_input("Age", min_value=0, max_value=120, value=35)
        monthly_income = st.number_input("Monthly Income", min_value=0, value=10000)
        dependents = st.number_input("Dependents", min_value=0, max_value=10, value=1)
        submitted = st.form_submit_button("Predict")

    if submitted:
        input_frame = pd.DataFrame(
            [[age, monthly_income, dependents]],
            columns=["Age", "Monthly_Income", "Dependents"],
        )
        prediction = results["best_model"].predict(input_frame)[0]
        probability = None
        if hasattr(results["best_model"], "predict_proba"):
            probability = results["best_model"].predict_proba(input_frame)[0][1]

        label = "Bought Insurance" if prediction == 1 else "Did Not Buy Insurance"
        st.info(f"Prediction: {label}")
        if probability is not None:
            st.write(f"Estimated probability of buying insurance: {probability:.2%}")

    st.download_button(
        label="Download best model",
        data=model_download_bytes(results["best_model"]),
        file_name="best_insurance_model.joblib",
        mime="application/octet-stream",
    )


if __name__ == "__main__":
    main()