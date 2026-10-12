import streamlit as st
import pickle
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from sklearn.metrics import mean_squared_error, r2_score
import math

# Set page config
st.set_page_config(page_title="Car Price Predictor", layout="wide")

# Load model and data
with open('best_model.pkl', 'rb') as f:
    best_model = pickle.load(f)

X_train = np.load('X_train.npy')
X_test = np.load('X_test.npy')
y_train = np.load('y_train.npy')
y_test = np.load('y_test.npy')

# Get predictions
y_pred = best_model.predict(X_test)
rmse = math.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

st.title("🚗 Car Price Prediction Model")

# Display model info
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Train Set Size", f"{len(X_train)} (60%)")
with col2:
    st.metric("Test Set Size", f"{len(X_test)} (40%)")
with col3:
    st.metric("RMSE", f"${rmse:.2f}")
with col4:
    st.metric("R² Score", f"{r2:.4f}")

# Create tabs for different sections
tab1, tab2, tab3 = st.tabs(["📊 Predictions vs Actual", "🔮 Make Prediction", "📈 Model Performance"])

# Tab 1: Predictions vs Actual
with tab1:
    st.subheader("Test Set: Predicted vs Actual Prices")
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=list(range(len(y_test))),
        y=y_test,
        mode='markers',
        name='Actual Price',
        marker=dict(size=10, color='blue', opacity=0.6)
    ))
    fig.add_trace(go.Scatter(
        x=list(range(len(y_pred))),
        y=y_pred,
        mode='markers',
        name='Predicted Price',
        marker=dict(size=10, color='red', opacity=0.6)
    ))
    fig.update_layout(
        title="Actual vs Predicted Car Prices",
        xaxis_title="Sample Index",
        yaxis_title="Price ($)",
        height=500
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Display table
    st.subheader("Detailed Predictions")
    results_df = pd.DataFrame({
        'Mileage': X_test[:, 0].astype(int),
        'Age (yrs)': X_test[:, 1].astype(int),
        'Actual Price ($)': y_test.astype(int),
        'Predicted Price ($)': y_pred.astype(int),
        'Error ($)': (y_test - y_pred).astype(int)
    })
    st.dataframe(results_df, use_container_width=True)

# Tab 2: Make Prediction
with tab2:
    st.subheader("Enter Car Details to Predict Price")
    
    col1, col2 = st.columns(2)
    with col1:
        mileage = st.number_input("Enter Mileage (miles):", min_value=0, value=50000, step=1000)
    with col2:
        age = st.number_input("Enter Age (years):", min_value=0, max_value=20, value=5, step=1)
    
    if st.button("Predict Price", type="primary"):
        input_data = np.array([[mileage, age]])
        predicted_price = best_model.predict(input_data)[0]
        
        st.success(f"### Predicted Price: ${predicted_price:,.2f}")
        
        st.info(f"""
        **Input Details:**
        - Mileage: {mileage:,} miles
        - Age: {age} years
        """)

# Tab 3: Model Performance
with tab3:
    st.subheader("Model Performance Analysis")
    
    # Residuals plot
    residuals = y_test - y_pred
    
    fig = go.Figure()
    fig.add_trace(go.Histogram(
        x=residuals,
        nbinsx=20,
        name='Residuals',
        marker_color='green',
        opacity=0.7
    ))
    fig.update_layout(
        title="Distribution of Prediction Errors (Residuals)",
        xaxis_title="Error ($)",
        yaxis_title="Frequency",
        height=400
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Performance metrics
    st.subheader("Performance Metrics")
    
    col1, col2 = st.columns(2)
    with col1:
        mae = np.mean(np.abs(residuals))
        st.metric("Mean Absolute Error (MAE)", f"${mae:.2f}")
    with col2:
        mape = np.mean(np.abs(residuals / y_test)) * 100
        st.metric("Mean Absolute Percentage Error (MAPE)", f"{mape:.2f}%")
    
    st.write(f"""
    **Model Statistics:**
    - Root Mean Squared Error (RMSE): ${rmse:.2f}
    - R² Score: {r2:.4f}
    - Number of Test Samples: {len(y_test)}
    """)

st.markdown("---")
st.markdown("Made with ❤️ using Streamlit | Car Price Prediction Model")
