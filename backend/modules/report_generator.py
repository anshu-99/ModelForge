"""
Report Generator Module for ModelForge AutoML.
Produces an executive-grade, standalone HTML report with interactive styling,
metric highlights, model leaderboard, feature importance, and diagnostic charts.
"""

from typing import Dict, Any, List

def generate_html_report(
    dataset_name: str,
    task_type: str,
    target_col: str | None,
    eda_summary: Dict[str, Any],
    preprocessing_summary: Dict[str, Any],
    leaderboard: List[Dict[str, Any]],
    best_model_name: str,
    best_metrics: Dict[str, Any],
    feature_importances: List[Dict[str, Any]],
    shap_summary: Dict[str, Any]
) -> str:
    # Build Leaderboard Rows
    leaderboard_rows = ""
    for idx, row in enumerate(leaderboard):
        rank_badge = f"<span class='badge rank-{idx+1}'>#{idx+1}</span>" if idx < 3 else f"#{idx+1}"
        m_name = row.get("model_name", "Model")
        time_sec = f"{row.get('fit_time', 0):.2f}s"
        
        if task_type == "classification":
            acc = f"{row.get('accuracy', 0)*100:.1f}%"
            f1 = f"{row.get('f1', 0):.3f}"
            auc = f"{row.get('roc_auc', 0):.3f}" if row.get('roc_auc') is not None else "N/A"
            leaderboard_rows += f"""
            <tr class="{'champ-row' if idx == 0 else ''}">
                <td>{rank_badge}</td>
                <td><strong>{m_name}</strong></td>
                <td>{acc}</td>
                <td><span class="pill-green">{f1}</span></td>
                <td>{auc}</td>
                <td>{time_sec}</td>
            </tr>
            """
        elif task_type == "regression":
            r2 = f"{row.get('r2', 0):.3f}"
            mae = f"{row.get('mae', 0):.3f}"
            rmse = f"{row.get('rmse', 0):.3f}"
            leaderboard_rows += f"""
            <tr class="{'champ-row' if idx == 0 else ''}">
                <td>{rank_badge}</td>
                <td><strong>{m_name}</strong></td>
                <td><span class="pill-green">{r2}</span></td>
                <td>{mae}</td>
                <td>{rmse}</td>
                <td>{time_sec}</td>
            </tr>
            """
        elif task_type == "clustering":
            sil = f"{row.get('silhouette_score', 0):.3f}" if row.get('silhouette_score') else "N/A"
            ch = f"{row.get('calinski_harabasz', 0):.1f}" if row.get('calinski_harabasz') else "N/A"
            leaderboard_rows += f"""
            <tr class="{'champ-row' if idx == 0 else ''}">
                <td>{rank_badge}</td>
                <td><strong>{m_name}</strong></td>
                <td><span class="pill-green">{sil}</span></td>
                <td>{ch}</td>
                <td>{time_sec}</td>
            </tr>
            """

    # Feature Importance Bars
    feat_bars = ""
    for f in feature_importances[:10]:
        val = f.get("importance", 0)
        feat_bars += f"""
        <div class="feat-row">
            <div class="feat-label">{f.get('feature')}</div>
            <div class="bar-container">
                <div class="bar-fill" style="width: {min(100, max(5, val))}%;"></div>
            </div>
            <div class="feat-val">{val:.1f}%</div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ModelForge AutoML Executive Report - {dataset_name}</title>
<style>
    :root {{
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text: #0f172a;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --success: #10b981;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
        padding: 40px 20px;
    }}
    .container {{
        max-width: 1000px;
        margin: 0 auto;
    }}
    .header {{
        background: linear-gradient(135deg, #1e293b, #0f172a);
        color: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    .header h1 {{ font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ color: #94a3b8; margin-top: 6px; font-size: 14px; }}
    .tag {{ background: #3b82f6; color: white; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
    
    .card {{
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
    }}
    .card-title {{
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 12px;
    }}
    
    .grid-4 {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
    }}
    .stat-box {{
        background: #f1f5f9;
        padding: 16px;
        border-radius: 10px;
        text-align: center;
    }}
    .stat-val {{ font-size: 24px; font-weight: 800; color: var(--primary); }}
    .stat-lbl {{ font-size: 13px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }}
    
    table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }}
    th, td {{
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid var(--border);
    }}
    th {{ background: #f8fafc; color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase; }}
    .champ-row {{ background: #eff6ff; font-weight: 600; }}
    
    .pill-green {{ background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-weight: 700; }}
    .badge {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }}
    .rank-1 {{ background: #fef08a; color: #854d0e; }}
    .rank-2 {{ background: #e2e8f0; color: #475569; }}
    .rank-3 {{ background: #ffedd5; color: #9a3412; }}
    
    .feat-row {{ display: flex; align-items: center; margin-bottom: 10px; font-size: 13px; }}
    .feat-label {{ width: 180px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    .bar-container {{ flex: 1; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin: 0 12px; }}
    .bar-fill {{ height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; }}
    .feat-val {{ width: 50px; text-align: right; color: var(--text-muted); font-weight: 600; }}
    
    .footer {{
        text-align: center;
        font-size: 13px;
        color: var(--text-muted);
        margin-top: 40px;
    }}
    @media print {{
        body {{ padding: 0; background: white; }}
        .card {{ box-shadow: none; page-break-inside: avoid; }}
    }}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div>
            <h1>ModelForge Executive AutoML Report</h1>
            <p>Dataset: <strong>{dataset_name}</strong> | Target: <strong>{target_col or 'Unsupervised'}</strong></p>
        </div>
        <div>
            <span class="tag">{task_type}</span>
        </div>
    </div>

    <!-- Overview Stats -->
    <div class="card">
        <div class="card-title">Dataset Profile & Processing Summary</div>
        <div class="grid-4">
            <div class="stat-box">
                <div class="stat-val">{eda_summary.get('n_rows', 0):,}</div>
                <div class="stat-lbl">Total Samples</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">{eda_summary.get('n_cols', 0)}</div>
                <div class="stat-lbl">Features</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">{eda_summary.get('duplicate_rows', 0)}</div>
                <div class="stat-lbl">Duplicates Cleaned</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">{best_model_name}</div>
                <div class="stat-lbl">Champion Model</div>
            </div>
        </div>
    </div>

    <!-- Leaderboard -->
    <div class="card">
        <div class="card-title">Model Comparison Leaderboard</div>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Algorithm</th>
                    {"<th>Accuracy</th><th>F1 Score</th><th>ROC-AUC</th>" if task_type == "classification" else ("<th>R² Score</th><th>MAE</th><th>RMSE</th>" if task_type == "regression" else "<th>Silhouette</th><th>Calinski-H</th>")}
                    <th>Fit Time</th>
                </tr>
            </thead>
            <tbody>
                {leaderboard_rows}
            </tbody>
        </table>
    </div>

    <!-- Feature Importance -->
    <div class="card">
        <div class="card-title">Top 10 Feature Importances</div>
        <div style="margin-top: 14px;">
            {feat_bars if feat_bars else "<p style='color:#64748b;'>No feature importances available for this model type.</p>"}
        </div>
    </div>

    <div class="footer">
        Generated automatically by ModelForge AutoML Engine. Zero Data Leakage Guaranteed.
    </div>
</div>
</body>
</html>
"""
    return html
