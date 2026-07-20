"""
Stacking Ensemble Predictor combining XGBoost, LSTM-Attention, and Bayesian Ridge
with Logistic Regression as meta-model
"""
import numpy as np
import xgboost as xgb
import joblib
from sklearn.linear_model import LogisticRegression
from typing import Dict, Optional, List
import os

# Import our custom models
from .lstm_attention import PyTorchLSTMWrapper
from .bayesian_predictor import BayesianMatchPredictor


class ModelEnsemble:
    """Stacking Ensemble de 3 modelos base + meta-modelo"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        
        # Initialize model parameters
        self.xgb_params = self.config.get('xgb_params', {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.05,
            'subsample': 0.8,
            'colsample_bytree': 0.7,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'objective': 'multi:softprob',
            'num_class': 3,
            'random_state': 42
        })
        
        self.lstm_params = self.config.get('lstm_params', {
            'hidden_dim': 64,
            'num_layers': 2,
            'epochs': 20,
            'lr': 0.001
        })
        
        self.meta_params = self.config.get('meta_params', {
            'C': 1.0,
            'max_iter': 1000,
            'multi_class': 'multinomial',
            'solver': 'lbfgs',
            'class_weight': 'balanced',
            'random_state': 42
        })
        
        # Initialize models
        self.xgb_model = None
        self.lstm_model = None
        self.bayesian_model = None
        self.meta_model = None
        
    def fit_base_models(
        self, 
        X_train: np.ndarray, 
        y_train_class: np.ndarray, 
        y_train_goal_diff: Optional[np.ndarray] = None
    ) -> 'ModelEnsemble':
        """Entrena los 3 modelos base"""
        
        # 1. XGBoost (for classification)
        self.xgb_model = xgb.XGBClassifier(**self.xgb_params)
        self.xgb_model.fit(X_train, y_train_class)
        
        # 2. Bayesian Ridge (for goal difference regression -> probabilities)
        self.bayesian_model = BayesianMatchPredictor()
        if y_train_goal_diff is None:
            # If goal diff not available, use dummy values
            y_train_goal_diff = y_train_class - 1  # 0,1,2 -> -1,0,1
        self.bayesian_model.fit(X_train, y_train_goal_diff)
        
        # 3. LSTM with Attention
        self.lstm_model = PyTorchLSTMWrapper(
            input_dim=X_train.shape[1],
            **self.lstm_params
        )
        self.lstm_model.fit(X_train, y_train_class)
        
        return self
        
    def fit_meta_model(
        self, 
        X_meta: np.ndarray, 
        y_meta: np.ndarray
    ) -> 'ModelEnsemble':
        """Entrena el meta-modelo usando predicciones de modelos base"""
        
        # Get base model predictions
        base_preds = self._get_base_predictions(X_meta)
        
        # Train meta model
        self.meta_model = LogisticRegression(**self.meta_params)
        self.meta_model.fit(base_preds, y_meta)
        
        return self
        
    def fit(
        self, 
        X: np.ndarray, 
        y_class: np.ndarray, 
        y_goal_diff: Optional[np.ndarray] = None
    ) -> 'ModelEnsemble':
        """Entrena todo el ensemble end-to-end"""
        
        # Fit base models
        self.fit_base_models(X, y_class, y_goal_diff)
        
        # Fit meta model on the same data (for simplicity)
        self.fit_meta_model(X, y_class)
        
        return self
        
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predice probabilidades finales usando el ensemble"""
        
        # Get base model predictions
        base_preds = self._get_base_predictions(X)
        
        # Get final predictions from meta model
        final_probs = self.meta_model.predict_proba(base_preds)
        
        return final_probs
    
    def predict_all_models(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """Devuelve predicciones de todos los modelos (base y final)"""
        
        # XGBoost predictions
        xgb_preds = self.xgb_model.predict_proba(X)
        
        # Bayesian predictions
        bayes_preds = self.bayesian_model.predict_proba(X)
        
        # LSTM predictions
        lstm_preds = self.lstm_model.predict_proba(X)
        
        # Final ensemble predictions
        final_probs = self.predict_proba(X)
        
        return {
            "XGBoost": xgb_preds,
            "Bayesian Ridge": bayes_preds,
            "LSTM con Atención": lstm_preds,
            "Ensemble Final": final_probs
        }
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predice la clase más probable"""
        
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)
    
    def predict_goal_diff(self, X: np.ndarray) -> np.ndarray:
        """Predice la diferencia de goles usando el modelo bayesiano"""
        # Use the bayesian model's regression prediction
        return self.bayesian_model.predict(X)
        
    def _get_base_predictions(self, X: np.ndarray) -> np.ndarray:
        """Obtiene las predicciones de los modelos base para concatenarlas"""
        
        # XGBoost predictions
        xgb_preds = self.xgb_model.predict_proba(X)  # shape: (n_samples, 3)
        
        # Bayesian predictions
        bayes_preds = self.bayesian_model.predict_proba(X)  # shape: (n_samples, 3)
        
        # LSTM predictions
        lstm_preds = self.lstm_model.predict_proba(X)  # shape: (n_samples, 3)
        
        # Concatenate all base predictions
        base_preds = np.hstack([xgb_preds, bayes_preds, lstm_preds])
        
        return base_preds
        
    def save(self, save_dir: str = "models/"):
        """Guarda todos los modelos"""
        
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
            
        # Save XGBoost
        joblib.dump(self.xgb_model, os.path.join(save_dir, "xgb_model.pkl"))
        
        # Save Bayesian
        joblib.dump(self.bayesian_model, os.path.join(save_dir, "bayesian_model.pkl"))
        
        # Save LSTM
        self.lstm_model.save_model(os.path.join(save_dir, "lstm_model.pth"))
        
        # Save Meta Model
        joblib.dump(self.meta_model, os.path.join(save_dir, "meta_model.pkl"))
        
        # Save config
        joblib.dump(self.config, os.path.join(save_dir, "ensemble_config.pkl"))
        
    @classmethod
    def load(cls, save_dir: str = "models/", input_dim: Optional[int] = None) -> 'ModelEnsemble':
        """Carga un ensemble guardado"""
        
        # Load config
        config = joblib.load(os.path.join(save_dir, "ensemble_config.pkl"))
        ensemble = cls(config)
        
        # Load XGBoost
        ensemble.xgb_model = joblib.load(os.path.join(save_dir, "xgb_model.pkl"))
        
        # Load Bayesian
        ensemble.bayesian_model = joblib.load(os.path.join(save_dir, "bayesian_model.pkl"))
        
        # Load LSTM
        # We need input_dim to reinitialize the model architecture
        if input_dim is None:
            # Try to infer from config or use dummy value
            input_dim = 20
            
        ensemble.lstm_model = PyTorchLSTMWrapper(input_dim=input_dim)
        ensemble.lstm_model.load_model(os.path.join(save_dir, "lstm_model.pth"), input_dim)
        
        # Load Meta Model
        ensemble.meta_model = joblib.load(os.path.join(save_dir, "meta_model.pkl"))
        
        return ensemble
