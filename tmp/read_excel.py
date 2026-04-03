import pandas as pd
import sys

file_path = r"D:\Tam\TAMM TAMM\ALEJANDRA CASTEL\IVA 2025\01_Enero 2025\AC_Liquidación de IVA_012025.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, header=None) # Read raw
        print(df.head(20).dropna(how='all', axis=0).dropna(how='all', axis=1).to_string())

except Exception as e:
    print(f"Error reading Excel: {e}")
