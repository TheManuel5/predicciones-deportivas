
import numpy as np
import pandas as pd
from datetime import datetime
from feature_engineering import load_historical_data

# Test 1: Cargar datos
print("Test 1: Cargar datos...")
df = load_historical_data("results.csv")
print(f"Filas: {len(df)}, Columnas: {df.columns}")

# Test 2: Crear una función de prueba simple
def test_compute_team_form(df):
    team_name = "Brazil"
    match_date = datetime(2020, 1, 1)
    team_matches = df[
        ((df['home_team'] == team_name) | (df['away_team'] == team_name))
    ]
    print(f"Partidos de {team_name}: {len(team_matches)}")

test_compute_team_form(df)
print("OK!")

