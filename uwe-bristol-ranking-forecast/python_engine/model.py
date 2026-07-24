import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import numpy as np
import json
import os

def train_and_predict_rankings(historical_data):
    """
    """
    df = pd.DataFrame(historical_data)
    
    X = df[['year', 'satisfaction', 'staffRatio']]
    y = df['rank']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    latest = df.iloc[-1]
    future_data = []
    for y_offset in range(1, 6):
        future_data.append([
            latest['year'] + y_offset, 
            latest['satisfaction'] + (y_offset * 0.2), 
            latest['staffRatio'] - (y_offset * 0.1)
        ])
    
    predictions = model.predict(future_data)
    return list(zip(range(2026, 2031), predictions))

if __name__ == "__main__":
    json_path = os.path.join(os.path.dirname(__file__), 'guardian_data.json')
    
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                full_data = json.load(f)
            
            uwe_entry = next((inst for inst in full_data.get('institutions', []) if inst['name'] == 'UWE Bristol'), None)
            
            if uwe_entry:
                data = [
                    {'year': 2011, 'rank': 64, 'satisfaction': 82, 'staffRatio': 16.2},
                    {'year': 2015, 'rank': 58, 'satisfaction': 84, 'staffRatio': 15.8},
                    {'year': 2023, 'rank': uwe_entry.get('rank2023', 24), 'satisfaction': 89, 'staffRatio': 14.1},
                    {'year': 2024, 'rank': uwe_entry.get('rank2024', 43), 'satisfaction': 83.2, 'staffRatio': 16.8},
                    {'year': 2025, 'rank': uwe_entry.get('rank2025', 64), 'satisfaction': float(uwe_entry.get('percentSatisfiedWithTeaching', 83.2)), 'staffRatio': float(uwe_entry.get('studentStaffRatio', 16.8))},
                ]
                print(f"--- Loaded Guardian Data for {uwe_entry['name']} ---")
            else:
                raise ValueError("UWE Bristol not found in JSON")
        except Exception as e:
            print(f"Error loading JSON ({e}). Using fallback mock data.")
            data = [
                {'year': 2011, 'rank': 64, 'satisfaction': 82, 'staffRatio': 16.2},
                {'year': 2015, 'rank': 58, 'satisfaction': 84, 'staffRatio': 15.8},
                {'year': 2023, 'rank': 24, 'satisfaction': 89, 'staffRatio': 14.1},
                {'year': 2024, 'rank': 43, 'satisfaction': 83.2, 'staffRatio': 16.8},
                {'year': 2025, 'rank': 64, 'satisfaction': 83.2, 'staffRatio': 16.8},
            ]
    else:
        print(f"File {json_path} not found. Using fallback mock data.")
        data = [
            {'year': 2011, 'rank': 64, 'satisfaction': 82, 'staffRatio': 16.2},
            {'year': 2015, 'rank': 58, 'satisfaction': 84, 'staffRatio': 15.8},
            {'year': 2023, 'rank': 24, 'satisfaction': 89, 'staffRatio': 14.1},
            {'year': 2024, 'rank': 43, 'satisfaction': 83.2, 'staffRatio': 16.8},
            {'year': 2025, 'rank': 64, 'satisfaction': 83.2, 'staffRatio': 16.8},
        ]

    results = train_and_predict_rankings(data)
    print("\n--- UWE Bristol Ranking Forecast (Python Core) ---")
    for year, pred in results:
        print(f"Year {year}: Predicted Rank {int(round(pred))}")
