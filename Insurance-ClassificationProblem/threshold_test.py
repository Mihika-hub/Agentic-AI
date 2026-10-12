import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier


df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

model = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2, random_state=42), n_estimators=200, learning_rate=0.5, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
out = cross_val_predict(model, X_train, y_train, cv=cv, method='predict_proba')[:, 1]
best = (0.5, 0)
for t in np.linspace(0.1, 0.9, 161):
    acc = accuracy_score(y_train, (out >= t).astype(int))
    if acc > best[1]:
        best = (t, acc)
print('best threshold train', best)
model.fit(X_train, y_train)
proba = model.predict_proba(X_test)[:, 1]
for t in [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, best[0]]:
    pred = (proba >= t).astype(int)
    print(t, accuracy_score(y_test, pred))
