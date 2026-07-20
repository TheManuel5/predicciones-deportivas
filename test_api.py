
import requests

API_KEY = "4c214a028f5001a3aec7273dcf178f74"
BASE_URL = "https://v3.football.api-sports.io"

headers = {"x-apisports-key": API_KEY}

# Test upcoming matches
try:
    print("Testing upcoming matches...")
    response = requests.get(
        f"{BASE_URL}/fixtures",
        headers=headers,
        params={"date": "2026-07-17", "status": "NS"},
        timeout=10
    )
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Number of matches: {len(data.get('response', []))}")
        if data.get('response'):
            first_match = data['response'][0]
            print(f"First match: {first_match['teams']['home']['name']} vs {first_match['teams']['away']['name']}")
except Exception as e:
    print(f"Error: {e}")

# Test predictions (if we have a fixture id)
try:
    # Use a sample fixture id
    print("\nTesting predictions with fixture id 1001 (or any existing)...")
    # Let's use a real fixture from a past date to get an id
    past_response = requests.get(
        f"{BASE_URL}/fixtures",
        headers=headers,
        params={"date": "2024-07-17"},
        timeout=10
    )
    if past_response.status_code == 200:
        past_data = past_response.json()
        if past_data.get('response'):
            fixture_id = past_data['response'][0]['fixture']['id']
            print(f"Testing predictions for fixture id: {fixture_id}")
            pred_response = requests.get(
                f"{BASE_URL}/predictions",
                headers=headers,
                params={"fixture": fixture_id},
                timeout=10
            )
            print(f"Predictions status code: {pred_response.status_code}")
            if pred_response.status_code == 200:
                pred_data = pred_response.json()
                if pred_data.get('response'):
                    first_pred = pred_data['response'][0]
                    print(f"Prediction goals: {first_pred['predictions']['goals']}")
                    print(f"Advice: {first_pred['predictions']['advice']}")
except Exception as e:
    print(f"Prediction test error: {e}")
