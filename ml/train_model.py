import os
import datetime
import numpy as np
import pandas as pd
from supabase import create_client, Client
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import lightgbm as lgb
import onnxmltools
from onnxmltools.convert import convert_lightgbm
from skl2onnx.common.data_types import FloatTensorType
from dotenv import load_dotenv

# Load env variables from root .env.local
load_dotenv(dotenv_path="../.env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("WARNING: Supabase URL or Key not found in .env.local")
    supabase = None
else:
    supabase: Client = create_client(url, key)

def fetch_data():
    if not supabase:
        print("Using mock data due to missing Supabase credentials.")
        return generate_mock_data()

    print("Fetching serving_stats from Supabase...")
    # Real implementation would join serving_stats, tickets, and queues
    # For now, we will fetch raw data and generate mock data if insufficient
    response = supabase.table("serving_stats").select("*").execute()
    data = response.data
    
    if len(data) < 100:
        print(f"Only found {len(data)} records. Generating synthetic historical data for robust training...")
        return generate_mock_data()
    
    # Process real data (Placeholder for actual join logic)
    df = pd.DataFrame(data)
    # df = ... 
    return df

def generate_mock_data(n_samples=5000):
    np.random.seed(42)
    # Features: hour_of_day, day_of_week, queue_position, rolling_avg_last_8, queue_length
    
    hours = np.random.randint(8, 18, n_samples)
    days = np.random.randint(0, 7, n_samples)
    queue_positions = np.random.randint(1, 20, n_samples)
    queue_lengths = queue_positions + np.random.randint(0, 10, n_samples)
    
    # Base service time is ~5 mins (300s). Doctors vary.
    # Rush hours (10-12, 14-16) add delay.
    
    base_time = 300
    rush_hour_penalty = np.where((hours >= 10) & (hours <= 12), 60, 0) + np.where((hours >= 14) & (hours <= 16), 40, 0)
    
    # The actual wait time is roughly position * (base_time + penalty) + some noise
    actual_wait = queue_positions * (base_time + rush_hour_penalty) + np.random.normal(0, 120, n_samples)
    actual_wait = np.maximum(actual_wait, 60) # Min 1 min wait
    
    # The naive rolling avg would just be base_time roughly
    rolling_avg = base_time + np.random.normal(0, 30, n_samples)
    
    df = pd.DataFrame({
        'hour_of_day': hours.astype(np.float32),
        'day_of_week': days.astype(np.float32),
        'queue_position_at_join': queue_positions.astype(np.float32),
        'rolling_avg_last_8': rolling_avg.astype(np.float32),
        'queue_length_at_join': queue_lengths.astype(np.float32),
        'duration_seconds': actual_wait.astype(np.float32)
    })
    
    return df

def main():
    df = fetch_data()
    
    # Features (X) and Target (y)
    features = ['hour_of_day', 'day_of_week', 'queue_position_at_join', 'rolling_avg_last_8', 'queue_length_at_join']
    X = df[features]
    y = df['duration_seconds']
    
    # Time-based split (mocked as standard split for now since data is synthetic)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training LightGBM model...")
    model = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    mape = mean_absolute_percentage_error(y_test, preds)
    
    print(f"Validation MAE: {mae:.2f} seconds")
    print(f"Validation MAPE: {mape*100:.2f}%")
    
    # Convert to ONNX
    print("Converting model to ONNX format...")
    initial_type = [('float_input', FloatTensorType([None, len(features)]))]
    onnx_model = convert_lightgbm(model, initial_types=initial_type, target_opset=12)
    
    model_path = "wait_predictor.onnx"
    with open(model_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"Model saved to {model_path}")
    
    # Log to Supabase model_training_runs
    if supabase:
        print("Logging training run to Supabase...")
        try:
            supabase.table("model_training_runs").insert({
                "row_count": len(df),
                "mae_seconds": mae,
                "mape_percent": mape * 100,
                "model_version": "lightgbm-v1"
            }).execute()
            print("Logged successfully.")
        except Exception as e:
            print(f"Error logging to Supabase (Ensure migration 00009 has run): {e}")

if __name__ == "__main__":
    main()
