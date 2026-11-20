"""
ModelForge AutoML - Backend Server (FastAPI)
Provides full REST API for dataset upload, sample datasets, automated EDA,
asynchronous AutoML training pipeline, model persistence, evaluation metrics,
explainability (SHAP & feature importances), code export, and interactive inference.
"""

import os
import sys
import time
import uuid
import json
import traceback
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import io
import joblib
import pandas as pd
import numpy as np

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel

# Internal modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sample_datasets import get_sample_dataset
from modules.eda import perform_eda
from modules.preprocessing import prepare_data, build_preprocessor_pipeline
from modules.models import (
    get_available_algorithms, instantiate_model, get_param_grid
)
from modules.evaluation import (
    evaluate_classification, evaluate_regression, evaluate_clustering,
    calculate_feature_importance, compute_shap_explanations
)
from modules.code_generator import (
    generate_python_script, generate_jupyter_notebook, generate_requirements
)
from modules.report_generator import generate_html_report

from sklearn.model_selection import train_test_split, KFold, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

app = FastAPI(title="ModelForge AutoML API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# In-memory storage for active datasets and job statuses
DATASETS: Dict[str, pd.DataFrame] = {}
JOBS: Dict[str, Dict[str, Any]] = {}

def add_job_log(job_id: str, message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if job_id in JOBS:
        JOBS[job_id]["logs"].append({
            "time": timestamp,
            "message": message,
            "level": level
        })

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ModelForge AutoML Engine", "time": datetime.now().isoformat()}

@app.get("/api/samples")
def list_sample_datasets():
    return [
        {
            "id": "titanic",
            "name": "Titanic Passenger Survival",
            "task": "classification",
            "rows": 400,
            "cols": 9,
            "description": "Binary classification with missing values, categorical features, and class imbalance."
        },
        {
            "id": "iris",
            "name": "Iris Flower Classification",
            "task": "classification",
            "rows": 150,
            "cols": 5,
            "description": "Clean multiclass benchmark with 4 continuous physical measurements."
        },
        {
            "id": "housing",
            "name": "California Housing Prices",
            "task": "regression",
            "rows": 600,
            "cols": 9,
            "description": "Continuous target value prediction with geospatial and demographic features."
        },
        {
            "id": "wine",
            "name": "Wine Recognition",
            "task": "classification",
            "rows": 178,
            "cols": 14,
            "description": "13 chemical attributes profiling 3 distinct cultivars."
        },
        {
            "id": "breast_cancer",
            "name": "Breast Cancer Diagnostic",
            "task": "classification",
            "rows": 569,
            "cols": 31,
            "description": "High-dimensional binary classification for cell nuclei characteristics."
        },
        {
            "id": "customers",
            "name": "Mall Customer Segmentation",
            "task": "clustering",
            "rows": 300,
            "cols": 4,
            "description": "Unsupervised customer clustering by income, spending behavior, and age."
        }
    ]

@app.post("/api/sample/{name}")
def load_sample(name: str):
    try:
        df, suggested_target, detected_task = get_sample_dataset(name)
        dataset_id = str(uuid.uuid4())
        DATASETS[dataset_id] = df

        eda_res = perform_eda(df, target_col=suggested_target)
        preview_rows = df.head(100).replace({np.nan: None}).to_dict(orient="records")

        return {
            "dataset_id": dataset_id,
            "name": f"sample_{name}",
            "shape": {"rows": df.shape[0], "cols": df.shape[1]},
            "preview": preview_rows,
            "eda": eda_res,
            "suggested_target": suggested_target,
            "detected_task": detected_task,
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        filename = file.filename or "dataset.csv"
        content = await file.read()
        
        # Max size check (100MB)
        if len(content) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 100MB limit.")

        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        else:
            # Fallback to CSV
            df = pd.read_csv(io.BytesIO(content))

        if df.empty or df.shape[0] < 5:
            raise HTTPException(status_code=400, detail="Dataset must contain at least 5 rows.")

        dataset_id = str(uuid.uuid4())
        DATASETS[dataset_id] = df

        eda_res = perform_eda(df)
        preview_rows = df.head(100).replace({np.nan: None}).to_dict(orient="records")

        return {
            "dataset_id": dataset_id,
            "name": filename,
            "shape": {"rows": df.shape[0], "cols": df.shape[1]},
            "preview": preview_rows,
            "eda": eda_res,
            "suggested_target": eda_res.get("suggested_target"),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

@app.get("/api/algorithms/{task_type}")
def list_algorithms(task_type: str):
    return get_available_algorithms(task_type)

class RunPipelineRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = None
    task_type: str  # "classification", "regression", "clustering"
    algorithms: List[str]  # e.g. ["random_forest", "xgboost"] or ["all"]
    train_test_split: float = 0.8
    cv_folds: int = 5
    random_seed: int = 42
    hyperparameter_tuning: str = "none"  # "none", "random", "grid"
    preprocessing_config: Dict[str, Any] = {}

def execute_pipeline_task(job_id: str, req: RunPipelineRequest):
    try:
        JOBS[job_id]["status"] = "running"
        JOBS[job_id]["progress"] = 5
        add_job_log(job_id, f"Pipeline initialization started for task '{req.task_type}' (seed={req.random_seed})")

        df = DATASETS.get(req.dataset_id)
        if df is None:
            raise ValueError("Dataset not found in memory.")

        job_dir = os.path.join(ARTIFACTS_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)

        # 1. Exploratory Data Analysis
        JOBS[job_id]["progress"] = 15
        JOBS[job_id]["current_step"] = "Exploratory Data Analysis"
        add_job_log(job_id, "Computing complete dataset statistics and correlation profiles...")
        eda_summary = perform_eda(df, target_col=req.target_column)

        # 2. Automated Data Preprocessing
        JOBS[job_id]["progress"] = 25
        JOBS[job_id]["current_step"] = "Automated Preprocessing"
        add_job_log(job_id, "Executing leak-free ColumnTransformer pipeline...")

        prep_res = prepare_data(df, target_col=req.target_column, config=req.preprocessing_config)
        X_raw = prep_res["X_raw"]
        y_raw = prep_res["y"]
        preprocessor = prep_res["preprocessor"]
        df_cleaned = prep_res["df_cleaned"]

        for l in prep_res["logs"]:
            add_job_log(job_id, l)

        # Save Cleaned CSV
        cleaned_csv_path = os.path.join(job_dir, "cleaned_dataset.csv")
        df_cleaned.to_csv(cleaned_csv_path, index=False)
        add_job_log(job_id, f"Exported preprocessed dataset ({df_cleaned.shape[0]} rows, {df_cleaned.shape[1]} features)")

        # Target formatting
        classes = []
        is_classification = (req.task_type == "classification")
        is_regression = (req.task_type == "regression")
        is_clustering = (req.task_type == "clustering")

        y_processed = None
        label_encoder = None
        if is_classification and y_raw is not None:
            label_encoder = LabelEncoder()
            y_processed = label_encoder.fit_transform(y_raw.astype(str))
            classes = list(label_encoder.classes_)
            add_job_log(job_id, f"Encoded target labels: {classes}")
        elif is_regression and y_raw is not None:
            y_processed = y_raw.values.astype(float)

        # Train/Test Split
        if not is_clustering:
            stratify = y_processed if (is_classification and len(np.unique(y_processed)) <= 10) else None
            X_train, X_test, y_train, y_test = train_test_split(
                X_raw, y_processed,
                test_size=round(1.0 - req.train_test_split, 2),
                random_state=req.random_seed,
                stratify=stratify
            )
            add_job_log(job_id, f"Partitioned data: Train={len(X_train)} samples, Test={len(X_test)} samples")
        else:
            X_train = X_raw
            X_test = X_raw
            y_train = None
            y_test = None

        # 3. Model Training & Comparison
        JOBS[job_id]["progress"] = 40
        JOBS[job_id]["current_step"] = "Model Benchmarking & Training"

        available_algos = get_available_algorithms(req.task_type)
        all_ids = [a["id"] for a in available_algos]

        if "all" in req.algorithms or not req.algorithms:
            selected_ids = all_ids
        else:
            selected_ids = [aid for aid in req.algorithms if aid in all_ids]

        if not selected_ids:
            selected_ids = [all_ids[0]]

        leaderboard = []
        trained_pipelines = {}

        total_models = len(selected_ids)
        for idx, model_id in enumerate(selected_ids):
            step_pct = 40 + int(((idx + 1) / total_models) * 35)
            JOBS[job_id]["progress"] = step_pct
            
            algo_meta = next((a for a in available_algos if a["id"] == model_id), {"name": model_id})
            m_name = algo_meta["name"]
            add_job_log(job_id, f"[{idx+1}/{total_models}] Training & evaluating {m_name}...")

            start_t = time.time()
            try:
                base_estimator = instantiate_model(model_id, req.task_type, random_seed=req.random_seed)

                # Assemble Pipeline
                pipeline = Pipeline(steps=[
                    ('preprocessor', preprocessor),
                    ('model', base_estimator)
                ])

                # Optional Hyperparameter Tuning
                if req.hyperparameter_tuning in ["random", "grid"] and not is_clustering:
                    grid = get_param_grid(model_id)
                    if grid:
                        prefix_grid = {f"model__{k}": v for k, v in grid.items()}
                        search = RandomizedSearchCV(
                            pipeline, prefix_grid, n_iter=4, cv=3,
                            random_state=req.random_seed, n_jobs=-1
                        )
                        search.fit(X_train, y_train)
                        pipeline = search.best_estimator_
                        add_job_log(job_id, f"Hyperparameter tuning finished for {m_name}")
                    else:
                        pipeline.fit(X_train, y_train)
                else:
                    if is_clustering:
                        pipeline.fit(X_train)
                    else:
                        pipeline.fit(X_train, y_train)

                fit_time = round(time.time() - start_t, 3)

                # Evaluation
                if is_classification:
                    # Evaluate on transformed features
                    fitted_prep = pipeline.named_steps['preprocessor']
                    fitted_model = pipeline.named_steps['model']
                    X_test_trans = fitted_prep.transform(X_test)

                    eval_metrics = evaluate_classification(fitted_model, X_test_trans, y_test, classes=list(range(len(classes))))
                    eval_metrics["model_id"] = model_id
                    eval_metrics["model_name"] = m_name
                    eval_metrics["fit_time"] = fit_time
                    leaderboard.append(eval_metrics)

                elif is_regression:
                    fitted_prep = pipeline.named_steps['preprocessor']
                    fitted_model = pipeline.named_steps['model']
                    X_test_trans = fitted_prep.transform(X_test)

                    eval_metrics = evaluate_regression(fitted_model, X_test_trans, y_test)
                    eval_metrics["model_id"] = model_id
                    eval_metrics["model_name"] = m_name
                    eval_metrics["fit_time"] = fit_time
                    leaderboard.append(eval_metrics)

                elif is_clustering:
                    fitted_prep = pipeline.named_steps['preprocessor']
                    fitted_model = pipeline.named_steps['model']
                    X_trans = fitted_prep.transform(X_train)

                    eval_metrics = evaluate_clustering(fitted_model, X_trans, prep_res["feature_names_out"])
                    eval_metrics["model_id"] = model_id
                    eval_metrics["model_name"] = m_name
                    eval_metrics["fit_time"] = fit_time
                    leaderboard.append(eval_metrics)

                trained_pipelines[model_id] = pipeline

            except Exception as model_err:
                add_job_log(job_id, f"Failed training {m_name}: {str(model_err)}", level="WARNING")

        if not leaderboard:
            raise RuntimeError("All models failed to train.")

        # Sort Leaderboard by primary metric
        if is_classification:
            leaderboard.sort(key=lambda x: x.get("f1", 0), reverse=True)
        elif is_regression:
            leaderboard.sort(key=lambda x: x.get("r2", -999), reverse=True)
        elif is_clustering:
            leaderboard.sort(key=lambda x: (x.get("silhouette_score") or -1), reverse=True)

        best_result = leaderboard[0]
        best_model_id = best_result["model_id"]
        best_model_name = best_result["model_name"]
        best_pipeline = trained_pipelines[best_model_id]
        add_job_log(job_id, f"Champion Model Selected: {best_model_name}")

        # 4. Explainability & SHAP
        JOBS[job_id]["progress"] = 80
        JOBS[job_id]["current_step"] = "Explainability & SHAP Analytics"
        add_job_log(job_id, "Computing feature importances and SHAP values...")

        fitted_prep = best_pipeline.named_steps['preprocessor']
        fitted_model = best_pipeline.named_steps['model']
        feature_names = prep_res["feature_names_out"]

        X_train_trans = fitted_prep.transform(X_train)
        
        feature_importances = calculate_feature_importance(
            fitted_model, X_train_trans, y_train, feature_names
        )

        shap_summary = compute_shap_explanations(
            fitted_model, X_train_trans, feature_names, req.task_type
        )

        # 5. Save Artifacts & Generate Code
        JOBS[job_id]["progress"] = 92
        JOBS[job_id]["current_step"] = "Generating Code, Reports & Artifacts"
        add_job_log(job_id, "Serializing pipeline to joblib and synthesizing code...")

        model_path = os.path.join(job_dir, "best_model_pipeline.joblib")
        joblib.dump({
            "pipeline": best_pipeline,
            "label_encoder": label_encoder,
            "classes": classes,
            "task_type": req.task_type,
            "target_column": req.target_column,
            "numeric_features": prep_res["numeric_features"],
            "low_card_cat": prep_res["low_card_cat"],
            "high_card_cat": prep_res["high_card_cat"]
        }, model_path)

        # Generate standalone python script
        py_script = generate_python_script(
            task_type=req.task_type,
            target_col=req.target_column,
            best_model_id=best_model_id,
            config=req.preprocessing_config,
            numeric_cols=prep_res["numeric_features"],
            cat_cols=prep_res["low_card_cat"] + prep_res["high_card_cat"]
        )
        with open(os.path.join(job_dir, "pipeline.py"), "w", encoding="utf-8") as f:
            f.write(py_script)

        # Generate Jupyter Notebook
        nb_json = generate_jupyter_notebook(py_script)
        with open(os.path.join(job_dir, "pipeline.ipynb"), "w", encoding="utf-8") as f:
            f.write(nb_json)

        # Generate requirements.txt
        req_txt = generate_requirements()
        with open(os.path.join(job_dir, "requirements.txt"), "w", encoding="utf-8") as f:
            f.write(req_txt)

        # Generate HTML report
        html_report = generate_html_report(
            dataset_name=req.dataset_id[:8],
            task_type=req.task_type,
            target_col=req.target_column,
            eda_summary=eda_summary,
            preprocessing_summary=prep_res,
            leaderboard=leaderboard,
            best_model_name=best_model_name,
            best_metrics=best_result,
            feature_importances=feature_importances,
            shap_summary=shap_summary
        )
        with open(os.path.join(job_dir, "report.html"), "w", encoding="utf-8") as f:
            f.write(html_report)

        add_job_log(job_id, "All deliverables, models, reports, and code exported successfully!")
        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["current_step"] = "Complete"

        JOBS[job_id]["result"] = {
            "job_id": job_id,
            "task_type": req.task_type,
            "target_column": req.target_column,
            "classes": classes,
            "leaderboard": leaderboard,
            "best_model_id": best_model_id,
            "best_model_name": best_model_name,
            "best_metrics": best_result,
            "feature_importances": feature_importances,
            "shap_summary": shap_summary,
            "eda_summary": eda_summary,
            "preprocessing_summary": {
                "dropped_cols": prep_res["dropped_cols"],
                "numeric_features": prep_res["numeric_features"],
                "categorical_features": prep_res["low_card_cat"] + prep_res["high_card_cat"],
                "transformed_feature_count": len(prep_res["feature_names_out"])
            },
            "python_script": py_script,
            "requirements": req_txt
        }

    except Exception as e:
        traceback.print_exc()
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
        add_job_log(job_id, f"Pipeline Error: {str(e)}", level="ERROR")

@app.post("/api/run")
def start_pipeline(req: RunPipelineRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "current_step": "Queued",
        "logs": [],
        "created_at": datetime.now().isoformat(),
        "result": None,
        "error": None
    }
    background_tasks.add_task(execute_pipeline_task, job_id, req)
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/status/{job_id}")
def get_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/api/download/{job_id}/{asset_type}")
def download_asset(job_id: str, asset_type: str):
    job_dir = os.path.join(ARTIFACTS_DIR, job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Artifacts not found")

    if asset_type == "cleaned_data":
        filepath = os.path.join(job_dir, "cleaned_dataset.csv")
        return FileResponse(filepath, filename="cleaned_dataset.csv", media_type="text/csv")
    elif asset_type == "model":
        filepath = os.path.join(job_dir, "best_model_pipeline.joblib")
        return FileResponse(filepath, filename="modelforge_model.joblib", media_type="application/octet-stream")
    elif asset_type == "python_script":
        filepath = os.path.join(job_dir, "pipeline.py")
        return FileResponse(filepath, filename="pipeline.py", media_type="text/x-python")
    elif asset_type == "jupyter_notebook":
        filepath = os.path.join(job_dir, "pipeline.ipynb")
        return FileResponse(filepath, filename="pipeline.ipynb", media_type="application/x-ipynb+json")
    elif asset_type == "report":
        filepath = os.path.join(job_dir, "report.html")
        return FileResponse(filepath, filename="modelforge_report.html", media_type="text/html")
    elif asset_type == "requirements":
        filepath = os.path.join(job_dir, "requirements.txt")
        return FileResponse(filepath, filename="requirements.txt", media_type="text/plain")
    else:
        raise HTTPException(status_code=400, detail="Invalid asset type")

class PredictRequest(BaseModel):
    data: List[Dict[str, Any]]

@app.post("/api/predict/{job_id}")
def predict_new_data(job_id: str, req: PredictRequest):
    job_dir = os.path.join(ARTIFACTS_DIR, job_id)
    model_path = os.path.join(job_dir, "best_model_pipeline.joblib")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Trained model not found for this job")

    saved_obj = joblib.load(model_path)
    pipeline = saved_obj["pipeline"]
    label_encoder = saved_obj.get("label_encoder")
    task_type = saved_obj.get("task_type")

    df_new = pd.DataFrame(req.data)

    try:
        preds = pipeline.predict(df_new)
        
        probabilities = None
        model_step = pipeline.named_steps.get('model') or pipeline.named_steps.get('classifier')
        if model_step and hasattr(model_step, "predict_proba"):
            try:
                raw_prob = model_step.predict_proba(pipeline.named_steps['preprocessor'].transform(df_new))
                probabilities = raw_prob.tolist()
            except Exception:
                probabilities = None

        if label_encoder is not None:
            decoded_preds = label_encoder.inverse_transform(preds).tolist()
        else:
            decoded_preds = [round(float(p), 4) if isinstance(p, (float, np.floating)) else int(p) for p in preds]

        return {
            "predictions": decoded_preds,
            "probabilities": probabilities,
            "classes": saved_obj.get("classes", [])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed: {str(e)}")

# Mount frontend production build if available
from fastapi.staticfiles import StaticFiles
dist_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
