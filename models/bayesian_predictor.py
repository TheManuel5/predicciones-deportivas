"""
Bayesian Match Predictor for sports match outcome probabilities
"""
import numpy as np
from sklearn.linear_model import BayesianRidge
from scipy.stats import norm
from typing import List, Dict, Optional


class BayesianMatchPredictor:
    """
    Modelo de Regresión Bayesiana para predecir la diferencia de goles.
    Convierte la distribución de la predicción (media y varianza) en
    probabilidades para Local, Empate y Visitante.
    """
    def __init__(self, draw_threshold: float = 0.5):
        self.model = BayesianRidge()
        self.draw_threshold = draw_threshold # Margen de diferencia de goles considerado empate
        
    def fit(self, X: np.ndarray, y_goal_diff: np.ndarray):
        """
        Entrena el modelo usando la diferencia de goles como objetivo.
        """
        self.model.fit(X, y_goal_diff)
        return self
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Devuelve la predicción de la media de la diferencia de goles.
        """
        mean, _ = self.model.predict(X, return_std=True)
        return mean
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Devuelve las probabilidades [Local, Empate, Visitante] usando
        la incertidumbre del modelo predictivo.
        """
        # Predice la media y desviación estándar de la diferencia de goles
        mean, std = self.model.predict(X, return_std=True)
        
        # Para evitar std=0 o divisiones por 0
        std = np.maximum(std, 1e-3)
        
        probs = np.zeros((len(mean), 3))
        
        for i in range(len(mean)):
            mu = mean[i]
            sigma = std[i]
            
            # Probabilidad de Empate: Goal diff está entre [-threshold, threshold]
            p_draw = norm.cdf(self.draw_threshold, loc=mu, scale=sigma) - norm.cdf(-self.draw_threshold, loc=mu, scale=sigma)
            
            # Probabilidad de Local: Goal diff > threshold
            p_home = 1.0 - norm.cdf(self.draw_threshold, loc=mu, scale=sigma)
            
            # Probabilidad de Visitante: Goal diff < -threshold
            p_away = norm.cdf(-self.draw_threshold, loc=mu, scale=sigma)
            
            # Normalizar para asegurar suma=1
            total = p_home + p_draw + p_away
            probs[i] = [p_home/total, p_draw/total, p_away/total]
            
        return probs
