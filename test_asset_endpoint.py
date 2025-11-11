import requests

# Test the asset endpoint to see if the sum of harga is added
try:
    response = requests.get('http://127.0.0.1:5002/api/asset.list')
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print(f"Error making request: {e}")
    print("The server might not be running yet.")