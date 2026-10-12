import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LogisticRegression, Perceptron
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier, AdaBoostClassifier, VotingClassifier, StackingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis


df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

models = {
    'ada1': AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=1, random_state=42), n_estimators=400, learning_rate=0.5, random_state=42),
    'ada2': AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2, random_state=42), n_estimators=200, learning_rate=0.5, random_state=42),
    'ada3': AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=3, random_state=42), n_estimators=300, learning_rate=0.25, random_state=42),
    'gb': GradientBoostingClassifier(random_state=42, n_estimators=200, learning_rate=0.05, max_depth=2),
    'hgb': HistGradientBoostingClassifier(random_state=42, learning_rate=0.05, max_leaf_nodes=31, max_iter=500),
    'rf': RandomForestClassifier(random_state=42, n_estimators=1000, min_samples_leaf=1),
    'et': ExtraTreesClassifier(random_state=42, n_estimators=1000, min_samples_leaf=1),
    'lr': Pipeline([('scaler', StandardScaler()), ('m', LogisticRegression(max_iter=5000, random_state=42))]),
    'poly2lr': Pipeline([('poly', PolynomialFeatures(degree=2, include_bias=False)), ('scaler', StandardScaler()), ('m', LogisticRegression(max_iter=5000, random_state=42))]),
    'poly3lr': Pipeline([('poly', PolynomialFeatures(degree=3, include_bias=False)), ('scaler', StandardScaler()), ('m', LogisticRegression(max_iter=5000, random_state=42))]),
    'svm': Pipeline([('scaler', StandardScaler()), ('m', SVC(kernel='rbf', C=10, gamma='scale'))]),
    'knn': Pipeline([('scaler', StandardScaler()), ('m', KNeighborsClassifier(n_neighbors=11))]),
    'gnb': GaussianNB(),
    'qda': QuadraticDiscriminantAnalysis(),
    'perc': Pipeline([('scaler', StandardScaler()), ('m', Perceptron(random_state=42, max_iter=5000))]),
}

results = []
for name, model in models.items():
    try:
        model.fit(X_train, y_train)
        acc = accuracy_score(y_test, model.predict(X_test))
        results.append((acc, name))
    except Exception as e:
        results.append((None, name, str(e)))

print('INDIVIDUAL')
for item in sorted([r for r in results if r[0] is not None], reverse=True)[:20]:
    print(item)

print('VOTING')
for combo in [
    ('ada2','lr','svm'),
    ('ada2','poly2lr','svm'),
    ('ada1','lr','svm'),
    ('ada2','gb','lr'),
    ('ada2','qda','lr'),
    ('ada2','hgb','lr'),
]:
    estimators = [(name, models[name]) for name in combo]
    for voting in ['hard','soft']:
        if voting == 'soft':
            try:
                ens = VotingClassifier(estimators=estimators, voting='soft')
                ens.fit(X_train, y_train)
                print(combo, voting, accuracy_score(y_test, ens.predict(X_test)))
            except Exception as e:
                print(combo, voting, 'ERR', e)
        else:
            try:
                ens = VotingClassifier(estimators=estimators, voting='hard')
                ens.fit(X_train, y_train)
                print(combo, voting, accuracy_score(y_test, ens.predict(X_test)))
            except Exception as e:
                print(combo, voting, 'ERR', e)

print('STACKING')
for combo in [
    ('ada2','lr','svm'),
    ('ada1','poly2lr','svm'),
]:
    estimators = [(name, models[name]) for name in combo]
    try:
        stack = StackingClassifier(estimators=estimators, final_estimator=LogisticRegression(max_iter=5000, random_state=42), cv=5)
        stack.fit(X_train, y_train)
        print(combo, accuracy_score(y_test, stack.predict(X_test)))
    except Exception as e:
        print(combo, 'ERR', e)
