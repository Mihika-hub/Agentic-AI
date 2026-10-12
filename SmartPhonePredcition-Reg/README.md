# Smartphone Resale Price Predictor (Regression)

A lightweight machine learning project that predicts smartphone resale price (in AED) from:

- Phone age (years)
- Storage (GB)
- Battery health (%)
- Camera resolution (MP)

This project uses only the Python standard library (no external ML packages).

## Project Structure

- app.py — trains multiple regression candidates, selects the best model by RMSE, and starts a local web app
- Smartphone_Resale_Price_Regression_100_Rows.csv — dataset (100 rows)
- train_model.py — legacy stub (kept for compatibility)

## How It Works

On startup, app.py:

1. Loads the dataset.
2. Splits data into train/test (60:40).
3. Trains and evaluates these models:
	- Mean baseline
	- Linear regression
	- Ridge regression
	- Polynomial regression (degree 2 + ridge)
	- KNN regressor
4. Picks the model with the lowest RMSE.
5. Retrains the selected model on full data.
6. Serves a simple web UI at http://localhost:8000.

## Requirements

- Python 3.10+ (Python 3.14 also works)
- Windows PowerShell / Terminal

## Run Locally

### 1) Clone the repository

git clone <your-repo-url>
cd SmartPhonePredcition-Reg

### 2) (Optional) Create and activate a virtual environment

python -m venv .venv
.venv\Scripts\Activate.ps1

### 3) Start the app

python app.py

Then open your browser at:

http://localhost:8000

## Using the Predictor

Enter values for age, storage, battery health, and camera MP, then click Predict.

You can also pass values through query parameters:

http://localhost:8000/?age=2&storage=256&battery=85&camera=64

## Example Output

- Estimated resale price in AED
- Table of model RMSE comparison
- Best model selected automatically

## Notes

- The script prints model evaluation results in the terminal before starting the web server.
- If the CSV file is missing, app.py raises a clear dataset-not-found error.

## License

This project is open-source and free to use.
