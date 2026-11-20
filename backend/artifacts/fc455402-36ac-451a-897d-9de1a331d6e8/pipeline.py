#!/usr/bin/env python3
"""
================================================================================
ModelForge AutoML - Automated Reproducible Pipeline
Generated for: RANDOM_FOREST (Classification)
Target Column: Survived
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

# Separate Target
df = df.dropna(subset=['Survived']).reset_index(drop=True)
X = df.drop(columns=['Survived'])
y = df['Survived']

numeric_features = ['Pclass', 'Age', 'SibSp', 'Parch', 'Fare']
categorical_features = ['Sex', 'Embarked']

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

# 4. Construct End-to-End Modeling Pipeline
print("[4/5] Training random_forest model...")
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)

full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', model)
])

# Train / Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

full_pipeline.fit(X_train, y_train)

# 5. Evaluate Performance
print("[5/5] Evaluating test set predictions...")
from sklearn.metrics import classification_report, accuracy_score, f1_score

y_pred = full_pipeline.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"F1 Score (Weighted): {f1_score(y_test, y_pred, average='weighted'):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Persist Trained Artifact
os.makedirs("models", exist_ok=True)
joblib.dump(full_pipeline, "models/modelforge_pipeline.joblib")
print("Saved complete pipeline to 'models/modelforge_pipeline.joblib'")

if __name__ == "__main__":
    print("AutoML Pipeline execution complete!")
