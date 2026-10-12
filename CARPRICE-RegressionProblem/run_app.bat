@echo off
cd /d "c:\Users\MIHIKA\OneDrive\Desktop\CARPRICE"
echo Training models and building the predictor...
python car_price_predictor.py
echo.
echo Starting Streamlit app...
echo Open your browser and navigate to: http://localhost:8501
echo.
streamlit run app.py
