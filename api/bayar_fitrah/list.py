from flask import jsonify
from datetime import datetime, timedelta

def get_bayar_fitrah_list(supabase_client):
    """Get all pembayaran_fitrah data with related information from muzakki, pegawai, harga_fitrah and akun_kas_bank tables"""
    try:
        # Get all pembayaran_fitrah data
        bayar_fitrah_response = supabase_client.table('pembayaran_fitrah').select('*').execute()

        if not bayar_fitrah_response.data:
            return jsonify({
                'success': True,
                'message': 'No pembayaran fitrah data found',
                'data': [],
                'count': 0
            })

        # Extract unique IDs for related tables to fetch in batches
        id_muzakki_list = list(set([record['id_muzakki'] for record in bayar_fitrah_response.data if record.get('id_muzakki')]))
        id_pegawai_list = list(set([record['id_pegawai'] for record in bayar_fitrah_response.data if record.get('id_pegawai')]))
        id_hargafitrah_list = list(set([record['id_hargafitrah'] for record in bayar_fitrah_response.data if record.get('id_hargafitrah')]))
        id_akun_list = list(set([record['id_akun'] for record in bayar_fitrah_response.data if record.get('id_akun')]))

        # Fetch related data in batches
        muzakki_data = {}
        if id_muzakki_list:
            muzakki_response = supabase_client.table('muzakki').select('id_muzakki, nama_lengkap').in_('id_muzakki', id_muzakki_list).execute()
            muzakki_data = {item['id_muzakki']: item for item in muzakki_response.data or []}

        pegawai_data = {}
        if id_pegawai_list:
            pegawai_response = supabase_client.table('pegawai').select('id_pegawai, nama_lengkap').in_('id_pegawai', id_pegawai_list).execute()
            pegawai_data = {item['id_pegawai']: item for item in pegawai_response.data or []}

        hargafitrah_data = {}
        if id_hargafitrah_list:
            hargafitrah_response = supabase_client.table('harga_fitrah').select('id_hargafitrah, keterangan, nominal, berat').in_('id_hargafitrah', id_hargafitrah_list).execute()
            hargafitrah_data = {item['id_hargafitrah']: item for item in hargafitrah_response.data or []}

        akun_data = {}
        if id_akun_list:
            akun_response = supabase_client.table('akun_kas_bank').select('id_akun, nama_akun').in_('id_akun', id_akun_list).execute()
            akun_data = {item['id_akun']: item for item in akun_response.data or []}

        # Format the response with joined data
        formatted_data = []
        for record in bayar_fitrah_response.data:
            # Parse and format the created_at timestamp to GMT+8
            formatted_record = {
                'id_pembayaranfitrah': record['id_pembayaranfitrah'],
                'kode_pembayaran': record['kode_pembayaran'],
                'id_muzakki': record['id_muzakki'],
                'id_pegawai': record['id_pegawai'],
                'id_hargafitrah': record['id_hargafitrah'],
                'id_akun': record['id_akun'],
                'jumlah': record['jumlah'],
                'total_berat': record['total_berat'],
                'total_uang': record['total_uang'],
                'lunas': record['lunas'],
                'bukti': record['bukti']
            }

            # Add formatted created_at
            if record.get('created_at'):
                try:
                    # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                    created_at_dt = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))

                    # Add 8 hours for GMT+8
                    gmt8_dt = created_at_dt + timedelta(hours=8)

                    # Format to 'YYYY-MM-DD HH24:MI'
                    formatted_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    # If parsing fails, keep original format
                    print(f"Error formatting date: {e}")
                    formatted_record['created_at'] = record['created_at']

            # Add related data from joined tables
            if record.get('id_muzakki') in muzakki_data:
                formatted_record['nama_muzakki'] = muzakki_data[record['id_muzakki']]['nama_lengkap']

            if record.get('id_pegawai') in pegawai_data:
                formatted_record['nama_pegawai'] = pegawai_data[record['id_pegawai']]['nama_lengkap']

            if record.get('id_hargafitrah') in hargafitrah_data:
                formatted_record['keterangan_hargafitrah'] = hargafitrah_data[record['id_hargafitrah']]['keterangan']
                formatted_record['nominal_hargafitrah'] = hargafitrah_data[record['id_hargafitrah']]['nominal']
                formatted_record['berat_hargafitrah'] = hargafitrah_data[record['id_hargafitrah']]['berat']

            if record.get('id_akun') in akun_data:
                formatted_record['nama_akun'] = akun_data[record['id_akun']]['nama_akun']

            formatted_data.append(formatted_record)

        return jsonify({
            'success': True,
            'data': formatted_data,
            'count': len(formatted_data)
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500