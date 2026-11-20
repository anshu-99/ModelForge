"""
Model Zoo and Training Module for ModelForge AutoML.
Provides model instantiations, hyperparameter grids, cross-validation,
and automated comparison across Classification, Regression, and Clustering.
"""

import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.linear_model import (
    LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet
)
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    HistGradientBoostingClassifier, HistGradientBoostingRegressor
)
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.model_selection import RandomizedSearchCV, GridSearchCV

# Optional imports with graceful fallbacks
try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier, LGBMRegressor
    HAS_LGBM = True
except ImportError:
    HAS_LGBM = False

def get_available_algorithms(task_type: str) -> List[Dict[str, str]]:
    """Returns list of algorithm identifiers and friendly names for UI."""
    if task_type == "classification":
        algos = [
            {"id": "random_forest", "name": "Random Forest Classifier", "category": "Ensemble", "default": True},
            {"id": "xgboost", "name": "XGBoost Classifier", "category": "Boosting", "default": True},
            {"id": "lightgbm", "name": "LightGBM Classifier", "category": "Boosting", "default": True},
            {"id": "gradient_boosting", "name": "Gradient Boosting", "category": "Boosting", "default": False},
            {"id": "logistic_regression", "name": "Logistic Regression", "category": "Linear", "default": True},
            {"id": "decision_tree", "name": "Decision Tree", "category": "Tree", "default": False},
            {"id": "svm", "name": "Support Vector Machine (SVM)", "category": "Kernel", "default": False},
            {"id": "knn", "name": "K-Nearest Neighbors (KNN)", "category": "Instance-based", "default": False},
            {"id": "naive_bayes", "name": "Gaussian Naive Bayes", "category": "Probabilistic", "default": False},
        ]
        return algos

    elif task_type == "regression":
        algos = [
            {"id": "random_forest", "name": "Random Forest Regressor", "category": "Ensemble", "default": True},
            {"id": "xgboost", "name": "XGBoost Regressor", "category": "Boosting", "default": True},
            {"id": "lightgbm", "name": "LightGBM Regressor", "category": "Boosting", "default": True},
            {"id": "gradient_boosting", "name": "Gradient Boosting", "category": "Boosting", "default": False},
            {"id": "ridge", "name": "Ridge Regression (L2)", "category": "Linear", "default": True},
            {"id": "lasso", "name": "Lasso Regression (L1)", "category": "Linear", "default": False},
            {"id": "linear_regression", "name": "Linear Regression (OLS)", "category": "Linear", "default": True},
            {"id": "decision_tree", "name": "Decision Tree Regressor", "category": "Tree", "default": False},
            {"id": "svr", "name": "Support Vector Regressor (SVR)", "category": "Kernel", "default": False},
            {"id": "knn", "name": "K-Nearest Neighbors Regressor", "category": "Instance-based", "default": False},
        ]
        return algos

    elif task_type == "clustering":
        algos = [
            {"id": "kmeans", "name": "K-Means Clustering", "category": "Centroid", "default": True},
            {"id": "dbscan", "name": "DBSCAN (Density-Based)", "category": "Density", "default": True},
            {"id": "hierarchical", "name": "Hierarchical (Agglomerative)", "category": "Hierarchical", "default": True},
        ]
        return algos

    return []

def instantiate_model(model_id: str, task_type: str, random_seed: int = 42, class_weight: Optional[str] = None):
    """Instantiates the scikit-learn compatible estimator."""
    seed = random_seed

    if task_type == "classification":
        if model_id == "logistic_regression":
            return LogisticRegression(max_iter=1000, random_state=seed, class_weight=class_weight)
        elif model_id == "decision_tree":
            return DecisionTreeClassifier(max_depth=8, random_state=seed, class_weight=class_weight)
        elif model_id == "random_forest":
            return RandomForestClassifier(n_estimators=100, max_depth=10, random_state=seed, class_weight=class_weight, n_jobs=-1)
        elif model_id == "gradient_boosting":
            return GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=seed)
        elif model_id == "xgboost":
            if HAS_XGB:
                return XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=seed, eval_metric='logloss', verbosity=0)
            return HistGradientBoostingClassifier(max_iter=100, random_state=seed)
        elif model_id == "lightgbm":
            if HAS_LGBM:
                return LGBMClassifier(n_estimators=100, learning_rate=0.1, num_leaves=31, random_state=seed, class_weight=class_weight, verbose=-1)
            return HistGradientBoostingClassifier(max_iter=100, random_state=seed)
        elif model_id == "svm":
            return SVC(probability=True, random_state=seed, class_weight=class_weight)
        elif model_id == "knn":
            return KNeighborsClassifier(n_neighbors=5, n_jobs=-1)
        elif model_id == "naive_bayes":
            return GaussianNB()

    elif task_type == "regression":
        if model_id == "linear_regression":
            return LinearRegression()
        elif model_id == "ridge":
            return Ridge(alpha=1.0, random_state=seed)
        elif model_id == "lasso":
            return Lasso(alpha=0.1, random_state=seed)
        elif model_id == "decision_tree":
            return DecisionTreeRegressor(max_depth=8, random_state=seed)
        elif model_id == "random_forest":
            return RandomForestRegressor(n_estimators=100, max_depth=10, random_state=seed, n_jobs=-1)
        elif model_id == "gradient_boosting":
            return GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=seed)
        elif model_id == "xgboost":
            if HAS_XGB:
                return XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=seed, verbosity=0)
            return HistGradientBoostingRegressor(max_iter=100, random_state=seed)
        elif model_id == "lightgbm":
            if HAS_LGBM:
                return LGBMRegressor(n_estimators=100, learning_rate=0.1, num_leaves=31, random_state=seed, verbose=-1)
            return HistGradientBoostingRegressor(max_iter=100, random_state=seed)
        elif model_id == "svr":
            return SVR()
        elif model_id == "knn":
            return KNeighborsRegressor(n_neighbors=5, n_jobs=-1)

    elif task_type == "clustering":
        if model_id == "kmeans":
            return KMeans(n_clusters=3, random_state=seed, n_init=10)
        elif model_id == "dbscan":
            return DBSCAN(eps=0.5, min_samples=5)
        elif model_id == "hierarchical":
            return AgglomerativeClustering(n_clusters=3)

    raise ValueError(f"Unknown model_id '{model_id}' for task_type '{task_type}'")

def get_param_grid(model_id: str) -> Dict[str, List[Any]]:
    """Returns lightweight tuning search grids."""
    grids = {
        "random_forest": {
            "n_estimators": [50, 100, 150],
            "max_depth": [5, 10, None],
            "min_samples_split": [2, 5]
        },
        "xgboost": {
            "n_estimators": [50, 100],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.03, 0.1, 0.2]
        },
        "lightgbm": {
            "n_estimators": [50, 100],
            "num_leaves": [15, 31, 63],
            "learning_rate": [0.03, 0.1]
        },
        "ridge": {
            "alpha": [0.01, 0.1, 1.0, 10.0]
        },
        "lasso": {
            "alpha": [0.01, 0.05, 0.1, 1.0]
        },
        "logistic_regression": {
            "C": [0.1, 1.0, 10.0]
        },
        "knn": {
            "n_neighbors": [3, 5, 7, 9]
        },
        "svm": {
            "C": [0.5, 1.0, 5.0],
            "kernel": ['linear', 'rbf']
        },
        "kmeans": {
            "n_clusters": [2, 3, 4, 5]
        }
    }
    return grids.get(model_id, {})
