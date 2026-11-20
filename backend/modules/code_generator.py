"""
Code Generator Module for ModelForge AutoML.
Generates completely self-contained, reproducible, standalone Python scripts (.py)
and Jupyter Notebooks (.ipynb) replicating every single pipeline step.
"""

import json
from typing import Dict, Any, List

def generate_python_script(
    task_type: str,
    target_col: str | None,
    best_model_id: str,
    config: Dict[str, Any],
    numeric_cols: List[str],
    cat_cols: List[str],
    dataset_filename: str = "dataset.csv"
) -> str:
    script = f'''#!/usr/bin/env python3
"""
================================================================================
ModelForge AutoML - Automated Reproducible Pipeline
Generated for: {best_model_id.upper()} ({task_type.capitalize()})
Target Column: {target_col if target_col else "None (Clustering)"}
================================================================================
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder, OrdinalEncoder

# 1. Load Dataset
print("[1/5] Loading dataset '{dataset_filename}'...")
df = pd.read_csv("{dataset_filename}")
print(f"Dataset shape: {{df.shape}}")

# 2. Basic Cleaning
print("[2/5] Performing data cleaning...")
df = df.drop_duplicates().reset_index(drop=True)
'''

    if target_col and task_type != "clustering":
        script += f'''
# Separate Target
df = df.dropna(subset=['{target_col}']).reset_index(drop=True)
X = df.drop(columns=['{target_col}'])
y = df['{target_col}']
'''
    else:
        script += '''
X = df.copy()
y = None
'''

    script += f'''
numeric_features = {numeric_cols}
categorical_features = {cat_cols}

# Filter to actual columns present
numeric_features = [c for c in numeric_features if c in X.columns]
categorical_features = [c for c in categorical_features if c in X.columns]

# 3. Construct Scikit-Learn Preprocessing Pipeline
print("[3/5] Building Leak-Free ColumnTransformer Preprocessing Pipeline...")

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='{config.get("missing_num_strategy", "median")}')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ],
    remainder='drop'
)
'''

    # Model definition
    if task_type == "classification":
        if best_model_id == "random_forest":
            model_code = "from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)"
        elif best_model_id == "xgboost":
            model_code = "from xgboost import XGBClassifier\nmodel = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42, eval_metric='logloss')"
        elif best_model_id == "lightgbm":
            model_code = "from lightgbm import LGBMClassifier\nmodel = LGBMClassifier(n_estimators=100, learning_rate=0.1, num_leaves=31, random_state=42, verbose=-1)"
        elif best_model_id == "gradient_boosting":
            model_code = "from sklearn.ensemble import GradientBoostingClassifier\nmodel = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)"
        elif best_model_id == "decision_tree":
            model_code = "from sklearn.tree import DecisionTreeClassifier\nmodel = DecisionTreeClassifier(max_depth=8, random_state=42)"
        elif best_model_id == "svm":
            model_code = "from sklearn.svm import SVC\nmodel = SVC(probability=True, random_state=42)"
        elif best_model_id == "knn":
            model_code = "from sklearn.neighbors import KNeighborsClassifier\nmodel = KNeighborsClassifier(n_neighbors=5)"
        elif best_model_id == "naive_bayes":
            model_code = "from sklearn.naive_bayes import GaussianNB\nmodel = GaussianNB()"
        else:
            model_code = "from sklearn.linear_model import LogisticRegression\nmodel = LogisticRegression(max_iter=1000, random_state=42)"

        script += f'''
# 4. Construct End-to-End Modeling Pipeline
print("[4/5] Training {best_model_id} model...")
{model_code}

full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', model)
])

# Train / Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size={1.0 - config.get("train_test_split", 0.8):.2f}, random_state={config.get("random_seed", 42)}
)

full_pipeline.fit(X_train, y_train)

# 5. Evaluate Performance
print("[5/5] Evaluating test set predictions...")
from sklearn.metrics import classification_report, accuracy_score, f1_score

y_pred = full_pipeline.predict(X_test)
print(f"Accuracy: {{accuracy_score(y_test, y_pred):.4f}}")
print(f"F1 Score (Weighted): {{f1_score(y_test, y_pred, average='weighted'):.4f}}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# Persist Trained Artifact
os.makedirs("models", exist_ok=True)
joblib.dump(full_pipeline, "models/modelforge_pipeline.joblib")
print("Saved complete pipeline to 'models/modelforge_pipeline.joblib'")
'''

    elif task_type == "regression":
        if best_model_id == "random_forest":
            model_code = "from sklearn.ensemble import RandomForestRegressor\nmodel = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)"
        elif best_model_id == "xgboost":
            model_code = "from xgboost import XGBRegressor\nmodel = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)"
        elif best_model_id == "lightgbm":
            model_code = "from lightgbm import LGBMRegressor\nmodel = LGBMRegressor(n_estimators=100, learning_rate=0.1, num_leaves=31, random_state=42, verbose=-1)"
        elif best_model_id == "gradient_boosting":
            model_code = "from sklearn.ensemble import GradientBoostingRegressor\nmodel = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42)"
        elif best_model_id == "ridge":
            model_code = "from sklearn.linear_model import Ridge\nmodel = Ridge(alpha=1.0, random_state=42)"
        elif best_model_id == "lasso":
            model_code = "from sklearn.linear_model import Lasso\nmodel = Lasso(alpha=0.1, random_state=42)"
        else:
            model_code = "from sklearn.linear_model import LinearRegression\nmodel = LinearRegression()"

        script += f'''
# 4. Construct End-to-End Modeling Pipeline
print("[4/5] Training {best_model_id} regressor...")
{model_code}

full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', model)
])

# Train / Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size={1.0 - config.get("train_test_split", 0.8):.2f}, random_state={config.get("random_seed", 42)}
)

full_pipeline.fit(X_train, y_train)

# 5. Evaluate Performance
print("[5/5] Evaluating test set predictions...")
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

y_pred = full_pipeline.predict(X_test)
print(f"R2 Score: {{r2_score(y_test, y_pred):.4f}}")
print(f"MAE: {{mean_absolute_error(y_test, y_pred):.4f}}")
print(f"RMSE: {{np.sqrt(mean_squared_error(y_test, y_pred)):.4f}}")

# Persist Trained Artifact
os.makedirs("models", exist_ok=True)
joblib.dump(full_pipeline, "models/modelforge_pipeline.joblib")
print("Saved complete pipeline to 'models/modelforge_pipeline.joblib'")
'''

    elif task_type == "clustering":
        script += f'''
# 4. Construct Clustering Pipeline
print("[4/5] Running KMeans Clustering...")
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('clusterer', KMeans(n_clusters=3, random_state=42, n_init=10))
])

X_trans = full_pipeline.named_steps['preprocessor'].fit_transform(X)
labels = full_pipeline.named_steps['clusterer'].fit_predict(X_trans)

# 5. Evaluation
sil = silhouette_score(X_trans, labels)
print(f"Silhouette Score: {{sil:.4f}}")

# Persist Artifact
os.makedirs("models", exist_ok=True)
joblib.dump(full_pipeline, "models/modelforge_pipeline.joblib")
print("Saved complete pipeline to 'models/modelforge_pipeline.joblib'")
'''

    script += '''
if __name__ == "__main__":
    print("AutoML Pipeline execution complete!")
'''
    return script

def generate_jupyter_notebook(script_content: str) -> str:
    """Wraps python script into a clean Jupyter Notebook JSON format."""
    cells = [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# ModelForge AutoML - Generated Pipeline\n",
                "This interactive notebook reproduces the complete data preprocessing, feature engineering, and model training pipeline."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": script_content.splitlines(keepends=True)
        }
    ]
    notebook_dict = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.10"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    return json.dumps(notebook_dict, indent=2)

def generate_requirements() -> str:
    return """pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
xgboost>=2.0.0
lightgbm>=4.0.0
imbalanced-learn>=0.11.0
joblib>=1.3.0
shap>=0.42.0
"""
