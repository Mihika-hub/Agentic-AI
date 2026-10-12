# Realistic Car Price Predictor

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Streamlit](https://img.shields.io/badge/Framework-Streamlit-ff4b4b)
![ML](https://img.shields.io/badge/ML-Regression-success)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

A Streamlit app that predicts a car's **sell price** using machine learning regression models.

---

## Features

- Automatic data loading from local dataset file
- Trains and compares 5 regression models
- Selects the best model by **lowest RMSE**
- Displays a model leaderboard with RMSE and R²
- Interactive form for real-time sell price prediction

## Models Compared

- Linear Regression
- Ridge Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- Extra Trees Regressor

## Tech Stack

- Python
- Streamlit
- Pandas / NumPy
- Scikit-learn
- OpenPyXL

## Project Structure

```text
Agentic AI/
└── RealisticCarPrice/
    ├── app.py
    ├── README.md
    ├── requirements.txt
    ├── .gitignore
    └── realistic_car_prices_dataset.xlsx
```

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/<your-username>/RealisticCarPrice.git
cd "Agentic AI/RealisticCarPrice"
```

### 2) Create and activate a virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

### 4) Run the app

```bash
streamlit run app.py
```

Open the URL shown in terminal (typically `http://localhost:8501`).

## Dataset Requirements

The app checks for these files in the folder first, then the parent folder:

1. `realistic_car_prices_dataset.xlsx`
2. `realistic_car_prices_dataset.csv.xlsx`
3. `realistic_car_prices_dataset.csv`

Required target column:

- `Sell Price`

## App Preview

Add screenshots to make the repository more attractive on GitHub.

Suggested files:
- `assets/app-home.png`
- `assets/model-leaderboard.png`
- `assets/prediction-result.png`

Example markdown once images are added:

```md
![App Home](assets/app-home.png)
![Leaderboard](assets/model-leaderboard.png)
![Prediction Result](assets/prediction-result.png)
```

## How It Works

1. Loads data and separates features/target.
2. Builds preprocessing pipeline:
	- Numeric: median imputation
	- Categorical: most-frequent imputation + one-hot encoding
3. Splits dataset into train/test (80:20).
4. Trains all candidate models.
5. Chooses best model using RMSE.
6. Uses best model for user-input predictions.

## Troubleshooting

- **Dataset not found**: keep the dataset file in the project folder or parent container folder.
- **Missing `Sell Price` column**: ensure exact column name match.
- **Import/dependency errors**: re-run `pip install -r requirements.txt`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

## License

For open-source publishing, add a license file (recommended: MIT).
