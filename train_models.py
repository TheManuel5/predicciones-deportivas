import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, classification_report
import warnings
warnings.filterwarnings('ignore')

from feature_engineering import create_sample_training_data
from models.ensemble_predictor import ModelEnsemble

def main():
    print("Iniciando pipeline de entrenamiento...")
    
    # Directorio para guardar modelos
    save_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        
    print("1. Cargando y procesando datos históricos (esto puede tardar unos minutos)...")
    # Utilizamos fast_mode=False para extraer features reales
    # Extraemos 5000 ejemplos para que no sea eterno, pero representativo
    X, y_class, y_goal_diff = create_sample_training_data(n_samples=5000, fast_mode=False)
    
    print(f"Dataset generado: {X.shape[0]} partidos.")
    
    print("2. Normalizando características...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Guardar scaler
    joblib.dump(scaler, os.path.join(save_dir, "feature_scaler.pkl"))
    print("Scaler guardado en saved_models/feature_scaler.pkl")
    
    # Split
    X_train, X_test, y_train_class, y_test_class, y_train_goal_diff, y_test_goal_diff = train_test_split(
        X_scaled, y_class, y_goal_diff, test_size=0.2, random_state=42, stratify=y_class
    )
    
    print(f"Entrenando con {X_train.shape[0]} ejemplos y evaluando con {X_test.shape[0]}...")
    
    print("3. Entrenando el ModelEnsemble (XGBoost, Bayesian Ridge, LSTM + Meta-Model)...")
    ensemble = ModelEnsemble()
    
    # Train end-to-end
    ensemble.fit(X_train, y_train_class, y_train_goal_diff)
    
    print("4. Evaluando el modelo...")
    preds = ensemble.predict(X_test)
    
    acc = accuracy_score(y_test_class, preds)
    f1 = f1_score(y_test_class, preds, average='weighted')
    
    print(f"Accuracy: {acc:.4f}")
    print(f"F1-Score: {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test_class, preds, target_names=['Local', 'Empate', 'Visitante']))
    
    print("5. Guardando modelos entrenados...")
    ensemble.save(save_dir=save_dir)
    print(f"Entrenamiento completo. Modelos guardados en {save_dir}")

if __name__ == "__main__":
    main()
