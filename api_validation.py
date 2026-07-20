import os
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
import streamlit as st
from scipy.stats import ttest_rel, wilcoxon, chi2, binom, chisquare
from models import ModelEnsemble
from feature_engineering import extract_match_features

# Intentar cargar key de .env o secrets
load_dotenv()
try:
    API_KEY = st.secrets.get("API_FOOTBALL_KEY", os.environ.get("API_FOOTBALL_KEY", ""))
except:
    API_KEY = os.environ.get("API_FOOTBALL_KEY", "")

BASE_URL = "https://v3.football.api-sports.io"
HEADERS = {
    "x-apisports-key": API_KEY
}

def get_recent_fixtures(league_id=39, season=2023, limit=100):
    """Obtiene partidos recientes completados de una liga (por defecto Premier League)"""
    url = f"{BASE_URL}/fixtures?league={league_id}&season={season}&status=FT"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        fixtures = data.get("response", [])
        return fixtures[-limit:] # Tomar los últimos 'limit' partidos
    else:
        print(f"Error fetching from API: {response.status_code}")
        return []

def format_for_prediction(fixtures):
    """Formatea los datos de la API para que los modelos los entiendan"""
    df_list = []
    real_results = [] # 0: Local, 1: Empate, 2: Visitante
    real_gd = []
    
    for match in fixtures:
        home_team = match["teams"]["home"]["name"]
        away_team = match["teams"]["away"]["name"]
        home_goals = match["goals"]["home"]
        away_goals = match["goals"]["away"]
        
        # Determinar resultado real
        if home_goals > away_goals:
            res = 0
        elif home_goals == away_goals:
            res = 1
        else:
            res = 2
            
        real_results.append(res)
        real_gd.append(home_goals - away_goals)
        
        match_data = {"home_team": home_team, "away_team": away_team}
        features = extract_match_features(match_data)
        if features.ndim > 1:
            features = features.flatten()
        df_list.append(pd.Series(features))
        
    if df_list:
        X = pd.concat(df_list, axis=1).T.values
    else:
        X = np.array([])
        
    return X, np.array(real_results), np.array(real_gd), [f"{m['teams']['home']['name']} vs {m['teams']['away']['name']}" for m in fixtures]

