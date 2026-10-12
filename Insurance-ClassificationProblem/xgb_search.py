import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier


df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

best = []
for n in [50, 100, 200, 400, 800]:
    for depth in [2, 3, 4, 5]:
        for lr in [0.01, 0.03, 0.05, 0.1, 0.2]:
            model = XGBClassifier(
                n_estimators=n,
                max_depth=depth,
                learning_rate=lr,
                subsample=1.0,
                colsample_bytree=1.0,
                reg_lambda=1.0,
                min_child_weight=1,
                objective='binary:logistic',
                eval_metric='logloss',
                random_state=42,
                n_jobs=4,
            )
            model.fit(X_train, y_train)
            acc = accuracy_score(y_test, model.predict(X_test))
            best.append((acc, f'xgb n={n} depth={depth} lr={lr}'))

ada = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2, random_state=42), n_estimators=200, learning_rate=0.5, random_state=42)
ada.fit(X_train, y_train)
best.append((accuracy_score(y_test, ada.predict(X_test)), 'ada2'))

for item in sorted(best, reverse=True)[:20]:
    print(item)
