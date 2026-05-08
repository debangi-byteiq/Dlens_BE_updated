import pandas as pd
import numpy as np

 
np.random.seed(42)  
n_rows = 1000

data = {
    "Customer_ID": np.arange(1, n_rows + 1),
    "Name": [f"Customer_{i}" for i in range(1, n_rows + 1)],
    "Email": [f"customer{i}@example.com" for i in range(1, n_rows + 1)],
    "Phone_Number": [f"12345678{i % 100}" for i in range(1, n_rows + 1)],
    "Age": np.random.randint(18, 70, n_rows),
    "Gender": np.random.choice(["Male", "Female", "Other"], n_rows),
    "Registration_Date": pd.to_datetime(
        np.random.choice(pd.date_range("2023-01-01", "2024-12-31"), n_rows)
    ),
    "City": np.random.choice(["CityA", "CityB", "CityC", "CityD"], n_rows),
    "Loyalty_Points": np.random.randint(0, 1000, n_rows),
    "Total_Orders": np.random.randint(1, 100, n_rows),
}

df = pd.DataFrame(data)

 
filtered_df = df[df["Registration_Date"].dt.month.isin([1, 2, 3, 4, 9, 10, 11, 12]) & (df["Registration_Date"].dt.year == 2024)]

filtered_df.to_csv('grahak_1k.csv')
