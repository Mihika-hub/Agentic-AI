import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures, FunctionTransformer
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.base import BaseEstimator, TransformerMixin

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        X = X.copy()
        X['Income_per_Dep'] = X['Monthly_Income'] / (X['Dependents'] + 1)
        X['Age_x_Income'] = X['Age'] * X['Monthly_Income']
        X['Age2'] = X['Age'] ** 2
        X['Income2'] = X['Monthly_Income'] ** 2
        X['Income_log'] = np.log1p(X['Monthly_Income'])
        X['Dep2'] = X['Dependents'] ** 2
        X['Age_per_Dep'] = X['Age'] / (X['Dependents'] + 1)
        return X


df = pd.read_csv('realistic_insurance_classification_1000.csv')
X = df.drop(columns=['Bought_Insurance'])
y = df['Bought_Insurance']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)

models = {
    'ada_raw': AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2, random_state=42), n_estimators=200, learning_rate=0.5, random_state=42),
    'ada_feat': Pipeline([('fe', FeatureEngineer()), ('model', AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=2, random_state=42), n_estimators=200, learning_rate=0.5, random_state=42))]),
    'gb_feat': Pipeline([('fe', FeatureEngineer()), ('model', GradientBoostingClassifier(random_state=42, n_estimators=200, learning_rate=0.05, max_depth=2))]),
    'hgb_feat': Pipeline([('fe', FeatureEngineer()), ('model', HistGradientBoostingClassifier(random_state=42, learning_rate=0.05, max_leaf_nodes=31, max_iter=500))]),
    'log_poly_feat': Pipeline([('fe', FeatureEngineer()), ('poly', PolynomialFeatures(degree=2, include_bias=False)), ('scaler', StandardScaler()), ('model', LogisticRegression(max_iter=5000, random_state=42))]),
    'svm_feat': Pipeline([('fe', FeatureEngineer()), ('scaler', StandardScaler()), ('model', SVC(kernel='rbf', C=10, gamma='scale'))]),
}

for name, model in models.items():
    model.fit(X_train, y_train)
    print(name, accuracy_score(y_test, model.predict(X_test)))
