# Car Price Regression Project

A machine learning project to predict used car selling price based on:
- `Mileage`
- `Age(yrs)`

The project trains multiple regression models, selects the best one by lowest RMSE, saves it, and serves predictions in a Streamlit web app.

## Features

- Trains and compares:
  - Linear Regression
  - Random Forest Regressor
  - Gradient Boosting Regressor
  - Support Vector Regressor (SVR)
- 60/40 train-test split
- Model selection using RMSE
- Saved model artifact (`best_model.pkl`)
- Interactive Streamlit dashboard with:
  - Predicted vs actual visualization
  - Residual distribution
  - Live price prediction form

## Project Structure

- `car_price_predictor.py` — training script and model selection
- `app.py` — Streamlit UI for metrics and predictions
- `carprices.csv` — dataset
- `best_model.pkl` — saved best model
- `X_train.npy`, `X_test.npy`, `y_train.npy`, `y_test.npy` — saved train/test arrays
- `run_app.bat` — helper script to train then launch app

## Requirements

Install Python packages:

- `pandas`
- `numpy`
- `scikit-learn`
- `streamlit`
- `plotly`

## Setup

1. Create and activate a virtual environment (optional but recommended).
2. Install dependencies:

```bash
pip install pandas numpy scikit-learn streamlit plotly
```

## Run the Project

### Option 1: Train + Launch manually

1. Train models and save artifacts:

```bash
python car_price_predictor.py
```

2. Start the Streamlit app:

```bash
streamlit run app.py
```

3. Open the app in your browser (usually):

- `http://localhost:8501`

### Option 2: Use batch file (Windows)

```bat
run_app.bat
```

## Model Selection Logic

`car_price_predictor.py` computes RMSE and R² for each model on the test split and picks the model with minimum RMSE.

## Notes

- If you retrain, `best_model.pkl` and `*.npy` files are overwritten.
- Ensure `carprices.csv` has columns:
  - `Mileage`
  - `Age(yrs)`
  - `Sell Price($)`

## Future Improvements

- Hyperparameter tuning with cross-validation
- Feature engineering (brand/model/fuel/transmission)
- Model versioning and experiment tracking
- Deployment to Streamlit Community Cloud or Azure
