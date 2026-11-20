#!/usr/bin/env python3
"""
================================================================================
ModelForge AutoML - Automated Reproducible Pipeline
Generated for: KMEANS (Clustering)
Target Column: species
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
print("[1/5] Loading dataset 'dataset.csv'...")
df = pd.read_csv("dataset.csv")
print(f"Dataset shape: {df.shape}")

# 2. Basic Cleaning
print("[2/5] Performing data cleaning...")
df = df.drop_duplicates().reset_index(drop=True)

X = df.copy()
y = None

numeric_features = ['sepal length (cm)', 'sepal width (cm)', 'petal length (cm)', 'petal width (cm)']
categorical_features = []

# Filter to actual columns present
numeric_features = [c for c in numeric_features if c in X.columns]
categorical_features = [c for c in categorical_features if c in X.columns]

# 3. Construct Scikit-Learn Preprocessing Pipeline
print("[3/5] Building Leak-Free ColumnTransformer Preprocessing Pipeline...")

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
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
print(f"Silhouette Score: {sil:.4f}")

# Persist Artifact
os.makedirs("models", exist_ok=True)
joblib.dump(full_pipeline, "models/modelforge_pipeline.joblib")
print("Saved complete pipeline to 'models/modelforge_pipeline.joblib'")

if __name__ == "__main__":
    print("AutoML Pipeline execution complete!")
