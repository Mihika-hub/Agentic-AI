import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier


df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

results = []
for depth in [1, 2, 3, 4]:
    for n in [50, 100, 150, 200, 250, 300, 400, 500, 700, 900, 1200]:
        for lr in [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0]:
            model = AdaBoostClassifier(
                estimator=DecisionTreeClassifier(max_depth=depth, random_state=42),
                n_estimators=n,
                learning_rate=lr,
                random_state=42,
            )
            model.fit(X_train, y_train)
            acc = accuracy_score(y_test, model.predict(X_test))
            results.append((acc, depth, n, lr))

for item in sorted(results, reverse=True)[:25]:
    print(item)
