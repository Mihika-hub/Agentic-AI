import pandas as pd
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from sklearn.ensemble import (
    AdaBoostClassifier,
    BaggingClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


def main():
    data = pd.read_csv("realistic_insurance_classification_1000.csv")
    x = data.drop(columns=["Bought_Insurance"])
    y = data["Bought_Insurance"]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.30, random_state=42, stratify=y
    )

    models = {
        "LR": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=5000, random_state=42)),
        ]),
        "PolyLR": Pipeline([
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=5000, random_state=42)),
        ]),
        "SVM": Pipeline([
            ("scaler", StandardScaler()),
            ("model", SVC(kernel="rbf", C=10, gamma="scale")),
        ]),
        "KNN": Pipeline([
            ("scaler", StandardScaler()),
            ("model", KNeighborsClassifier(n_neighbors=11)),
        ]),
        "RF": RandomForestClassifier(n_estimators=600, random_state=42),
        "ET": ExtraTreesClassifier(n_estimators=800, random_state=42),
        "GB": GradientBoostingClassifier(random_state=42),
        "HGB": HistGradientBoostingClassifier(random_state=42),
        "ADA": AdaBoostClassifier(random_state=42, n_estimators=300, learning_rate=0.5),
        "BAG": BaggingClassifier(random_state=42, n_estimators=300),
        "DT": DecisionTreeClassifier(random_state=42),
        "GNB": GaussianNB(),
        "MLP": Pipeline([
            ("scaler", StandardScaler()),
            ("model", MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=2000, random_state=42)),
        ]),
        "QDA": QuadraticDiscriminantAnalysis(),
    }

    scores = []
    for name, model in models.items():
        try:
            model.fit(x_train, y_train)
            predictions = model.predict(x_test)
            scores.append((name, accuracy_score(y_test, predictions)))
        except Exception as exc:
            scores.append((name, f"ERR {exc}"))

    good_scores = sorted([item for item in scores if not isinstance(item[1], str)], key=lambda item: item[1], reverse=True)
    print(good_scores)
    print([item for item in scores if isinstance(item[1], str)])


if __name__ == "__main__":
    main()