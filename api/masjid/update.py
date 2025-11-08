from flask import jsonify

def update_masjid(supabase_client, request):
    """Mengupdate masjid berdasarkan id_masjid"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'Request body harus berisi JSON. Pastikan header Content-Type adalah application/json.'}), 400

        id_masjid = data.get('id_masjid')

        if not id_masjid:
            return jsonify({'success': False, 'message': 'Field id_masjid harus diisi'}), 400

        # Cek apakah masjid dengan id_masjid tersebut ada
        existing_masjid = supabase_client.table('masjid').select('id_masjid').eq('id_masjid', id_masjid).execute()
        if not existing_masjid.data:
            return jsonify({'success': False, 'message': f'Masjid dengan id_masjid "{id_masjid}" tidak ditemukan.'}), 404

        # Ambil data yang akan diupdate
        nama_mesjid = data.get('nama_mesjid')
        alamat = data.get('alamat')
        kota = data.get('kota')
        provinsi = data.get('provinsi')
        email = data.get('email')
        gps = data.get('gps')
        mushola = data.get('mushola')
        foto = data.get('foto')

        update_data = {}

        if nama_mesjid:
            update_data['nama_mesjid'] = nama_mesjid
        if alamat:
            update_data['alamat'] = alamat
        if kota:
            update_data['kota'] = kota
        if provinsi:
            update_data['provinsi'] = provinsi
        if email:
            update_data['email'] = email
        if gps:
            update_data['gps'] = gps
        if mushola is not None:
            update_data['mushola'] = bool(mushola)
        if foto is not None:
            update_data['foto'] = foto

        if not update_data:
            return jsonify({'success': False, 'message': 'Tidak ada data yang diupdate.'}), 400

        response = supabase_client.table('masjid').update(update_data).eq('id_masjid', id_masjid).execute()

        if response.data:
            updated_masjid = response.data[0]
            
            # Format created_at to GMT+8 if it exists
            if updated_masjid.get('created_at'):
                from datetime import datetime
                from zoneinfo import ZoneInfo
                utc_time = datetime.fromisoformat(updated_masjid['created_at'].replace('Z', '+00:00'))
                gmt8_time = utc_time.astimezone(ZoneInfo('Asia/Makassar'))
                updated_masjid['created_at'] = gmt8_time.strftime('%Y-%m-%d %H:%M')

            return jsonify({
                'success': True,
                'message': 'Masjid berhasil diupdate',
                'data': updated_masjid
            }), 200
        else:
            error_message = "Gagal mengupdate masjid."
            if hasattr(response, 'error') and response.error:
                error_message += f" Detail: {response.error.message}"
            return jsonify({'success': False, 'message': error_message}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500