from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Import routes
from api.kategori.kategori import get_kategori_transaksi
from api.kategori.new import create_kategori
from api.kategori.update import update_kategori
from api.pegawai.new import create_pegawai
from api.pegawai.pegawai import get_pegawai
from api.pegawai.update import update_pegawai
from api.pegawai.update_pribadi import update_pribadi
from api.pegawai.cek_login import cek_login_pegawai
from api.pegawai.logout import logout_pegawai
from api.pegawai.reset import request_reset, verify_code, reset_password
from api.pegawai.cek_kodeverifikasi import cek_kodeverifikasi
from api.pegawai.update_resetpw import update_newpassword
from api.mustahik.mustahik import get_mustahik
from api.mustahik.new import create_mustahik
from api.mustahik.update import update_mustahik
from api.akun.akun import get_akun_kas_bank
from api.akun.new import create_akun_kas_bank
from api.akun.update import update_akun_kas_bank
from api.asset.asset import get_all_assets, get_asset_by_kode_barang
from api.asset.new import create_asset
from api.asset.update import update_asset
from api.asset.upload import upload_asset_image
from api.muzakki.muzakki import get_muzakki_list
from api.muzakki.new import create_muzakki
from api.muzakki.update import update_muzakki
from api.transaksi.list_tx import get_transaksi_list
from api.transaksi.list_tx_detail import get_transaksi_detail_list
from api.transaksi.new_tx import create_transaksi
from api.transaksi.new_tx_detail import create_transaksi_detail
from api.transaksi.update_tx_detail import update_transaksi_detail
from api.transaksi.close_tx import close_transaction
from api.transaksi.upload import upload_bukti
from api.masjid.masjid import get_masjid
from api.masjid.update import update_masjid
from api.jenis_fitrah.list import get_jenis_fitrah_list
from api.jenis_fitrah.new import create_jenis_fitrah
from api.jenis_fitrah.update import update_jenis_fitrah
from api.beranda.total import get_total_by_account_type
from api.beranda.asset import get_asset_statistics
from api.beranda.mustahik import get_total_mustahik
from api.beranda.pembayaranfitrah import get_pembayaran_fitrah_summary
from api.proyek_fitrah.list import get_proyek_fitrah_list
from api.proyek_fitrah.new import create_proyek_fitrah
from api.proyek_fitrah.update import update_proyek_fitrah
from api.harga_fitrah.new import create_harga_fitrah
from api.harga_fitrah.update import update_harga_fitrah
from api.harga_fitrah.list import get_harga_fitrah_list
from api.bayar_fitrah.list import get_bayar_fitrah_list
from api.bayar_fitrah.new import create_pembayaran_fitrah
from api.bayar_fitrah.delete import delete_pembayaran_fitrah
from api.beranda.tx_bulan import get_monthly_transactions_by_category
from api.beranda.aktifitas import handle_beranda_aktifitas
from api.report.gl import gl_bp
from api.report.aruskas import aruskas_bp
from api.report.rl import rl_bp

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

# Register blueprints
app.register_blueprint(gl_bp, url_prefix='/api/laporan')  # This creates /api/laporan/gl
app.register_blueprint(aruskas_bp, url_prefix='/api/laporan')  # This creates /api/laporan/aruskas
app.register_blueprint(rl_bp, url_prefix='/api/laporan')  # This creates /api/laporan/rl

# Additional route to match exact requirement /api/laporan.gl
@app.route('/api/laporan.gl', methods=['GET'])
def general_ledger_report():
    from api.report.gl import get_general_ledger
    return get_general_ledger()

# Additional route to match exact requirement /api/laporan.aruskas
@app.route('/api/laporan.aruskas', methods=['GET'])
def cash_flow_report():
    from api.report.aruskas import get_aruskas
    return get_aruskas()

# Additional route to match exact requirement /api/laporan.rl
@app.route('/api/laporan.rl', methods=['GET'])
def profit_loss_report():
    from api.report.rl import get_profit_loss
    return get_profit_loss()



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

