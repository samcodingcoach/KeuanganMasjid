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
from api.kategori.new import create_kategori
from api.pegawai.new import create_pegawai
from api.pegawai.pegawai import get_pegawai
from api.mustahik.mustahik import get_mustahik
from api.akun.akun import get_akun_kas_bank
from api.akun.new import create_akun_kas_bank

# GET: Mengambil semua data dari tabel
#@app.route('/data', methods=['GET'])
@app.route('/api/kategori.list', methods=['GET'])
def get_data():
    return get_kategori_transaksi(supabase)

# POST: Membuat kategori baru
@app.route('/api/kategori.create', methods=['POST'])
def new_kategori():
    return create_kategori(supabase, request)

# POST: Membuat profil baru
@app.route('/api/pegawai.create', methods=['POST'])
def new_pegawai():
    return create_pegawai(supabase, request)

# GET: Mengambil semua data pegawai
@app.route('/api/pegawai.list', methods=['GET'])
def list_pegawai():
    return get_pegawai(supabase)

# GET: Mengambil semua data mustahik
@app.route('/api/mustahik.list', methods=['GET'])
def list_mustahik():
    return get_mustahik(supabase)

# GET: Mengambil semua data akun kas bank
@app.route('/api/akun.list', methods=['GET'])
def list_akun():
    return get_akun_kas_bank(supabase)

# POST: Membuat akun kas bank baru
@app.route('/api/akun.create', methods=['POST'])
def new_akun():
    return create_akun_kas_bank(supabase, request)

if __name__ == '__main__':
    app.run(debug=True)
