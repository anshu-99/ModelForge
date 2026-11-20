# ⚡ ModelForge - Autonomous AutoML & Data Modeling Engine

**ModelForge** is a production-grade, end-to-end Automated Machine Learning (AutoML) web portal. It autonomously manages the entire data science lifecycle: data ingestion, exploratory data profiling, automated leak-free preprocessing, feature engineering, model training and cross-validation, hyperparameter tuning, model competition / leaderboarding, SHAP explainability, interactive live inference, and downloadable reproducible artifacts.

---

## 🌟 Key Features

### 1. 📂 Intelligent Ingestion & Profiling
- **Multi-Format Support:** Drag-and-drop CSV, Excel (`.xlsx`, `.xls`), and JSON up to 100 MB.
- **Built-in Curated Benchmark Datasets:** Instant 1-click loading for **Titanic** (binary classification with missing values), **Iris** (multiclass), **California Housing** (regression), **Wine Quality**, **Breast Cancer**, and **Mall Customers** (unsupervised clustering).
- **Interactive Data Preview:** Browse the first 100 rows with instantaneous column search, data type badges, and missing indicators.
- **Automated Schema Audit:** Detects duplicate rows, constant/near-constant columns, ID/key columns, high cardinality features, and class imbalance ratios.

### 2. ⚙️ Leak-Free Automated Preprocessing
- **Data Leakage Guarantee:** Built strictly with Scikit-Learn `Pipeline` and `ColumnTransformer` constructs. Imputers and scalers are fitted exclusively on training folds during cross-validation.
- **Missing Value Imputation:**
  - *Numerical:* Median, Mean, KNN Imputation (5 neighbors), or Constant Zero.
  - *Categorical:* Most Frequent (Mode) or Constant string (`Missing`).
- **Outlier Capping:** Dynamic clipping using **IQR** (1.5x interquartile range) or **Z-Score** (3.0x standard deviations).
- **Categorical Encoding:** One-Hot Encoding for low cardinality (<10 categories) and Ordinal / Target encoding for high cardinality.
- **Feature Scaling:** StandardScaler, MinMaxScaler, and RobustScaler (median-centered).
- **Temporal Feature Extraction:** Extracts Year, Month, Day, Day of Week, and Weekend indicators from datetime columns.
- **Class Imbalance Handling:** Supports algorithmic class weights and SMOTE synthetic oversampling.

### 3. 🤖 Comprehensive Model Zoo & Tuning
- **Classification:**
  - Random Forest Classifier
  - XGBoost Classifier
  - LightGBM Classifier
  - Gradient Boosting Classifier
  - Logistic Regression (L1/L2)
  - Support Vector Machine (SVC with calibrated probabilities)
  - Decision Tree Classifier
  - K-Nearest Neighbors (KNN)
  - Gaussian Naive Bayes
- **Regression:**
  - Random Forest Regressor
  - XGBoost Regressor
  - LightGBM Regressor
  - Gradient Boosting Regressor
  - Ridge & Lasso Regression
  - Ordinary Least Squares (OLS)
  - Support Vector Regressor (SVR)
  - K-Nearest Neighbors Regressor
- **Clustering (Unsupervised):**
  - K-Means (with auto inertia & elbow search)
  - DBSCAN (density-based spatial clustering)
  - Hierarchical Agglomerative Clustering
- **Hyperparameter Optimization:** Built-in `RandomizedSearchCV` and `GridSearchCV` parameter sweeps.

### 4. 📊 Results, Diagnostics & Explainability
- **Champion Model Ribbon:** Prominently displays the #1 ranked model with its primary metric badge (F1 / R² / Silhouette) and execution time.
- **Interactive Leaderboard:** Multi-metric sorting across Accuracy, F1, ROC-AUC, Precision, Recall, R², MAE, RMSE, and Fit Time.
- **Diagnostic Visualizations (Plotly):**
  - Interactive Pearson correlation heatmap
  - Confusion Matrix heatmaps
  - ROC Curve with AUC & Random Guess baseline
  - Predicted vs. Actual scatter plots & Residual distributions
  - 2D PCA cluster projections
- **Feature Importance & SHAP:** Global feature contributions and directional Shapley value rankings.
- **Live Interactive Inference:** Form automatically synthesized from feature schema with realistic median defaults. Test individual records and view predicted classes and probability distributions in real time.

