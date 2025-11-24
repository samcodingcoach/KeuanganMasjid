from flask import Blueprint, jsonify
from datetime import datetime

aktifitas_bp = Blueprint('aktifitas', __name__)

def get_beranda_aktifitas(supabase_client):
    try:
        # Query 1: Transaction details with related data
        # First, get all transaction details
        transaksi_detail_response = supabase_client.table('transaksi_detail').select(
            'id_detail, subtotal, id_transaksi, id_kategori'
        ).execute()

        transaksi_detail_data = transaksi_detail_response.data or []

        # Extract unique IDs for batch fetching related data
        transaksi_ids = list(set([d['id_transaksi'] for d in transaksi_detail_data if d.get('id_transaksi')]))
        kategori_ids = list(set([d['id_kategori'] for d in transaksi_detail_data if d.get('id_kategori')]))

        # Fetch related data in batches
        transaksi_data = {}
        if transaksi_ids:
            transaksi_response = supabase_client.table('transaksi').select('id_transaksi, tanggal_transaksi, id_muzakki, id_akun').in_('id_transaksi', transaksi_ids).execute()
            transaksi_data = {item['id_transaksi']: item for item in transaksi_response.data or []}

        kategori_data = {}
        if kategori_ids:
            kategori_response = supabase_client.table('kategori_transaksi').select('id_kategori, jenis_kategori, nama_kategori').in_('id_kategori', kategori_ids).execute()
            kategori_data = {item['id_kategori']: item for item in kategori_response.data or []}

        # Get akun and muzakki data - we need to collect IDs from transactions
        akun_ids = list(set([t['id_akun'] for t in transaksi_data.values() if t.get('id_akun')]))
        muzakki_ids = list(set([t['id_muzakki'] for t in transaksi_data.values() if t.get('id_muzakki')]))

        akun_data = {}
        if akun_ids:
            akun_response = supabase_client.table('akun_kas_bank').select('id_akun, jenis_akun').in_('id_akun', akun_ids).execute()
            akun_data = {item['id_akun']: item for item in akun_response.data or []}

        muzakki_data = {}
        if muzakki_ids:
            muzakki_response = supabase_client.table('muzakki').select('id_muzakki, nama_lengkap').in_('id_muzakki', muzakki_ids).execute()
            muzakki_data = {item['id_muzakki']: item for item in muzakki_response.data or []}

        # Build results for query 1
        results1 = []
        for detail in transaksi_detail_data:
            # Get related data
            transaksi_info = transaksi_data.get(detail['id_transaksi'], {})
            kategori_info = kategori_data.get(detail['id_kategori'], {})
            akun_info = akun_data.get(transaksi_info.get('id_akun'), {})  # Use id_akun from transaction
            muzakki_info = muzakki_data.get(transaksi_info.get('id_muzakki'), {})

            # Create the combined description
            jenis_kategori = kategori_info.get('jenis_kategori', '')
            nama_kategori = kategori_info.get('nama_kategori', '')
            deskripsi = f"{jenis_kategori} {nama_kategori}".strip()

            # Create the nilai field
            subtotal = detail.get('subtotal', 0)
            nama_lengkap = muzakki_info.get('nama_lengkap', '')
            nilai = f"Rp {subtotal} {nama_lengkap}".strip()

            # Get transaction date
            tanggal_transaksi = transaksi_info.get('tanggal_transaksi', '')
            jenis_akun = akun_info.get('jenis_akun', '')

            # Extract nama_lengkap from the nilai field (which has format "Rp amount name")
            name_part = ' '.join(nilai.split(' ')[2:]) if len(nilai.split(' ')) > 2 else ''

            results1.append({
                'deskripsi': deskripsi,
                'nilai': nilai,
                'tanggal_transaksi': tanggal_transaksi,
                'nama_lengkap': name_part,
                'subtotal': subtotal,
                'jenis_akun': jenis_akun
            })

        # Query 2: Pembayaran fitrah with related data
        pembayaran_fitrah_response = supabase_client.table('pembayaran_fitrah').select(
            'created_at, total_berat, total_uang, id_muzakki'
        ).execute()

        pembayaran_data = pembayaran_fitrah_response.data or []

        # Get muzakki IDs from pembayaran data
        pembayaran_muzakki_ids = list(set([p['id_muzakki'] for p in pembayaran_data if p.get('id_muzakki')]))
        if pembayaran_muzakki_ids:
            # We need to fetch any muzakki data we don't already have
            missing_muzakki_ids = [mid for mid in pembayaran_muzakki_ids if mid not in muzakki_data]
            if missing_muzakki_ids:
                muzakki_response2 = supabase_client.table('muzakki').select('id_muzakki, nama_lengkap').in_('id_muzakki', missing_muzakki_ids).execute()
                for item in muzakki_response2.data or []:
                    muzakki_data[item['id_muzakki']] = item

        # Build results for query 2
        results2 = []
        for row in pembayaran_data:
            tanggal_transaksi = row['created_at']
            muzakki_info = muzakki_data.get(row['id_muzakki'], {})
            nama_lengkap = muzakki_info.get('nama_lengkap', '')

            # Determine nilai based on whether total_berat is 0
            if row.get('total_berat', 0) == 0:
                nilai_formatted = f"Rp {row['total_uang']}"
                nilai = row['total_uang']  # for subtotal field
            else:
                nilai_formatted = f"{row['total_berat']} KG"
                nilai = row['total_berat']  # for subtotal field

            # Determine jenis_akun based on whether total_berat is 0
            jenis_akun = 'Uang' if row.get('total_berat', 0) == 0 else 'Beras'

            results2.append({
                'deskripsi': 'Pembayaran Fitrah',
                'nilai': nilai_formatted,
                'tanggal_transaksi': tanggal_transaksi,
                'nama_lengkap': nama_lengkap,  # Add nama_lengkap as a separate field
                'subtotal': nilai,
                'jenis_akun': jenis_akun
            })

        # Combine both results
        all_results = results1 + results2

        # Convert date strings to datetime objects for proper sorting
        for item in all_results:
            date_str = item.get('tanggal_transaksi', '')
            if date_str:
                try:
                    # Try different common datetime formats
                    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ'):
                        try:
                            # Remove fractional seconds if present and handle timezone
                            clean_date_str = date_str.split('.')[0]
                            if 'T' in clean_date_str and 'Z' in date_str:
                                clean_date_str = clean_date_str.replace('Z', '+00:00')
                                parsed_date = datetime.fromisoformat(clean_date_str)
                            else:
                                parsed_date = datetime.strptime(clean_date_str, fmt)
                            item['sort_date'] = parsed_date
                            break
                        except ValueError:
                            continue
                except:
                    # If all formats fail, set to min datetime
                    item['sort_date'] = datetime.min
            else:
                item['sort_date'] = datetime.min

        # Sort by sort_date in descending order (most recent first)
        all_results.sort(key=lambda x: x['sort_date'], reverse=True)

        # Return only the first 6 rows
        top_6_results = all_results[:6]

        # Remove the sort_date from the returned results
        for item in top_6_results:
            if 'sort_date' in item:
                del item['sort_date']

        return jsonify({
            'success': True,
            'data': top_6_results,
            'count': len(top_6_results)
        })

    except Exception as e:
        print(f"Error in get_beranda_aktifitas: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@aktifitas_bp.route('/api/beranda.aktifitas', methods=['GET'])
def get_beranda_aktifitas_route():
    # The actual implementation happens in main.py where supabase client is passed
    # This function is just a placeholder for the blueprint
    return jsonify({
        'success': False,
        'message': 'This endpoint requires supabase client. Function must be called from main.py with supabase instance.'
    }), 500

def handle_beranda_aktifitas(supabase_client):
    return get_beranda_aktifitas(supabase_client)