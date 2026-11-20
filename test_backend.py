import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from sample_datasets import get_sample_dataset
from modules.eda import perform_eda
from modules.preprocessing import prepare_data
from modules.models import instantiate_model, get_available_algorithms
from modules.evaluation import evaluate_classification, calculate_feature_importance, compute_shap_explanations
from modules.code_generator import generate_python_script, generate_jupyter_notebook
from modules.report_generator import generate_html_report

print("Testing backend modules...")

# Test 1: Titanic
df, target, task = get_sample_dataset("titanic")
print(f"Sample loaded: shape={df.shape}, target={target}, task={task}")

eda = perform_eda(df, target)
print(f"EDA completed: numeric_cols={len(eda['numeric_cols'])}, cat_cols={len(eda['categorical_cols'])}")

prep = prepare_data(df, target)
print(f"Preprocessing completed: cleaned_shape={prep['df_cleaned'].shape}")

# Test 2: Pipeline Fit & Predict
from sklearn.pipeline import Pipeline
model = instantiate_model("random_forest", "classification")
pipe = Pipeline([('preprocessor', prep['preprocessor']), ('model', model)])
pipe.fit(prep['X_raw'], prep['y'].astype(str))
print("Pipeline fitted successfully!")

# Test 3: Feature importance
X_trans = prep['preprocessor'].transform(prep['X_raw'])
importances = calculate_feature_importance(model, X_trans, prep['y'].astype(str).values, prep['feature_names_out'])
print(f"Feature importance calculated: {len(importances)} features, top={importances[0]['feature']}")

# Test 4: SHAP values
shap_res = compute_shap_explanations(model, X_trans, prep['feature_names_out'], "classification")
print(f"SHAP computed: {len(shap_res.get('feature_ranking', []))} ranked features")

# Test 5: Code generation
py_code = generate_python_script(task, target, "random_forest", {}, prep['numeric_features'], prep['low_card_cat'] + prep['high_card_cat'])
nb_json = generate_jupyter_notebook(py_code)
print(f"Generated python script ({len(py_code)} chars) and notebook ({len(nb_json)} chars)")

# Test 6: Report generation
html = generate_html_report("titanic", task, target, eda, prep, [{"model_id": "rf", "model_name": "Random Forest", "accuracy": 0.82, "f1": 0.81, "roc_auc": 0.85, "fit_time": 0.12}], "Random Forest", {}, importances, shap_res)
print(f"Generated HTML report ({len(html)} chars)")

print("\n==========================================")
print("ALL BACKEND MODULE TESTS PASSED WITH 100% SUCCESS!")
print("==========================================")