### 5. 📦 Downloadable Deliverables
- **Preprocessed Dataset (`cleaned_dataset.csv`):** Fully imputed, encoded, and scaled data.
- **Trained Model (`modelforge_model.joblib`):** Serialized end-to-end Scikit-Learn pipeline ready for production deployment.
- **Runnable Python Code (`pipeline.py`):** Standalone, clean Python script replicating every single step independently.
- **Jupyter Notebook (`pipeline.ipynb`):** Executable notebook with code cells and markdown narratives.
- **Executive HTML Report (`report.html`):** Standalone, responsive report ready for stakeholders or printing to PDF.
- **Dependency Manifest (`requirements.txt`):** Exact library versions for reproduction.

---

## 🏗️ Folder Structure

```
formatflow-doc-formatter/
├── backend/
│   ├── main.py                     # FastAPI server, REST API endpoints, static mount
│   ├── sample_datasets.py          # Benchmark dataset generators (Titanic, Iris, etc.)
│   └── modules/
│       ├── eda.py                  # Statistical profiling, correlation, imbalance checks
│       ├── preprocessing.py        # Leak-free ColumnTransformer pipelines & outlier cappers
│       ├── models.py               # Model zoo instantiations & hyperparameter search grids
│       ├── evaluation.py           # Evaluation metrics, ROC/PR, confusion matrix & SHAP
│       ├── code_generator.py       # Python script (.py) and Jupyter notebook (.ipynb) synthesis
│       └── report_generator.py     # Standalone executive HTML report generator
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navigation, theme toggle (Dark/Light), active dataset badge
│   │   ├── Stepper.jsx             # 4-stage wizard stepper
│   │   ├── StepUpload.jsx          # Drag-and-drop file upload, sample dataset pills, preview table
│   │   ├── StepConfigure.jsx       # Target selection, task override, algorithm picker, tuning
│   │   ├── StepTraining.jsx        # Live progress bar, stage badges, streaming terminal console
│   │   ├── StepResults.jsx         # 8-tab results dashboard (Overview, Leaderboard, SHAP, Inference)
│   │   └── PlotlyChart.jsx         # Theme-aware interactive Plotly charting wrapper
│   ├── utils/
│   │   └── api.js                  # Centralized API endpoints
│   ├── App.jsx                     # Core state management and step orchestration
│   ├── index.css                   # Modern CSS design system (Dark & Light mode)
│   └── main.jsx                    # React 19 entry point
├── samples/                        # Pre-generated sample CSV files for testing
│   ├── titanic.csv                 # 400 rows, 9 cols (Binary classification)
│   ├── iris.csv                    # 150 rows, 5 cols (Multiclass classification)
│   ├── housing.csv                 # 500 rows, 7 cols (Continuous regression)
│   ├── wine.csv                    # 178 rows, 14 cols (Multiclass)
│   ├── customers.csv               # 300 rows, 4 cols (Clustering)
│   └── breast_cancer.csv           # 569 rows, 31 cols (Binary classification)
├── dist/                           # Production-ready frontend build
├── run_app.py                      # Unified single-command launcher (Backend + Frontend)
├── test_backend.py                 # Backend unit & integration test
├── test_e2e_api.py                 # Full E2E automated test suite
├── package.json                    # Frontend dependencies
├── vite.config.js                  # Vite bundler configuration
└── README.md                       # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** (for frontend development, optional for production run)

### Required Python Libraries
All required packages can be installed via:
```bash
pip install fastapi uvicorn scikit-learn pandas numpy scipy xgboost lightgbm imbalanced-learn shap plotly python-multipart openpyxl joblib jinja2
```

---

## 🏃 Running the Application

### Option A: Unified One-Command Launch (Recommended)
You can run the entire platform (both the FastAPI backend and the compiled React frontend) using one single command:

```bash
python run_app.py
```

Open your browser and navigate to:
👉 **`http://localhost:8000`**

- **Interactive Web App:** `http://localhost:8000`
- **Interactive Swagger API Docs:** `http://localhost:8000/docs`

---

### Option B: Development Mode (Hot Reload)
If you wish to develop the React frontend and FastAPI backend simultaneously with hot module reloading:

1. **Start the FastAPI Backend:**
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **In a second terminal, start the Vite Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

ModelForge includes automated test suites to ensure 100% pipeline stability:

1. **Backend Unit & Pipeline Test:**
   ```bash
   python test_backend.py
   ```
   *Verifies dataset loading, EDA, preprocessing transformations, model fitting, SHAP explanations, and code generation.*

2. **Full End-to-End API Integration Suite:**
   ```bash
   python test_e2e_api.py
   ```
   *Spawns the server, tests dataset ingestion, executes an asynchronous AutoML job, polls execution logs, performs live predictions with class probabilities, and verifies all 6 downloadable asset endpoints.*

---

## 📝 License
Built with ❤️ for rapid, autonomous machine learning development.
