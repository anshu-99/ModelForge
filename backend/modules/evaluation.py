"""
Evaluation and Explainability Module for ModelForge AutoML.
Calculates metrics, ROC/PR curves, confusion matrices, residual plots,
cluster metrics (Silhouette, Davies-Bouldin, Calinski-Harabasz),
PCA 2D projection, feature importance, and SHAP explanations.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve,
    r2_score, mean_absolute_error, mean_squared_error, mean_absolute_percentage_error,
    silhouette_score, calinski_harabasz_score, davies_bouldin_score
)
from sklearn.inspection import permutation_importance
from sklearn.decomposition import PCA
import shap

def evaluate_classification(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    classes: List[Any]
) -> Dict[str, Any]:
    y_pred = model.predict(X_test)
    y_test_arr = np.array(y_test)
    
    # Probabilities
    y_prob = None
    if hasattr(model, "predict_proba"):
        try:
            y_prob = model.predict_proba(X_test)
        except Exception:
            y_prob = None

    # Base Metrics
    acc = float(accuracy_score(y_test_arr, y_pred))
    p_weighted = float(precision_score(y_test_arr, y_pred, average='weighted', zero_division=0))
    r_weighted = float(recall_score(y_test_arr, y_pred, average='weighted', zero_division=0))
    f1_weighted = float(f1_score(y_test_arr, y_pred, average='weighted', zero_division=0))
    f1_macro = float(f1_score(y_test_arr, y_pred, average='macro', zero_division=0))

    # ROC-AUC
    auc = None
    if y_prob is not None:
        try:
            if len(classes) == 2:
                # Binary classification
                auc = float(roc_auc_score(y_test_arr, y_prob[:, 1]))
            else:
                # Multiclass
                auc = float(roc_auc_score(y_test_arr, y_prob, multi_class='ovr', average='weighted'))
        except Exception:
            auc = None

    # Confusion Matrix
    cm = confusion_matrix(y_test_arr, y_pred, labels=classes)
    cm_dict = {
        "labels": [str(c) for c in classes],
        "matrix": cm.tolist()
    }

    # ROC & PR Curves (Binary or first class)
    roc_data = None
    pr_data = None
    if y_prob is not None and len(classes) == 2:
        try:
            fpr, tpr, _ = roc_curve(y_test_arr, y_prob[:, 1], pos_label=classes[1])
            # Subsample curve points if too long for clean chart rendering
            idx = np.linspace(0, len(fpr) - 1, min(60, len(fpr))).astype(int)
            roc_data = {
                "fpr": [round(float(fpr[i]), 4) for i in idx],
                "tpr": [round(float(tpr[i]), 4) for i in idx],
                "auc": round(auc, 4) if auc else None
            }

            prec, rec, _ = precision_recall_curve(y_test_arr, y_prob[:, 1], pos_label=classes[1])
            idx_pr = np.linspace(0, len(prec) - 1, min(60, len(prec))).astype(int)
            pr_data = {
                "precision": [round(float(prec[i]), 4) for i in idx_pr],
                "recall": [round(float(rec[i]), 4) for i in idx_pr]
            }
        except Exception:
            pass

    return {
        "accuracy": round(acc, 4),
        "precision": round(p_weighted, 4),
        "recall": round(r_weighted, 4),
        "f1": round(f1_weighted, 4),
        "f1_macro": round(f1_macro, 4),
        "roc_auc": round(auc, 4) if auc is not None else None,
        "confusion_matrix": cm_dict,
        "roc_curve": roc_data,
        "pr_curve": pr_data
    }

def evaluate_regression(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> Dict[str, Any]:
    y_pred = model.predict(X_test)
    y_test_arr = np.array(y_test, dtype=float)
    y_pred_arr = np.array(y_pred, dtype=float)

    r2 = float(r2_score(y_test_arr, y_pred_arr))
    mae = float(mean_absolute_error(y_test_arr, y_pred_arr))
    mse = float(mean_squared_error(y_test_arr, y_pred_arr))
    rmse = float(np.sqrt(mse))
    
    try:
        mape = float(mean_absolute_percentage_error(y_test_arr, y_pred_arr))
    except Exception:
        mape = None

    residuals = (y_test_arr - y_pred_arr).tolist()
    
    # Subsample scatter plot points for responsiveness
    n_pts = len(y_test_arr)
    sample_indices = np.random.choice(n_pts, size=min(120, n_pts), replace=False) if n_pts > 120 else range(n_pts)

    scatter_data = {
        "actual": [round(float(y_test_arr[i]), 3) for i in sample_indices],
        "predicted": [round(float(y_pred_arr[i]), 3) for i in sample_indices],
        "residuals": [round(float(residuals[i]), 3) for i in sample_indices]
    }

    # Residuals distribution
    res_counts, res_bins = np.histogram(residuals, bins=15)
    residual_hist = {
        "counts": res_counts.tolist(),
        "bin_edges": [round(float(b), 2) for b in res_bins.tolist()]
    }

    return {
        "r2": round(r2, 4),
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "mape": round(mape, 4) if mape is not None else None,
        "scatter_data": scatter_data,
        "residual_distribution": residual_hist
    }

def evaluate_clustering(
    model,
    X: np.ndarray,
    feature_names: List[str]
) -> Dict[str, Any]:
    if hasattr(model, "labels_"):
        labels = model.labels_
    else:
        labels = model.fit_predict(X)

    unique_labels = set(labels)
    # Ignore noise cluster (-1) in DBSCAN for score calculations if necessary
    n_clusters = len([l for l in unique_labels if l != -1])

    sil = None
    ch = None
    db = None

    if n_clusters > 1 and len(X) > n_clusters:
        try:
            sil = float(silhouette_score(X, labels))
            ch = float(calinski_harabasz_score(X, labels))
            db = float(davies_bouldin_score(X, labels))
        except Exception:
            pass

    # 2D PCA projection for cluster visualization
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X)
    
    # Subsample points if large
    n_pts = len(X)
    indices = np.random.choice(n_pts, size=min(250, n_pts), replace=False) if n_pts > 250 else range(n_pts)

    pca_plot = {
        "x": [round(float(X_pca[i, 0]), 3) for i in indices],
        "y": [round(float(X_pca[i, 1]), 3) for i in indices],
        "cluster": [int(labels[i]) for i in indices],
        "explained_variance_ratio": [round(float(v), 3) for v in pca.explained_variance_ratio_.tolist()]
    }

    # Cluster distribution
    unique_l, counts = np.unique(labels, return_counts=True)
    cluster_counts = {str(int(l)): int(c) for l, c in zip(unique_l, counts)}

    return {
        "n_clusters": n_clusters,
        "silhouette_score": round(sil, 4) if sil is not None else None,
        "calinski_harabasz": round(ch, 2) if ch is not None else None,
        "davies_bouldin": round(db, 4) if db is not None else None,
        "cluster_distribution": cluster_counts,
        "pca_2d": pca_plot
    }

def calculate_feature_importance(
    model,
    X_train: np.ndarray,
    y_train: np.ndarray,
    feature_names: List[str]
) -> List[Dict[str, Any]]:
    importances = []
    
    if hasattr(model, "feature_importances_"):
        raw_imp = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        if coef.ndim > 1:
            raw_imp = np.mean(np.abs(coef), axis=0)
        else:
            raw_imp = np.abs(coef)
    else:
        # Fallback to permutation importance on 50 samples
        try:
            sub_idx = np.random.choice(len(X_train), size=min(50, len(X_train)), replace=False)
            res = permutation_importance(model, X_train[sub_idx], y_train[sub_idx], n_repeats=3, random_state=42)
            raw_imp = res.importances_mean
        except Exception:
            raw_imp = np.zeros(len(feature_names))

    # Normalize to 0..100%
    raw_imp = np.array(raw_imp, dtype=float)
    total = np.sum(raw_imp)
    if total > 0:
        norm_imp = (raw_imp / total) * 100.0
    else:
        norm_imp = raw_imp

    for name, score in zip(feature_names[:len(raw_imp)], norm_imp):
        importances.append({
            "feature": name,
            "importance": round(float(score), 2)
        })

    importances.sort(key=lambda x: x["importance"], reverse=True)
    return importances[:20]

def compute_shap_explanations(
    model,
    X_sample: np.ndarray,
    feature_names: List[str],
    task_type: str
) -> Dict[str, Any]:
    """Computes fast SHAP values on a compact subsample (up to 40 samples)."""
    try:
        sample_size = min(40, len(X_sample))
        X_sub = X_sample[:sample_size]
        
        # Select best explainer
        explainer = None
        try:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_sub)
        except Exception:
            try:
                # Model-agnostic explainer
                background = shap.sample(X_sample, min(20, len(X_sample)))
                explainer = shap.Explainer(model.predict, background)
                shap_values = explainer(X_sub).values
            except Exception:
                return {}

        if isinstance(shap_values, list):
            # Binary or multiclass classification list of arrays
            shap_arr = np.array(shap_values[-1])
        elif hasattr(shap_values, 'values'):
            shap_arr = shap_values.values
        else:
            shap_arr = np.array(shap_values)

        if shap_arr.ndim == 3:
            # (n_samples, n_features, n_classes) -> average over classes
            shap_arr = shap_arr[:, :, -1]

        # Mean absolute SHAP value per feature
        mean_abs_shap = np.mean(np.abs(shap_arr), axis=0)
        shap_ranking = []
        for name, val in zip(feature_names[:len(mean_abs_shap)], mean_abs_shap):
            shap_ranking.append({
                "feature": name,
                "mean_shap": round(float(val), 4)
            })
        shap_ranking.sort(key=lambda x: x["mean_shap"], reverse=True)

        # Top 8 sample values for beeswarm-like preview
        sample_records = []
        for i in range(min(10, len(X_sub))):
            sample_records.append({
                "sample_idx": i,
                "values": {feature_names[j]: round(float(shap_arr[i, j]), 4) for j in range(min(len(feature_names), shap_arr.shape[1]))}
            })

        return {
            "feature_ranking": shap_ranking[:15],
            "sample_shap": sample_records
        }
    except Exception as e:
        return {"notice": str(e)}
