from flask import Flask, jsonify, request, send_from_directory
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Import routes
from api.kategori.kategori import get_kategori_transaksi
from api.kategori.new import create_kategori
from api.kategori.update import update_kategori
from api.pegawai.new import create_pegawai
from api.pegawai.pegawai import get_pegawai
from api.pegawai.update import update_pegawai
from api.pegawai.cek_login import cek_login_pegawai
from api.mustahik.mustahik import get_mustahik
from api.mustahik.new import create_mustahik
from api.mustahik.update import update_mustahik
from api.akun.akun import get_akun_kas_bank
from api.akun.new import create_akun_kas_bank
from api.akun.update import update_akun_kas_bank
from api.asset.asset import get_all_assets, get_asset_by_kode_barang
from api.asset.new import create_asset
from api.asset.update import update_asset
from api.muzakki.muzakki import muzakki_bp, init_supabase
from api.transaksi.list_tx import get_transaksi_list
from api.transaksi.list_tx_detail import get_transaksi_detail_list
from api.transaksi.new_tx import create_transaksi

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

# Initialize Supabase for blueprints
init_supabase(supabase)

# Register blueprints
app.register_blueprint(muzakki_bp)

# Route utama
@app.route('/')
def index():
    return 'Hello, Supabase + Flask!'

@app.route('/index')
def index_page():
    return send_from_directory('public', 'index.html')

# GET: Mengambil semua data dari tabel
#@app.route('/data', methods=['GET'])
@app.route('/api/kategori.list', methods=['GET'])
def get_data():
    return get_kategori_transaksi(supabase)

# POST: Membuat kategori baru
@app.route('/api/kategori.create', methods=['POST'])
def new_kategori():
    return create_kategori(supabase, request)

# POST: Mengupdate kategori baru
@app.route('/api/kategori.update', methods=['POST'])
def update_kategori_route():
    return update_kategori(supabase, request)

# POST: Membuat profil baru
@app.route('/api/pegawai.create', methods=['POST'])
def new_pegawai():
    return create_pegawai(supabase, request)

# GET: Mengambil semua data pegawai
@app.route('/api/pegawai.list', methods=['GET'])
def list_pegawai():
    return get_pegawai(supabase)

# POST: Mengupdate data pegawai
@app.route('/api/pegawai.update', methods=['POST'])
def update_pegawai_route():
    return update_pegawai(supabase, request)

# POST: Cek login pegawai
@app.route('/api/pegawai.login', methods=['POST'])
def cek_login_pegawai_route():
    return cek_login_pegawai(supabase, request)

# GET: Mengambil semua data mustahik
@app.route('/api/mustahik.list', methods=['GET'])
def list_mustahik():
    return get_mustahik(supabase)

# POST: Membuat mustahik baru
@app.route('/api/mustahik.create', methods=['POST'])
def new_mustahik():
    return create_mustahik(supabase, request)

# POST: Mengupdate mustahik
@app.route('/api/mustahik.update', methods=['POST'])
def update_mustahik_route():
    return update_mustahik(supabase, request)

# GET: Mengambil semua data akun kas bank
@app.route('/api/akun.list', methods=['GET'])
def list_akun():
    return get_akun_kas_bank(supabase)

# POST: Membuat akun kas bank baru
@app.route('/api/akun.create', methods=['POST'])
def new_akun():
    return create_akun_kas_bank(supabase, request)

# POST: Mengupdate akun kas bank
@app.route('/api/akun.update', methods=['POST'])
def update_akun():
    return update_akun_kas_bank(supabase, request)

# GET: Mengambil semua data asset
@app.route('/api/asset.list', methods=['GET'])
def list_asset():
    return get_all_assets(supabase)

# GET: Mengambil data asset berdasarkan kode_barang
@app.route('/api/asset.list/<kode_barang>', methods=['GET'])
def get_asset_by_kode_barang_route(kode_barang):
    return get_asset_by_kode_barang(supabase, kode_barang)

# POST: Membuat asset baru
@app.route('/api/asset.create', methods=['POST'])
def new_asset():
    return create_asset(supabase, request)

# POST: Mengupdate asset
@app.route('/api/asset.update', methods=['POST'])
def update_asset_route():
    return update_asset(supabase, request)

# GET: Mengambil semua data transaksi
@app.route('/api/transaksi.list', methods=['GET'])
def list_transaksi():
    return get_transaksi_list(supabase)

# GET: Mengambil data detail transaksi berdasarkan id_transaksi
@app.route('/api/transaksi.listdetail', methods=['GET'])
def list_transaksi_detail():
    return get_transaksi_detail_list(supabase)

# POST: Membuat transaksi baru
@app.route('/api/transaksi.create', methods=['POST'])
def new_transaksi():
    return create_transaksi(supabase, request)

@app.route('/akun')
def akun_page():
    return send_from_directory('public', 'akun.html')

@app.route('/kategori')
def kategori_transaksi_page():
    return send_from_directory('public', 'kategori_transaksi.html')

@app.route('/pegawai')
def pegawai_page():
    return send_from_directory('public', 'pegawai.html')

@app.route('/login')
def login():
    return send_from_directory('public', 'login.html')

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('public/css', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('public/js', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000, debug=True)