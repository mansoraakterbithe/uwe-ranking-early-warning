import pandas as pd
import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pickle
import os

def train_institutional_strategy_model(json_path='server/data.json'):
    print(f"--- Loading dataset from {json_path} ---")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data['institutions'])
    
    features = [
        'percentSatisfiedWithTeaching',
        'studentStaffRatio',
        'careerProspects',
        'valueAdded',
        'averageEntryTariff',
        'continuation'
    ]
    target = 'rank2025'
    
    for col in features:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df = df.dropna(subset=[target] + features) 
    
    X = df[features]
    y = df[target]
    
    print(f"Processing {len(df)} institutional records...")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    
    print("Training analytical trajectory engine...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    print(f"Model Training Complete. MSE Variance: {mse:.4f}")
    
    model_path = 'server/institutional_engine.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Analytical engine successfully saved to {model_path}")
    return model

if __name__ == "__main__":
    if os.path.exists('server/data.json'):
        train_institutional_strategy_model()
    else:
        print("Error: data.json not found in server directory.")
