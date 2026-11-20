"""
EDA (Exploratory Data Analysis) Module for ModelForge AutoML.
Calculates summary statistics, missing values, duplicates, distributions, correlations,
and class imbalance metrics for interactive visualization.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List

def perform_eda(df: pd.DataFrame, target_col: Optional[str] = None) -> Dict[str, Any]:
    n_rows, n_cols = df.shape
    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    duplicate_rows = int(df.duplicated().sum())

    # Column-level summaries
    columns_info = []
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []

    for col in df.columns:
        s = df[col]
        dtype_str = str(s.dtype)
        null_count = int(s.isnull().sum())
        null_pct = round((null_count / max(1, n_rows)) * 100, 2)
        nunique = int(s.nunique(dropna=True))
        
        # Detect column semantic role
        role = "numerical"
        if pd.api.types.is_numeric_dtype(s):
            # Check if it acts as ID (all unique integers or monotonic)
            if nunique == n_rows and n_rows > 10:
                role = "id"
            elif nunique <= 1:
                role = "constant"
            elif nunique == 2:
                role = "binary"
                numeric_cols.append(col)
            else:
                numeric_cols.append(col)
        elif pd.api.types.is_datetime64_any_dtype(s):
            role = "datetime"
            datetime_cols.append(col)
        else:
            # Try parsing datetime if strings
            sample_non_null = s.dropna().astype(str).head(10)
            is_dt = False
            if len(sample_non_null) > 0:
                try:
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        pd.to_datetime(sample_non_null, errors='raise')
                        role = "datetime"
                        datetime_cols.append(col)
                        is_dt = True
                except Exception:
                    pass
            if not is_dt:
                if nunique == n_rows and n_rows > 10:
                    role = "id"
                elif nunique <= 1:
                    role = "constant"
                else:
                    role = "categorical"
                    categorical_cols.append(col)

        sample_vals = [None if pd.isna(v) else (str(v) if not isinstance(v, (int, float, bool)) else (int(v) if isinstance(v, (int, np.integer)) else float(v))) for v in s.head(5).tolist()]

        columns_info.append({
            "name": col,
            "dtype": dtype_str,
            "role": role,
            "null_count": null_count,
            "null_pct": null_pct,
            "nunique": nunique,
            "sample_values": sample_vals
        })

    # Numeric summary statistics
    numeric_stats = {}
    distributions = {}
    for col in numeric_cols:
        s_clean = df[col].dropna()
        if len(s_clean) > 0:
            q25 = float(s_clean.quantile(0.25))
            q75 = float(s_clean.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            outlier_count = int(((s_clean < lower_bound) | (s_clean > upper_bound)).sum())
            skew = round(float(s_clean.skew()), 3) if len(s_clean) > 2 else 0.0
            
            numeric_stats[col] = {
                "count": int(s_clean.count()),
                "mean": round(float(s_clean.mean()), 3),
                "std": round(float(s_clean.std()), 3) if len(s_clean) > 1 else 0.0,
                "min": round(float(s_clean.min()), 3),
                "q25": round(q25, 3),
                "median": round(float(s_clean.median()), 3),
                "q75": round(q75, 3),
                "max": round(float(s_clean.max()), 3),
                "iqr": round(iqr, 3),
                "outliers_count": outlier_count,
                "skewness": skew
            }

            # Generate histogram bins for chart
            try:
                counts, bin_edges = np.histogram(s_clean, bins=min(20, max(5, int(np.sqrt(len(s_clean))))))
                distributions[col] = {
                    "type": "numeric",
                    "counts": counts.tolist(),
                    "bin_edges": [round(float(b), 2) for b in bin_edges.tolist()]
                }
            except Exception:
                pass

    # Categorical distributions (top 10 categories)
    for col in categorical_cols:
        vc = df[col].value_counts(dropna=False).head(10)
        distributions[col] = {
            "type": "categorical",
            "categories": [str(k) for k in vc.index.tolist()],
            "counts": [int(v) for v in vc.values.tolist()]
        }

    # Correlation Matrix (for numeric features, capped to 25 to avoid giant payload)
    corr_matrix = {}
    corr_numeric_cols = numeric_cols[:25]
    if len(corr_numeric_cols) >= 2:
        try:
            corr_df = df[corr_numeric_cols].corr().fillna(0).round(3)
            corr_matrix = {
                "columns": corr_numeric_cols,
                "values": corr_df.values.tolist()
            }
        except Exception:
            corr_matrix = {}

    # Target Column Analysis & Task Type Detection
    detected_task = "clustering"
    target_info = None
    suggested_target = target_col

    if target_col and target_col in df.columns:
        t_series = df[target_col].dropna()
        t_unique = int(t_series.nunique())
        
        if pd.api.types.is_numeric_dtype(t_series):
            if t_unique == 2:
                detected_task = "classification"
                task_subtype = "binary"
            elif t_unique <= 15 and pd.api.types.is_integer_dtype(t_series):
                detected_task = "classification"
                task_subtype = "multiclass"
            else:
                detected_task = "regression"
                task_subtype = "continuous"
        else:
            detected_task = "classification"
            task_subtype = "binary" if t_unique == 2 else "multiclass"

        # Target distribution
        vc = t_series.value_counts(dropna=False)
        target_distribution = {
            "labels": [str(k) for k in vc.index.tolist()],
            "counts": [int(v) for v in vc.values.tolist()],
            "percentages": [round(float(v / max(1, len(t_series)) * 100), 2) for v in vc.values.tolist()]
        }

        # Check class imbalance if classification
        is_imbalanced = False
        imbalance_ratio = 1.0
        if detected_task == "classification" and len(vc) >= 2:
            max_c = vc.iloc[0]
            min_c = vc.iloc[-1]
            if min_c > 0:
                imbalance_ratio = round(float(max_c / min_c), 2)
                if imbalance_ratio > 3.0:
                    is_imbalanced = True

        target_info = {
            "name": target_col,
            "detected_task": detected_task,
            "task_subtype": task_subtype,
            "nunique": t_unique,
            "distribution": target_distribution,
            "is_imbalanced": is_imbalanced,
            "imbalance_ratio": imbalance_ratio
        }
    else:
        # Heuristic to suggest target column if not supplied
        for col in df.columns:
            lower = col.lower()
            if any(key in lower for key in ['target', 'label', 'survived', 'class', 'price', 'outcome', 'churn', 'status']):
                suggested_target = col
                break

    # Data Quality Warnings
    warnings = []
    if duplicate_rows > 0:
        warnings.append(f"Found {duplicate_rows} duplicate rows that will be removed.")
    
    for c in columns_info:
        if c["null_pct"] > 50:
            warnings.append(f"Column '{c['name']}' has {c['null_pct']}% missing values.")
        if c["role"] == "constant":
            warnings.append(f"Column '{c['name']}' is constant (zero variance) and should be dropped.")
        if c["role"] == "id":
            warnings.append(f"Column '{c['name']}' appears to be an identifier (all unique).")

    if target_info and target_info.get("is_imbalanced"):
        warnings.append(f"Target '{target_col}' is imbalanced (ratio {target_info['imbalance_ratio']}:1). Recommended: Enable SMOTE or class weighting.")

    return {
        "n_rows": n_rows,
        "n_cols": n_cols,
        "memory_mb": memory_mb,
        "duplicate_rows": duplicate_rows,
        "columns": columns_info,
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
        "datetime_cols": datetime_cols,
        "numeric_stats": numeric_stats,
        "distributions": distributions,
        "corr_matrix": corr_matrix,
        "suggested_target": suggested_target,
        "target_info": target_info,
        "warnings": warnings
    }
