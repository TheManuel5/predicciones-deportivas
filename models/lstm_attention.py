"""
LSTM with Attention Mechanism for sports match predictions
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from typing import Optional, Tuple, Dict


class AttentionLayer(nn.Module):
    def __init__(self, hidden_dim: int):
        super(AttentionLayer, self).__init__()
        self.attention = nn.Linear(hidden_dim, 1)

    def forward(self, lstm_out: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # lstm_out shape: (batch_size, seq_len, hidden_dim)
        attn_weights = F.softmax(self.attention(lstm_out), dim=1)
        # attn_weights shape: (batch_size, seq_len, 1)
        context_vector = torch.sum(attn_weights * lstm_out, dim=1)
        # context_vector shape: (batch_size, hidden_dim)
        return context_vector, attn_weights


class LSTMAttentionModel(nn.Module):
    def __init__(
        self, 
        input_dim: int, 
        hidden_dim: int = 64, 
        num_layers: int = 2, 
        output_dim: int = 3
    ):
        super(LSTMAttentionModel, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.3 if num_layers > 1 else 0.0)
        self.layer_norm = nn.LayerNorm(hidden_dim)
        self.attention = AttentionLayer(hidden_dim)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim // 2, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        lstm_out = self.layer_norm(lstm_out)
        context_vector, _ = self.attention(lstm_out)
        logits = self.fc(context_vector)
        return logits


class PyTorchLSTMWrapper:
    def __init__(
        self, 
        input_dim: int, 
        hidden_dim: int = 64, 
        num_layers: int = 2, 
        epochs: int = 10, 
        lr: float = 0.001
    ):
        self.model = LSTMAttentionModel(input_dim, hidden_dim, num_layers, output_dim=3)
        self.epochs = epochs
        self.lr = lr
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
    def fit(self, X: np.ndarray, y: np.ndarray):
        if len(X.shape) == 2:
            X = np.expand_dims(X, axis=1)
            
        X_tensor = torch.FloatTensor(X).to(self.device)
        y_tensor = torch.LongTensor(y).to(self.device)
        
        dataset = TensorDataset(X_tensor, y_tensor)
        loader = DataLoader(dataset, batch_size=32, shuffle=True)
        
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=self.lr)
        
        self.model.train()
        for epoch in range(self.epochs):
            for batch_x, batch_y in loader:
                optimizer.zero_grad()
                outputs = self.model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
        return self
        
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if len(X.shape) == 2:
            X = np.expand_dims(X, axis=1)
            
        self.model.eval()
        with torch.no_grad():
            outputs = self.model(torch.FloatTensor(X).to(self.device))
            probs = F.softmax(outputs, dim=1).cpu().numpy()
        return probs

    def save_model(self, filepath: str):
        torch.save(self.model.state_dict(), filepath)
        
    def load_model(self, filepath: str, input_dim: int):
        self.model = LSTMAttentionModel(input_dim=input_dim)
        self.model.load_state_dict(torch.load(filepath))
        self.model.to(self.device)
