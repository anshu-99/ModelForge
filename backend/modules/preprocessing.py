"""
Preprocessing Module for ModelForge AutoML.
Builds leak-free scikit-learn ColumnTransformer pipelines, handles imputation,
outlier capping, encoding, scaling, datetime extraction, and class imbalance.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    OneHotEncoder, OrdinalEncoder, FunctionTransformer
)
from sklearn.feature_selection import VarianceThreshold, SelectKBest, f_classif, f_regression
from imblearn.over_sampling import SMOTE, RandomOverSampler

class IQRCapper(BaseEstimator, TransformerMixin):
    """Caps outliers using the 1.5 * IQR rule."""
    def __init__(self, factor: float = 1.5):
        self.factor = factor
        self.bounds_ = {}

    def fit(self, X, y=None):
        X_df = pd.DataFrame(X)
        self.bounds_ = {}
        for col in X_df.columns:
            q25 = X_df[col].quantile(0.25)
            q75 = X_df[col].quantile(0.75)
            iqr = q75 - q25
            lower = q25 - self.factor * iqr
            upper = q75 + self.factor * iqr
            self.bounds_[col] = (lower, upper)
        return self

    def transform(self, X):
        X_df = pd.DataFrame(X).copy()
        for col, (lower, upper) in self.bounds_.items():
            if col in X_df.columns:
                X_df[col] = X_df[col].clip(lower=lower, upper=upper)
        return X_df.values

class ZScoreCapper(BaseEstimator, TransformerMixin):
    """Caps outliers using the 3 * sigma rule."""
    def __init__(self, threshold: float = 3.0):
        self.threshold = threshold
        self.stats_ = {}

    def fit(self, X, y=None):
        X_df = pd.DataFrame(X)
        self.stats_ = {}
        for col in X_df.columns:
            mean = X_df[col].mean()
            std = X_df[col].std()
            if std == 0 or pd.isna(std):
                self.stats_[col] = (mean, mean)
            else:
                self.stats_[col] = (mean - self.threshold * std, mean + self.threshold * std)
        return self

    def transform(self, X):
        X_df = pd.DataFrame(X).copy()
        for col, (lower, upper) in self.stats_.items():
            if col in X_df.columns:
                X_df[col] = X_df[col].clip(lower=lower, upper=upper)
        return X_df.values

def extract_datetime_features(df: pd.DataFrame, dt_cols: List[str]) -> Tuple[pd.DataFrame, List[str]]:
    """Extracts informative temporal features from datetime columns."""
    df_out = df.copy()
    new_cols = []
    for col in dt_cols:
        try:
            dt_s = pd.to_datetime(df_out[col], errors='coerce')
            prefix = col
            df_out[f"{prefix}_year"] = dt_s.dt.year.fillna(2000).astype(int)
            df_out[f"{prefix}_month"] = dt_s.dt.month.fillna(1).astype(int)
            df_out[f"{prefix}_day"] = dt_s.dt.day.fillna(1).astype(int)
            df_out[f"{prefix}_dayofweek"] = dt_s.dt.dayofweek.fillna(0).astype(int)
            df_out[f"{prefix}_is_weekend"] = dt_s.dt.dayofweek.isin([5, 6]).astype(int)
            new_cols.extend([f"{prefix}_year", f"{prefix}_month", f"{prefix}_day", f"{prefix}_dayofweek", f"{prefix}_is_weekend"])
            df_out.drop(columns=[col], inplace=True)
        except Exception:
            pass
    return df_out, new_cols

def build_preprocessor_pipeline(
    numeric_features: List[str],
    low_card_cat_features: List[str],
    high_card_cat_features: List[str],
    config: Dict[str, Any]
) -> ColumnTransformer:
    transformers = []
    
    # 1. Numeric Pipeline
    if numeric_features:
        num_steps = []
        
        # Missing value imputer
        num_imp_strat = config.get("missing_num_strategy", "median")
        if num_imp_strat == "knn":
            num_steps.append(('imputer', KNNImputer(n_neighbors=5)))
        elif num_imp_strat == "zero":
            num_steps.append(('imputer', SimpleImputer(strategy='constant', fill_value=0.0)))
        else:
            num_steps.append(('imputer', SimpleImputer(strategy=num_imp_strat)))
        
        # Outlier handling
        outlier_strat = config.get("outlier_strategy", "none")
        if outlier_strat == "iqr":
            num_steps.append(('outlier_capper', IQRCapper(factor=1.5)))
        elif outlier_strat == "zscore":
            num_steps.append(('outlier_capper', ZScoreCapper(threshold=3.0)))
            
        # Scaling
        scaler_strat = config.get("feature_scaling", "standard")
        if scaler_strat == "minmax":
            num_steps.append(('scaler', MinMaxScaler()))
        elif scaler_strat == "robust":
            num_steps.append(('scaler', RobustScaler()))
        elif scaler_strat == "standard" or scaler_strat == "auto":
            num_steps.append(('scaler', StandardScaler()))
            
        transformers.append(('numeric', Pipeline(num_steps), numeric_features))

    # 2. Low-cardinality Categorical Pipeline (One-Hot Encoding)
    if low_card_cat_features:
        cat_steps = [
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ]
        transformers.append(('low_card_cat', Pipeline(cat_steps), low_card_cat_features))

    # 3. High-cardinality Categorical Pipeline (Ordinal Encoding)
    if high_card_cat_features:
        high_cat_steps = [
            ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
            ('ordinal', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ]
        transformers.append(('high_card_cat', Pipeline(high_cat_steps), high_card_cat_features))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder='drop',
        verbose_feature_names_out=False
    )
    return preprocessor

def prepare_data(
    df: pd.DataFrame,
    target_col: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if config is None:
        config = {}

    df_clean = df.copy()
    logs = []
    
    # Step A: Remove duplicate rows
    if config.get("drop_duplicates", True):
        dup_count = df_clean.duplicated().sum()
        if dup_count > 0:
            df_clean = df_clean.drop_duplicates().reset_index(drop=True)
            logs.append(f"Removed {dup_count} duplicate rows.")

    # Target column separation
    y = None
    y_raw = None
    if target_col and target_col in df_clean.columns:
        y_raw = df_clean[target_col]
        # Drop rows where target is NaN
        valid_idx = y_raw.notnull()
        if not valid_idx.all():
            dropped = (~valid_idx).sum()
            df_clean = df_clean[valid_idx].reset_index(drop=True)
            y_raw = df_clean[target_col]
            logs.append(f"Dropped {dropped} rows with missing target values.")
        df_clean = df_clean.drop(columns=[target_col])
        y = y_raw.copy()

    # Step B: Identify and drop ID-like or constant columns
    dropped_cols = []
    n_rows = len(df_clean)
    
    cols_to_check = list(df_clean.columns)
    for col in cols_to_check:
        s = df_clean[col]
        nunique = s.nunique(dropna=True)
        # Drop constant
        if nunique <= 1 and config.get("drop_constant_cols", True):
            dropped_cols.append((col, "Constant / Zero variance"))
            df_clean.drop(columns=[col], inplace=True)
            continue
        # Drop ID-like
        if config.get("drop_id_cols", True) and nunique == n_rows and n_rows > 10:
            if pd.api.types.is_numeric_dtype(s) or any(id_kw in col.lower() for id_kw in ['id', 'uuid', 'guid', 'key']):
                dropped_cols.append((col, "Identifier (all unique)"))
                df_clean.drop(columns=[col], inplace=True)
                continue

    if dropped_cols:
        logs.append(f"Dropped {len(dropped_cols)} non-informative columns: {', '.join([c[0] for c in dropped_cols])}")

    # Step C: Datetime feature extraction
    dt_candidates = []
    for col in df_clean.columns:
        if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
            dt_candidates.append(col)
        elif pd.api.types.is_string_dtype(df_clean[col]) or pd.api.types.is_object_dtype(df_clean[col]):
            sample = df_clean[col].dropna().head(5)
            if len(sample) > 0:
                try:
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        pd.to_datetime(sample, errors='raise')
                        dt_candidates.append(col)
                except Exception:
                    pass

    if dt_candidates and config.get("datetime_handling", True):
        df_clean, new_dt_cols = extract_datetime_features(df_clean, dt_candidates)
        logs.append(f"Extracted temporal features from {len(dt_candidates)} datetime column(s): {', '.join(dt_candidates)}")

    # Step D: Segregate feature types
    numeric_features = []
    low_card_cat = []
    high_card_cat = []

    for col in df_clean.columns:
        s = df_clean[col]
        if pd.api.types.is_numeric_dtype(s):
            numeric_features.append(col)
        else:
            n_unq = s.nunique()
            if n_unq <= 10:
                low_card_cat.append(col)
            else:
                high_card_cat.append(col)

    # Build ColumnTransformer
    preprocessor = build_preprocessor_pipeline(
        numeric_features=numeric_features,
        low_card_cat_features=low_card_cat,
        high_card_cat_features=high_card_cat,
        config=config
    )

    # Fit preprocessor to get clean dataset
    try:
        X_trans = preprocessor.fit_transform(df_clean)
        # Try retrieving feature names
        try:
            feat_names = list(preprocessor.get_feature_names_out())
        except Exception:
            feat_names = [f"feat_{i}" for i in range(X_trans.shape[1])]
        
        # Build Cleaned DataFrame
        df_transformed = pd.DataFrame(X_trans, columns=feat_names)
        if y is not None:
            df_transformed[target_col] = y.values
    except Exception as e:
        logs.append(f"Preprocessing transform notice: {str(e)}")
        df_transformed = df_clean.copy()
        feat_names = list(df_clean.columns)

    return {
        "X_raw": df_clean,
        "y": y,
        "preprocessor": preprocessor,
        "df_cleaned": df_transformed,
        "numeric_features": numeric_features,
        "low_card_cat": low_card_cat,
        "high_card_cat": high_card_cat,
        "dropped_cols": dropped_cols,
        "feature_names_out": feat_names,
        "logs": logs
    }