# POST: Mengupdate data pribadi pegawai
@app.route('/api/pegawai.update_pribadi', methods=['POST'])
def update_pribadi_route():
    return update_pribadi(supabase, request)

# POST: Cek login pegawai
@app.route('/api/pegawai.login', methods=['POST'])
def cek_login_pegawai_route():
    return cek_login_pegawai(supabase, request)

@app.route('/api/logout', methods=['POST'])
def logout_pegawai_route():
    return logout_pegawai()

@app.route('/api/beranda.total', methods=['GET'])
def total_beranda():
    return get_total_by_account_type(supabase)

@app.route('/api/beranda.asset', methods=['GET'])
def asset_beranda():
    return get_asset_statistics(supabase)

@app.route('/api/beranda.mustahik', methods=['GET'])
def mustahik_beranda():
    return get_total_mustahik(supabase)

@app.route('/api/beranda.pembayaran-fitrah', methods=['GET'])
def pembayaran_fitrah_beranda():
    return get_pembayaran_fitrah_summary(supabase)

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

# GET: Mengambil semua data muzakki
@app.route('/api/muzakki.list', methods=['GET'])
def list_muzakki():
    return get_muzakki_list(supabase)

# POST: Membuat muzakki baru
@app.route('/api/muzakki.create', methods=['POST'])
def new_muzakki():
    return create_muzakki(supabase, request)

# POST: Mengupdate muzakki
@app.route('/api/muzakki.update', methods=['POST'])
def update_muzakki_route():
    return update_muzakki(supabase, request)

# GET: Mengambil semua data transaksi
@app.route('/api/transaksi.list', methods=['GET'])
def list_transaksi():
    return get_transaksi_list(supabase)

# GET: Mengambil data detail transaksi berdasarkan id_transaksi
@app.route('/api/transaksi.listdetail', methods=['GET'])
def list_transaksi_detail():
    return get_transaksi_detail_list(supabase)

# GET: Mengambil semua data masjid
@app.route('/api/masjid.list', methods=['GET'])
def list_masjid():
    return get_masjid(supabase)

@app.route('/api/jenisfitrah.list', methods=['GET'])
def list_jenis_fitrah():
    return get_jenis_fitrah_list(supabase)

@app.route('/api/jenisfitrah.new', methods=['POST'])
def new_jenis_fitrah():
    return create_jenis_fitrah(supabase, request)

@app.route('/api/jenisfitrah.update', methods=['POST'])
def update_jenis_fitrah_route():
    return update_jenis_fitrah(supabase, request)

@app.route('/api/fitrah.list', methods=['GET'])
def list_proyek_fitrah():
    return get_proyek_fitrah_list(supabase)

@app.route('/api/fitrah.new', methods=['POST'])
def new_proyek_fitrah():
    return create_proyek_fitrah(supabase, request)

@app.route('/api/fitrah.update', methods=['POST'])
def update_proyek_fitrah_route():
    return update_proyek_fitrah(supabase, request)

@app.route('/api/hargafitrah.new', methods=['POST'])
def new_harga_fitrah():
    return create_harga_fitrah(supabase, request)

@app.route('/api/hargafitrah.update', methods=['POST'])
def update_harga_fitrah_route():
    return update_harga_fitrah(supabase, request)

@app.route('/api/hargafitrah.list', methods=['GET'])
def list_harga_fitrah():
    return get_harga_fitrah_list(supabase)

@app.route('/api/bayarfitrah.list', methods=['GET'])
def list_bayar_fitrah():
    return get_bayar_fitrah_list(supabase)

@app.route('/api/bayarfitrah.create', methods=['POST'])
def new_bayar_fitrah():
    return create_pembayaran_fitrah(supabase, request)

@app.route('/api/bayarfitrah.delete', methods=['POST'])
def delete_bayar_fitrah():
    return delete_pembayaran_fitrah(supabase, request)

@app.route('/api/beranda.tx-bulan', methods=['GET'])
def tx_bulan_beranda():
    return get_monthly_transactions_by_category(supabase)

