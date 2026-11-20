import urllib.request
import json
import time
import subprocess
import sys
import os

print("Starting ModelForge Server for E2E Integration Test...")
proc = subprocess.Popen([sys.executable, 'run_app.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)

# Wait for server to bind port
for attempt in range(10):
    time.sleep(1)
    try:
        req = urllib.request.Request('http://127.0.0.1:8000/api/health')
        with opener.open(req, timeout=2) as resp:
            print(f"Server up on attempt {attempt+1}")
            break
    except Exception:
        pass

try:
    # 1. Health check
    req = urllib.request.Request('http://127.0.0.1:8000/api/health')
    with opener.open(req) as resp:
        print("[1/6] Health check:", json.loads(resp.read().decode()))

    # 2. Load Sample Dataset (Titanic)
    req = urllib.request.Request('http://127.0.0.1:8000/api/sample/titanic', data=b"{}")
    with opener.open(req) as resp:
        sample_data = json.loads(resp.read().decode())
        dataset_id = sample_data["dataset_id"]
        print(f"[2/6] Sample loaded: {sample_data['name']} (id={dataset_id[:8]}), rows={sample_data['shape']['rows']}, cols={sample_data['shape']['cols']}")

    # 3. Launch Pipeline
    run_payload = {
        "dataset_id": dataset_id,
        "target_column": "Survived",
        "task_type": "classification",
        "algorithms": ["random_forest", "logistic_regression"],
        "train_test_split": 0.8,
        "cv_folds": 3,
        "random_seed": 42,
        "hyperparameter_tuning": "none",
        "preprocessing_config": {
            "drop_duplicates": True,
            "drop_id_cols": True,
            "missing_num_strategy": "median",
            "outlier_strategy": "none",
            "feature_scaling": "standard"
        }
    }
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/run',
        data=json.dumps(run_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with opener.open(req) as resp:
        run_res = json.loads(resp.read().decode())
        job_id = run_res["job_id"]
        print(f"[3/6] AutoML Run initiated: job_id={job_id}")

    # 4. Poll status until complete
    status = "queued"
    for _ in range(30):
        time.sleep(1)
        req = urllib.request.Request(f'http://127.0.0.1:8000/api/status/{job_id}')
        with opener.open(req) as resp:
            poll_data = json.loads(resp.read().decode())
            status = poll_data["status"]
            progress = poll_data.get("progress", 0)
            step = poll_data.get("current_step", "")
            print(f"      Polling: progress={progress}%, step='{step}', status={status}")
            if status in ["completed", "failed"]:
                break

    assert status == "completed", f"Job failed: {poll_data.get('error')}"
    res = poll_data["result"]
    print(f"[4/6] AutoML Completed! Champion Model: {res['best_model_name']}, F1: {res['best_metrics']['f1']:.3f}, Acc: {res['best_metrics']['accuracy']*100:.1f}%")

    # 5. Test Live Inference
    test_record = {
        "Pclass": 1,
        "Sex": "female",
        "Age": 28.0,
        "SibSp": 0,
        "Parch": 0,
        "Fare": 85.0,
        "Embarked": "C"
    }
    req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/predict/{job_id}',
        data=json.dumps({"data": [test_record]}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with opener.open(req) as resp:
        pred_res = json.loads(resp.read().decode())
        print(f"[5/6] Live Prediction: predicted={pred_res['predictions']}, probs={pred_res['probabilities']}")

    # 6. Verify Asset Downloads
    for asset in ["cleaned_data", "model", "python_script", "jupyter_notebook", "report", "requirements"]:
        req = urllib.request.Request(f'http://127.0.0.1:8000/api/download/{job_id}/{asset}')
        with opener.open(req) as resp:
            content = resp.read()
            print(f"[6/6] Asset verified: {asset} ({len(content)} bytes)")

    print("\n=======================================================")
    print(">>> COMPLETE E2E INTEGRATION SUITE PASSED 100%! <<<")
    print("=======================================================")

finally:
    proc.terminate()
    print("ModelForge test server stopped.")
