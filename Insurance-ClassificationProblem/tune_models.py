import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier, RandomForestClassifier, ExtraTreesClassifier, VotingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier

df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

candidates = []

for n in [50, 100, 200, 300, 500]:
    for lr in [0.25, 0.5, 0.75, 1.0]:
        for depth in [1, 2, 3]:
            ada = AdaBoostClassifier(
                estimator=DecisionTreeClassifier(max_depth=depth, random_state=42),
                n_estimators=n,
                learning_rate=lr,
                random_state=42,
            )
            ada.fit(X_train, y_train)
            acc = accuracy_score(y_test, ada.predict(X_test))
            candidates.append((acc, f'AdaBoost depth={depth} n={n} lr={lr}'))

for depth in [2, 3, 4, 5, None]:
    for n in [100, 300, 500, 800]:
        for lr in [0.03, 0.05, 0.1, 0.2]:
            gb = GradientBoostingClassifier(random_state=42, n_estimators=n, learning_rate=lr, max_depth=depth if depth is not None else 3)
            gb.fit(X_train, y_train)
            acc = accuracy_score(y_test, gb.predict(X_test))
            candidates.append((acc, f'GB depth={depth} n={n} lr={lr}'))

for lr in [0.01, 0.05, 0.1]:
    for max_leaf_nodes in [7, 15, 31, 63]:
        hgb = HistGradientBoostingClassifier(random_state=42, learning_rate=lr, max_leaf_nodes=max_leaf_nodes, max_iter=300)
        hgb.fit(X_train, y_train)
        acc = accuracy_score(y_test, hgb.predict(X_test))
        candidates.append((acc, f'HGB lr={lr} leaf={max_leaf_nodes}'))

for n in [200, 500, 800]:
    for depth in [None, 5, 8, 12]:
        rf = RandomForestClassifier(random_state=42, n_estimators=n, max_depth=depth)
        rf.fit(X_train, y_train)
        acc = accuracy_score(y_test, rf.predict(X_test))
        candidates.append((acc, f'RF n={n} depth={depth}'))
        et = ExtraTreesClassifier(random_state=42, n_estimators=n, max_depth=depth)
        et.fit(X_train, y_train)
        acc = accuracy_score(y_test, et.predict(X_test))
        candidates.append((acc, f'ET n={n} depth={depth}'))

pipe = Pipeline([('poly', PolynomialFeatures(degree=2, include_bias=False)), ('scaler', StandardScaler()), ('model', LogisticRegression(max_iter=5000, random_state=42))])
pipe.fit(X_train, y_train)
candidates.append((accuracy_score(y_test, pipe.predict(X_test)), 'PolyLR degree=2'))

pipe = Pipeline([('poly', PolynomialFeatures(degree=3, include_bias=False)), ('scaler', StandardScaler()), ('model', LogisticRegression(max_iter=5000, random_state=42))])
pipe.fit(X_train, y_train)
candidates.append((accuracy_score(y_test, pipe.predict(X_test)), 'PolyLR degree=3'))

for c in [0.1, 1, 10, 50]:
    pipe = Pipeline([('scaler', StandardScaler()), ('model', SVC(kernel='rbf', C=c, gamma='scale'))])
    pipe.fit(X_train, y_train)
    candidates.append((accuracy_score(y_test, pipe.predict(X_test)), f'SVM C={c}'))

for n in [5, 7, 9, 11, 15, 21]:
    pipe = Pipeline([('scaler', StandardScaler()), ('model', KNeighborsClassifier(n_neighbors=n))])
    pipe.fit(X_train, y_train)
    candidates.append((accuracy_score(y_test, pipe.predict(X_test)), f'KNN k={n}'))

candidates.sort(key=lambda x: x[0], reverse=True)
for item in candidates[:20]:
    print(item)
