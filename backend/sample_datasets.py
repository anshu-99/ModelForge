"""
Sample datasets generator for ModelForge AutoML.
Provides ready-to-use sample datasets for Classification, Regression, and Clustering.
"""

import pandas as pd
import numpy as np
from sklearn import datasets

def get_sample_dataset(name: str) -> tuple[pd.DataFrame, str | None, str]:
    """
    Returns (DataFrame, suggested_target_column, task_type)
    """
    name = name.lower().strip()
    
    if name == "titanic":
        # Realistic Titanic sample with missing values and mixed types
        data = {
            'PassengerId': list(range(1, 401)),
            'Survived': np.random.choice([0, 1], size=400, p=[0.62, 0.38]),
            'Pclass': np.random.choice([1, 2, 3], size=400, p=[0.24, 0.21, 0.55]),
            'Sex': np.random.choice(['male', 'female'], size=400, p=[0.64, 0.36]),
            'Age': [round(np.random.normal(29, 14), 1) if np.random.rand() > 0.18 else np.nan for _ in range(400)],
            'SibSp': np.random.choice([0, 1, 2, 3], size=400, p=[0.68, 0.23, 0.06, 0.03]),
            'Parch': np.random.choice([0, 1, 2], size=400, p=[0.76, 0.16, 0.08]),
            'Fare': [round(max(7.2, np.random.exponential(32.0)), 2) for _ in range(400)],
            'Embarked': np.random.choice(['S', 'C', 'Q', None], size=400, p=[0.70, 0.20, 0.08, 0.02]),
        }
        df = pd.DataFrame(data)
        # Fix negative ages
        df['Age'] = df['Age'].apply(lambda x: abs(x) if pd.notnull(x) else x)
        # Add correlation with survival: women and 1st class higher survival
        for idx in range(len(df)):
            bonus = (0.35 if df.loc[idx, 'Sex'] == 'female' else -0.2) + (0.2 if df.loc[idx, 'Pclass'] == 1 else -0.1)
            prob = max(0.05, min(0.95, 0.38 + bonus))
            df.loc[idx, 'Survived'] = int(np.random.rand() < prob)
        return df, 'Survived', 'classification'

    elif name == "iris":
        iris = datasets.load_iris(as_frame=True)
        df = iris.frame.copy()
        df.rename(columns={'target': 'species'}, inplace=True)
        df['species'] = df['species'].map({0: 'setosa', 1: 'versicolor', 2: 'virginica'})
        return df, 'species', 'classification'

    elif name == "housing" or name == "california_housing":
        # Generate realistic California housing distribution locally without network/disk permission hurdles
        np.random.seed(42)
        n = 500
        medinc = np.random.lognormal(mean=1.2, sigma=0.45, size=n).round(4)
        house_age = np.random.uniform(5, 52, size=n).round(1)
        ave_rooms = (medinc * 1.2 + np.random.normal(2.5, 0.5, size=n)).clip(2, 12).round(2)
        ave_occup = np.random.uniform(1.8, 4.5, size=n).round(2)
        latitude = np.random.uniform(32.5, 41.5, size=n).round(2)
        longitude = np.random.uniform(-124.2, -114.5, size=n).round(2)
        # Price correlates with income and lower age
        med_val = (medinc * 0.65 - (house_age * 0.005) + np.random.normal(0.8, 0.3, size=n)).clip(0.4, 5.0).round(3)
        df = pd.DataFrame({
            'MedInc': medinc,
            'HouseAge': house_age,
            'AveRooms': ave_rooms,
            'AveOccup': ave_occup,
            'Latitude': latitude,
            'Longitude': longitude,
            'MedHouseVal': med_val
        })
        return df, 'MedHouseVal', 'regression'

    elif name == "wine" or name == "wine_quality":
        wine = datasets.load_wine(as_frame=True)
        df = wine.frame.copy()
        df.rename(columns={'target': 'wine_class'}, inplace=True)
        return df, 'wine_class', 'classification'

    elif name == "breast_cancer":
        cancer = datasets.load_breast_cancer(as_frame=True)
        df = cancer.frame.copy()
        df.rename(columns={'target': 'diagnosis'}, inplace=True)
        df['diagnosis'] = df['diagnosis'].map({0: 'malignant', 1: 'benign'})
        return df, 'diagnosis', 'classification'

    elif name == "customers" or name == "customer_segmentation" or name == "clustering":
        np.random.seed(42)
        n = 300
        # Create 3 natural clusters
        c1 = np.random.multivariate_normal([25, 20, 80], [[25, 0, 0], [0, 20, 0], [0, 0, 50]], size=100)
        c2 = np.random.multivariate_normal([45, 60, 50], [[30, 0, 0], [0, 30, 0], [0, 0, 40]], size=100)
        c3 = np.random.multivariate_normal([35, 90, 25], [[20, 0, 0], [0, 25, 0], [0, 0, 35]], size=100)
        all_c = np.vstack([c1, c2, c3])
        df = pd.DataFrame(all_c, columns=['Age', 'Annual_Income_k$', 'Spending_Score_1_100'])
        df['Age'] = df['Age'].clip(18, 70).round().astype(int)
        df['Annual_Income_k$'] = df['Annual_Income_k$'].clip(15, 140).round(1)
        df['Spending_Score_1_100'] = df['Spending_Score_1_100'].clip(1, 100).round().astype(int)
        df['Gender'] = np.random.choice(['Male', 'Female'], size=n)
        return df, None, 'clustering'

    else:
        raise ValueError(f"Unknown sample dataset: {name}")
