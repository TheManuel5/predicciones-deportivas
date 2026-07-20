
"""
Feature Engineering module for sports match predictions
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import os


# Load the results.csv data globally (cached)
RESULTS_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.csv")
df_results = None


def load_results():
    """Load and cache the results.csv data"""
    global df_results
    if df_results is None:
        if os.path.exists(RESULTS_CSV_PATH):
            df_results = pd.read_csv(RESULTS_CSV_PATH)
            df_results["date"] = pd.to_datetime(df_results["date"], errors="coerce")
            df_results = df_results.dropna(subset=["date", "home_team", "away_team", "home_score", "away_score"])
        else:
            raise FileNotFoundError(f"Could not find results.csv at {RESULTS_CSV_PATH}")
    return df_results


def get_team_history(team_name: str, df: pd.DataFrame, n_matches: int = 10) -> pd.DataFrame:
    """Get the last n matches for a given team (home or away)"""
    home_matches = df[df["home_team"] == team_name].copy()
    away_matches = df[df["away_team"] == team_name].copy()
    
    # Combine and process
    home_matches["is_home"] = True
    home_matches["team"] = team_name
    home_matches["opponent"] = home_matches["away_team"]
    home_matches["goals_for"] = home_matches["home_score"]
    home_matches["goals_against"] = home_matches["away_score"]
    home_matches["result"] = np.where(
        home_matches["home_score"] > home_matches["away_score"], 1,
        np.where(home_matches["home_score"] == home_matches["away_score"], 0, -1)
    )
    
    away_matches["is_home"] = False
    away_matches["team"] = team_name
    away_matches["opponent"] = away_matches["home_team"]
    away_matches["goals_for"] = away_matches["away_score"]
    away_matches["goals_against"] = away_matches["home_score"]
    away_matches["result"] = np.where(
        away_matches["away_score"] > away_matches["home_score"], 1,
        np.where(away_matches["away_score"] == away_matches["home_score"], 0, -1)
    )
    
    # Combine, sort by date, take last n
    all_matches = pd.concat([home_matches, away_matches], ignore_index=True)
    all_matches = all_matches.sort_values("date", ascending=False).head(n_matches)
    return all_matches


def extract_match_features(
    match_data: Dict,
    team_history: Optional[List[Dict]] = None,
    head_to_head: Optional[List[Dict]] = None
) -> np.ndarray:
    """
    Extracts features from a single match for model prediction
    using real historical data from results.csv
    """
    df = load_results()
    
    home_team = match_data.get("home_team", match_data.get("teams", {}).get("home", {}).get("name", ""))
    away_team = match_data.get("away_team", match_data.get("teams", {}).get("away", {}).get("name", ""))
    
    # Get last 10 matches for each team
    home_history = get_team_history(home_team, df, n_matches=10)
    away_history = get_team_history(away_team, df, n_matches=10)
    
    features = []
    
    # Home team stats (last 10)
    if len(home_history) > 0:
        features.append(home_history["result"].mean())  # Avg result
        features.append(home_history["goals_for"].mean())  # Avg goals for
        features.append(home_history["goals_against"].mean())  # Avg goals against
        features.append((home_history["result"] == 1).sum() / len(home_history))  # Win rate
        features.append((home_history["result"] == 0).sum() / len(home_history))  # Draw rate
    else:
        features.extend([0, 1.5, 1.5, 0.33, 0.33])
    
    # Away team stats (last 10)
    if len(away_history) > 0:
        features.append(away_history["result"].mean())  # Avg result
        features.append(away_history["goals_for"].mean())  # Avg goals for
        features.append(away_history["goals_against"].mean())  # Avg goals against
        features.append((away_history["result"] == 1).sum() / len(away_history))  # Win rate
        features.append((away_history["result"] == 0).sum() / len(away_history))  # Draw rate
    else:
        features.extend([0, 1.5, 1.5, 0.33, 0.33])
    
    # Head-to-head stats
    h2h = df[
        ((df["home_team"] == home_team) & (df["away_team"] == away_team)) |
        ((df["home_team"] == away_team) & (df["away_team"] == home_team))
    ].tail(5)
    if len(h2h) > 0:
        # Home team wins in H2H
        home_h2h_wins = len(h2h[
            ((h2h["home_team"] == home_team) & (h2h["home_score"] > h2h["away_score"])) |
            ((h2h["away_team"] == home_team) & (h2h["away_score"] > h2h["home_score"]))
        ])
        features.append(home_h2h_wins / len(h2h))
        
        # Draws in H2H
        draws_h2h = len(h2h[h2h["home_score"] == h2h["away_score"]])
        features.append(draws_h2h / len(h2h))
        
        # Avg goals in H2H
        avg_h2h_goals = (h2h["home_score"] + h2h["away_score"]).mean()
        features.append(avg_h2h_goals)
    else:
        features.extend([0.33, 0.33, 2.5])
    
    # Add some derived features
    features.append(features[0] - features[5])  # Home form minus away form
    features.append(features[1] - features[6])  # Home goals for minus away goals for
    features.append(features[7] - features[2])  # Away goals against minus home goals against
    features.append(features[3] - features[8])  # Home win rate minus away win rate
    features.append(len(home_history))  # Number of home history matches
    features.append(len(away_history))  # Number of away history matches
    features.append(len(h2h))  # Number of H2H matches
    
    # Make sure we have exactly 20 features
    while len(features) < 20:
        features.append(0.0)
    
    return np.array(features[:20]).reshape(1, -1)


def create_sample_training_data(n_samples: Optional[int] = None, fast_mode: bool = False) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Creates training data using real data from results.csv
    Optimized: precomputes team histories incrementally and caches results
    Fast mode: uses simple random features for testing (still uses real targets)
    """
    if fast_mode:
        print("Using fast mode for testing...")
        df = load_results()
        df_recent = df.tail(n_samples if n_samples else 1000).copy()
        
        X = np.random.rand(len(df_recent), 20)
        
        y_class_list = []
        y_goal_diff_list = []
        for _, row in df_recent.iterrows():
            home_score = row["home_score"]
            away_score = row["away_score"]
            
            if home_score > away_score:
                y_class = 0
            elif home_score == away_score:
                y_class = 1
            else:
                y_class = 2
            
            y_class_list.append(y_class)
            y_goal_diff_list.append(home_score - away_score)
        
        return X, np.array(y_class_list), np.array(y_goal_diff_list)
    
    # Check if cached data exists
    cache_file = "training_data_cache.npz"
    if os.path.exists(cache_file):
        print("Loading cached training data...")
        data = np.load(cache_file, allow_pickle=True)
        X = data["X"]
        y_class = data["y_class"]
        y_goal_diff = data["y_goal_diff"]
        
        # Apply n_samples if needed
        if n_samples is not None and len(X) > n_samples:
            X = X[-n_samples:]
            y_class = y_class[-n_samples:]
            y_goal_diff = y_goal_diff[-n_samples:]
        
        return X, y_class, y_goal_diff
    
    df = load_results()
    
    # We'll use matches from 2000 onwards to have relatively recent data
    df_recent = df[df["date"] >= pd.Timestamp("2000-01-01")].copy()
    df_recent = df_recent.sort_values("date").reset_index(drop=True)
    
    if n_samples is not None:
        df_recent = df_recent.tail(n_samples)
    
    X_list = []
    y_class_list = []
    y_goal_diff_list = []
    
    # Sort all matches by date (we already did this, but just in case)
    all_matches_sorted = df.sort_values("date").reset_index(drop=True)
    
    # Keep track of all matches processed so far
    processed_matches = []
    
    for idx, row in df_recent.iterrows():
        # For each historical match, create a feature vector based on data BEFORE that match
        match_date = row["date"]
        
        # Add all matches before current match to processed_matches if not already there
        # First, find the index in all_matches_sorted where date < match_date
        # Iterate through all_matches_sorted and add until we hit match_date
        while len(processed_matches) < len(all_matches_sorted) and all_matches_sorted.iloc[len(processed_matches)]["date"] < match_date:
            processed_matches.append(all_matches_sorted.iloc[len(processed_matches)].to_dict())
        
        if len(processed_matches) == 0:
            continue
        
        # Create df_past from processed_matches
        df_past = pd.DataFrame(processed_matches)
        df_past["date"] = pd.to_datetime(df_past["date"])
        
        # Extract features using past data
        global df_results
        original_df = df_results
        df_results = df_past
        
        try:
            match_dict = {
                "home_team": row["home_team"],
                "away_team": row["away_team"]
            }
            X = extract_match_features(match_dict)
            X_list.append(X.flatten())
        finally:
            df_results = original_df
        
        # Determine target
        home_score = row["home_score"]
        away_score = row["away_score"]
        
        if home_score > away_score:
            y_class = 0  # Home win
        elif home_score == away_score:
            y_class = 1  # Draw
        else:
            y_class = 2  # Away win
        
        y_goal_diff = home_score - away_score
        
        y_class_list.append(y_class)
        y_goal_diff_list.append(y_goal_diff)
    
    X = np.array(X_list)
    y_class = np.array(y_class_list)
    y_goal_diff = np.array(y_goal_diff_list)
    
    # Save to cache
    print("Saving training data to cache...")
    np.savez_compressed(cache_file, X=X, y_class=y_class, y_goal_diff=y_goal_diff)
    
    return X, y_class, y_goal_diff


if __name__ == "__main__":
    print("Testing feature engineering...")
    
    sample_match = {
        "home_team": "Brazil",
        "away_team": "Argentina",
        "league": "FIFA World Cup"
    }
    
    features = extract_match_features(sample_match)
    print(f"Extracted features shape: {features.shape}")
    print(f"Features: {features}")
    
    X, y_class, y_goal_diff = create_sample_training_data(n_samples=500)
    print(f"\nTraining data shapes:")
    print(f"  X: {X.shape}")
    print(f"  y_class: {y_class.shape}")
    print(f"  y_goal_diff: {y_goal_diff.shape}")
