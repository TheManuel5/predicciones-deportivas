
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score,
    mean_absolute_error, mean_squared_error
)
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from scipy import stats
from feature_engineering import create_sample_training_data
from models import ModelEnsemble
import warnings
import os
warnings.filterwarnings('ignore')


def run_robust_validation(save_dir: str = "saved_models"):
    """
    Run robust statistical validation of models saved in save_dir
    """
    # Load data
    X, y_class, y_goal_diff = create_sample_training_data(n_samples=500, fast_mode=False)
    X_train, X_test, y_train_class, y_test_class, y_train_gd, y_test_gd = train_test_split(
        X, y_class, y_goal_diff, test_size=0.2, random_state=42, stratify=y_class
    )
    
    # Load saved models
    input_dim = X.shape[1]
    ensemble = ModelEnsemble.load(save_dir=save_dir, input_dim=input_dim)
    
    # Get predictions for all models
    y_test_probas = ensemble.predict_all_models(X_test)
    y_train_probas = ensemble.predict_all_models(X_train)
    
    model_names = ["XGBoost", "Bayesian Ridge", "LSTM con Atención", "Ensemble Final"]
    
    # We will export a dictionary mapping model_name -> model_results
    results = {}
    
    # Convert series to numpy if necessary for array indexing
    y_test_class_arr = y_test_class.values if hasattr(y_test_class, 'values') else np.array(y_test_class)
    y_train_class_arr = y_train_class.values if hasattr(y_train_class, 'values') else np.array(y_train_class)
    
    for name in model_names:
        model_results = {
            "metrics": {"classification": {}},
            "figures": {},
            "stability_tests": {},
            "overfitting_tests": {}
        }
        
        y_pred_class = np.argmax(y_test_probas[name], axis=1)
        y_train_class_pred = np.argmax(y_train_probas[name], axis=1)
        
        # Regression proxy
        if name == "Ensemble Final":
            y_pred_gd = ensemble.predict_goal_diff(X_test)
        elif name == "Bayesian Ridge":
            y_pred_gd = ensemble.bayesian_model.predict(X_test)
        else:
            class_to_gd = {0: 1, 1: 0, 2: -1}
            y_pred_gd = np.array([class_to_gd.get(c, 0) for c in y_pred_class])
            
        # 1. Classification metrics
        model_results["metrics"]["classification"] = {
            "Accuracy": accuracy_score(y_test_class_arr, y_pred_class),
            "Precision": precision_score(y_test_class_arr, y_pred_class, average='weighted', zero_division=0),
            "Recall": recall_score(y_test_class_arr, y_pred_class, average='weighted', zero_division=0),
            "F1": f1_score(y_test_class_arr, y_pred_class, average='weighted', zero_division=0),
            "ROC-AUC": roc_auc_score(y_test_class_arr, y_test_probas[name], multi_class='ovr') if len(np.unique(y_test_class_arr)) > 1 else np.nan
        }
        
        # 1.5 Regression metrics
        model_results["metrics"]["regression"] = {
            "MAE": mean_absolute_error(y_test_gd, y_pred_gd),
            "MSE": mean_squared_error(y_test_gd, y_pred_gd),
            "RMSE": np.sqrt(mean_squared_error(y_test_gd, y_pred_gd))
        }
        
        # 2. Confusion matrix figure
        cm = confusion_matrix(y_test_class_arr, y_pred_class)
        # Save raw CM for React to draw grid
        model_results["confusion_matrix"] = cm.tolist()
        
        fig_cm = go.Figure(data=go.Heatmap(
            z=cm,
            x=['Local', 'Empate', 'Visitante'],
            y=['Local', 'Empate', 'Visitante'],
            colorscale='Blues',
            texttemplate="%{z}",
            textfont={"size": 16}
        ))
        fig_cm.update_layout(title=f"Matriz de Confusión ({name})", xaxis_title="Predicho", yaxis_title="Real")
        model_results["figures"]["confusion_matrix"] = fig_cm
        
        # 2.5 Residuals and Normality
        residuals = y_test_gd - y_pred_gd
        model_results["residual_analysis"] = {
            "mean_residual": np.mean(residuals),
            "std_residual": np.std(residuals),
            "min_residual": np.min(residuals),
            "max_residual": np.max(residuals)
        }
        
        fig_residuals = go.Figure()
        fig_residuals.add_trace(go.Scatter(x=y_pred_gd, y=residuals, mode='markers', name='Residuos'))
        fig_residuals.add_hline(y=0, line_dash='dash', line_color='red')
        fig_residuals.update_layout(title=f"Análisis de Residuos ({name})", xaxis_title="Predicción", yaxis_title="Residuo")
        model_results["figures"]["residuals"] = fig_residuals
        
        shapiro_stat, shapiro_p = stats.shapiro(residuals) if len(residuals) <= 5000 else (np.nan, np.nan)
        ks_stat, ks_p = stats.kstest(residuals, 'norm', args=(np.mean(residuals), np.std(residuals)))
        model_results["normality_tests"] = {
            "Shapiro-Wilk": {"statistic": shapiro_stat, "p_value": shapiro_p},
            "Kolmogorov-Smirnov": {"statistic": ks_stat, "p_value": ks_p}
        }
        
        # 3. Stability tests (Bootstrapping for performance reasons across all models)
        n_bootstraps = 100
        boot_scores = []
        for _ in range(n_bootstraps):
            indices = np.random.randint(0, len(y_test_class_arr), len(y_test_class_arr))
            boot_scores.append(accuracy_score(y_test_class_arr[indices], y_pred_class[indices]))
            
        model_results["stability_tests"] = {
            "cv_scores": boot_scores[:5], # Mocked to keep previous UI interface format
            "cv_mean": np.mean(boot_scores),
            "cv_std": np.std(boot_scores)
        }
        
        fig_cv = go.Figure(data=[go.Histogram(x=boot_scores, nbinsx=15)])
        fig_cv.add_vline(x=np.mean(boot_scores), line_dash='dash', line_color='red', annotation_text=f"Media: {np.mean(boot_scores):.4f}")
        fig_cv.update_layout(title=f"Estabilidad (Bootstrapping) - {name}", xaxis_title="Accuracy", yaxis_title="Frecuencia")
        model_results["figures"]["cross_validation"] = fig_cv
        
        # 4. Overfitting tests (train vs test performance)
        train_acc = accuracy_score(y_train_class_arr, y_train_class_pred)
        test_acc = model_results["metrics"]["classification"]["Accuracy"]
        model_results["overfitting_tests"] = {
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "accuracy_gap": train_acc - test_acc
        }
        
        fig_overfit = go.Figure(data=[
            go.Bar(name='Entrenamiento', x=['Accuracy'], y=[train_acc]),
            go.Bar(name='Prueba', x=['Accuracy'], y=[test_acc])
        ])
        fig_overfit.update_layout(title=f"Prueba de Sobreajuste ({name})", barmode='group', yaxis_range=[0, 1])
        model_results["figures"]["overfitting"] = fig_overfit
        
        # Guardar en el dict global
        results[name] = model_results
    
    # Save full results (including figures) with joblib
    import joblib
    joblib.dump(results, "model_validation_results_full.joblib")
    
    # Also save a simple CSV for basic metrics
    metrics_list = []
    for model_name, res in results.items():
        metrics_list.append({"model": model_name, "Accuracy": res["metrics"]["classification"]["Accuracy"]})
    pd.DataFrame(metrics_list).to_csv("model_validation_results.csv", index=False)
    
    return results

def main():
    print("="*60)
    print("VALIDACIÓN ROBUSTA MULTI-MODELO")
    print("="*60)
    results = run_robust_validation()
    print("\nValidación completada! Resultados guardados.")

if __name__ == "__main__":
    main()