def run_api_validation():
    print("Obteniendo datos de la API de Football...")
    fixtures = get_recent_fixtures(limit=150)
    
    if not fixtures:
        print("No se pudieron obtener partidos. Verifica tu API Key.")
        return
        
    X, y_true_class, y_true_gd, match_names = format_for_prediction(fixtures)
    print(f"Se procesaron {len(X)} partidos reales para validación.")
    
    # Cargar modelos
    ensemble = ModelEnsemble.load(save_dir="saved_models", input_dim=X.shape[1])
    
    # Obtener predicciones
    all_preds = ensemble.predict_all_models(X)
    
    model_names = ["XGBoost", "Bayesian Ridge", "LSTM con Atención", "Ensemble Final"]
    preds_class = {}
    
    for name in model_names:
        preds_class[name] = np.argmax(all_preds[name], axis=1)
    
    # ==========================
    # PRUEBAS ESTADÍSTICAS
    # ==========================
    print("\n" + "="*50)
    print(" RESULTADOS DE CLASIFICACIÓN (Accuracy)")
    print("="*50)
    accuracies = {}
    for name in model_names:
        acc = np.mean(preds_class[name] == y_true_class)
        accuracies[name] = acc
        print(f"{name}: {acc*100:.2f}%")
        
    print("\n" + "="*50)
    print(" PRUEBA DE MCNEMAR (Comparación de Modelos)")
    print("="*50)
    
    # Comparar pares
    best_model_name = max(accuracies, key=accuracies.get)
    
    for name in model_names:
        if name == best_model_name:
            continue
            
        # Tabla de contingencia entre Best y el otro
        # A: Best acertó, B: Best falló
        # C: Otro acertó, D: Otro falló
        # [[Ambos aciertan, Best acierta/Otro falla], [Best falla/Otro acierta, Ambos fallan]]
        best_correct = (preds_class[best_model_name] == y_true_class)
        other_correct = (preds_class[name] == y_true_class)
        
        a = sum(best_correct & other_correct)
        b = sum(best_correct & ~other_correct)
        c = sum(~best_correct & other_correct)
        d = sum(~best_correct & ~other_correct)
        
        table = [[a, b], [c, d]]
        
        # McNemar test with continuity correction
        if b + c == 0:
            p_value = 1.0
        else:
            statistic = (abs(b - c) - 1)**2 / (b + c)
            p_value = 1 - chi2.cdf(statistic, 1)
        
        print(f"Comparando {best_model_name} vs {name}:")
        print(f"  P-Value: {p_value:.4f}")
        if p_value < 0.05:
            print(f"  -> {best_model_name} es ESTADÍSTICAMENTE superior a {name}.")
    print("\n" + "="*50)
    print(f"🏆 EL MEJOR MODELO GLOBAL ES: {best_model_name} 🏆")
    print(f"Con un Accuracy de {accuracies[best_model_name]*100:.2f}% frente a datos reales de la API.")
    print("="*50)

    # Guardar reporte JSON con estructura detallada por modelo
    import json
    
    model_descriptions = {
        "XGBoost": "Modelo de árboles de decisión con boosting",
        "Bayesian Ridge": "Modelo probabilístico de regresión",
        "LSTM con Atención": "Red neuronal recurrente para patrones temporales",
        "Ensemble Final": "Meta-modelo (Logistic Regression) que combina todos los anteriores"
    }

    report = {
        "timestamp": datetime.now().isoformat(),
        "total_matches_tested": len(y_true_class),
        "best_model": best_model_name,
        "models": []
    }
    
    for name in model_names:
        model_data = {
            "name": name,
            "description": model_descriptions.get(name, ""),
            "accuracy": float(accuracies[name]),
            "mcnemar_tests": [],
            "additional_tests": {}
        }
        
        n_trials = len(y_true_class)
        n_success = sum(preds_class[name] == y_true_class)
        # P-value for binomial test (H0: p=1/3, H1: p > 1/3)
        binom_p_value = binom.sf(n_success - 1, n_trials, 1/3)
        
        # Chi-square goodness of fit
        actual_freq = np.array([sum(y_true_class == i) for i in range(3)], dtype=float)
        pred_freq = np.array([sum(preds_class[name] == i) for i in range(3)], dtype=float)
        
        # Normalize actual_freq to have the same sum as pred_freq and avoid zeros
        actual_freq += 1e-5
        actual_freq = actual_freq * (pred_freq.sum() / actual_freq.sum())
        
        try:
            chi2_stat, chi2_p = chisquare(f_obs=pred_freq, f_exp=actual_freq)
        except Exception as e:
            print(f"Chi-square error for {name}: {e}")
            chi2_p = 1.0
        
        model_data["additional_tests"] = {
            "binomial_test": {
                "p_value": float(binom_p_value),
                "significant": bool(binom_p_value < 0.05),
                "description": "¿Predice mejor que el azar (33%)?"
            },
            "chi_square_test": {
                "p_value": float(chi2_p),
                "significant": bool(chi2_p < 0.05),
                "description": "¿Distribución de clases difiere de la real?"
            }
        }
        
        for other_name in model_names:
            if name != other_name:
                model_a_correct = (preds_class[name] == y_true_class)
                model_b_correct = (preds_class[other_name] == y_true_class)
                b = sum(model_a_correct & ~model_b_correct)
                c = sum(~model_a_correct & model_b_correct)
                if b + c == 0:
                    p_value = 1.0
                else:
                    statistic = (abs(b - c) - 1)**2 / (b + c)
                    p_value = 1 - chi2.cdf(statistic, 1)
                
                model_data["mcnemar_tests"].append({
                    "compared_to": other_name,
                    "p_value": float(p_value),
                    "significant": bool(p_value < 0.05)
                })
                
        report["models"].append(model_data)
            
    with open("validation_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4, ensure_ascii=False)
    print("\n✅ Reporte detallado guardado en validation_report.json")
    
if __name__ == "__main__":
    run_api_validation()
