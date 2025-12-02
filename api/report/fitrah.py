from flask import Blueprint, request, jsonify
from datetime import datetime
import os
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

report_fitrah_bp = Blueprint('report_fitrah', __name__)

@report_fitrah_bp.route('/laporan.fitrah', methods=['GET'])
def get_laporan_fitrah():
    """
    API endpoint to get fitrah report combining pembayaran and penyaluran data
    with optional date range filtering and sorted by created_at (newest first)
    """
    # Get date range from query parameters
    tanggal_awal = request.args.get('tanggal_awal')
    tanggal_akhir = request.args.get('tanggal_akhir')

    # Validate date format if provided
    if tanggal_awal:
        try:
            datetime.strptime(tanggal_awal, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Format tanggal awal tidak valid. Gunakan format YYYY-MM-DD'}), 400

    if tanggal_akhir:
        try:
            datetime.strptime(tanggal_akhir, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Format tanggal akhir tidak valid. Gunakan format YYYY-MM-DD'}), 400

    try:
        # Get pembayaran data
        pembayaran_query = supabase.table('pembayaran_fitrah').select('*')
        if tanggal_awal:
            pembayaran_query = pembayaran_query.gte('created_at', tanggal_awal)
        if tanggal_akhir:
            pembayaran_query = pembayaran_query.lte('created_at', tanggal_akhir)
        pembayaran_response = pembayaran_query.execute()
        pembayaran_data = pembayaran_response.data

        # Get related data for pembayaran
        harga_fitrah_ids = [p['id_hargafitrah'] for p in pembayaran_data]
        if harga_fitrah_ids:
            harga_fitrah_response = supabase.table('harga_fitrah').select('*').in_('id_hargafitrah', list(set(harga_fitrah_ids))).execute()
            harga_fitrah_data = {h['id_hargafitrah']: h for h in harga_fitrah_response.data}

            # Get related jenis_fitrah and proyek_fitrah data
            jenis_fitrah_ids = [h['id_jenis_fitrah'] for h in harga_fitrah_data.values()]
            if jenis_fitrah_ids:
                jenis_fitrah_response = supabase.table('jenis_fitrah').select('*').in_('id_jenis_fitrah', list(set(jenis_fitrah_ids))).execute()
                jenis_fitrah_data = {j['id_jenis_fitrah']: j for j in jenis_fitrah_response.data}

            fitrah_ids = [h['id_fitrah'] for h in harga_fitrah_data.values()]
            if fitrah_ids:
                proyek_fitrah_response = supabase.table('proyek_fitrah').select('*').in_('id_fitrah', list(set(fitrah_ids))).execute()
                proyek_fitrah_data = {p['id_fitrah']: p for p in proyek_fitrah_response.data}
        else:
            harga_fitrah_data = {}
            jenis_fitrah_data = {}
            proyek_fitrah_data = {}

        # Get akun_kas_bank data
        akun_ids = [p['id_akun'] for p in pembayaran_data]
        if akun_ids:
            akun_response = supabase.table('akun_kas_bank').select('*').in_('id_akun', list(set(akun_ids))).execute()
            akun_data = {a['id_akun']: a for a in akun_response.data}
        else:
            akun_data = {}

        # Get penyaluran data
        penyaluran_query = supabase.table('penyaluran_fitrah').select('*')
        if tanggal_awal:
            penyaluran_query = penyaluran_query.gte('tanggal_penerimaan', tanggal_awal)
        if tanggal_akhir:
            penyaluran_query = penyaluran_query.lte('tanggal_penerimaan', tanggal_akhir)
        penyaluran_response = penyaluran_query.execute()
        penyaluran_data = penyaluran_response.data

        # Get related data for penyaluran
        fitrah_ids_peny = [p['id_fitrah'] for p in penyaluran_data]
        if fitrah_ids_peny:
            proyek_fitrah_peny_response = supabase.table('proyek_fitrah').select('*').in_('id_fitrah', list(set(fitrah_ids_peny))).execute()
            proyek_fitrah_peny_data = {p['id_fitrah']: p for p in proyek_fitrah_peny_response.data}
        else:
            proyek_fitrah_peny_data = {}

        akun_ids_peny = [p['id_akun'] for p in penyaluran_data]
        if akun_ids_peny:
            akun_peny_response = supabase.table('akun_kas_bank').select('*').in_('id_akun', list(set(akun_ids_peny))).execute()
            akun_peny_data = {a['id_akun']: a for a in akun_peny_response.data}
        else:
            akun_peny_data = {}

        mustahik_ids = [p['id_mustahik'] for p in penyaluran_data]
        if mustahik_ids:
            mustahik_response = supabase.table('mustahik').select('*').in_('id_mustahik', list(set(mustahik_ids))).execute()
            mustahik_data = {m['id_mustahik']: m for m in mustahik_response.data}
        else:
            mustahik_data = {}

        # Transform pembayaran data to match the required format
        transformed_pembayaran = []
        for record in pembayaran_data:
            harga_fitrah_rec = harga_fitrah_data.get(record['id_hargafitrah'], {})
            jenis_fitrah_rec = jenis_fitrah_data.get(harga_fitrah_rec.get('id_jenis_fitrah'), {})
            proyek_fitrah_rec = proyek_fitrah_data.get(harga_fitrah_rec.get('id_fitrah'), {})
            akun_rec = akun_data.get(record['id_akun'], {})

            transformed_record = {
                'Mode': 'Pembayaran',
                'created_at': record.get('created_at'),
                'tahun_hijriah': proyek_fitrah_rec.get('tahun_hijriah'),
                'penanggung_jawab': proyek_fitrah_rec.get('penanggung_jawab'),
                'keterangan': harga_fitrah_rec.get('keterangan'),
                'nama_jenis': jenis_fitrah_rec.get('nama_jenis'),
                'nama_akun': akun_rec.get('nama_akun'),
                'nominal': record.get('total_uang') if record.get('total_berat') == 0 else 0,
                'beras': record.get('total_berat') if record.get('total_berat') > 0 else 0
            }
            transformed_pembayaran.append(transformed_record)

        # Transform penyaluran data to match the required format
        transformed_penyaluran = []
        for record in penyaluran_data:
            proyek_fitrah_rec = proyek_fitrah_peny_data.get(record['id_fitrah'], {})
            akun_rec = akun_peny_data.get(record['id_akun'], {})
            mustahik_rec = mustahik_data.get(record['id_mustahik'], {})

            transformed_record = {
                'Mode': 'Penyaluran',
                'created_at': record.get('tanggal_penerimaan'),
                'tahun_hijriah': proyek_fitrah_rec.get('tahun_hijriah'),
                'penanggung_jawab': proyek_fitrah_rec.get('penanggung_jawab'),
                'keterangan': mustahik_rec.get('nama_lengkap'),
                'nama_jenis': 'Uang' if record.get('jumlah_beras') == 0 else 'Beras',
                'nama_akun': akun_rec.get('nama_akun'),
                'nominal': record.get('jumlah_uang') if record.get('jumlah_beras') == 0 else 0,
                'beras': record.get('jumlah_beras') if record.get('jumlah_beras') > 0 else 0
            }
            transformed_penyaluran.append(transformed_record)

        # Combine both datasets
        combined_data = transformed_pembayaran + transformed_penyaluran

        # Sort by created_at (newest first)
        combined_data.sort(key=lambda x: x['created_at'] or '', reverse=True)

        return jsonify({
            'success': True,
            'data': combined_data,
            'total': len(combined_data)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500