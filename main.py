from flask import Flask, jsonify, request
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Cek apakah credentials ada
if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL atau SUPABASE_KEY tidak ditemukan!")
else:
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:20]}...")  # Print sebagian key saja

supabase: Client = create_client(supabase_url, supabase_key)

# Route utama
@app.route('/')
def index():
    return 'Hello, Supabase + Flask!'

from api.kategori.kategori import get_kategori_transaksi

# GET: Mengambil semua data dari tabel
@app.route('/api/kategori.list', methods=['GET'])
def get_data():
    return get_kategori_transaksi(supabase)

if __name__ == '__main__':
    app.run(debug=True)