@app.route('/api/beranda.aktifitas', methods=['GET'])
def aktifitas_beranda():
    return handle_beranda_aktifitas(supabase)

# POST: Mengupdate data masjid
@app.route('/api/masjid.update', methods=['POST'])
def update_masjid_route():
    return update_masjid(supabase, request)

# POST: Membuat transaksi baru
@app.route('/api/transaksi.create', methods=['POST'])
def new_transaksi():
    return create_transaksi(supabase, request)

# POST: Membuat detail transaksi baru
@app.route('/api/transaksi.createdetail', methods=['POST'])
def new_transaksi_detail():
    return create_transaksi_detail(supabase, request)

# POST: Mengupdate detail transaksi
@app.route('/api/transaksi.updatedetail', methods=['POST'])
def update_transaksi_detail_route():
    return update_transaksi_detail(supabase, request)

@app.route('/api/transaksi.upload', methods=['POST'])
def upload_bukti_route():
    return upload_bukti(supabase)

# POST: Close transaction by setting isClose = 1
@app.route('/api/transaksi.close', methods=['POST'])
def close_transaksi():
    return close_transaction(supabase, request)

@app.route('/api/asset.upload', methods=['POST'])
def upload_asset_image_route():
    return upload_asset_image(supabase)

@app.route('/akun')
def akun_page():
    return send_from_directory('public', 'akun.html')

@app.route('/kategori')
def kategori_transaksi_page():
    return send_from_directory('public', 'kategori_transaksi.html')

@app.route('/jenisfitrah')
def jenis_fitrah_page():
    return send_from_directory('public', 'jenisfitrah.html')

@app.route('/proyekfitrah')
def proyek_fitrah_page():
    return send_from_directory('public', 'proyekfitrah.html')

@app.route('/hargafitrah')
def harga_fitrah_page():
    return send_from_directory('public', 'hargafitrah.html')

@app.route('/bayarfitrah')
def bayar_fitrah_page():
    return send_from_directory('public', 'bayarfitrah.html')

@app.route('/pegawai')
def pegawai_page():
    return send_from_directory('public', 'pegawai.html')

@app.route('/asset')
def asset_page():
    return send_from_directory('public', 'asset.html')

@app.route('/muzakki')
def muzakki_page():
    return send_from_directory('public', 'muzakki.html')

@app.route('/mustahik')
def mustahik_page():
    return send_from_directory('public', 'mustahik.html')

@app.route('/masjid')
def masjid_page():
    return send_from_directory('public', 'masjid.html')

@app.route('/dashboard')
def dashboard_page():
    return send_from_directory('public', 'dashboard.html')

@app.route('/admin')
def admin_page():
    return send_from_directory('public', 'admin.html')

@app.route('/pemasukan')
def pemasukan_page():
    return send_from_directory('public', 'pemasukan.html')

@app.route('/pengeluaran')
def pengeluaran_page():
    return send_from_directory('public', 'pengeluaran.html')

@app.route('/laporan')
def laporan_page():
    return send_from_directory('public', 'masterlaporan.html')

@app.route('/test')
def test_page():
    return send_from_directory('public', 'test_sidebar.html')

@app.route('/login')
def login():
    return send_from_directory('public', 'login.html')

@app.route('/lupa')
def forget():
    return send_from_directory('public', 'forget.html')

# Route to send verification code via email
@app.route('/api/request-reset', methods=['POST'])
def request_reset_route():
    return request_reset(supabase, request)

# Route to verify the verification code
@app.route('/api/verify-code', methods=['POST'])
def verify_code_route():
    return verify_code(supabase, request)

# Route to check verification code
@app.route('/api/cek-kodeverifikasi', methods=['POST'])
def cek_kodeverifikasi_route():
    return cek_kodeverifikasi(supabase, request)

# Route to reset password using email
@app.route('/api/update_newpassword', methods=['POST'])
def update_newpassword_route():
    return update_newpassword(supabase, request)

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('public/css', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('public/js', path)

@app.route('/components/<path:path>')
def send_components(path):
    return send_from_directory('public/components', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5001, debug=True)